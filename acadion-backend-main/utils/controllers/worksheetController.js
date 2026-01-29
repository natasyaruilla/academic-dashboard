const pool = require('../config/database');

// Get checkin periods
exports.getCheckinPeriods = async (req, res) => {
  try {
    const batchId = req.user.batch_id;
    
    const [periods] = await pool.query(
      'SELECT * FROM checkin_periods WHERE batch_id = ? ORDER BY start_date DESC',
      [batchId]
    );

    res.json({ success: true, data: periods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create checkin period (Admin)
exports.createCheckinPeriod = async (req, res) => {
  try {
    const { period_name, start_date, end_date, description, is_active } = req.body;
    const batchId = req.body.batch_id || req.user.batch_id;

    // FIX: Gunakan Local Time, bukan UTC
    const formatDateForMySQL = (dateStr) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      const pad = (num) => String(num).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const formattedStartDate = formatDateForMySQL(start_date);
    const formattedEndDate = formatDateForMySQL(end_date);

    const [result] = await pool.query(
      'INSERT INTO checkin_periods (batch_id, period_name, start_date, end_date, description, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [batchId, period_name, formattedStartDate, formattedEndDate, description, is_active !== false]
    );

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    console.error('Create checkin period error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update checkin period (Admin)
exports.updateCheckinPeriod = async (req, res) => {
  try {
    const { periodId } = req.params;
    const { period_name, start_date, end_date, description, is_active } = req.body;

    // FIX: Gunakan Local Time, bukan UTC
    const formatDateForMySQL = (dateStr) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      const pad = (num) => String(num).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const formattedStartDate = formatDateForMySQL(start_date);
    const formattedEndDate = formatDateForMySQL(end_date);

    await pool.query(
      'UPDATE checkin_periods SET period_name = ?, start_date = ?, end_date = ?, description = ?, is_active = ? WHERE id = ?',
      [period_name, formattedStartDate, formattedEndDate, description, is_active, periodId]
    );

    res.json({ success: true, message: 'Check-in period updated successfully' });
  } catch (error) {
    console.error('Update checkin period error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete checkin period (Admin)
exports.deleteCheckinPeriod = async (req, res) => {
  try {
    const { periodId } = req.params;
    
    // Check if period exists
    const [periods] = await pool.query(
      'SELECT id, period_name FROM checkin_periods WHERE id = ?',
      [periodId]
    );

    if (periods.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Check-in period not found'
      });
    }

    // Delete the period
    await pool.query('DELETE FROM checkin_periods WHERE id = ?', [periodId]);

    res.json({ 
      success: true, 
      message: `Check-in period "${periods[0].period_name}" deleted successfully` 
    });
  } catch (error) {
    console.error('Delete checkin period error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Submit worksheet (Student)
exports.submitWorksheet = async (req, res) => {
  try {
    const { checkin_period_id, activity_description, proof_file } = req.body;
    const userId = req.user.id;

    // Get user's group
    const [groups] = await pool.query(
      'SELECT group_id FROM capstone_group_members WHERE user_id = ? AND state = "accepted"',
      [userId]
    );

    if (groups.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'You must be in a group to submit worksheets'
      });
    }

    const groupId = groups[0].group_id;

    const [result] = await pool.query(
      'INSERT INTO worksheets (checkin_period_id, user_id, group_id, activity_description, proof_file, submission_date) VALUES (?, ?, ?, ?, ?, NOW())',
      [checkin_period_id, userId, groupId, activity_description, proof_file]
    );

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update worksheet (Student)
exports.updateWorksheet = async (req, res) => {
  try {
    const { worksheetId } = req.params;
    const { activity_description, proof_file } = req.body;
    const userId = req.user.id;

    // Check if worksheet belongs to the user
    const [worksheets] = await pool.query(
      'SELECT id FROM worksheets WHERE id = ? AND user_id = ?',
      [worksheetId, userId]
    );

    if (worksheets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found or you do not have permission to edit it'
      });
    }

    // Update the worksheet
    await pool.query(
      'UPDATE worksheets SET activity_description = ?, proof_file = ? WHERE id = ?',
      [activity_description, proof_file, worksheetId]
    );

    res.json({ success: true, message: 'Worksheet updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get my worksheets (Student)
exports.getMyWorksheets = async (req, res) => {
  try {
    const userId = req.user.id;

    const [worksheets] = await pool.query(
      `SELECT w.*, cp.period_name, cp.start_date, cp.end_date
       FROM worksheets w
       JOIN checkin_periods cp ON w.checkin_period_id = cp.id
       WHERE w.user_id = ?
       ORDER BY w.submission_date DESC`,
      [userId]
    );

    res.json({ success: true, data: worksheets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all worksheets for validation (Admin)
exports.getAllWorksheets = async (req, res) => {
  try {
    const { batch_id, status } = req.query;

    let query = `
      SELECT w.*, u.name as user_name, u.email, g.group_name, cp.period_name
      FROM worksheets w
      JOIN users u ON w.user_id = u.id
      JOIN capstone_groups g ON w.group_id = g.id
      JOIN checkin_periods cp ON w.checkin_period_id = cp.id
      WHERE 1=1
    `;
    const params = [];

    if (batch_id) {
      query += ' AND u.batch_id = ?';
      params.push(batch_id);
    }

    if (status) {
      query += ' AND w.validation_status = ?';
      params.push(status);
    }

    query += ' ORDER BY w.submission_date DESC';

    const [worksheets] = await pool.query(query, params);

    res.json({ success: true, data: worksheets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Validate worksheet (Admin)
exports.validateWorksheet = async (req, res) => {
  try {
    const { worksheetId } = req.params;
    const { validation_status, admin_notes } = req.body;

    const validStatuses = ['pending', 'completed', 'completed_late', 'not_completed'];
    if (!validStatuses.includes(validation_status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid validation status'
      });
    }

    await pool.query(
      'UPDATE worksheets SET validation_status = ?, admin_notes = ? WHERE id = ?',
      [validation_status, admin_notes, worksheetId]
    );

    res.json({ success: true, message: 'Worksheet validated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};