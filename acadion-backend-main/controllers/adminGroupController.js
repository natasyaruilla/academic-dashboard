const pool = require('../config/database');
const UseCaseValidationEngine = require('../utils/useCaseValidationEngine');

// Get groups for validation
exports.getGroupsForValidation = async (req, res) => {
  try {
    const { batch_id, status, use_case_id } = req.query;

    let query = `
      SELECT 
        g.*,
        u.name as creator_name,
        uc.name as use_case_name,
        uc.company as use_case_company,
        (SELECT COUNT(*) FROM capstone_group_members WHERE group_id = g.id AND state = 'accepted') as member_count
      FROM capstone_groups g
      JOIN users u ON g.creator_user_id = u.id
      LEFT JOIN capstone_use_cases uc ON g.use_case_id = uc.id
      WHERE 1=1
    `;
    const params = [];

    if (batch_id) {
      query += ' AND g.batch_id = ?';
      params.push(batch_id);
    }

    if (use_case_id) {
      query += ' AND g.use_case_id = ?';
      params.push(use_case_id);
    }

    if (status) {
      query += ' AND g.status = ?';
      params.push(status);
    } else {
      query += ' AND g.status IN ("ready", "approved", "rejected")';
    }

    query += ' ORDER BY g.status ASC, g.locked_at DESC';

    const [groups] = await pool.query(query, params);

    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    console.error('Get groups for validation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Validate group (Approve/Reject)
exports.validateGroup = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { groupId } = req.params;
    const { status, rejection_reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be "approved" or "rejected"'
      });
    }

    // Get group info
    const [groups] = await connection.query(
      'SELECT * FROM capstone_groups WHERE id = ?',
      [groupId]
    );

    if (groups.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const group = groups[0];

    if (group.status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: 'Group is not ready for validation'
      });
    }

    await connection.beginTransaction();

    if (status === 'approved') {
      // Approve group
      await connection.query(
        'UPDATE capstone_groups SET status = ? WHERE id = ?',
        [status, groupId]
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'Group approved successfully'
      });

    } else {
      // Reject group
      // 1. Update status to draft (allow reselection)
      // 2. Add use_case_id to rejected list
      
      let rejectedIds = group.rejected_use_case_ids ? group.rejected_use_case_ids.split(',') : [];
      if (group.use_case_id && !rejectedIds.includes(String(group.use_case_id))) {
        rejectedIds.push(String(group.use_case_id));
      }

      await connection.query(`
        UPDATE capstone_groups 
        SET status = 'draft', 
            use_case_id = NULL,
            rejected_use_case_ids = ?,
            locked_at = NULL
        WHERE id = ?
      `, [rejectedIds.join(','), groupId]);

      // Optional: Store rejection reason in a separate table or log
      if (rejection_reason) {
        await connection.query(`
          INSERT INTO capstone_group_rejection_history (group_id, use_case_id, reason, rejected_at, rejected_by)
          VALUES (?, ?, ?, NOW(), ?)
        `, [groupId, group.use_case_id, rejection_reason, req.user.id]);
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Group rejected. Team can select a different use case.',
        data: {
          rejectedUseCaseId: group.use_case_id,
          canReselect: true
        }
      });
    }
  } catch (error) {
    await connection.rollback();
    console.error('Validate group error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    connection.release();
  }
};

// Batch validate multiple groups
exports.batchValidateGroups = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { group_ids, status } = req.body;

    if (!Array.isArray(group_ids) || group_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'group_ids must be a non-empty array'
      });
    }

    if (status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Batch operation only supports "approved" status'
      });
    }

    await connection.beginTransaction();

    // Get all groups to validate
    const [groups] = await connection.query(
      `SELECT id, status FROM capstone_groups WHERE id IN (?) AND status = 'ready'`,
      [group_ids]
    );

    if (groups.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'No ready groups found to approve'
      });
    }

    // Batch approve all ready groups
    await connection.query(
      `UPDATE capstone_groups SET status = ? WHERE id IN (?) AND status = 'ready'`,
      [status, group_ids]
    );

    await connection.commit();

    res.json({
      success: true,
      message: `Successfully approved ${groups.length} group(s)`,
      data: {
        approved_count: groups.length,
        approved_ids: groups.map(g => g.id)
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Batch validate groups error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    connection.release();
  }
};

// Remove member from group
exports.removeMemberFromGroup = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { groupId, userId } = req.params;

    await connection.beginTransaction();

    // Get group info
    const [groups] = await connection.query(
      'SELECT * FROM capstone_groups WHERE id = ?',
      [groupId]
    );

    if (groups.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const group = groups[0];

    // Cannot remove group creator
    if (group.creator_user_id === parseInt(userId)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cannot remove group creator. Transfer ownership first.'
      });
    }

    // Remove member
    const [result] = await connection.query(
      'DELETE FROM capstone_group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Member not found in this group'
      });
    }

    // Re-validate group if it has a use case
    if (group.use_case_id) {
      const validationResult = await UseCaseValidationEngine.validateGroup(groupId);
      
      // Update group status based on validation
      const newStatus = validationResult.isValid ? 'ready' : 'draft';
      await connection.query(
        'UPDATE capstone_groups SET status = ? WHERE id = ?',
        [newStatus, groupId]
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'Member removed successfully',
        data: {
          validation: validationResult,
          new_status: newStatus,
          revalidation_required: !validationResult.isValid
        }
      });
    } else {
      await connection.commit();

      res.json({
        success: true,
        message: 'Member removed successfully'
      });
    }

  } catch (error) {
    await connection.rollback();
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    connection.release();
  }
};
// Search available users (not in any group)
exports.searchAvailableUsers = async (req, res) => {
  try {
    const { search } = req.query;
    
    if (!search || search.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Find users who are not in any group
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.learning_path,
        u.university
      FROM users u
      WHERE u.role = 'STUDENT'
        AND (u.name LIKE ? OR u.email LIKE ?)
        AND NOT EXISTS (
          SELECT 1 FROM capstone_group_members cgm
          JOIN capstone_groups cg ON cgm.group_id = cg.id
          WHERE cgm.user_id = u.id
            AND cgm.state = 'accepted'
            AND cg.status NOT IN ('disbanded')
        )
      LIMIT 10
    `;

    const searchPattern = `%${search}%`;
    const [users] = await pool.query(query, [searchPattern, searchPattern]);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// Add member to group
exports.addMemberToGroup = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { groupId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required'
      });
    }

    await connection.beginTransaction();

    // Get group info
    const [groups] = await connection.query(
      'SELECT * FROM capstone_groups WHERE id = ?',
      [groupId]
    );

    if (groups.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const group = groups[0];

    // Check if user exists
    const [users] = await connection.query(
      'SELECT id, name FROM users WHERE id = ?',
      [user_id]
    );

    if (users.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user already in a group
    const [existingMemberships] = await connection.query(
      'SELECT group_id FROM capstone_group_members WHERE user_id = ? AND state = "accepted"',
      [user_id]
    );

    if (existingMemberships.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'User is already member of another group'
      });
    }

    // Add member directly as accepted (admin override)
    await connection.query(
      'INSERT INTO capstone_group_members (group_id, user_id, state) VALUES (?, ?, "accepted")',
      [groupId, user_id]
    );

    // Admin add = auto approve, no validation needed
    // Only update status if not already approved
    if (group.status !== 'approved') {
      await connection.query(
        'UPDATE capstone_groups SET status = ? WHERE id = ?',
        ['approved', groupId]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Member added successfully. Group auto-approved by admin.',
      data: {
        user: users[0],
        new_status: 'approved'
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    connection.release();
  }
};