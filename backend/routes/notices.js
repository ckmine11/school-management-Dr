import express from 'express';
import Notice from '../models/Notice.js';
import { protect, authorize } from '../middleware/auth.js';
import { sendBulkWhatsApp } from '../utils/whatsapp.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';

const router = express.Router();

// GET /api/notices (public notices also visible without auth)
router.get('/', async (req, res) => {
  try {
    const { type, audience, isPublic } = req.query;
    const query = {};
    if (type) query.type = type;
    if (audience) query.targetAudience = { $in: [audience, 'all'] };
    if (isPublic === 'true') query.isPublic = true;
    query.$or = [{ expiresAt: { $gte: new Date() } }, { expiresAt: null }];
    const notices = await Notice.find(query)
      .populate('createdBy', 'name')
      .sort({ isPinned: -1, createdAt: -1 });
    res.json({ success: true, count: notices.length, data: notices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/notices/:id
router.get('/:id', async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id).populate('createdBy', 'name');
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.json({ success: true, data: notice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/notices
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const notice = await Notice.create({ ...req.body, createdBy: req.user._id });

    // Send WhatsApp if requested
    if (req.body.sendWhatsApp) {
      const numbers = [];
      if (['all', 'parents'].includes(notice.targetAudience)) {
        const students = await Student.find({ status: 'active' }).select('parentPhone');
        students.forEach(s => s.parentPhone && numbers.push(s.parentPhone));
      }
      if (['all', 'teachers'].includes(notice.targetAudience)) {
        const teachers = await Teacher.find({ status: 'active' }).select('phone');
        teachers.forEach(t => t.phone && numbers.push(t.phone));
      }
      await sendBulkWhatsApp([...new Set(numbers)], `📢 *School Notice*\n\n*${notice.title}*\n\n${notice.content}`);
    }

    res.status(201).json({ success: true, data: notice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/notices/:id
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.json({ success: true, data: notice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/notices/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.json({ success: true, message: 'Notice deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
