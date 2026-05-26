import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: Date, required: true },
  class: { type: String, required: true },
  section: { type: String, required: true },
  status: { type: String, enum: ['present', 'absent', 'late', 'holiday'], default: 'present' },
  remarks: { type: String },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ class: 1, section: 1, date: 1 }); // class-wise daily attendance
attendanceSchema.index({ date: 1 });                        // date-range reports

export default mongoose.model('Attendance', attendanceSchema);
