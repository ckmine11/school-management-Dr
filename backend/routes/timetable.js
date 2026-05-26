import express from 'express';
import Timetable from '../models/Timetable.js';
import { protect, authorize } from '../middleware/auth.js';
import { createHttpError } from '../utils/authAccess.js';

const router = express.Router();

// GET /api/timetable?class=10&section=A  — get full week for a class
router.get('/', protect, async (req, res) => {
  try {
    const { class: cls, section } = req.query;
    if (!cls || !section) throw createHttpError(400, 'class and section are required');

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const rows = await Timetable.find({ class: cls, section });

    // Return as map { Monday: [...periods], Tuesday: [...] }
    const map = {};
    for (const day of days) {
      const found = rows.find(r => r.day === day);
      map[day] = found ? found.periods : [];
    }
    res.json({ success: true, data: map });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// PUT /api/timetable — upsert a single day's timetable (admin only)
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { class: cls, section, day, periods } = req.body;
    if (!cls || !section || !day || !Array.isArray(periods)) {
      throw createHttpError(400, 'class, section, day, and periods are required');
    }

    const doc = await Timetable.findOneAndUpdate(
      { class: cls, section, day },
      { periods },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

// DELETE /api/timetable?class=10&section=A&day=Monday — clear one day
router.delete('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { class: cls, section, day } = req.query;
    if (!cls || !section || !day) throw createHttpError(400, 'class, section, and day required');
    await Timetable.findOneAndDelete({ class: cls, section, day });
    res.json({ success: true, message: 'Timetable cleared for that day' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

export default router;
