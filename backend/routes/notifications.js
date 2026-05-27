import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { sendPushNotification } from '../utils/notification.js';
import AdmissionEnquiry from '../models/AdmissionEnquiry.js';
import ContactMessage from '../models/ContactMessage.js';

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

// GET /api/notifications/inbox — admin, returns unread count + recent new items
router.get('/inbox', protect, authorize('admin'), async (req, res) => {
  try {
    const [admissions, contacts] = await Promise.all([
      AdmissionEnquiry.find({ status: 'new' }).sort({ createdAt: -1 }).limit(10).select('studentName applyingClass createdAt'),
      ContactMessage.find({ status: 'new' }).sort({ createdAt: -1 }).limit(10).select('name subject createdAt')
    ]);

    const items = [
      ...admissions.map(a => ({
        id: a._id, type: 'admission',
        title: `New Admission: ${a.studentName}`,
        subtitle: a.applyingClass,
        time: a.createdAt,
        href: '/admin/admissions.html'
      })),
      ...contacts.map(c => ({
        id: c._id, type: 'contact',
        title: `New Message: ${c.name}`,
        subtitle: c.subject,
        time: c.createdAt,
        href: '/admin/contacts.html'
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 15);

    res.json({ success: true, unread: admissions.length + contacts.length, items });
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
