const pool = require('../config/database');

/**
 * New Validation Engine untuk Use Case Rules
 * Lebih sederhana dan fleksibel
 */

class UseCaseValidationEngine {
  /**
   * Validasi grup berdasarkan use case rules
   * @param {number} groupId - ID grup yang akan divalidasi
   * @returns {Object} - Hasil validasi dengan detail setiap rule
   */
  static async validateGroup(groupId) {
    const connection = await pool.getConnection();
    
    try {
      // Get group info
      const [groups] = await connection.query(
        'SELECT * FROM capstone_groups WHERE id = ?',
        [groupId]
      );

      if (groups.length === 0) {
        throw new Error('Group not found');
      }

      const group = groups[0];

      // Check if group has selected use case
      if (!group.use_case_id) {
        return {
          groupId,
          groupName: group.group_name,
          status: group.status,
          hasUseCase: false,
          canLock: false,
          message: 'Pilih use case terlebih dahulu',
          validations: []
        };
      }

      // Get use case info
      const [useCases] = await connection.query(
        'SELECT * FROM capstone_use_cases WHERE id = ?',
        [group.use_case_id]
      );

      const useCase = useCases[0];

      // Get all rules for this use case
      const [rules] = await connection.query(`
        SELECT 
          r.*,
          ucr.is_required
        FROM capstone_use_case_rules ucr
        JOIN capstone_rules r ON ucr.rule_id = r.id
        WHERE ucr.use_case_id = ?
        ORDER BY 
          FIELD(r.rule_type, 'GROUP_SIZE', 'MAX_SAME_UNIVERSITY', 'REQUIRED_LEARNING_PATHS')
      `, [group.use_case_id]);

      // Get all accepted members
      const [members] = await connection.query(`
        SELECT u.* 
        FROM capstone_group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ? AND gm.state = 'accepted'
      `, [groupId]);

      // Validate each rule
      const validationResults = [];
      let allRequiredPassed = true;

      for (const rule of rules) {
        const result = await this.validateRule(rule, members);
        validationResults.push(result);

        if (rule.is_required && !result.passed) {
          allRequiredPassed = false;
        }
      }

      return {
        groupId,
        groupName: group.group_name,
        status: group.status,
        hasUseCase: true,
        useCase: {
          id: useCase.id,
          name: useCase.name,
          company: useCase.company
        },
        memberCount: members.length,
        allRequiredPassed,
        canLock: allRequiredPassed && group.status === 'draft',
        validations: validationResults
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Validasi single rule
   * @param {Object} rule - Rule object dari database
   * @param {Array} members - Array of member objects
   * @returns {Object} - Validation result
   */
  static async validateRule(rule, members) {
    const { rule_type, rule_value, description, is_required } = rule;
    
    let passed = false;
    let currentValue = null;
    let expectedValue = rule_value;
    let message = '';
    let details = {};

    switch (rule_type) {
      case 'GROUP_SIZE':
        currentValue = members.length;
        const requiredSize = parseInt(rule_value);
        passed = currentValue === requiredSize;
        message = passed
          ? `✅ Ukuran tim: ${currentValue}/${requiredSize} anggota`
          : `❌ Ukuran tim: ${currentValue}/${requiredSize} anggota (kurang ${requiredSize - currentValue})`;
        details = {
          current: currentValue,
          required: requiredSize
        };
        break;

      case 'MAX_SAME_UNIVERSITY':
        // Group members by university
        const universityCounts = {};
        members.forEach(m => {
          const univ = m.university || 'Unknown';
          universityCounts[univ] = (universityCounts[univ] || 0) + 1;
        });
        
        const maxCount = Math.max(...Object.values(universityCounts), 0);
        const maxUniv = Object.keys(universityCounts).find(
          key => universityCounts[key] === maxCount
        );
        
        const maxAllowed = parseInt(rule_value);
        currentValue = maxCount;
        passed = maxCount <= maxAllowed;
        
        message = passed
          ? `✅ Distribusi universitas: Max ${maxCount} dari ${maxUniv} (batas ${maxAllowed})`
          : `❌ Terlalu banyak dari ${maxUniv}: ${maxCount} orang (max ${maxAllowed})`;
        
        details = {
          distribution: universityCounts,
          maxFromSameUniversity: maxCount,
          universityName: maxUniv,
          maxAllowed: maxAllowed
        };
        break;

      case 'REQUIRED_LEARNING_PATHS':
        // Parse comma-separated learning paths
        const requiredPaths = rule_value.split(',').map(p => p.trim());
        
        // Get member learning paths
        const memberPaths = members.map(m => m.learning_path).filter(p => p);
        
        // Check if at least 1 member has any of the required paths
        const matchingPaths = [];
        const matchingMembers = [];
        
        requiredPaths.forEach(requiredPath => {
          members.forEach(member => {
            if (member.learning_path === requiredPath) {
              if (!matchingPaths.includes(requiredPath)) {
                matchingPaths.push(requiredPath);
              }
              if (!matchingMembers.find(m => m.id === member.id)) {
                matchingMembers.push({
                  id: member.id,
                  name: member.name,
                  path: member.learning_path
                });
              }
            }
          });
        });
        
        passed = matchingPaths.length > 0;
        currentValue = matchingPaths.length;
        
        if (passed) {
          message = `✅ Learning path terpenuhi: ${matchingPaths.join(', ')} (${matchingMembers.length} member)`;
        } else {
          message = `❌ Tidak ada member dengan learning path: ${requiredPaths.join(' atau ')}`;
        }
        
        details = {
          requiredPaths: requiredPaths,
          matchingPaths: matchingPaths,
          matchingMembers: matchingMembers,
          allMemberPaths: memberPaths
        };
        break;

      default:
        message = `Unknown rule type: ${rule_type}`;
        passed = false;
    }

    return {
      ruleId: rule.id,
      ruleType: rule_type,
      ruleValue: rule_value,
      description: description || message,
      isRequired: is_required,
      passed,
      currentValue,
      expectedValue,
      message,
      details
    };
  }

  /**
   * Check if a user can be added to a group
   * @param {number} groupId
   * @param {string} userId
   * @returns {Object} - Can add and reason
   */
  static async canAddMember(groupId, userId) {
    const connection = await pool.getConnection();
    
    try {
      // Check if user already in a group
      const [existingMembership] = await connection.query(`
        SELECT g.id, g.group_name, g.use_case_id, uc.name as use_case_name
        FROM capstone_group_members gm
        JOIN capstone_groups g ON gm.group_id = g.id
        LEFT JOIN capstone_use_cases uc ON g.use_case_id = uc.id
        WHERE gm.user_id = ? AND gm.state = 'accepted' AND g.status != 'rejected'
      `, [userId]);

      if (existingMembership.length > 0) {
        const existing = existingMembership[0];
        return {
          canAdd: false,
          reason: `User sudah menjadi anggota grup "${existing.group_name}" (${existing.use_case_name || 'No use case'})`
        };
      }

      // Check if group is locked
      const [groups] = await connection.query(
        'SELECT status, use_case_id FROM capstone_groups WHERE id = ?',
        [groupId]
      );

      if (groups.length === 0) {
        return { canAdd: false, reason: 'Group not found' };
      }

      if (groups[0].status !== 'draft') {
        return { canAdd: false, reason: 'Group sudah dikunci atau sedang dalam proses approval' };
      }

      return { canAdd: true, reason: 'User dapat ditambahkan ke grup' };
    } finally {
      connection.release();
    }
  }

  /**
   * Get available use cases for a student
   * Exclude rejected use cases
   */
  static async getAvailableUseCases(userId, batchId) {
    const connection = await pool.getConnection();
    
    try {
      // Get rejected use case IDs for this user
      const [groups] = await connection.query(`
        SELECT rejected_use_case_ids 
        FROM capstone_groups 
        WHERE creator_user_id = ? AND rejected_use_case_ids IS NOT NULL
      `, [userId]);

      let rejectedIds = [];
      if (groups.length > 0 && groups[0].rejected_use_case_ids) {
        rejectedIds = groups[0].rejected_use_case_ids.split(',').map(id => parseInt(id));
      }

      // Get all active use cases except rejected ones
      let query = `
        SELECT 
          uc.*,
          (SELECT COUNT(*) FROM capstone_groups WHERE use_case_id = uc.id AND status IN ('ready', 'approved')) as team_count
        FROM capstone_use_cases uc
        WHERE uc.batch_id = ? AND uc.is_active = TRUE
      `;
      const params = [batchId];

      if (rejectedIds.length > 0) {
        query += ` AND uc.id NOT IN (${rejectedIds.join(',')})`;
      }

      query += ' ORDER BY uc.display_order ASC';

      const [useCases] = await connection.query(query, params);

      return {
        success: true,
        data: useCases,
        rejectedIds
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = UseCaseValidationEngine;