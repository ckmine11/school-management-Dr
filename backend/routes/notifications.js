import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { sendPushNotification } from '../utils/notification.js';
import AdmissionEnquiry from '../models/AdmissionEnquiry.js';
import ContactMessage from '../models/ContactMessage.js';
import Notice from '../models/Notice.js';
import ExamSchedule from '../models/ExamSchedule.js';
import Teacher from '../models/Teacher.js';
import Fee from '../models/Fee.js';
import Result from '../models/Result.js';
import Attendance from '../models/Attendance.js';

const router = express.Router();

// POST /api/notifications/send — admin only
router.post('/send', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, message, url } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }
    const result = await sendPushNotification({ title, message, url: url || '/' });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/notifications/inbox — all authenticated roles, fully role-specific
router.get('/inbox', protect, async (req, res) => {
  try {
    const role = req.user.role;
    const roleId = req.user.roleId;
    const items = [];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // ── Common: Notices (audience-filtered, last 7 days) ──────────────────
    const audienceMap = { teacher: 'teachers', student: 'students', parent: 'parents' };
    const noticeQuery = { createdAt: { $gte: sevenDaysAgo } };
    if (role !== 'admin') noticeQuery.targetAudience = { $in: ['all', audienceMap[role]] };

    const noticeHref = role === 'teacher' ? '/admin/notices.html'
      : role === 'student' ? '/admin/notices.html'
      : role === 'parent' ? '/admin/notices.html'
      : '/admin/notices.html';

    const notices = await Notice.find(noticeQuery).sort({ createdAt: -1 }).limit(5).select('title type createdAt');
    notices.forEach(n => items.push({
      type: 'notice',
      title: n.title,
      subtitle: `${n.type.charAt(0).toUpperCase() + n.type.slice(1)} Notice`,
      time: n.createdAt,
      href: noticeHref
    }));

    // ── Common: Upcoming exams (next 7 days) ──────────────────────────────
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const examHref = role === 'teacher' ? '/teacher/exams.html'
      : role === 'student' ? '/student/exams.html'
      : role === 'parent' ? '/parent/exams.html'
      : '/admin/exams.html';

    const exams = await ExamSchedule.find({ examDate: { $gte: new Date(), $lte: sevenDaysLater } })
      .sort({ examDate: 1 }).limit(5).select('subject class examDate examType createdAt');
    exams.forEach(e => items.push({
      type: 'exam',
      title: `Exam: ${e.subject} (${e.class})`,
      subtitle: `${e.examType} · ${new Date(e.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
      time: e.createdAt,
      href: examHref
    }));

    // ── Teacher-specific ──────────────────────────────────────────────────
    if (role === 'teacher' && roleId) {
      const teacher = await Teacher.findById(roleId).select('assignedClasses name');
      if (teacher && teacher.assignedClasses.length > 0) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
        const classNames = teacher.assignedClasses.map(c => c.class);

        const todayAttendance = await Attendance.findOne({
          class: { $in: classNames },
          date: { $gte: today, $lt: tomorrow }
        }).select('_id createdAt');

        if (!todayAttendance) {
          const classList = teacher.assignedClasses.map(c => `${c.class}-${c.section}`).join(', ');
          items.push({
            type: 'reminder',
            title: 'Attendance not marked today',
            subtitle: classList,
            time: new Date(),
            href: '/teacher/attendance.html'
          });
        }
      }
    }

    // ── Student-specific ──────────────────────────────────────────────────
    if (role === 'student' && roleId) {
      const [overdueFees, recentResults] = await Promise.all([
        Fee.find({ studentId: roleId, status: { $in: ['unpaid', 'partial'] }, dueDate: { $lt: new Date() } })
          .sort({ dueDate: 1 }).limit(3).select('feeType amount dueDate createdAt'),
        Result.find({ studentId: roleId, createdAt: { $gte: sevenDaysAgo } })
          .sort({ createdAt: -1 }).limit(3).select('examType class percentage createdAt')
      ]);

      overdueFees.forEach(f => items.push({
        type: 'fee',
        title: `Fee Due: ${f.feeType}`,
        subtitle: `₹${f.amount} overdue · ${new Date(f.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
        time: f.createdAt,
        href: '/student/fees.html'
      }));

      recentResults.forEach(r => items.push({
        type: 'result',
        title: `Result Published: ${r.examType}`,
        subtitle: `${r.class} · ${r.percentage}%`,
        time: r.createdAt,
        href: '/student/results.html'
      }));
    }

    // ── Parent-specific ───────────────────────────────────────────────────
    if (role === 'parent' && roleId) {
      const [overdueFees, recentResults, recentAbsences] = await Promise.all([
        Fee.find({ studentId: roleId, status: { $in: ['unpaid', 'partial'] }, dueDate: { $lt: new Date() } })
          .sort({ dueDate: 1 }).limit(3).select('feeType amount dueDate createdAt'),
        Result.find({ studentId: roleId, createdAt: { $gte: sevenDaysAgo } })
          .sort({ createdAt: -1 }).limit(3).select('examType class percentage createdAt'),
        Attendance.find({ studentId: roleId, status: 'absent', date: { $gte: sevenDaysAgo } })
          .sort({ date: -1 }).limit(3).select('date class createdAt')
      ]);

      overdueFees.forEach(f => items.push({
        type: 'fee',
        title: `Fee Due: ${f.feeType}`,
        subtitle: `₹${f.amount} overdue · ${new Date(f.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
        time: f.createdAt,
        href: '/parent/dashboard.html'
      }));

      recentResults.forEach(r => items.push({
        type: 'result',
        title: `Result Published: ${r.examType}`,
        subtitle: `${r.class} · ${r.percentage}%`,
        time: r.createdAt,
        href: '/parent/dashboard.html'
      }));

      recentAbsences.forEach(a => items.push({
        type: 'absent',
        title: `Absent: ${new Date(a.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`,
        subtitle: `Class ${a.class}`,
        time: a.createdAt,
        href: '/parent/dashboard.html'
      }));
    }

    // ── Admin-only ────────────────────────────────────────────────────────
    if (role === 'admin') {
      const [admissions, contacts] = await Promise.all([
        AdmissionEnquiry.find({ status: 'new' }).sort({ createdAt: -1 }).limit(10).select('studentName applyingClass createdAt'),
        ContactMessage.find({ status: 'new' }).sort({ createdAt: -1 }).limit(10).select('name subject createdAt')
      ]);
      admissions.forEach(a => items.push({ type: 'admission', title: `New Admission: ${a.studentName}`, subtitle: a.applyingClass, time: a.createdAt, href: '/admin/admissions.html' }));
      contacts.forEach(c => items.push({ type: 'contact', title: `New Message: ${c.name}`, subtitle: c.subject, time: c.createdAt, href: '/admin/contacts.html' }));
    }

    const sorted = items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 15);
    res.json({ success: true, items: sorted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/notifications/config — public, returns App ID for frontend SDK init
router.get('/config', (req, res) => {
  const configured = !!(
    process.env.ONESIGNAL_APP_ID &&
    process.env.ONESIGNAL_APP_ID !== 'your_onesignal_app_id'
  );
  res.json({
    success: true,
    configured,
    appId: configured ? process.env.ONESIGNAL_APP_ID : null
  });
});

export default router;
