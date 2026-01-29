const pool = require('../config/database');

// Get all use cases (Admin & Student)
exports.getAllUseCases = async (req, res) => {
  try {
    const { batch_id, is_active } = req.query;
    const userRole = req.user.role;

    let query = `
      SELECT 
        uc.*,
        (SELECT COUNT(*) FROM capstone_groups WHERE use_case_id = uc.id AND status IN ('draft', 'ready', 'approved')) as team_count,
        (SELECT COUNT(*) FROM capstone_use_case_rules WHERE use_case_id = uc.id) as rules_count
      FROM capstone_use_cases uc
      WHERE 1=1
    `;
    const params = [];

    if (batch_id) {
      query += ' AND uc.batch_id = ?';
      params.push(batch_id);
    }

    // Student only see active use cases
    if (userRole === 'STUDENT') {
      query += ' AND uc.is_active = TRUE';
    } else if (is_active !== undefined) {
      query += ' AND uc.is_active = ?';
      params.push(is_active === 'true' || is_active === true);
    }

    query += ' ORDER BY uc.display_order ASC, uc.created_at DESC';

    const [useCases] = await pool.query(query, params);

    res.json({
      success: true,
      data: useCases
    });
  } catch (error) {
    console.error('Get use cases error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get use case detail with rules
exports.getUseCaseDetail = async (req, res) => {
  try {
    const { useCaseId } = req.params;

    // Get use case info
    const [useCases] = await pool.query(
      'SELECT * FROM capstone_use_cases WHERE id = ?',
      [useCaseId]
    );

    if (useCases.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Use case not found'
      });
    }

    // Get rules for this use case
    const [rules] = await pool.query(`
      SELECT 
        r.*,
        ucr.is_required
      FROM capstone_use_case_rules ucr
      JOIN capstone_rules r ON ucr.rule_id = r.id
      WHERE ucr.use_case_id = ?
      ORDER BY 
        FIELD(r.rule_type, 'GROUP_SIZE', 'MAX_SAME_UNIVERSITY', 'REQUIRED_LEARNING_PATHS'),
        r.id
    `, [useCaseId]);

    // Get team count
    const [teamCount] = await pool.query(
      'SELECT COUNT(*) as count FROM capstone_groups WHERE use_case_id = ? AND status IN ("draft", "ready", "approved")',
      [useCaseId]
    );

    res.json({
      success: true,
      data: {
        ...useCases[0],
        rules,
        team_count: teamCount[0].count
      }
    });
  } catch (error) {
    console.error('Get use case detail error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create use case (Admin only)
exports.createUseCase = async (req, res) => {
  try {
    const { name, company, description, is_active, display_order } = req.body;
    const batch_id = req.body.batch_id || req.user.batch_id;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Use case name is required'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO capstone_use_cases (batch_id, name, company, description, is_active, display_order) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [batch_id, name, company, description, is_active !== false, display_order || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Use case created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create use case error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update use case (Admin only)
exports.updateUseCase = async (req, res) => {
  try {
    const { useCaseId } = req.params;
    const { name, company, description, is_active, display_order } = req.body;

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (company !== undefined) {
      updates.push('company = ?');
      values.push(company);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }
    if (display_order !== undefined) {
      updates.push('display_order = ?');
      values.push(display_order);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(useCaseId);

    await pool.query(
      `UPDATE capstone_use_cases SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Use case updated successfully'
    });
  } catch (error) {
    console.error('Update use case error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete use case (Admin only)
exports.deleteUseCase = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { useCaseId } = req.params;

    await connection.beginTransaction();

    // Check if any groups are using this use case
    const [groups] = await connection.query(
      'SELECT COUNT(*) as count FROM capstone_groups WHERE use_case_id = ? AND status IN ("ready", "approved")',
      [useCaseId]
    );

    if (groups[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete use case. ${groups[0].count} team(s) are using this use case.`
      });
    }

    // Delete use case (CASCADE will handle rules mapping)
    await connection.query('DELETE FROM capstone_use_cases WHERE id = ?', [useCaseId]);

    await connection.commit();

    res.json({
      success: true,
      message: 'Use case deleted successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Delete use case error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    connection.release();
  }
};

// ==========================================
// ADMIN: Rules Management
// ==========================================

// Get all rules
exports.getAllRules = async (req, res) => {
  try {
    const { batch_id, rule_type } = req.query;

    let query = 'SELECT * FROM capstone_rules WHERE 1=1';
    const params = [];

    if (batch_id) {
      query += ' AND batch_id = ?';
      params.push(batch_id);
    }

    if (rule_type) {
      query += ' AND rule_type = ?';
      params.push(rule_type);
    }

    query += ' ORDER BY rule_type, created_at DESC';

    const [rules] = await pool.query(query, params);

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Get rules error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create rule
exports.createRule = async (req, res) => {
  try {
    const { rule_type, rule_value, description } = req.body;
    const batch_id = req.body.batch_id || req.user.batch_id;

    if (!rule_type || !rule_value) {
      return res.status(400).json({
        success: false,
        message: 'rule_type and rule_value are required'
      });
    }

    // Validate rule_type
    const validTypes = ['GROUP_SIZE', 'MAX_SAME_UNIVERSITY', 'REQUIRED_LEARNING_PATHS'];
    if (!validTypes.includes(rule_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid rule_type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const [result] = await pool.query(
      'INSERT INTO capstone_rules (batch_id, rule_type, rule_value, description) VALUES (?, ?, ?, ?)',
      [batch_id, rule_type, rule_value, description]
    );

    res.status(201).json({
      success: true,
      message: 'Rule created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create rule error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update rule
exports.updateRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    const { rule_type, rule_value, description } = req.body;

    const updates = [];
    const values = [];

    if (rule_type !== undefined) {
      updates.push('rule_type = ?');
      values.push(rule_type);
    }
    if (rule_value !== undefined) {
      updates.push('rule_value = ?');
      values.push(rule_value);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(ruleId);

    await pool.query(
      `UPDATE capstone_rules SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Rule updated successfully'
    });
  } catch (error) {
    console.error('Update rule error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete rule
exports.deleteRule = async (req, res) => {
  try {
    const { ruleId } = req.params;

    // Check if rule is being used
    const [useCases] = await pool.query(
      'SELECT COUNT(*) as count FROM capstone_use_case_rules WHERE rule_id = ?',
      [ruleId]
    );

    if (useCases[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete rule. It is being used by ${useCases[0].count} use case(s).`
      });
    }

    await pool.query('DELETE FROM capstone_rules WHERE id = ?', [ruleId]);

    res.json({
      success: true,
      message: 'Rule deleted successfully'
    });
  } catch (error) {
    console.error('Delete rule error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// ADMIN: Assign Rules to Use Case
// ==========================================

// Assign rules to use case
exports.assignRulesToUseCase = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { useCaseId } = req.params;
    const { rule_ids } = req.body; // Array of rule IDs

    if (!Array.isArray(rule_ids)) {
      return res.status(400).json({
        success: false,
        message: 'rule_ids must be an array'
      });
    }

    await connection.beginTransaction();

    // Delete existing mappings
    await connection.query('DELETE FROM capstone_use_case_rules WHERE use_case_id = ?', [useCaseId]);

    // Insert new mappings
    if (rule_ids.length > 0) {
      const values = rule_ids.map(ruleId => [useCaseId, ruleId, true]);
      await connection.query(
        'INSERT INTO capstone_use_case_rules (use_case_id, rule_id, is_required) VALUES ?',
        [values]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Rules assigned successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Assign rules error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    connection.release();
  }
};

// Get rules for specific use case
exports.getUseCaseRules = async (req, res) => {
  try {
    const { useCaseId } = req.params;

    const [rules] = await pool.query(`
      SELECT 
        r.*,
        ucr.is_required
      FROM capstone_use_case_rules ucr
      JOIN capstone_rules r ON ucr.rule_id = r.id
      WHERE ucr.use_case_id = ?
      ORDER BY r.rule_type, r.id
    `, [useCaseId]);

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Get use case rules error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};