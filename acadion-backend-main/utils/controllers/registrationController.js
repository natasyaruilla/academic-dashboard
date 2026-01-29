// ==========================================
// backend/controllers/registrationController.js
// ==========================================
const pool = require('../config/database');

// FIX: Helper function to format date for MySQL (Local Time)
const formatDateForMySQL = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

// Get active registration period
exports.getActiveRegistrationPeriod = async (req, res) => {
  try {
    const batchId = req.user.batch_id;

    const [periods] = await pool.query(
      `SELECT * FROM registration_periods 
       WHERE batch_id = ? AND is_active = TRUE 
       ORDER BY created_at DESC LIMIT 1`,
      [batchId]
    );

    if (periods.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No active registration period'
      });
    }

    const period = periods[0];
    const now = new Date();
    const openDate = new Date(period.open_date);
    const closeDate = new Date(period.close_date);

    const isOpen = now >= openDate && now <= closeDate;

    res.json({
      success: true,
      data: {
        ...period,
        is_open: isOpen,
        status: isOpen ? 'open' : (now < openDate ? 'upcoming' : 'closed')
      }
    });
  } catch (error) {
    console.error('Get active registration period error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all registration periods (Admin)
exports.getAllRegistrationPeriods = async (req, res) => {
  try {
    const { batch_id } = req.query;
    const batchId = batch_id || req.user.batch_id;

    const [periods] = await pool.query(
      `SELECT rp.*, u.name as creator_name
       FROM registration_periods rp
       JOIN users u ON rp.created_by = u.id
       WHERE rp.batch_id = ?
       ORDER BY rp.created_at DESC`,
      [batchId]
    );

    // Add status to each period
    const now = new Date();
    const periodsWithStatus = periods.map(period => {
      const openDate = new Date(period.open_date);
      const closeDate = new Date(period.close_date);
      const isOpen = now >= openDate && now <= closeDate;

      return {
        ...period,
        is_open: isOpen,
        status: isOpen ? 'open' : (now < openDate ? 'upcoming' : 'closed')
      };
    });

    res.json({
      success: true,
      data: periodsWithStatus
    });
  } catch (error) {
    console.error('Get all registration periods error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create registration period (Admin)
exports.createRegistrationPeriod = async (req, res) => {
  try {
    const { open_date, close_date, is_active } = req.body;
    const batchId = req.body.batch_id || req.user.batch_id;
    const createdBy = req.user.id;

    const formattedOpenDate = formatDateForMySQL(open_date);
    const formattedCloseDate = formatDateForMySQL(close_date);

    // Validate dates
    if (new Date(open_date) >= new Date(close_date)) {
      return res.status(400).json({
        success: false,
        message: 'Open date must be before close date'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO registration_periods (batch_id, open_date, close_date, is_active, created_by, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [batchId, formattedOpenDate, formattedCloseDate, is_active !== false, createdBy]
    );

    res.status(201).json({
      success: true,
      data: { id: result.insertId },
      message: 'Registration period created successfully'
    });
  } catch (error) {
    console.error('Create registration period error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update registration period (Admin)
exports.updateRegistrationPeriod = async (req, res) => {
  try {
    const { periodId } = req.params;
    const { open_date, close_date, is_active } = req.body;

    const formattedOpenDate = formatDateForMySQL(open_date);
    const formattedCloseDate = formatDateForMySQL(close_date);

    // Validate dates
    if (new Date(open_date) >= new Date(close_date)) {
      return res.status(400).json({
        success: false,
        message: 'Open date must be before close date'
      });
    }

    await pool.query(
      `UPDATE registration_periods 
       SET open_date = ?, close_date = ?, is_active = ?, updated_at = NOW() 
       WHERE id = ?`,
      [formattedOpenDate, formattedCloseDate, is_active, periodId]
    );

    res.json({
      success: true,
      message: 'Registration period updated successfully'
    });
  } catch (error) {
    console.error('Update registration period error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete registration period (Admin)
exports.deleteRegistrationPeriod = async (req, res) => {
  try {
    const { periodId } = req.params;

    await pool.query('DELETE FROM registration_periods WHERE id = ?', [periodId]);

    res.json({
      success: true,
      message: 'Registration period deleted successfully'
    });
  } catch (error) {
    console.error('Delete registration period error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};