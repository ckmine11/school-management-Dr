import mongoose from 'mongoose';

const schoolSettingsSchema = new mongoose.Schema({
  schoolName: { type: String, default: 'My School' },
  tagline: { type: String, default: 'Excellence in Education' },
  logo: { type: String, default: null },
  primaryColor: { type: String, default: '#1e3a5f' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  website: { type: String, default: '' },
  academicYear: { type: String, default: '2024-25' },
  currency: { type: String, default: 'INR' },
  currencySymbol: { type: String, default: '₹' },
  feeTypes: {
    type: [String],
    default: ['Tuition Fee', 'Transport Fee', 'Library Fee', 'Sports Fee', 'Exam Fee']
  }
}, { timestamps: true });

// Singleton: only one settings document per deployment
const SchoolSettings = mongoose.model('SchoolSettings', schoolSettingsSchema);

export async function getSettings() {
  let settings = await SchoolSettings.findOne();
  if (!settings) {
    settings = await SchoolSettings.create({});
  }
  return settings;
}

export default SchoolSettings;
