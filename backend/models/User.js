import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'teacher', 'student', 'parent'], default: 'student' },
  roleId: { type: mongoose.Schema.Types.ObjectId, refPath: 'roleModel' },
  roleModel: { type: String, enum: ['Student', 'Teacher'] },
  isActive: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: false },
  lastLogin: { type: Date }
}, { timestamps: true });

// email already indexed via unique:true; add role for role-based lookups
userSchema.index({ role: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model('User', userSchema);
