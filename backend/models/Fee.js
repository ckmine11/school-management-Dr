import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema({
  receiptNo: { type: String, unique: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  feeType: { type: String, enum: ['tuition', 'transport', 'library', 'sports', 'exam', 'other'], required: true },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  paidDate: { type: Date },
  status: { type: String, enum: ['paid', 'unpaid', 'partial'], default: 'unpaid' },
  paidAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['cash', 'bank', 'online', 'cheque'], default: 'cash' },
  month: { type: String },
  year: { type: Number },
  remarks: { type: String },
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Indexes for fast queries
feeSchema.index({ studentId: 1 });              // student fee history
feeSchema.index({ status: 1 });                 // unpaid fee reports
feeSchema.index({ year: 1, month: 1 });         // monthly collection report
feeSchema.index({ studentId: 1, year: 1, month: 1 }); // student monthly fee check

feeSchema.pre('save', async function (next) {
  if (!this.receiptNo) {
    const count = await mongoose.model('Fee').countDocuments();
    this.receiptNo = `RCP${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model('Fee', feeSchema);
