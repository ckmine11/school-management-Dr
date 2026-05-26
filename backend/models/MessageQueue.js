import mongoose from 'mongoose';

const messageQueueSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['pending', 'processing', 'sent', 'failed'], default: 'pending' },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 },
  error: { type: String },
  sentAt: { type: Date },
  scheduledFor: { type: Date, default: Date.now }
}, { timestamps: true });

messageQueueSchema.index({ status: 1, scheduledFor: 1 });

export default mongoose.model('MessageQueue', messageQueueSchema);
