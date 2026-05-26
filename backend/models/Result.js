import mongoose from 'mongoose';

const subjectResultSchema = new mongoose.Schema({
  name: { type: String, required: true },
  maxMarks: { type: Number, required: true },
  obtainedMarks: { type: Number, required: true },
  grade: { type: String }
}, { _id: false });

const resultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  examType: { type: String, enum: ['unit-test', 'midterm', 'final', 'quarterly'], required: true },
  class: { type: String, required: true },
  section: { type: String, required: true },
  academicYear: { type: String, required: true },
  subjects: [subjectResultSchema],
  totalMaxMarks: { type: Number },
  totalObtainedMarks: { type: Number },
  percentage: { type: Number },
  grade: { type: String },
  rank: { type: Number },
  status: { type: String, enum: ['pass', 'fail', 'promoted'], default: 'pass' },
  remarks: { type: String },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Indexes for fast queries
resultSchema.index({ studentId: 1 });                                    // student result history
resultSchema.index({ class: 1, section: 1, academicYear: 1, examType: 1 }); // class result sheet
resultSchema.index({ academicYear: 1 });                                 // year-wise reports

resultSchema.pre('save', function (next) {
  if (this.subjects && this.subjects.length > 0) {
    this.totalMaxMarks = this.subjects.reduce((s, sub) => s + sub.maxMarks, 0);
    this.totalObtainedMarks = this.subjects.reduce((s, sub) => s + sub.obtainedMarks, 0);
    this.percentage = Math.round((this.totalObtainedMarks / this.totalMaxMarks) * 100 * 10) / 10;
    this.grade = calcGrade(this.percentage);
    this.status = this.percentage >= 33 ? 'pass' : 'fail';
    this.subjects.forEach(sub => {
      sub.grade = calcGrade(Math.round((sub.obtainedMarks / sub.maxMarks) * 100));
    });
  }
  next();
});

function calcGrade(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 33) return 'D';
  return 'F';
}

export default mongoose.model('Result', resultSchema);
