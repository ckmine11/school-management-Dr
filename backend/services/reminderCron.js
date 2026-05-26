import cron from 'node-cron';
import ExamSchedule from '../models/ExamSchedule.js';
import Student from '../models/Student.js';
import { messageQueueService } from './messageQueue.js';

export function startReminderCron() {
  // Run every day at 8:00 AM
  cron.schedule('0 8 * * *', sendExamReminders, { timezone: 'Asia/Kolkata' });
  console.log('[ReminderCron] Started — exam reminders at 8:00 AM IST');
}

export async function sendExamReminders() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const start = new Date(tomorrow.setHours(0, 0, 0, 0));
    const end = new Date(tomorrow.setHours(23, 59, 59, 999));

    const exams = await ExamSchedule.find({
      examDate: { $gte: start, $lte: end },
      reminderSent: false
    });

    if (!exams.length) return;
    console.log(`[ReminderCron] Found ${exams.length} exam(s) tomorrow — sending reminders...`);

    for (const exam of exams) {
      // Get all students in this class (and section if specific)
      const studentQuery = { class: exam.class, status: 'active' };
      if (exam.section && exam.section !== 'All') studentQuery.section = exam.section;
      const students = await Student.find(studentQuery).select('name parentPhone phone section');

      const date = new Date(exam.examDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
      const examLabel = exam.examType.charAt(0).toUpperCase() + exam.examType.slice(1).replace('-', ' ');

      const parentPhones = new Set();
      for (const s of students) {
        if (s.parentPhone) parentPhones.add(s.parentPhone);
        else if (s.phone) parentPhones.add(s.phone);
      }

      if (parentPhones.size) {
        const message =
          `📚 *Exam Reminder — ${process.env.SCHOOL_NAME || 'School'}*\n\n` +
          `Tomorrow is *${exam.subject}* exam!\n\n` +
          `📅 Date: ${date}\n` +
          `🕐 Time: ${exam.startTime}\n` +
          `⏱ Duration: ${exam.duration} minutes\n` +
          `📝 Exam: ${examLabel}\n` +
          `🏫 Class: ${exam.class}${exam.section !== 'All' ? ` - ${exam.section}` : ''}\n` +
          `📊 Max Marks: ${exam.maxMarks}\n` +
          (exam.room ? `🚪 Room: ${exam.room}\n` : '') +
          `\n*Best of luck! 🌟*`;

        await messageQueueService.enqueueBulk([...parentPhones], message);
        console.log(`[ReminderCron] Queued ${parentPhones.size} reminders for ${exam.subject} (${exam.class})`);
      }

      await ExamSchedule.findByIdAndUpdate(exam._id, { reminderSent: true });
    }
  } catch (err) {
    console.error('[ReminderCron] Error:', err.message);
  }
}
