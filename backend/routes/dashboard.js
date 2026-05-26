import express from 'express';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Fee from '../models/Fee.js';
import Attendance from '../models/Attendance.js';
import Notice from '../models/Notice.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [totalStudents, totalTeachers, feeStats, todayAttendance, recentNotices] = await Promise.all([
      Student.countDocuments({ status: 'active' }),
      Teacher.countDocuments({ status: 'active' }),
      Fee.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' }, collected: { $sum: '$paidAmount' } } }
      ]),
      Attendance.aggregate([
        { $match: { date: { $gte: today, $lte: todayEnd } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Notice.find({ $or: [{ expiresAt: { $gte: new Date() } }, { expiresAt: null }] })
        .sort({ isPinned: -1, createdAt: -1 })
        .limit(5)
        .select('title type createdAt isPinned')
    ]);

    const attMap = {};
    todayAttendance.forEach(a => attMap[a._id] = a.count);
    const presentToday = (attMap.present || 0) + (attMap.late || 0);
    const absentToday = attMap.absent || 0;
    const totalMarked = presentToday + absentToday + (attMap.holiday || 0);
    const attendancePct = totalMarked > 0 ? Math.round((presentToday / totalMarked) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        feesCollected: feeStats[0]?.collected || 0,
        feesTotal: feeStats[0]?.total || 0,
        attendancePercent: attendancePct,
        presentToday,
        absentToday,
        recentNotices
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dashboard/class-stats
router.get('/class-stats', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await Student.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: { class: '$class', section: '$section' }, count: { $sum: 1 } } },
      { $sort: { '_id.class': 1, '_id.section': 1 } }
    ]);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
