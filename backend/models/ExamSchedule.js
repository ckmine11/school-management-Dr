import mongoose from 'mongoose';

const examScheduleSchema = new mongoose.Schema({
  examType: { type: String, enum: ['unit-test', 'midterm', 'final', 'quarterly', 'other'], required: true },
  academicYear: { type: String, required: true },
  class: { type: String, required: true },
  section: { type: String, default: 'All' },
  subject: { type: String, required: true },
  examDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  duration: { type: Number, default: 180 },
  maxMarks: { type: Number, default: 100 },
  room: { type: String, default: '' },
  notes: { type: String, default: '' },
  reminderSent: { type: Boolean, default: false }
}, { timestamps: true });

examScheduleSchema.index({ class: 1, examType: 1, academicYear: 1 });
examScheduleSchema.index({ examDate: 1, reminderSent: 1 });

export default mongoose.model('ExamSchedule', examScheduleSchema);
