const pool = require('../config/database');
const ValidationEngine = require('../utils/validationEngine');

// Send invitation
exports.sendInvitation = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { groupId, invitee_email } = req.body;
    const userId = req.user.id;

    // Check if user is leader
    const [membership] = await connection.query(
      'SELECT role FROM capstone_group_members WHERE group_id = ? AND user_id = ? AND role = "leader"',
      [groupId, userId]
    );

    if (membership.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only group leader can send invitations'
      });
    }

    // Check group status
    const [groups] = await connection.query(
      'SELECT status FROM capstone_groups WHERE id = ?',
      [groupId]
    );

    if (groups.length === 0 || groups[0].status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Can only invite members to draft groups'
      });
    }

    // Find invitee
    const [invitees] = await connection.query(
      'SELECT id, name, batch_id FROM users WHERE email = ?',
      [invitee_email]
    );

    if (invitees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found with that email'
      });
    }

    const inviteeId = invitees[0].id;

    // Check if same batch
    if (invitees[0].batch_id !== req.user.batch_id) {
      return res.status(400).json({
        success: false,
        message: 'Can only invite users from the same batch'
      });
    }

    // Check if can add member
    const canAdd = await ValidationEngine.canAddMember(groupId, inviteeId);
    if (!canAdd.canAdd) {
      return res.status(400).json({
        success: false,
        message: canAdd.reason
      });
    }

    // Check if already invited
    const [existingInvite] = await connection.query(
      'SELECT state FROM capstone_group_invitations WHERE group_id = ? AND invitee_user_id = ? AND state = "pending"',
      [groupId, inviteeId]
    );

    if (existingInvite.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invitation already sent to this user'
      });
    }

    // Send invitation
    await connection.query(
      `INSERT INTO capstone_group_invitations (group_id, inviter_user_id, invitee_user_id, state, created_at) 
       VALUES (?, ?, ?, 'pending', NOW())`,
      [groupId, userId, inviteeId]
    );

    res.status(201).json({
      success: true,
      message: `Invitation sent to ${invitees[0].name}`
    });
  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invitation',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get my invitations
exports.getMyInvitations = async (req, res) => {
  try {
    const userId = req.user.id;

    const [invitations] = await pool.query(
      `SELECT 
        i.id, i.group_id, i.created_at, i.state,
        g.group_name, g.status as group_status,
        u.name as inviter_name,
        (SELECT COUNT(*) FROM capstone_group_members WHERE group_id = i.group_id AND state = 'accepted') as member_count
       FROM capstone_group_invitations i
       JOIN capstone_groups g ON i.group_id = g.id
       JOIN users u ON i.inviter_user_id = u.id
       WHERE i.invitee_user_id = ?
       ORDER BY i.state ASC, i.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: invitations
    });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invitations',
      error: error.message
    });
  }
};

// Respond to invitation (accept/reject)
exports.respondToInvitation = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { invitationId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    const userId = req.user.id;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be "accept" or "reject"'
      });
    }

    // Get invitation
    const [invitations] = await connection.query(
      `SELECT * FROM capstone_group_invitations 
       WHERE id = ? AND invitee_user_id = ? AND state = 'pending'`,
      [invitationId, userId]
    );

    if (invitations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or already responded'
      });
    }

    const invitation = invitations[0];

    await connection.beginTransaction();

    if (action === 'accept') {
      // Check if can add member
      const canAdd = await ValidationEngine.canAddMember(invitation.group_id, userId);
      if (!canAdd.canAdd) {
        return res.status(400).json({
          success: false,
          message: canAdd.reason
        });
      }

      // Add user to group
      await connection.query(
        `INSERT INTO capstone_group_members (group_id, user_id, role, state, joined_at) 
         VALUES (?, ?, 'member', 'accepted', NOW())`,
        [invitation.group_id, userId]
      );

      // Update invitation
      await connection.query(
        `UPDATE capstone_group_invitations 
         SET state = 'accepted', acted_at = NOW() 
         WHERE id = ?`,
        [invitationId]
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'Invitation accepted successfully',
        data: { groupId: invitation.group_id }
      });
    } else {
      // Reject invitation
      await connection.query(
        `UPDATE capstone_group_invitations 
         SET state = 'rejected', acted_at = NOW() 
         WHERE id = ?`,
        [invitationId]
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'Invitation rejected'
      });
    }
  } catch (error) {
    await connection.rollback();
    console.error('Respond to invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to invitation',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Cancel invitation (by leader)
exports.cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.id;

    // Check if user is leader of the group
    const [invitations] = await pool.query(
      `SELECT i.*, gm.role
       FROM capstone_group_invitations i
       JOIN capstone_group_members gm ON i.group_id = gm.group_id
       WHERE i.id = ? AND gm.user_id = ? AND gm.role = 'leader' AND i.state = 'pending'`,
      [invitationId, userId]
    );

    if (invitations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or you are not authorized'
      });
    }

    await pool.query(
      'DELETE FROM capstone_group_invitations WHERE id = ?',
      [invitationId]
    );

    res.json({
      success: true,
      message: 'Invitation cancelled'
    });
  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel invitation',
      error: error.message
    });
  }
};