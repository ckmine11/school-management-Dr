import express from 'express';
import ExamSchedule from '../models/ExamSchedule.js';
import { protect, authorize } from '../middleware/auth.js';
import { createHttpError, getLinkedStudentId } from '../utils/authAccess.js';
import Student from '../models/Student.js';
import { messageQueueService } from '../services/messageQueue.js';

const router = express.Router();

// GET /api/exams — filtered list (admin/teacher/student/parent)
router.get('/', protect, async (req, res) => {
  try {
    const { class: cls, section, examType, academicYear } = req.query;
    const query = {};
    if (examType) query.examType = examType;
    if (academicYear) query.academicYear = academicYear;

    // Students/parents see only their class
    if (req.user.role === 'student' || req.user.role === 'parent') {
      const linkedId = getLinkedStudentId(req.user);
      if (!linkedId) throw createHttpError(403, 'Account not linked to a student');
      const student = await Student.findById(linkedId).select('class section');
      if (!student) throw createHttpError(404, 'Student not found');
      query.class = student.class;
    } else {
      if (cls) query.class = cls;
      if (section && section !== 'All') query.$or = [{ section }, { section: 'All' }];
    }

    const exams = await ExamSchedule.find(query).sort({ examDate: 1, startTime: 1 });
    res.json({ success: true, count: exams.length, data: exams });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// POST /api/exams — admin only
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const exam = await ExamSchedule.create(req.body);
    res.status(201).json({ success: true, data: exam });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

// PUT /api/exams/:id — admin only
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const exam = await ExamSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!exam) throw createHttpError(404, 'Exam not found');
    res.json({ success: true, data: exam });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

// POST /api/exams/send-reminder — manually send reminder for one exam (admin only)
router.post('/send-reminder', protect, authorize('admin'), async (req, res) => {
  try {
    const { examId } = req.body;
    if (!examId) throw createHttpError(400, 'examId is required');
    const exam = await ExamSchedule.findById(examId);
    if (!exam) throw createHttpError(404, 'Exam not found');

    const studentQuery = { class: exam.class, status: 'active' };
    if (exam.section && exam.section !== 'All') studentQuery.section = exam.section;
    const students = await Student.find(studentQuery).select('parentPhone phone');

    if (!students.length) return res.json({ success: false, message: `No active students found in ${exam.class}. Add students first.` });

    // Prefer parentPhone, fall back to student phone
    const phones = new Set();
    for (const s of students) {
      if (s.parentPhone) phones.add(s.parentPhone);
      else if (s.phone) phones.add(s.phone);
    }
    const parentPhones = [...phones];
    if (!parentPhones.length) return res.json({ success: false, message: `${students.length} student(s) found in ${exam.class} but none have phone numbers. Please add parent/student phone numbers in student records.` });

    const date = new Date(exam.examDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const examLabel = exam.examType.charAt(0).toUpperCase() + exam.examType.slice(1).replace('-', ' ');
    const message =
      `📚 *Exam Reminder — ${process.env.SCHOOL_NAME || 'School'}*\n\n` +
      `*${exam.subject}* exam is scheduled!\n\n` +
      `📅 Date: ${date}\n` +
      `🕐 Time: ${exam.startTime}\n` +
      `⏱ Duration: ${exam.duration} minutes\n` +
      `📝 Exam: ${examLabel}\n` +
      `🏫 Class: ${exam.class}${exam.section !== 'All' ? ` - ${exam.section}` : ''}\n` +
      `📊 Max Marks: ${exam.maxMarks}\n` +
      (exam.room ? `🚪 Room: ${exam.room}\n` : '') +
      `\n*Best of luck! 🌟*`;

    await messageQueueService.enqueueBulk(parentPhones, message);
    await ExamSchedule.findByIdAndUpdate(examId, { reminderSent: true });
    res.json({ success: true, message: `Reminder queued for ${parentPhones.length} parent(s)` });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// DELETE /api/exams/:id — admin only
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const exam = await ExamSchedule.findByIdAndDelete(req.params.id);
    if (!exam) throw createHttpError(404, 'Exam not found');
    res.json({ success: true, message: 'Exam deleted' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

export default router;
