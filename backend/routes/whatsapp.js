import express from 'express';
import QRCode from 'qrcode';
import { whatsappService } from '../services/whatsappClient.js';
import { messageQueueService } from '../services/messageQueue.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/whatsapp/status
router.get('/status', protect, authorize('admin'), (req, res) => {
  res.json({ success: true, data: whatsappService.getStatus() });
});

// GET /api/whatsapp/qr — returns QR code as base64 image
router.get('/qr', protect, authorize('admin'), async (req, res) => {
  const { qrCode, status } = whatsappService;

  if (status === 'ready') {
    return res.json({ success: true, status: 'ready', qr: null });
  }
  if (!qrCode) {
    return res.json({ success: true, status, qr: null });
  }
  try {
    const qrImage = await QRCode.toDataURL(qrCode, { width: 300, margin: 2 });
    res.json({ success: true, status: 'qr_ready', qr: qrImage });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/whatsapp/init — start WhatsApp client
router.post('/init', protect, authorize('admin'), (req, res) => {
  whatsappService.init();
  res.json({ success: true, message: 'WhatsApp client starting...' });
});

// POST /api/whatsapp/logout
router.post('/logout', protect, authorize('admin'), async (req, res) => {
  await whatsappService.logout();
  res.json({ success: true, message: 'Logged out from WhatsApp' });
});

// POST /api/whatsapp/send
router.post('/send', protect, authorize('admin'), async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Phone and message required' });
    }
    const result = await whatsappService.sendMessage(phone, message);
    res.json({ success: result.success, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/whatsapp/send-bulk — queued bulk broadcast (survives server restarts)
router.post('/send-bulk', protect, authorize('admin'), async (req, res) => {
  try {
    const { numbers, message } = req.body;
    if (!numbers?.length || !message) {
      return res.status(400).json({ success: false, message: 'Numbers array and message required' });
    }
    await messageQueueService.enqueueBulk(numbers, message);
    res.json({
      success: true,
      message: `${numbers.length} messages queued for delivery`,
      data: { queued: numbers.length }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/whatsapp/queue — queue stats + recent 30 entries
router.get('/queue', protect, authorize('admin'), async (_req, res) => {
  try {
    const [stats, recent] = await Promise.all([
      messageQueueService.getStats(),
      messageQueueService.getRecent(30)
    ]);
    res.json({ success: true, data: { stats, recent } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/whatsapp/queue/retry — re-queue all failed messages
router.post('/queue/retry', protect, authorize('admin'), async (_req, res) => {
  try {
    const count = await messageQueueService.retryFailed();
    res.json({ success: true, message: `${count} failed messages queued for retry` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
