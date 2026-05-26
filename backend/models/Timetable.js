import mongoose from 'mongoose';

const periodSchema = new mongoose.Schema({
  periodNo: { type: Number, required: true },
  startTime: { type: String, default: '' },
  endTime: { type: String, default: '' },
  subject: { type: String, default: '' },
  teacherName: { type: String, default: '' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null }
}, { _id: false });

const timetableSchema = new mongoose.Schema({
  class: { type: String, required: true },
  section: { type: String, required: true },
  day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], required: true },
  periods: [periodSchema]
}, { timestamps: true });

timetableSchema.index({ class: 1, section: 1, day: 1 }, { unique: true });
timetableSchema.index({ class: 1, section: 1 });

export default mongoose.model('Timetable', timetableSchema);
