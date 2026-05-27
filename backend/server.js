import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';

import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import teacherRoutes from './routes/teachers.js';
import attendanceRoutes from './routes/attendance.js';
import feeRoutes from './routes/fees.js';
import resultRoutes from './routes/results.js';
import noticeRoutes from './routes/notices.js';
import dashboardRoutes from './routes/dashboard.js';
import whatsappRoutes from './routes/whatsapp.js';
import galleryRoutes from './routes/gallery.js';
import notificationRoutes from './routes/notifications.js';
import timetableRoutes from './routes/timetable.js';
import examRoutes from './routes/examSchedule.js';
import settingsRoutes from './routes/settings.js';
import contactRoutes from './routes/contact.js';
import admissionRoutes from './routes/admissions.js';
import { whatsappService } from './services/whatsappClient.js';
import { messageQueueService } from './services/messageQueue.js';
import { startReminderCron } from './services/reminderCron.js';

dotenv.config();
connectDB();

const app = express();
app.set('trust proxy', 1); // nginx proxy ke peeche hai
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost';

// CORS — only allow requests from the known frontend origin
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost',
  'http://localhost:80',
  'http://127.0.0.1',
  'http://127.0.0.1:80',
].filter((v, i, a) => v && a.indexOf(v) === i);

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or same-origin requests (no origin header)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true
}));

// Rate limiting — strict on auth, relaxed on general API
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed attempts
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Apply rate limiters
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admissions', admissionRoutes);

app.get(['/', '/api', '/login', '/login.html'], (req, res) => {
  res.redirect(`${FRONTEND_URL}/login.html`);
});

app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'School Management API Running' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  whatsappService.init();
  messageQueueService.start();
  startReminderCron();
});
