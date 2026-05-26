import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  teacherId: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  dob: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  photo: { type: String, default: '' },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  qualification: { type: String },
  experience: { type: Number, default: 0 },
  subjects: [{ type: String }],
  assignedClasses: [{ class: String, section: String }],
  joinDate: { type: Date, default: Date.now },
  salary: { type: Number },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Indexes for fast queries
teacherSchema.index({ status: 1 });  // active teachers list
teacherSchema.index({ phone: 1 });   // WhatsApp broadcast

teacherSchema.pre('save', async function (next) {
  if (!this.teacherId) {
    const count = await mongoose.model('Teacher').countDocuments();
    this.teacherId = `TCH${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

export default mongoose.model('Teacher', teacherSchema);
