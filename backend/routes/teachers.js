import express from 'express';
import Teacher from '../models/Teacher.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import { createHttpError } from '../utils/authAccess.js';
import { issueTemporaryPasswordForUser, syncTeacherUser, validateTeacherAccountEmail } from '../utils/accountSync.js';
import multer from 'multer';
import path from 'path';
import { compressPhoto } from '../utils/imageProcessor.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/photos/'),
  filename: (req, file, cb) => cb(null, `teacher_${Date.now()}${path.extname(file.originalname)}`)
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

const loadTeacherLoginAccount = async (teacher) => {
  if (!teacher?.userId) return null;

  const user = await User.findById(teacher.userId).select('email isActive lastLogin mustChangePassword');
  if (!user) return null;

  return {
    id: user._id,
    email: user.email,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    mustChangePassword: user.mustChangePassword
  };
};

// GET /api/teachers
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, search, page, limit } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { teacherId: { $regex: search, $options: 'i' } },
        { subjects: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 100));
    const total = await Teacher.countDocuments(query);
    const teachers = await Teacher.find(query)
      .sort({ name: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({ success: true, count: teachers.length, total, page: pageNum, pages: Math.ceil(total / limitNum), data: teachers });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// GET /api/teachers/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) throw createHttpError(404, 'Teacher not found');

    const isAdmin = req.user.role === 'admin';
    const isSelf = req.user.role === 'teacher' && String(req.user.roleId) === String(teacher._id);
    if (!isAdmin && !isSelf) {
      throw createHttpError(403, 'You are not allowed to access this teacher record');
    }

    const data = teacher.toObject();
    if (isAdmin) {
      data.loginAccount = await loadTeacherLoginAccount(teacher);
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// POST /api/teachers
router.post('/', protect, authorize('admin'), upload.single('photo'), async (req, res) => {
  let teacher;

  try {
    const data = { ...req.body };
    if (data.subjects && typeof data.subjects === 'string') {
      data.subjects = data.subjects.split(',').map((subject) => subject.trim()).filter(Boolean);
    }
    if (data.assignedClasses && typeof data.assignedClasses === 'string') {
      data.assignedClasses = JSON.parse(data.assignedClasses);
    }
    if (req.file) {
      await compressPhoto(req.file.path);
      data.photo = req.file.filename;
    }

    teacher = await Teacher.create(data);
    await validateTeacherAccountEmail(teacher);
    const teacherAccount = await syncTeacherUser(teacher);

    const freshTeacher = await Teacher.findById(teacher._id);

    res.status(201).json({
      success: true,
      data: freshTeacher,
      credentials: {
        teacher: buildCredentialPayload(teacherAccount)
      }
    });
  } catch (err) {
    if (teacher?._id) {
      if (teacher.userId) await User.findByIdAndDelete(teacher.userId);
      await Teacher.findByIdAndDelete(teacher._id);
    }

    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

// PUT /api/teachers/:id
router.put('/:id', protect, authorize('admin'), upload.single('photo'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) throw createHttpError(404, 'Teacher not found');

    const data = { ...req.body };
    if (data.subjects && typeof data.subjects === 'string') {
      data.subjects = data.subjects.split(',').map((subject) => subject.trim()).filter(Boolean);
    }
    if (data.assignedClasses && typeof data.assignedClasses === 'string') {
      data.assignedClasses = JSON.parse(data.assignedClasses);
    }
    if (req.file) {
      await compressPhoto(req.file.path);
      data.photo = req.file.filename;
    }

    Object.assign(teacher, data);
    await validateTeacherAccountEmail(teacher);
    await teacher.save();

    const teacherAccount = await syncTeacherUser(teacher);
    const freshTeacher = await Teacher.findById(teacher._id);
    const response = { success: true, data: freshTeacher };

    if (teacherAccount.created) {
      response.credentials = {
        teacher: buildCredentialPayload(teacherAccount)
      };
    }

    res.json(response);
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

router.post('/:id/reset-login', protect, authorize('admin'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) throw createHttpError(404, 'Teacher not found');

    await validateTeacherAccountEmail(teacher);
    const teacherAccount = await syncTeacherUser(teacher);

    let temporaryPassword = teacherAccount.temporaryPassword;
    let email = teacherAccount.email;

    if (!teacherAccount.created) {
      const user = await User.findById(teacher.userId);
      if (!user) throw createHttpError(404, 'Teacher login account not found');
      temporaryPassword = await issueTemporaryPasswordForUser(user);
      email = user.email;
    }

    res.json({
      success: true,
      message: 'Teacher login reset successfully',
      credentials: {
        teacher: {
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

// DELETE /api/teachers/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) throw createHttpError(404, 'Teacher not found');

    if (teacher.userId) await User.findByIdAndDelete(teacher.userId);
    await teacher.deleteOne();

    res.json({ success: true, message: 'Teacher deleted' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

export default router;
