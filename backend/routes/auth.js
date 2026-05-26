import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import { protect } from '../middleware/auth.js';
import { createTemporaryPassword } from '../utils/accountSync.js';

const router = express.Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

const serializeUserWithRoleData = async (user) => {
  let roleData = {};

  if (user.role === 'student' && user.roleId) {
    roleData = await Student.findById(user.roleId).select('class section rollNo');
  } else if (user.role === 'teacher' && user.roleId) {
    roleData = await Teacher.findById(user.roleId).select('subjects assignedClasses');
  } else if (user.role === 'parent' && user.roleId) {
    const child = await Student.findById(user.roleId).select('name class section rollNo');
    if (child) {
      roleData = {
        childName: child.name,
        childClass: child.class,
        childSection: child.section,
        childRollNo: child.rollNo
      };
    }
  }

  const roleDataObject = roleData && typeof roleData.toObject === 'function' ? roleData.toObject() : roleData;

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    roleId: user.roleId,
    mustChangePassword: Boolean(user.mustChangePassword),
    ...roleDataObject
  };
};

// POST /api/auth/login - Universal login for all roles
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account is deactivated' });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);

    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      success: true,
      user: await serializeUserWithRoleData(user)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    res.json({ success: true, user: await serializeUserWithRoleData(req.user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password must be different from the current password' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();
    res.json({
      success: true,
      message: 'Password changed successfully',
      user: await serializeUserWithRoleData(user)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/admin-recovery — reset admin password using the recovery secret key
router.post('/admin-recovery', async (req, res) => {
  try {
    const { email, recoverySecret } = req.body;

    if (!email || !recoverySecret) {
      return res.status(400).json({ success: false, message: 'Email and recovery key are required' });
    }

    const configuredSecret = process.env.ADMIN_RECOVERY_SECRET;
    if (!configuredSecret || recoverySecret !== configuredSecret) {
      return res.status(401).json({ success: false, message: 'Invalid recovery key' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail, role: 'admin' }).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'No admin account found with this email' });
    }

    const tempPassword = createTemporaryPassword();
    user.password = tempPassword;
    user.mustChangePassword = true;
    await user.save();

    res.json({
      success: true,
      message: 'Admin password reset successfully',
      temporaryPassword: tempPassword
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
