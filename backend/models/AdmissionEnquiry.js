import mongoose from 'mongoose';

const admissionEnquirySchema = new mongoose.Schema({
  studentName: { type: String, required: true, trim: true },
  dob: { type: String, default: '' },
  applyingClass: { type: String, required: true },
  parentName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  currentSchool: { type: String, trim: true, default: '' },
  message: { type: String, default: '' },
  status: { type: String, enum: ['new', 'contacted', 'admitted', 'rejected'], default: 'new' },
  adminNote: { type: String, default: '' }
}, { timestamps: true });

admissionEnquirySchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('AdmissionEnquiry', admissionEnquirySchema);
