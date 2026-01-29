const pool = require('../config/database');
const UseCaseValidationEngine = require('../utils/useCaseValidationEngine');

// Select use case and create group
exports.selectUseCaseAndCreateGroup = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { use_case_id, group_name } = req.body;
    const userId = req.user.id;
    const batchId = req.user.batch_id;

    if (!use_case_id) {
      return res.status(400).json({
        success: false,
        message: 'use_case_id is required'
      });
    }

    // Check if user already in a group
    const [existingGroup] = await connection.query(`
      SELECT g.id, g.group_name, g.status, uc.name as use_case_name
      FROM capstone_group_members gm
      JOIN capstone_groups g ON gm.group_id = g.id
      LEFT JOIN capstone_use_cases uc ON g.use_case_id = uc.id
      WHERE gm.user_id = ? AND gm.state = 'accepted' AND g.status IN ('draft', 'ready', 'approved')
    `, [userId]);

    if (existingGroup.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Anda sudah terdaftar di grup "${existingGroup[0].group_name}" dengan use case "${existingGroup[0].use_case_name}"`
      });
    }

    // Check if use case exists and is active
    const [useCases] = await connection.query(
      'SELECT * FROM capstone_use_cases WHERE id = ? AND batch_id = ? AND is_active = TRUE',
      [use_case_id, batchId]
    );

    if (useCases.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Use case not found or not active'
      });
    }

    // Check if this use case was rejected before
    const [rejectedGroups] = await connection.query(
      'SELECT rejected_use_case_ids FROM capstone_groups WHERE creator_user_id = ? AND rejected_use_case_ids IS NOT NULL',
      [userId]
    );

    if (rejectedGroups.length > 0 && rejectedGroups[0].rejected_use_case_ids) {
      const rejectedIds = rejectedGroups[0].rejected_use_case_ids.split(',').map(id => parseInt(id));
      if (rejectedIds.includes(parseInt(use_case_id))) {
        return res.status(400).json({
          success: false,
          message: 'Use case ini pernah direject. Silakan pilih use case lain.'
        });
      }
    }

    await connection.beginTransaction();

    const useCase = useCases[0];
    const finalGroupName = group_name || `Team ${useCase.name}`;

    // Create group with use case
    const [result] = await connection.query(`
      INSERT INTO capstone_groups (batch_id, use_case_id, group_name, creator_user_id, status, created_at) 
      VALUES (?, ?, ?, ?, 'draft', NOW())
    `, [batchId, use_case_id, finalGroupName, userId]);

    const groupId = result.insertId;

    // Add creator as leader
    await connection.query(`
      INSERT INTO capstone_group_members (group_id, user_id, role, state, joined_at) 
      VALUES (?, ?, 'leader', 'accepted', NOW())
    `, [groupId, userId]);

    await connection.commit();

    // Get validation status
    const validation = await UseCaseValidationEngine.validateGroup(groupId);

    res.status(201).json({
      success: true,
      message: `Use case "${useCase.name}" dipilih dan grup berhasil dibuat`,
      data: {
        groupId,
        groupName: finalGroupName,
        useCase: {
          id: useCase.id,
          name: useCase.name,
          company: useCase.company
        },
        validation
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Select use case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to select use case and create group',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Change use case (only if draft)
exports.changeUseCase = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { groupId } = req.params;
    const { use_case_id } = req.body;
    const userId = req.user.id;

    // Check if user is leader
    const [membership] = await connection.query(
      'SELECT role FROM capstone_group_members WHERE group_id = ? AND user_id = ? AND role = "leader"',
      [groupId, userId]
    );

    if (membership.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only group leader can change use case'
      });
    }

    // Check group status
    const [groups] = await pool.query(
      'SELECT status, rejected_use_case_ids FROM capstone_groups WHERE id = ?',
      [groupId]
    );

    if (groups.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (groups[0].status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change use case. Group is already locked or approved.'
      });
    }

    // Check if new use case was rejected before
    if (groups[0].rejected_use_case_ids) {
      const rejectedIds = groups[0].rejected_use_case_ids.split(',').map(id => parseInt(id));
      if (rejectedIds.includes(parseInt(use_case_id))) {
        return res.status(400).json({
          success: false,
          message: 'Use case ini pernah direject. Silakan pilih use case lain.'
        });
      }
    }

    // Update use case
    await connection.query(
      'UPDATE capstone_groups SET use_case_id = ? WHERE id = ?',
      [use_case_id, groupId]
    );

    // Get validation
    const validation = await UseCaseValidationEngine.validateGroup(groupId);

    res.json({
      success: true,
      message: 'Use case berhasil diubah',
      data: { validation }
    });
  } catch (error) {
    console.error('Change use case error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    connection.release();
  }
};

// Get my group
exports.getMyGroup = async (req, res) => {
  try {
    const userId = req.user.id;

    const [groups] = await pool.query(`
      SELECT g.id, g.group_name, g.status, g.use_case_id, g.created_at, g.locked_at, 
             gm.role, uc.name as use_case_name, uc.company as use_case_company
      FROM capstone_group_members gm
      JOIN capstone_groups g ON gm.group_id = g.id
      LEFT JOIN capstone_use_cases uc ON g.use_case_id = uc.id
      WHERE gm.user_id = ? AND gm.state = 'accepted' AND g.status IN ('draft', 'ready', 'approved')
    `, [userId]);

    if (groups.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'You are not in any group'
      });
    }

    const groupId = groups[0].id;

    // Get full group details
    const [members] = await pool.query(`
      SELECT u.id, u.name, u.email, u.learning_path, u.university, gm.role
      FROM capstone_group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ? AND gm.state = 'accepted'
      ORDER BY gm.role DESC, u.name ASC
    `, [groupId]);

    // Get validation
    const validation = await UseCaseValidationEngine.validateGroup(groupId);

    res.json({
      success: true,
      data: {
        ...groups[0],
        members,
        validation
      }
    });
  } catch (error) {
    console.error('Get my group error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get group details (with validation)
exports.getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Get group info
    const [groups] = await pool.query(`
      SELECT g.*, u.name as creator_name, uc.name as use_case_name, uc.company as use_case_company
      FROM capstone_groups g
      JOIN users u ON g.creator_user_id = u.id
      LEFT JOIN capstone_use_cases uc ON g.use_case_id = uc.id
      WHERE g.id = ?
    `, [groupId]);

    if (groups.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const group = groups[0];

    // Check if user is member
    const [membership] = await pool.query(
      'SELECT role FROM capstone_group_members WHERE group_id = ? AND user_id = ? AND state = "accepted"',
      [groupId, userId]
    );

    const isMember = membership.length > 0;
    const isLeader = isMember && membership[0].role === 'leader';

    // Get members
    const [members] = await pool.query(`
      SELECT u.id, u.name, u.email, u.learning_path, u.university, gm.role, gm.joined_at
      FROM capstone_group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ? AND gm.state = 'accepted'
      ORDER BY gm.role DESC, gm.joined_at ASC
    `, [groupId]);

    // Get pending invitations (only if leader)
    let pendingInvitations = [];
    if (isLeader) {
      const [invitations] = await pool.query(`
        SELECT i.id, i.created_at, u.name as invitee_name, u.email as invitee_email
        FROM capstone_group_invitations i
        JOIN users u ON i.invitee_user_id = u.id
        WHERE i.group_id = ? AND i.state = 'pending'
        ORDER BY i.created_at DESC
      `, [groupId]);
      pendingInvitations = invitations;
    }

    // Get validation status
    const validation = await UseCaseValidationEngine.validateGroup(groupId);

    res.json({
      success: true,
      data: {
        group,
        isMember,
        isLeader,
        members,
        pendingInvitations,
        validation
      }
    });
  } catch (error) {
    console.error('Get group details error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Lock team (NEW: requires use case and validation)
exports.lockTeam = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check if user is leader
    const [membership] = await connection.query(
      'SELECT role FROM capstone_group_members WHERE group_id = ? AND user_id = ? AND role = "leader"',
      [groupId, userId]
    );

    if (membership.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only group leader can lock the team'
      });
    }

    // Check current status
    const [groups] = await connection.query(
      'SELECT status, use_case_id FROM capstone_groups WHERE id = ?',
      [groupId]
    );

    if (groups.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (groups[0].status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Group is already locked or approved'
      });
    }

    if (!groups[0].use_case_id) {
      return res.status(400).json({
        success: false,
        message: 'Silakan pilih use case terlebih dahulu'
      });
    }

    // Validate group
    const validation = await UseCaseValidationEngine.validateGroup(groupId);

    if (!validation.allRequiredPassed) {
      return res.status(400).json({
        success: false,
        message: 'Grup belum memenuhi semua syarat yang diperlukan',
        validation
      });
    }

    // Lock team
    await connection.query(`
      UPDATE capstone_groups 
      SET status = 'ready', locked_at = NOW() 
      WHERE id = ?
    `, [groupId]);

    res.json({
      success: true,
      message: 'Tim berhasil dikunci dan dikirim untuk persetujuan admin',
      data: { status: 'ready' }
    });
  } catch (error) {
    console.error('Lock team error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    connection.release();
  }
};

// Get validation status
exports.getValidation = async (req, res) => {
  try {
    const { groupId } = req.params;

    const validation = await UseCaseValidationEngine.validateGroup(groupId);

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Get validation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update group name
exports.updateGroupName = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { group_name } = req.body;
    const userId = req.user.id;

    // Check if leader
    const [membership] = await pool.query(
      'SELECT role FROM capstone_group_members WHERE group_id = ? AND user_id = ? AND role = "leader"',
      [groupId, userId]
    );

    if (membership.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only group leader can update group name'
      });
    }

    await pool.query(
      'UPDATE capstone_groups SET group_name = ? WHERE id = ?',
      [group_name, groupId]
    );

    res.json({
      success: true,
      message: 'Group name updated successfully'
    });
  } catch (error) {
    console.error('Update group name error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};