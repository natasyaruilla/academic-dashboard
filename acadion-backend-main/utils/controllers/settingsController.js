const pool = require('../config/database');

// Get settings
const getSettings = async (req, res) => {
  try {
    const batchId = req.query.batch_id || req.user.batch_id;

    const [settings] = await pool.query(
      'SELECT * FROM system_settings WHERE batch_id = ?',
      [batchId]
    );

    // Convert to key-value object
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.setting_key] = s.setting_value === 'true' ? true : 
                                     s.setting_value === 'false' ? false : 
                                     s.setting_value;
    });

    res.json({
      success: true,
      data: settingsObj
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update setting
const updateSetting = async (req, res) => {
  try {
    const { setting_key, setting_value } = req.body;
    const batchId = req.body.batch_id || req.user.batch_id;
    const userId = req.user.id;

    // Upsert setting
    await pool.query(
      `INSERT INTO system_settings (batch_id, setting_key, setting_value, updated_by) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       setting_value = VALUES(setting_value), 
       updated_by = VALUES(updated_by),
       updated_at = NOW()`,
      [batchId, setting_key, String(setting_value), userId]
    );

    res.json({
      success: true,
      message: 'Setting updated successfully'
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle group registration
const toggleGroupRegistration = async (req, res) => {
  try {
    const { is_open } = req.body;
    const batchId = req.body.batch_id || req.user.batch_id;
    const userId = req.user.id;

    await pool.query(
      `INSERT INTO system_settings (batch_id, setting_key, setting_value, updated_by) 
       VALUES (?, 'group_registration_open', ?, ?)
       ON DUPLICATE KEY UPDATE 
       setting_value = VALUES(setting_value), 
       updated_by = VALUES(updated_by),
       updated_at = NOW()`,
      [batchId, String(is_open), userId]
    );

    res.json({
      success: true,
      message: `Group registration ${is_open ? 'opened' : 'closed'} successfully`,
      data: { is_open }
    });
  } catch (error) {
    console.error('Toggle registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export all functions
module.exports = {
  getSettings,
  updateSetting,
  toggleGroupRegistration
};