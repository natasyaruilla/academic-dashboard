const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { v4: uuidv4 } = require('crypto');

// Generate unique ID
const generateUserId = () => {
  return `USR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
};

// Register
exports.register = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { email, password, name, batch_id, learning_path, university, learning_group } = req.body;

    // Validation
    if (!email || !password || !name || !batch_id) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, name, and batch_id are required'
      });
    }

    // Check if user exists
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate user ID
    const userId = generateUserId();

    // Insert user
    await connection.query(
      `INSERT INTO users (id, batch_id, email, password, name, learning_path, university, learning_group, role) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'STUDENT')`,
      [userId, batch_id, email, hashedPassword, name, learning_path, university, learning_group]
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: userId,
        email,
        name,
        role: 'STUDENT'
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          batch_id: user.batch_id,
          learning_path: user.learning_path,
          university: user.university,
          learning_group: user.learning_group
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.query(
      `SELECT id, email, name, batch_id, learning_path, university, learning_group, role, created_at 
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get group info if student
    let groupInfo = null;
    if (users[0].role === 'STUDENT') {
      const [groups] = await pool.query(
        `SELECT g.id, g.group_name, g.status, gm.role as member_role
         FROM capstone_groups g
         JOIN capstone_group_members gm ON g.id = gm.group_id
         WHERE gm.user_id = ? AND gm.state = 'accepted'`,
        [userId]
      );
      
      if (groups.length > 0) {
        groupInfo = groups[0];
      }
    }

    // Get pending invitations count
    const [invitationsCount] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM capstone_group_invitations 
       WHERE invitee_user_id = ? AND state = 'pending'`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        ...users[0],
        group: groupInfo,
        pendingInvitations: invitationsCount[0].count
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, learning_path, university, learning_group } = req.body;

    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (learning_path !== undefined) {
      updates.push('learning_path = ?');
      values.push(learning_path);
    }
    if (university !== undefined) {
      updates.push('university = ?');
      values.push(university);
    }
    if (learning_group !== undefined) {
      updates.push('learning_group = ?');
      values.push(learning_group);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(userId);

    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};