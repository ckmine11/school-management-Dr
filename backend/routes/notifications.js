import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { sendPushNotification } from '../utils/notification.js';
import AdmissionEnquiry from '../models/AdmissionEnquiry.js';
import ContactMessage from '../models/ContactMessage.js';
import Notice from '../models/Notice.js';
import ExamSchedule from '../models/ExamSchedule.js';

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

// GET /api/notifications/inbox — all authenticated roles, role-aware content
router.get('/inbox', protect, async (req, res) => {
  try {
    const role = req.user.role;
    const items = [];

    // New notices (last 7 days) — filtered by targetAudience
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const audienceMap = { teacher: 'teachers', student: 'students', parent: 'parents' };
    const noticeQuery = { createdAt: { $gte: sevenDaysAgo } };
    if (role !== 'admin') noticeQuery.targetAudience = { $in: ['all', audienceMap[role]] };

    const notices = await Notice.find(noticeQuery).sort({ createdAt: -1 }).limit(5).select('title type createdAt');
    notices.forEach(n => items.push({
      type: 'notice',
      title: n.title,
      subtitle: `${n.type.charAt(0).toUpperCase() + n.type.slice(1)} Notice`,
      time: n.createdAt,
      href: '/admin/notices.html'
    }));

    // Upcoming exams (next 7 days) — all roles
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const exams = await ExamSchedule.find({ examDate: { $gte: new Date(), $lte: sevenDaysLater } })
      .sort({ examDate: 1 }).limit(5).select('subject class examDate examType');
    exams.forEach(e => items.push({
      type: 'exam',
      title: `Exam: ${e.subject} (${e.class})`,
      subtitle: `${e.examType} · ${new Date(e.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
      time: e.examDate,
      href: '/admin/exams.html'
    }));

    // Admin-only: new admissions + new contact messages
    let adminUnread = 0;
    if (role === 'admin') {
      const [admissions, contacts] = await Promise.all([
        AdmissionEnquiry.find({ status: 'new' }).sort({ createdAt: -1 }).limit(10).select('studentName applyingClass createdAt'),
        ContactMessage.find({ status: 'new' }).sort({ createdAt: -1 }).limit(10).select('name subject createdAt')
      ]);
      adminUnread = admissions.length + contacts.length;
      admissions.forEach(a => items.push({ type: 'admission', title: `New Admission: ${a.studentName}`, subtitle: a.applyingClass, time: a.createdAt, href: '/admin/admissions.html' }));
      contacts.forEach(c => items.push({ type: 'contact', title: `New Message: ${c.name}`, subtitle: c.subject, time: c.createdAt, href: '/admin/contacts.html' }));
    }

    const sorted = items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 15);
    res.json({ success: true, unread: adminUnread + notices.length + exams.length, items: sorted });
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
