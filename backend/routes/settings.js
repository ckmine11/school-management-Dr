import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, authorize } from '../middleware/auth.js';
import SchoolSettings, { getSettings } from '../models/SchoolSettings.js';
import { compressImage } from '../utils/imageProcessor.js';

const router = express.Router();

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/logos/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `logo_${Date.now()}${path.extname(file.originalname)}`)
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files allowed'));
    cb(null, true);
  }
});

// GET /api/settings — public (used by login page and layout)
router.get('/', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/settings — admin only
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    const allowed = ['schoolName', 'tagline', 'primaryColor', 'address', 'phone', 'email',
      'website', 'academicYear', 'currency', 'currencySymbol', 'feeTypes'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const settings = await SchoolSettings.findOneAndUpdate({}, updates, {
      new: true, upsert: true, runValidators: true
    });
    res.json({ success: true, data: settings, message: 'Settings saved' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/settings/logo — admin only, upload school logo
router.post('/logo', protect, authorize('admin'), uploadLogo.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    await compressImage(req.file.path, { maxWidth: 300, maxHeight: 300, quality: 90 });

    const logoUrl = `/uploads/logos/${req.file.filename}`;
    const settings = await SchoolSettings.findOneAndUpdate(
      {},
      { logo: logoUrl },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: settings, message: 'Logo uploaded' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/settings/logo — remove logo
router.delete('/logo', protect, authorize('admin'), async (req, res) => {
  try {
    const settings = await getSettings();
    if (settings.logo) {
      const filePath = path.join(process.cwd(), settings.logo);
      try { fs.unlinkSync(filePath); } catch {}
    }
    settings.logo = null;
    await settings.save();
    res.json({ success: true, message: 'Logo removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
