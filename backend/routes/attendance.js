import express from 'express';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  buildMongoFilters,
  buildTeacherScopeFilter,
  createHttpError,
  ensureStudentRecordAccess,
  ensureTeacherClassAccess,
  isTeacher
} from '../utils/authAccess.js';
import { sendWhatsApp } from '../utils/whatsapp.js';

const router = express.Router();

// POST /api/attendance/mark - bulk mark attendance for a class
router.post('/mark', protect, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { class: cls, section, date, records } = req.body;
    if (!cls || !section || !date || !Array.isArray(records) || !records.length) {
      throw createHttpError(400, 'Class, section, date, and attendance records are required');
    }

    await ensureTeacherClassAccess(req.user, cls, section);

    const studentIds = records.map((record) => record.studentId);
    const validStudents = await Student.countDocuments({
      _id: { $in: studentIds },
      class: cls,
      section
    });

    if (validStudents !== studentIds.length) {
      throw createHttpError(400, 'Attendance contains students outside the selected class and section');
    }

    const attendanceDate = new Date(date);
    const ops = records.map((record) => ({
      updateOne: {
        filter: { studentId: record.studentId, date: attendanceDate },
        update: {
          $set: {
            ...record,
            class: cls,
            section,
            date: attendanceDate,
            markedBy: req.user._id
          }
        },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(ops);

    const absentIds = records.filter((record) => record.status === 'absent').map((record) => record.studentId);
    if (absentIds.length > 0) {
      const absentStudents = await Student.find({ _id: { $in: absentIds } });
      for (const student of absentStudents) {
        if (student.parentPhone) {
          await sendWhatsApp(
            student.parentPhone,
            `Dear Parent, your child *${student.name}* (${student.class}-${student.section}) was marked *ABSENT* today (${attendanceDate.toLocaleDateString()}). Please contact the school if needed.`
          );
        }
      }
    }

    res.json({ success: true, message: 'Attendance marked successfully' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// GET /api/attendance?class=&section=&date=
router.get('/', protect, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { class: cls, section, date, studentId, month, year } = req.query;
    const filters = [];

    if (cls) filters.push({ class: cls });
    if (section) filters.push({ section });
    if (studentId) filters.push({ studentId });

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filters.push({ date: { $gte: start, $lte: end } });
    }

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
      filters.push({ date: { $gte: start, $lte: end } });
    }

    if (isTeacher(req.user)) {
      filters.push(await buildTeacherScopeFilter(req.user, cls, section));
    }

    const query = buildMongoFilters(filters);
    const records = await Attendance.find(query)
      .populate('studentId', 'name studentId rollNo')
      .sort({ date: -1 });

    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// GET /api/attendance/report/:studentId
router.get('/report/:studentId', protect, async (req, res) => {
  try {
    await ensureStudentRecordAccess(req.user, req.params.studentId);

    const { month, year } = req.query;
    const filters = [{ studentId: req.params.studentId }];

    if (month && year) {
      filters.push({
        date: {
          $gte: new Date(Number(year), Number(month) - 1, 1),
          $lte: new Date(Number(year), Number(month), 0, 23, 59, 59, 999)
        }
      });
    }

    const records = await Attendance.find(buildMongoFilters(filters)).sort({ date: 1 });
    const summary = {
      total: records.length,
      present: records.filter((record) => record.status === 'present').length,
      absent: records.filter((record) => record.status === 'absent').length,
      late: records.filter((record) => record.status === 'late').length,
      percentage: 0
    };

    if (summary.total > 0) {
      summary.percentage = Math.round(((summary.present + summary.late) / summary.total) * 100);
    }

    res.json({ success: true, data: records, summary });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// GET /api/attendance/class-summary?class=&section=&date=
router.get('/class-summary', protect, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { class: cls, section, date } = req.query;
    if (!cls || !section) {
      throw createHttpError(400, 'Class and section are required');
    }

    await ensureTeacherClassAccess(req.user, cls, section);

    const start = new Date(date || Date.now());
    start.setHours(0, 0, 0, 0);
    const end = new Date(date || Date.now());
    end.setHours(23, 59, 59, 999);

    const query = {
      class: cls,
      section,
      date: { $gte: start, $lte: end }
    };

    const records = await Attendance.find(query).populate('studentId', 'name studentId rollNo');
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

export default router;
