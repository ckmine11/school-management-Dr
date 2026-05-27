import express from 'express';
import AdmissionEnquiry from '../models/AdmissionEnquiry.js';
import { protect, authorize } from '../middleware/auth.js';
import { getSettings } from '../models/SchoolSettings.js';
import { messageQueueService } from '../services/messageQueue.js';
import { sendAdmissionNotification } from '../utils/mailer.js';

const router = express.Router();

// POST /api/admissions — public, submit enquiry
router.post('/', async (req, res) => {
  try {
    const { studentName, dob, applyingClass, parentName, phone, email, currentSchool, message } = req.body;
    if (!studentName?.trim() || !applyingClass || !parentName?.trim() || !phone?.trim()) {
      return res.status(400).json({ success: false, message: 'Student name, class, parent name and phone are required' });
    }

    const enquiry = await AdmissionEnquiry.create({ studentName: studentName.trim(), dob: dob || '', applyingClass, parentName: parentName.trim(), phone: phone.trim(), email: email?.trim() || '', currentSchool: currentSchool?.trim() || '', message: message?.trim() || '' });

    setImmediate(async () => {
      try {
        const settings = await getSettings();

        // WhatsApp to school admin phone
        if (settings.phone) {
          await messageQueueService.enqueue(
            settings.phone,
            `🎓 *New Admission Enquiry*\n\n*Student:* ${enquiry.studentName}\n*Class:* ${enquiry.applyingClass}\n*Parent:* ${enquiry.parentName}\n*Phone:* ${enquiry.phone}\n*Email:* ${enquiry.email || '-'}\n*Current School:* ${enquiry.currentSchool || '-'}\n${enquiry.message ? '\n*Message:*\n' + enquiry.message : ''}\n\n_View in admin panel → Admissions_`
          );
        }

        // Email notification
        if (settings.email) {
          await sendAdmissionNotification(enquiry, settings.email);
        }
      } catch (err) {
        console.error('[Admission notify]', err.message);
      }
    });

    res.status(201).json({ success: true, message: 'Enquiry submitted! We will contact you within 24 hours.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admissions — admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const [total, enquiries] = await Promise.all([
      AdmissionEnquiry.countDocuments(query),
      AdmissionEnquiry.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum)
    ]);

    const newCount = await AdmissionEnquiry.countDocuments({ status: 'new' });
    res.json({ success: true, count: enquiries.length, total, newCount, page: pageNum, pages: Math.ceil(total / limitNum), data: enquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admissions/:id
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const update = {};
    if (status) update.status = status;
    if (adminNote !== undefined) update.adminNote = adminNote;

    const enquiry = await AdmissionEnquiry.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    res.json({ success: true, data: enquiry });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/admissions/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const enquiry = await AdmissionEnquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
