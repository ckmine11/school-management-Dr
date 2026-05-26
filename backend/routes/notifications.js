import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { sendPushNotification } from '../utils/notification.js';

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
