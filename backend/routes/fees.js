import express from 'express';
import Fee from '../models/Fee.js';
import { protect, authorize } from '../middleware/auth.js';
import { createHttpError, ensureOwnStudentAccess, getLinkedStudentId } from '../utils/authAccess.js';
import { messageQueueService } from '../services/messageQueue.js';
import { generateFeeReceipt } from '../utils/pdfGenerator.js';

const router = express.Router();

// GET /api/fees
router.get('/', protect, async (req, res) => {
  try {
    if (!['admin', 'student', 'parent'].includes(req.user.role)) {
      throw createHttpError(403, 'You are not allowed to view fee records');
    }

    const { studentId, status, month, year, feeType, page, limit } = req.query;
    const query = {};

    if (req.user.role === 'student' || req.user.role === 'parent') {
      const linkedStudentId = getLinkedStudentId(req.user);
      if (!linkedStudentId) throw createHttpError(403, 'This account is not linked to a student profile');
      if (studentId && String(studentId) !== linkedStudentId) {
        throw createHttpError(403, 'You are not allowed to view another student\'s fees');
      }
      query.studentId = linkedStudentId;
    } else if (studentId) {
      query.studentId = studentId;
    }

    if (status) query.status = status;
    if (month) query.month = month;
    if (year) query.year = Number(year);
    if (feeType) query.feeType = feeType;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit) || 100));
    const total = await Fee.countDocuments(query);
    const fees = await Fee.find(query)
      .populate('studentId', 'name studentId class section')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({ success: true, count: fees.length, total, page: pageNum, pages: Math.ceil(total / limitNum), data: fees });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// GET /api/fees/:id/receipt — download PDF receipt
router.get('/:id/receipt', protect, async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate('studentId', 'name studentId class section rollNo parentName parentPhone');
    if (!fee) throw createHttpError(404, 'Fee not found');

    if (req.user.role === 'student' || req.user.role === 'parent') {
      ensureOwnStudentAccess(req.user, fee.studentId?._id || fee.studentId);
    } else if (req.user.role !== 'admin') {
      throw createHttpError(403, 'Not allowed');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt_${fee.receiptNo}.pdf"`);
    await generateFeeReceipt(fee, res);
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// GET /api/fees/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id).populate('studentId', 'name studentId class section parentName parentPhone');
    if (!fee) throw createHttpError(404, 'Fee record not found');

    if (req.user.role === 'student' || req.user.role === 'parent') {
      ensureOwnStudentAccess(req.user, fee.studentId?._id || fee.studentId);
    } else if (req.user.role !== 'admin') {
      throw createHttpError(403, 'You are not allowed to access this fee record');
    }

    res.json({ success: true, data: fee });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// POST /api/fees
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const data = { ...req.body, collectedBy: req.user._id };
    if (!data.month) data.month = new Date().toLocaleString('default', { month: 'long' });
    if (!data.year) data.year = new Date().getFullYear();
    const fee = await Fee.create(data);
    res.status(201).json({ success: true, data: fee });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

// PUT /api/fees/:id/pay - mark as paid
router.put('/:id/pay', protect, authorize('admin'), async (req, res) => {
  try {
    const { paymentMethod, paidAmount } = req.body;
    const fee = await Fee.findById(req.params.id).populate('studentId', 'name parentPhone class section');
    if (!fee) throw createHttpError(404, 'Fee not found');

    const paid = paidAmount ? Number(paidAmount) : fee.amount;
    fee.paidAmount = paid;
    fee.status = paid >= fee.amount ? 'paid' : 'partial';
    fee.paidDate = new Date();
    fee.paymentMethod = paymentMethod || 'cash';
    await fee.save();

    if (fee.studentId?.parentPhone) {
      await messageQueueService.enqueue(
        fee.studentId.parentPhone,
        `✅ *Fee Receipt — ${fee.receiptNo}*\n\n*Student:* ${fee.studentId.name} (${fee.studentId.class}-${fee.studentId.section})\n*Fee Type:* ${fee.feeType}\n*Paid:* Rs.${paid}\n*Method:* ${fee.paymentMethod || 'cash'}\n*Status:* ${fee.status.toUpperCase()}\n\nThank you! — ${process.env.SCHOOL_NAME || 'School'}`
      );
    }

    res.json({ success: true, data: fee, message: 'Payment recorded' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// PUT /api/fees/:id
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!fee) throw createHttpError(404, 'Fee not found');
    res.json({ success: true, data: fee });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

// DELETE /api/fees/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const fee = await Fee.findByIdAndDelete(req.params.id);
    if (!fee) throw createHttpError(404, 'Fee not found');
    res.json({ success: true, message: 'Fee deleted' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// GET /api/fees/stats/summary
router.get('/stats/summary', protect, authorize('admin'), async (req, res) => {
  try {
    const { year } = req.query;
    const matchYear = year ? { year: Number(year) } : {};
    const [total, paid, unpaid] = await Promise.all([
      Fee.aggregate([{ $match: matchYear }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Fee.aggregate([{ $match: { ...matchYear, status: 'paid' } }, { $group: { _id: null, total: { $sum: '$paidAmount' } } }]),
      Fee.countDocuments({ ...matchYear, status: 'unpaid' })
    ]);

    res.json({
      success: true,
      data: {
        totalAmount: total[0]?.total || 0,
        collected: paid[0]?.total || 0,
        unpaidCount: unpaid
      }
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// POST /api/fees/remind - send fee reminders via WhatsApp
router.post('/remind', protect, authorize('admin'), async (req, res) => {
  try {
    const unpaidFees = await Fee.find({ status: { $in: ['unpaid', 'partial'] } })
      .populate('studentId', 'name class section parentPhone');

    let sent = 0;
    for (const fee of unpaidFees) {
      if (fee.studentId?.parentPhone) {
        await messageQueueService.enqueue(
          fee.studentId.parentPhone,
          `📢 *Fee Reminder*\n\nDear Parent,\n\n*${fee.feeType}* fee of *Rs.${fee.amount}* for *${fee.studentId.name}* (${fee.studentId.class}-${fee.studentId.section}) is due.\n\nPlease pay at the earliest. Thank you.\n\n— ${process.env.SCHOOL_NAME || 'School'}`
        );
        sent += 1;
      }
    }

    res.json({ success: true, message: `Reminders sent to ${sent} parents` });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

export default router;
