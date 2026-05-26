import express from 'express';
import Result from '../models/Result.js';
import Student from '../models/Student.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  buildMongoFilters,
  buildTeacherScopeFilter,
  createHttpError,
  ensureOwnStudentAccess,
  ensureTeacherClassAccess,
  getLinkedStudentId,
  isTeacher
} from '../utils/authAccess.js';

const router = express.Router();

const ensureTeacherCanManageResult = async (user, payload, existingResult = null) => {
  if (!isTeacher(user)) return;

  const className = payload.class || existingResult?.class;
  const section = payload.section || existingResult?.section;
  const studentId = payload.studentId || existingResult?.studentId;

  if (!className || !section || !studentId) {
    throw createHttpError(400, 'Class, section, and student are required');
  }

  await ensureTeacherClassAccess(user, className, section);

  const student = await Student.findById(studentId).select('class section');
  if (!student) throw createHttpError(404, 'Student not found');

  if (student.class !== className || student.section !== section) {
    throw createHttpError(400, 'Result class and section must match the selected student');
  }
};

// GET /api/results
router.get('/', protect, async (req, res) => {
  try {
    const { studentId, class: cls, section, examType, academicYear, page, limit } = req.query;
    const filters = [];

    if (examType) filters.push({ examType });
    if (academicYear) filters.push({ academicYear });

    if (req.user.role === 'student' || req.user.role === 'parent') {
      const linkedStudentId = getLinkedStudentId(req.user);
      if (!linkedStudentId) throw createHttpError(403, 'This account is not linked to a student profile');
      if (studentId && String(studentId) !== linkedStudentId) {
        throw createHttpError(403, 'You are not allowed to view another student\'s results');
      }
      filters.push({ studentId: linkedStudentId });
    } else {
      if (studentId) filters.push({ studentId });
    }

    if (cls) filters.push({ class: cls });
    if (section) filters.push({ section });

    if (isTeacher(req.user)) {
      filters.push(await buildTeacherScopeFilter(req.user, cls, section));
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit) || 100));
    const builtQuery = buildMongoFilters(filters);
    const total = await Result.countDocuments(builtQuery);
    const results = await Result.find(builtQuery)
      .populate('studentId', 'name studentId rollNo class section')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({ success: true, count: results.length, total, page: pageNum, pages: Math.ceil(total / limitNum), data: results });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// GET /api/results/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('studentId', 'name studentId rollNo class section dob parentName');
    if (!result) throw createHttpError(404, 'Result not found');

    if (req.user.role === 'student' || req.user.role === 'parent') {
      ensureOwnStudentAccess(req.user, result.studentId?._id || result.studentId);
    } else if (isTeacher(req.user)) {
      await ensureTeacherClassAccess(req.user, result.class, result.section);
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// POST /api/results
router.post('/', protect, authorize('admin', 'teacher'), async (req, res) => {
  try {
    await ensureTeacherCanManageResult(req.user, req.body);

    const data = { ...req.body, addedBy: req.user._id };
    const result = await Result.create(data);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

// PUT /api/results/:id
router.put('/:id', protect, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) throw createHttpError(404, 'Result not found');

    await ensureTeacherCanManageResult(req.user, req.body, result);

    Object.assign(result, req.body);
    await result.save();

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

// DELETE /api/results/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);
    if (!result) throw createHttpError(404, 'Result not found');
    res.json({ success: true, message: 'Result deleted' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// POST /api/results/bulk - add results for entire class
router.post('/bulk', protect, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { class: cls, section, examType, academicYear, resultsData } = req.body;
    if (!cls || !section || !examType || !academicYear || !Array.isArray(resultsData) || !resultsData.length) {
      throw createHttpError(400, 'Class, section, exam type, academic year, and results data are required');
    }

    await ensureTeacherClassAccess(req.user, cls, section);

    const created = [];
    for (const item of resultsData) {
      await ensureTeacherCanManageResult(req.user, { studentId: item.studentId, class: cls, section });
      const result = await Result.create({
        studentId: item.studentId,
        class: cls,
        section,
        examType,
        academicYear,
        subjects: item.subjects,
        addedBy: req.user._id
      });
      created.push(result);
    }

    const allResults = await Result.find({ class: cls, section, examType, academicYear }).sort({ percentage: -1 });
    for (let index = 0; index < allResults.length; index += 1) {
      allResults[index].rank = index + 1;
      await allResults[index].save();
    }

    res.status(201).json({ success: true, count: created.length, message: 'Results saved and ranked' });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

export default router;
