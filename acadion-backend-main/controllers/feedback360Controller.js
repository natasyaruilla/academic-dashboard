// ==========================================
// backend/controllers/feedback360Controller.js
// ==========================================
const pool = require('../config/database');
const ExcelJS = require('exceljs');

// FIX: Helper function to format date for MySQL (Local Time)
const formatDateForMySQL = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

// ============ FEEDBACK 360 PERIODS (ADMIN) ============

exports.getAllFeedbackPeriods = async (req, res) => {
  try {
    const { batch_id } = req.query;
    const batchId = batch_id || req.user.batch_id;

    const [periods] = await pool.query(
      `SELECT fp.*, u.name as creator_name
       FROM feedback_360_periods fp
       JOIN users u ON fp.created_by = u.id
       WHERE fp.batch_id = ?
       ORDER BY fp.created_at DESC`,
      [batchId]
    );

    const now = new Date();
    const periodsWithStatus = periods.map(period => {
      const start = new Date(period.start_date);
      const end = new Date(period.end_date);
      const isOpen = now >= start && now <= end && period.is_active;

      return {
        ...period,
        is_open: isOpen,
        status: isOpen ? 'open' : (now < start ? 'upcoming' : 'closed')
      };
    });

    res.json({ success: true, data: periodsWithStatus });
  } catch (error) {
    console.error('Get feedback periods error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createFeedbackPeriod = async (req, res) => {
  try {
    const { period_name, start_date, end_date, is_active } = req.body;
    const batchId = req.body.batch_id || req.user.batch_id;
    const createdBy = req.user.id;

    // Backend menerima string datetime-local, diproses sebagai Local Time
    const formattedStartDate = formatDateForMySQL(start_date);
    const formattedEndDate = formatDateForMySQL(end_date);

    const [result] = await pool.query(
      `INSERT INTO feedback_360_periods (batch_id, period_name, start_date, end_date, is_active, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [batchId, period_name, formattedStartDate, formattedEndDate, is_active !== false, createdBy]
    );

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    console.error('Create feedback period error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateFeedbackPeriod = async (req, res) => {
  try {
    const { periodId } = req.params;
    const { period_name, start_date, end_date, is_active } = req.body;

    // Backend menerima string datetime-local, diproses sebagai Local Time
    const formattedStartDate = formatDateForMySQL(start_date);
    const formattedEndDate = formatDateForMySQL(end_date);

    await pool.query(
      `UPDATE feedback_360_periods 
       SET period_name = ?, start_date = ?, end_date = ?, is_active = ?, updated_at = NOW() 
       WHERE id = ?`,
      [period_name, formattedStartDate, formattedEndDate, is_active, periodId]
    );

    res.json({ success: true, message: 'Feedback period updated' });
  } catch (error) {
    console.error('Update feedback period error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteFeedbackPeriod = async (req, res) => {
  try {
    const { periodId } = req.params;
    await pool.query('DELETE FROM feedback_360_periods WHERE id = ?', [periodId]);
    res.json({ success: true, message: 'Feedback period deleted' });
  } catch (error) {
    console.error('Delete feedback period error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ FEEDBACK 360 SUBMISSION (STUDENT) ============

exports.getActiveFeedbackPeriod = async (req, res) => {
  try {
    const batchId = req.user.batch_id;

    const [periods] = await pool.query(
      `SELECT * FROM feedback_360_periods 
       WHERE batch_id = ? AND is_active = TRUE 
       ORDER BY created_at DESC LIMIT 1`,
      [batchId]
    );

    if (periods.length === 0) {
      return res.json({ success: true, data: null });
    }

    const period = periods[0];
    const now = new Date();
    const start = new Date(period.start_date);
    const end = new Date(period.end_date);
    const isOpen = now >= start && now <= end;

    res.json({
      success: true,
      data: {
        ...period,
        is_open: isOpen,
        status: isOpen ? 'open' : (now < start ? 'upcoming' : 'closed')
      }
    });
  } catch (error) {
    console.error('Get active feedback period error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyTeamMembers = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's group
    const [groups] = await pool.query(
      `SELECT group_id FROM capstone_group_members 
       WHERE user_id = ? AND state = 'accepted'`,
      [userId]
    );

    if (groups.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const groupId = groups[0].group_id;

    // Get all team members except self
    const [members] = await pool.query(
      `SELECT u.id, u.name, u.email, u.learning_path 
       FROM capstone_group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ? AND gm.state = 'accepted' AND u.id != ?
       ORDER BY u.name ASC`,
      [groupId, userId]
    );

    res.json({ success: true, data: members });
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    const { reviewee_id, is_active, contribution_level, reason } = req.body;
    const reviewerId = req.user.id;
    const batchId = req.user.batch_id;

    // Get reviewer's group
    const [groups] = await pool.query(
      `SELECT group_id FROM capstone_group_members 
       WHERE user_id = ? AND state = 'accepted'`,
      [reviewerId]
    );

    if (groups.length === 0) {
      return res.status(400).json({ success: false, message: 'You are not in any group' });
    }

    const groupId = groups[0].group_id;

    // Check if reviewee is in the same group
    const [revieweeGroup] = await pool.query(
      `SELECT group_id FROM capstone_group_members 
       WHERE user_id = ? AND group_id = ? AND state = 'accepted'`,
      [reviewee_id, groupId]
    );

    if (revieweeGroup.length === 0) {
      return res.status(400).json({ success: false, message: 'Reviewee is not in your group' });
    }

    // Check if feedback already exists
    const [existing] = await pool.query(
      'SELECT id FROM feedback_360 WHERE reviewer_id = ? AND reviewee_id = ?',
      [reviewerId, reviewee_id]
    );

    if (existing.length > 0) {
      // Update existing feedback
      await pool.query(
        `UPDATE feedback_360 
         SET is_active = ?, contribution_level = ?, reason = ?, submitted_at = NOW() 
         WHERE reviewer_id = ? AND reviewee_id = ?`,
        [is_active, contribution_level, reason, reviewerId, reviewee_id]
      );

      res.json({ success: true, message: 'Feedback updated successfully' });
    } else {
      // Insert new feedback
      await pool.query(
        `INSERT INTO feedback_360 (batch_id, reviewer_id, reviewee_id, group_id, is_active, contribution_level, reason) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [batchId, reviewerId, reviewee_id, groupId, is_active, contribution_level, reason]
      );

      res.status(201).json({ success: true, message: 'Feedback submitted successfully' });
    }
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyFeedbackProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's group and team members
    const [groups] = await pool.query(
      `SELECT group_id FROM capstone_group_members 
       WHERE user_id = ? AND state = 'accepted'`,
      [userId]
    );

    if (groups.length === 0) {
      return res.json({ success: true, data: { submitted: 0, total: 0, feedbacks: [] } });
    }

    const groupId = groups[0].group_id;

    // Count team members (excluding self)
    const [memberCount] = await pool.query(
      `SELECT COUNT(*) as count FROM capstone_group_members 
       WHERE group_id = ? AND state = 'accepted' AND user_id != ?`,
      [groupId, userId]
    );

    const totalMembers = memberCount[0].count;

    // Get submitted feedbacks
    const [feedbacks] = await pool.query(
      `SELECT f.*, u.name as reviewee_name 
       FROM feedback_360 f
       JOIN users u ON f.reviewee_id = u.id
       WHERE f.reviewer_id = ?
       ORDER BY f.submitted_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        submitted: feedbacks.length,
        total: totalMembers,
        feedbacks
      }
    });
  } catch (error) {
    console.error('Get feedback progress error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ EXPORT (ADMIN) ============

exports.exportFeedback = async (req, res) => {
  try {
    const { batch_id } = req.query;
    const batchId = batch_id || req.user.batch_id;

    // Get all feedbacks
    const [feedbacks] = await pool.query(
      `SELECT 
        f.*,
        reviewer.name as reviewer_name,
        reviewer.email as reviewer_email,
        reviewee.name as reviewee_name,
        reviewee.email as reviewee_email,
        g.group_name
       FROM feedback_360 f
       JOIN users reviewer ON f.reviewer_id = reviewer.id
       JOIN users reviewee ON f.reviewee_id = reviewee.id
       JOIN capstone_groups g ON f.group_id = g.id
       WHERE f.batch_id = ?
       ORDER BY g.group_name, reviewer.name, reviewee.name`,
      [batchId]
    );

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    
    // RAW DATA Sheet
    const rawSheet = workbook.addWorksheet('Raw Data');
    rawSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Batch ID', key: 'batch_id', width: 15 },
      { header: 'Group Name', key: 'group_name', width: 20 },
      { header: 'Reviewer Name', key: 'reviewer_name', width: 25 },
      { header: 'Reviewer Email', key: 'reviewer_email', width: 30 },
      { header: 'Reviewee Name', key: 'reviewee_name', width: 25 },
      { header: 'Reviewee Email', key: 'reviewee_email', width: 30 },
      { header: 'Is Active', key: 'is_active', width: 15 },
      { header: 'Contribution Level', key: 'contribution_level', width: 50 },
      { header: 'Reason', key: 'reason', width: 60 },
      { header: 'Submitted At', key: 'submitted_at', width: 20 },
    ];

    feedbacks.forEach(feedback => {
      rawSheet.addRow(feedback);
    });

    // CLEAN DATA Sheet (Summary per Reviewer)
    const cleanSheet = workbook.addWorksheet('Clean Data');
    cleanSheet.columns = [
      { header: 'Reviewer Name', key: 'reviewer_name', width: 25 },
      { header: 'Group Name', key: 'group_name', width: 20 },
      { header: 'Total Reviewed', key: 'total_reviewed', width: 15 },
      { header: 'Members Reviewed', key: 'members_reviewed', width: 40 },
      { header: 'Active Members', key: 'active_count', width: 15 },
      { header: 'Inactive Members', key: 'inactive_count', width: 15 },
      { header: 'Significant Contribution', key: 'significant_count', width: 25 },
      { header: 'Not Significant', key: 'not_significant_count', width: 20 },
    ];

    // Group feedbacks by reviewer
    const reviewerSummary = {};
    feedbacks.forEach(f => {
      if (!reviewerSummary[f.reviewer_id]) {
        reviewerSummary[f.reviewer_id] = {
          reviewer_name: f.reviewer_name,
          group_name: f.group_name,
          total_reviewed: 0,
          members: [],
          active_count: 0,
          inactive_count: 0,
          significant_count: 0,
          not_significant_count: 0,
        };
      }

      const summary = reviewerSummary[f.reviewer_id];
      summary.total_reviewed++;
      summary.members.push(f.reviewee_name);
      
      if (f.is_active === 'Aktif') summary.active_count++;
      else summary.inactive_count++;
      
      if (f.contribution_level === 'Memberikan kontribusi signifikan') {
        summary.significant_count++;
      } else if (f.contribution_level.includes('tidak signifikan') || 
                 f.contribution_level.includes('Tidak memberikan')) {
        summary.not_significant_count++;
      }
    });

    Object.values(reviewerSummary).forEach(summary => {
      cleanSheet.addRow({
        ...summary,
        members_reviewed: summary.members.join(', ')
      });
    });

    // Style headers
    [rawSheet, cleanSheet].forEach(sheet => {
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      sheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=360_Feedback_${batchId}_${Date.now()}.xlsx`);
    res.send(buffer);

  } catch (error) {
    console.error('Export feedback error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};