const pool = require('../config/database');

// Get all users (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { batch_id, role } = req.query;

    let query = 'SELECT id, email, name, batch_id, learning_path, university, learning_group, role, created_at FROM users WHERE 1=1';
    const params = [];

    if (batch_id) {
      query += ' AND batch_id = ?';
      params.push(batch_id);
    }

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC';

    const [users] = await pool.query(query, params);

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete user (Admin)
// Delete user (Admin)
exports.deleteUser = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { userId } = req.params;
    
    console.log('Deleting user ID:', userId); // Debug log

    // Check if user exists
    const [users] = await connection.query(
      'SELECT id, name, role FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // Don't allow deleting admin users
    if (user.role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    // Begin transaction
    await connection.beginTransaction();

    // Delete user (foreign key constraints will handle cascading)
    await connection.query('DELETE FROM users WHERE id = ?', [userId]);

    await connection.commit();

    res.json({
      success: true,
      message: `User "${user.name}" deleted successfully`
    });
  } catch (error) {
    await connection.rollback();
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  } finally {
    connection.release();
  }
};

// Get groups for admin validation
exports.getGroupsForValidation = async (req, res) => {
  try {
    const { batch_id, status } = req.query;

    let query = `
      SELECT g.*, u.name as creator_name,
        (SELECT COUNT(*) FROM capstone_group_members WHERE group_id = g.id AND state = 'accepted') as member_count
      FROM capstone_groups g
      JOIN users u ON g.creator_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (batch_id) {
      query += ' AND g.batch_id = ?';
      params.push(batch_id);
    }

    if (status) {
      query += ' AND g.status = ?';
      params.push(status);
    } else {
      query += ' AND g.status IN ("ready", "approved", "rejected")';
    }

    query += ' ORDER BY g.status ASC, g.locked_at DESC';

    const [groups] = await pool.query(query, params);

    res.json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve/Reject group (Admin)
exports.validateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { status, rejection_reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be "approved" or "rejected"'
      });
    }

    await pool.query(
      'UPDATE capstone_groups SET status = ? WHERE id = ?',
      [status, groupId]
    );

    res.json({
      success: true,
      message: `Group ${status} successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export groups data
exports.exportGroups = async (req, res) => {
  try {
    const { batch_id } = req.query;
    const batchId = batch_id || req.user.batch_id;

    const [groups] = await pool.query(
      `SELECT 
        g.id,
        g.group_name,
        g.status,
        g.created_at,
        g.locked_at,
        u.name as creator_name,
        u.email as creator_email,
        (SELECT COUNT(*) FROM capstone_group_members WHERE group_id = g.id AND state = 'accepted') as member_count
       FROM capstone_groups g
       JOIN users u ON g.creator_user_id = u.id
       WHERE g.batch_id = ?
       ORDER BY g.id ASC`,
      [batchId]
    );

    // Get members for each group
    const groupsWithMembers = await Promise.all(groups.map(async (group) => {
      const [members] = await pool.query(
        `SELECT u.name, u.email, u.learning_path, u.university, gm.role
         FROM capstone_group_members gm
         JOIN users u ON gm.user_id = u.id
         WHERE gm.group_id = ? AND gm.state = 'accepted'
         ORDER BY gm.role DESC, u.name ASC`,
        [group.id]
      );
      
      return { ...group, members };
    }));

    // Create Excel
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Groups Data');

    sheet.columns = [
      { header: 'Group ID', key: 'id', width: 10 },
      { header: 'Group Name', key: 'group_name', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Leader', key: 'creator_name', width: 25 },
      { header: 'Leader Email', key: 'creator_email', width: 30 },
      { header: 'Member Count', key: 'member_count', width: 15 },
      { header: 'Members', key: 'members_list', width: 60 },
      { header: 'Created At', key: 'created_at', width: 20 },
    ];

    groupsWithMembers.forEach(group => {
      sheet.addRow({
        ...group,
        members_list: group.members.map(m => `${m.name} (${m.email})`).join('; ')
      });
    });

    // Style
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Groups_${batchId}_${Date.now()}.xlsx`);
    res.send(buffer);

  } catch (error) {
    console.error('Export groups error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};