import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Gallery from '../models/Gallery.js';
import { protect, authorize } from '../middleware/auth.js';
import { compressGallery } from '../utils/imageProcessor.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/gallery/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `gallery_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files allowed'));
    cb(null, true);
  }
});

// GET /api/gallery — public
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const items = await Gallery.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/gallery — admin only
router.post('/', protect, authorize('admin'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Image file is required' });
    const { title, category } = req.body;
    if (!title || !category) return res.status(400).json({ success: false, message: 'Title and category are required' });

    await compressGallery(req.file.path);
    const item = await Gallery.create({ title, category, image: req.file.filename });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/gallery/:id — admin only
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    const filePath = `uploads/gallery/${item.image}`;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await item.deleteOne();
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
