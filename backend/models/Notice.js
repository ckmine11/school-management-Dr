import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['general', 'exam', 'holiday', 'event', 'fee', 'result'], default: 'general' },
  targetAudience: { type: String, enum: ['all', 'teachers', 'students', 'parents'], default: 'all' },
  isPublic: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  expiresAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Notice', noticeSchema);
