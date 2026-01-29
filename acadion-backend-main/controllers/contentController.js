const pool = require('../config/database');

// CAPSTONE INFORMATION (Pengumuman)
exports.getInformation = async (req, res) => {
  try {
    const batchId = req.user.batch_id;
    
    const [info] = await pool.query(
      'SELECT * FROM capstone_information WHERE batch_id = ? ORDER BY created_at DESC',
      [batchId]
    );

    res.json({ success: true, data: info });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createInformation = async (req, res) => {
  try {
    const { title, content } = req.body;
    const batchId = req.body.batch_id || req.user.batch_id;

    const [result] = await pool.query(
      'INSERT INTO capstone_information (batch_id, title, content, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [batchId, title, content]
    );

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateInformation = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    await pool.query(
      'UPDATE capstone_information SET title = ?, content = ?, updated_at = NOW() WHERE id = ?',
      [title, content, id]
    );

    res.json({ success: true, message: 'Information updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteInformation = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM capstone_information WHERE id = ?', [id]);
    res.json({ success: true, message: 'Information deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CAPSTONE TIMELINE (Jadwal)
exports.getTimeline = async (req, res) => {
  try {
    const batchId = req.user.batch_id;
    
    const [timeline] = await pool.query(
      'SELECT * FROM capstone_timeline WHERE batch_id = ? ORDER BY order_idx ASC, start_at ASC',
      [batchId]
    );

    res.json({ success: true, data: timeline });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// FIX: Helper for MySQL DateTime (Local)
const formatDateForMySQL = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

exports.createTimeline = async (req, res) => {
  try {
    const { title, start_at, end_at, description, order_idx } = req.body;
    const batchId = req.body.batch_id || req.user.batch_id;

    const formattedStartAt = formatDateForMySQL(start_at);
    const formattedEndAt = formatDateForMySQL(end_at);

    const [result] = await pool.query(
      'INSERT INTO capstone_timeline (batch_id, title, start_at, end_at, description, order_idx) VALUES (?, ?, ?, ?, ?, ?)',
      [batchId, title, formattedStartAt, formattedEndAt, description, order_idx || 0]
    );

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, start_at, end_at, description, order_idx } = req.body;

    const formattedStartAt = formatDateForMySQL(start_at);
    const formattedEndAt = formatDateForMySQL(end_at);

    await pool.query(
      'UPDATE capstone_timeline SET title = ?, start_at = ?, end_at = ?, description = ?, order_idx = ? WHERE id = ?',
      [title, formattedStartAt, formattedEndAt, description, order_idx, id]
    );

    res.json({ success: true, message: 'Timeline updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM capstone_timeline WHERE id = ?', [id]);
    res.json({ success: true, message: 'Timeline deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CAPSTONE DOCS (Dokumen)
exports.getDocs = async (req, res) => {
  try {
    const batchId = req.user.batch_id;
    
    const [docs] = await pool.query(
      'SELECT * FROM capstone_docs WHERE batch_id = ? ORDER BY order_idx ASC',
      [batchId]
    );

    res.json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createDoc = async (req, res) => {
  try {
    const { title, url, order_idx } = req.body;
    const batchId = req.body.batch_id || req.user.batch_id;

    const [result] = await pool.query(
      'INSERT INTO capstone_docs (batch_id, title, url, order_idx) VALUES (?, ?, ?, ?)',
      [batchId, title, url, order_idx || 0]
    );

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, order_idx } = req.body;

    await pool.query(
      'UPDATE capstone_docs SET title = ?, url = ?, order_idx = ? WHERE id = ?',
      [title, url, order_idx, id]
    );

    res.json({ success: true, message: 'Document updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteDoc = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM capstone_docs WHERE id = ?', [id]);
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};