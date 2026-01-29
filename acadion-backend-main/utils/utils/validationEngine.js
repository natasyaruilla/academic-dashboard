const pool = require('../config/database');

/**
 * Validation Engine untuk Rules Capstone Groups
 * Mengecek apakah grup memenuhi semua aturan yang ditentukan
 */

class ValidationEngine {
  /**
   * Validasi grup berdasarkan rules yang aktif
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

      // Get all active rules for this batch
      const [rules] = await connection.query(
        `SELECT * FROM capstone_group_rules 
         WHERE batch_id = ? AND is_active = TRUE 
         ORDER BY is_required DESC, id ASC`,
        [group.batch_id]
      );

      // Get all accepted members
      const [members] = await connection.query(
        `SELECT u.* 
         FROM capstone_group_members gm
         JOIN users u ON gm.user_id = u.id
         WHERE gm.group_id = ? AND gm.state = 'accepted'`,
        [groupId]
      );

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
    const { criteria, user_attribute, attribute_value, operator, value } = rule;
    
    let passed = false;
    let currentValue = null;
    let expectedValue = value;
    let message = '';

    switch (criteria) {
      case 'GROUP_SIZE':
        currentValue = members.length;
        passed = this.compareValues(currentValue, operator, parseInt(value));
        message = `Team size: ${currentValue} (${this.getOperatorText(operator)} ${value})`;
        break;

      case 'USER_ATTRIBUTE_COUNT':
        // Count members with specific attribute value
        currentValue = members.filter(m => 
          m[user_attribute] === attribute_value
        ).length;
        passed = this.compareValues(currentValue, operator, parseInt(value));
        message = `Members with ${user_attribute} "${attribute_value}": ${currentValue} (${this.getOperatorText(operator)} ${value})`;
        break;

      case 'SAME_USER_ATTRIBUTE':
        // Group members by attribute value and check max count
        const attributeCounts = {};
        members.forEach(m => {
          const attrVal = m[user_attribute] || 'null';
          attributeCounts[attrVal] = (attributeCounts[attrVal] || 0) + 1;
        });
        
        const maxCount = Math.max(...Object.values(attributeCounts), 0);
        currentValue = maxCount;
        passed = this.compareValues(maxCount, operator, parseInt(value));
        
        const topAttribute = Object.keys(attributeCounts).find(
          key => attributeCounts[key] === maxCount
        );
        message = `Max members from same ${user_attribute}: ${maxCount} from "${topAttribute}" (${this.getOperatorText(operator)} ${value})`;
        break;

      case 'USER_ATTRIBUTE_UNIQUE':
        // Check if all members have unique values for the attribute
        const uniqueValues = new Set(members.map(m => m[user_attribute]));
        currentValue = uniqueValues.size;
        passed = currentValue === members.length;
        message = `Unique ${user_attribute} values: ${currentValue}/${members.length}`;
        break;

      case 'MIN_USER_ATTRIBUTE_COUNT':
        // Minimum count of members with specific attribute
        currentValue = members.filter(m => 
          m[user_attribute] === attribute_value
        ).length;
        passed = currentValue >= parseInt(value);
        message = `Min ${user_attribute} "${attribute_value}": ${currentValue} (need >= ${value})`;
        break;

      case 'MAX_USER_ATTRIBUTE_COUNT':
        // Maximum count of members with specific attribute
        currentValue = members.filter(m => 
          m[user_attribute] === attribute_value
        ).length;
        passed = currentValue <= parseInt(value);
        message = `Max ${user_attribute} "${attribute_value}": ${currentValue} (need <= ${value})`;
        break;

      default:
        message = `Unknown criteria: ${criteria}`;
        passed = false;
    }

    return {
      ruleId: rule.id,
      criteria: rule.criteria,
      isRequired: rule.is_required,
      passed,
      currentValue,
      expectedValue,
      message,
      details: {
        userAttribute: rule.user_attribute,
        attributeValue: rule.attribute_value,
        operator: rule.operator
      }
    };
  }

  /**
   * Compare values based on operator
   */
  static compareValues(current, operator, expected) {
    switch (operator) {
      case 'EQUAL_TO':
        return current === expected;
      case 'NOT_EQUAL_TO':
        return current !== expected;
      case 'GREATER_THAN':
        return current > expected;
      case 'GREATER_THAN_OR_EQUAL':
        return current >= expected;
      case 'LESS_THAN':
        return current < expected;
      case 'LESS_THAN_OR_EQUAL':
      case 'AT_MOST':
        return current <= expected;
      case 'AT_LEAST':
        return current >= expected;
      default:
        return false;
    }
  }

  /**
   * Get human-readable operator text
   */
  static getOperatorText(operator) {
    const operatorMap = {
      'EQUAL_TO': 'must be',
      'NOT_EQUAL_TO': 'must not be',
      'GREATER_THAN': 'must be >',
      'GREATER_THAN_OR_EQUAL': 'must be >=',
      'LESS_THAN': 'must be <',
      'LESS_THAN_OR_EQUAL': 'must be <=',
      'AT_MOST': 'max',
      'AT_LEAST': 'min'
    };
    return operatorMap[operator] || operator;
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
      const [existingMembership] = await connection.query(
        `SELECT g.id, g.group_name 
         FROM capstone_group_members gm
         JOIN capstone_groups g ON gm.group_id = g.id
         WHERE gm.user_id = ? AND gm.state = 'accepted' AND g.status != 'rejected'`,
        [userId]
      );

      if (existingMembership.length > 0) {
        return {
          canAdd: false,
          reason: `User is already a member of group "${existingMembership[0].group_name}"`
        };
      }

      // Check if group is locked
      const [groups] = await connection.query(
        'SELECT status FROM capstone_groups WHERE id = ?',
        [groupId]
      );

      if (groups.length === 0) {
        return { canAdd: false, reason: 'Group not found' };
      }

      if (groups[0].status !== 'draft') {
        return { canAdd: false, reason: 'Group is already locked or approved' };
      }

      return { canAdd: true, reason: 'User can be added to the group' };
    } finally {
      connection.release();
    }
  }
}

module.exports = ValidationEngine;