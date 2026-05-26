import express from 'express';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  buildMongoFilters,
  buildTeacherScopeFilter,
  createHttpError,
  ensureStudentRecordAccess,
  getTeacherAssignments,
  isTeacher
} from '../utils/authAccess.js';
import { removeStudentLinkedUsers, syncParentUser, syncStudentUser, validateStudentAccountEmails, issueTemporaryPasswordForUser } from '../utils/accountSync.js';
import multer from 'multer';
import path from 'path';
import { compressPhoto } from '../utils/imageProcessor.js';
import { generateIdCard } from '../utils/pdfGenerator.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/photos/'),
  filename: (req, file, cb) => cb(null, `student_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

const buildCredentialPayload = (account) => {
  if (!account?.email || !account?.temporaryPassword) return null;

  return {
    email: account.email,
    temporaryPassword: account.temporaryPassword,
    mustChangePassword: true
  };
};

const loadStudentLoginAccounts = async (student) => {
  const [studentUser, parentUser] = await Promise.all([
    student.userId ? User.findById(student.userId).select('email isActive lastLogin mustChangePassword') : null,
    User.findOne({ role: 'parent', roleId: student._id }).select('email isActive lastLogin mustChangePassword')
  ]);

  return {
    student: studentUser
      ? {
          id: studentUser._id,
          email: studentUser.email,
          isActive: studentUser.isActive,
          lastLogin: studentUser.lastLogin,
          mustChangePassword: studentUser.mustChangePassword
        }
      : null,
    parent: parentUser
      ? {
          id: parentUser._id,
          email: parentUser.email,
          isActive: parentUser.isActive,
          lastLogin: parentUser.lastLogin,
          mustChangePassword: parentUser.mustChangePassword
        }
      : null
  };
};

// GET /api/students
router.get('/', protect, async (req, res) => {
  try {
    if (!['admin', 'teacher'].includes(req.user.role)) {
      throw createHttpError(403, 'You are not allowed to list students');
    }

    const { class: cls, section, status, search, page = 1, limit = 50 } = req.query;
    const filters = [];

    if (cls) filters.push({ class: cls });
    if (section) filters.push({ section });
    if (status) filters.push({ status });
    if (search) {
      filters.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { studentId: { $regex: search, $options: 'i' } },
          { rollNo: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (isTeacher(req.user)) {
      filters.push(await buildTeacherScopeFilter(req.user, cls, section));
    }

    const query = buildMongoFilters(filters);
    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .sort({ class: 1, section: 1, rollNo: 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, count: students.length, total, data: students });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// GET /api/students/classes/list
router.get('/classes/list', protect, async (req, res) => {
  try {
    if (!['admin', 'teacher'].includes(req.user.role)) {
      throw createHttpError(403, 'You are not allowed to view class lists');
    }

    if (isTeacher(req.user)) {
      const assignedClasses = await getTeacherAssignments(req.user);
      const classes = [...new Set(assignedClasses.map((entry) => entry.class))].sort();
      return res.json({ success: true, data: classes });
    }

    const classes = await Student.distinct('class');
    res.json({ success: true, data: classes.sort() });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// GET /api/students/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) throw createHttpError(404, 'Student not found');

    await ensureStudentRecordAccess(req.user, student._id);

    const data = student.toObject();
    if (req.user.role === 'admin') {
      data.loginAccounts = await loadStudentLoginAccounts(student);
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// POST /api/students
router.post('/', protect, authorize('admin'), upload.single('photo'), async (req, res) => {
  let student;

  try {
    const data = { ...req.body };
    if (req.file) {
      await compressPhoto(req.file.path);
      data.photo = req.file.filename;
    }

    student = await Student.create(data);

    await validateStudentAccountEmails(student);
    const studentAccount = await syncStudentUser(student);
    const parentAccount = await syncParentUser(student);

    const freshStudent = await Student.findById(student._id);

    res.status(201).json({
      success: true,
      data: freshStudent,
      credentials: {
        student: buildCredentialPayload(studentAccount),
        parent: buildCredentialPayload(parentAccount)
      }
    });
  } catch (err) {
    if (student?._id) {
      await removeStudentLinkedUsers(student);
      await Student.findByIdAndDelete(student._id);
    }

    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

// PUT /api/students/:id
router.put('/:id', protect, authorize('admin'), upload.single('photo'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) throw createHttpError(404, 'Student not found');

    const data = { ...req.body };
    if (req.file) {
      await compressPhoto(req.file.path);
      data.photo = req.file.filename;
    }

    Object.assign(student, data);
    await validateStudentAccountEmails(student);
    await student.save();

    const studentAccount = await syncStudentUser(student);
    const parentAccount = await syncParentUser(student);

    const freshStudent = await Student.findById(student._id);
    const response = { success: true, data: freshStudent };

    if (studentAccount.created || parentAccount.created) {
      response.credentials = {
        student: studentAccount.created ? buildCredentialPayload(studentAccount) : null,
        parent: parentAccount.created ? buildCredentialPayload(parentAccount) : null
      };
    }

    res.json(response);
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

router.post('/:id/reset-student-password', protect, authorize('admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) throw createHttpError(404, 'Student not found');

    await validateStudentAccountEmails(student);
    const studentAccount = await syncStudentUser(student);

    let temporaryPassword = studentAccount.temporaryPassword;
    let email = studentAccount.email;

    if (!studentAccount.created) {
      const user = await User.findById(student.userId);
      if (!user) throw createHttpError(404, 'Student login account not found');
      temporaryPassword = await issueTemporaryPasswordForUser(user);
      email = user.email;
    }

    res.json({
      success: true,
      message: 'Student login reset successfully',
      credentials: {
        student: {
          email,
          temporaryPassword,
          mustChangePassword: true
        }
      }
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

router.post('/:id/reset-parent-password', protect, authorize('admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) throw createHttpError(404, 'Student not found');

    await validateStudentAccountEmails(student);
    const parentAccount = await syncParentUser(student);

    let temporaryPassword = parentAccount.temporaryPassword;
    let email = parentAccount.email;

    if (!parentAccount.created) {
      const user = await User.findOne({ role: 'parent', roleId: student._id });
      if (!user) throw createHttpError(404, 'Parent login account not found');
      temporaryPassword = await issueTemporaryPasswordForUser(user);
      email = user.email;
    }

    res.json({
      success: true,
      message: 'Parent login reset successfully',
      credentials: {
        parent: {
          email,
          temporaryPassword,
          mustChangePassword: true
        }
      }
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

// GET /api/students/:id/idcard — download PDF ID card
router.get('/:id/idcard', protect, authorize('admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) throw createHttpError(404, 'Student not found');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="idcard_${student.studentId}.pdf"`);
    generateIdCard(student, res);
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// DELETE /api/students/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) throw createHttpError(404, 'Student not found');

    await removeStudentLinkedUsers(student);
    await student.deleteOne();

    res.json({ success: true, message: 'Student deleted' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

export default router;
