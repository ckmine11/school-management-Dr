import express from 'express';
import ContactMessage from '../models/ContactMessage.js';
import { protect, authorize } from '../middleware/auth.js';
import { getSettings } from '../models/SchoolSettings.js';
import { messageQueueService } from '../services/messageQueue.js';
import { sendContactNotification } from '../utils/mailer.js';

const router = express.Router();

// POST /api/contact — public, submit contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'Name, email and message are required' });
    }

    const msg = await ContactMessage.create({ name: name.trim(), email: email.trim(), phone: phone?.trim() || '', subject: subject || 'General Inquiry', message: message.trim() });

    // Fire notifications async — don't block the response
    setImmediate(async () => {
      try {
        const settings = await getSettings();

        // WhatsApp to admin phone (school phone from settings)
        if (settings.phone) {
          await messageQueueService.enqueue(
            settings.phone,
            `📩 *New Contact Message*\n\n*From:* ${msg.name}\n*Email:* ${msg.email}\n*Phone:* ${msg.phone || '-'}\n*Subject:* ${msg.subject}\n\n*Message:*\n${msg.message}\n\n_View in admin panel → Contact Messages_`
          );
        }

        // Email notification
        if (settings.email) {
          await sendContactNotification(msg, settings.email);
        }
      } catch (err) {
        console.error('[Contact notify]', err.message);
      }
    });

    res.status(201).json({ success: true, message: 'Message received! We will get back to you within 24 hours.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/contact — admin: list all messages
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const [total, messages] = await Promise.all([
      ContactMessage.countDocuments(query),
      ContactMessage.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum)
    ]);

    // Count new messages
    const newCount = await ContactMessage.countDocuments({ status: 'new' });

    res.json({ success: true, count: messages.length, total, newCount, page: pageNum, pages: Math.ceil(total / limitNum), data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/contact/:id — mark status or add note
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const update = {};
    if (status) update.status = status;
    if (adminNote !== undefined) update.adminNote = adminNote;

    const msg = await ContactMessage.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, data: msg });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/contact/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const msg = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
