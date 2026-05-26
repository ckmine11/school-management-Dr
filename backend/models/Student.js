import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  dob: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  photo: { type: String, default: '' },
  class: { type: String, required: true },
  section: { type: String, required: true },
  rollNo: { type: String },
  address: { type: String },
  phone: { type: String },
  parentName: { type: String },
  parentPhone: { type: String },
  parentEmail: { type: String },
  admissionDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'inactive', 'transferred'], default: 'active' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Indexes for fast queries
studentSchema.index({ class: 1, section: 1 });         // list by class
studentSchema.index({ status: 1 });                     // active/inactive filter
studentSchema.index({ parentPhone: 1 });                // WhatsApp broadcast
studentSchema.index({ phone: 1 });                      // student phone lookup

studentSchema.pre('save', async function (next) {
  if (!this.studentId) {
    const count = await mongoose.model('Student').countDocuments();
    this.studentId = `STU${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model('Student', studentSchema);
