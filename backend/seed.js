import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Student from './models/Student.js';
import Teacher from './models/Teacher.js';
import Notice from './models/Notice.js';
import { createTemporaryPassword } from './utils/accountSync.js';

dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Safety guard — refuse to run if data already exists
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    console.log('Admin account already exists. Seed skipped to protect existing data.');
    console.log('To force re-seed, manually drop the database first.');
    await mongoose.disconnect();
    process.exit(0);
  }

  await User.deleteMany({});
  await Student.deleteMany({});
  await Teacher.deleteMany({});
  await Notice.deleteMany({});
  console.log('Cleared existing data (fresh database confirmed)');

  const admin = await User.create({
    name: 'School Admin',
    email: 'admin@school.com',
    password: 'admin123',
    role: 'admin'
  });
  console.log('Admin created: admin@school.com / admin123');

  const teacher1Password = createTemporaryPassword();
  const teacher1User = await User.create({
    name: 'Ramesh Kumar',
    email: 'ramesh@school.com',
    password: teacher1Password,
    role: 'teacher',
    mustChangePassword: true
  });
  const teacher1 = await Teacher.create({
    name: 'Ramesh Kumar',
    email: 'ramesh@school.com',
    phone: '9876543210',
    subjects: ['Mathematics', 'Physics'],
    qualification: 'M.Sc, B.Ed',
    experience: 8,
    assignedClasses: [{ class: 'Class 10', section: 'A' }, { class: 'Class 10', section: 'B' }],
    userId: teacher1User._id
  });
  teacher1User.roleId = teacher1._id;
  teacher1User.roleModel = 'Teacher';
  await teacher1User.save({ validateBeforeSave: false });

  const teacher2Password = createTemporaryPassword();
  const teacher2User = await User.create({
    name: 'Priya Sharma',
    email: 'priya@school.com',
    password: teacher2Password,
    role: 'teacher',
    mustChangePassword: true
  });
  const teacher2 = await Teacher.create({
    name: 'Priya Sharma',
    email: 'priya@school.com',
    phone: '9876543211',
    subjects: ['English', 'Hindi'],
    qualification: 'M.A, B.Ed',
    experience: 5,
    assignedClasses: [{ class: 'Class 9', section: 'A' }],
    userId: teacher2User._id
  });
  teacher2User.roleId = teacher2._id;
  teacher2User.roleModel = 'Teacher';
  await teacher2User.save({ validateBeforeSave: false });
  console.log(`Teachers created: ramesh@school.com / ${teacher1Password}, priya@school.com / ${teacher2Password}`);

  const stu1Password = createTemporaryPassword();
  const stu1User = await User.create({
    name: 'Arun Singh',
    email: 'arun.singh.stu@school.com',
    password: stu1Password,
    role: 'student',
    mustChangePassword: true
  });
  const stu1 = await Student.create({
    name: 'Arun Singh',
    email: 'arun.singh.stu@school.com',
    class: 'Class 10',
    section: 'A',
    rollNo: '01',
    gender: 'male',
    parentName: 'Suresh Singh',
    parentPhone: '9999000001',
    parentEmail: 'suresh@gmail.com',
    status: 'active',
    userId: stu1User._id
  });
  stu1User.roleId = stu1._id;
  stu1User.roleModel = 'Student';
  await stu1User.save({ validateBeforeSave: false });

  const stu2Password = createTemporaryPassword();
  const stu2User = await User.create({
    name: 'Meera Patel',
    email: 'meera.patel.stu@school.com',
    password: stu2Password,
    role: 'student',
    mustChangePassword: true
  });
  const stu2 = await Student.create({
    name: 'Meera Patel',
    email: 'meera.patel.stu@school.com',
    class: 'Class 10',
    section: 'A',
    rollNo: '02',
    gender: 'female',
    parentName: 'Rajesh Patel',
    parentPhone: '9999000002',
    status: 'active',
    userId: stu2User._id
  });
  stu2User.roleId = stu2._id;
  stu2User.roleModel = 'Student';
  await stu2User.save({ validateBeforeSave: false });

  const stu3Password = createTemporaryPassword();
  const stu3User = await User.create({
    name: 'Vikram Rao',
    email: 'vikram.rao.stu@school.com',
    password: stu3Password,
    role: 'student',
    mustChangePassword: true
  });
  const stu3 = await Student.create({
    name: 'Vikram Rao',
    email: 'vikram.rao.stu@school.com',
    class: 'Class 9',
    section: 'A',
    rollNo: '01',
    gender: 'male',
    parentName: 'Mohan Rao',
    parentPhone: '9999000003',
    status: 'active',
    userId: stu3User._id
  });
  stu3User.roleId = stu3._id;
  stu3User.roleModel = 'Student';
  await stu3User.save({ validateBeforeSave: false });
  console.log(`Students created: arun.singh.stu@school.com / ${stu1Password}, meera.patel.stu@school.com / ${stu2Password}, vikram.rao.stu@school.com / ${stu3Password}`);

  const parentPassword = createTemporaryPassword();
  await User.create({
    name: 'Suresh Singh (Parent)',
    email: 'parent@school.com',
    password: parentPassword,
    role: 'parent',
    roleId: stu1._id,
    roleModel: 'Student',
    mustChangePassword: true
  });
  console.log(`Parent created: parent@school.com / ${parentPassword} (linked to Arun Singh)`);

  await Notice.create([
    {
      title: 'School Reopens June 15',
      content: 'Dear Parents, school will reopen for new academic year on June 15, 2024. Please ensure all fees are paid before June 10.',
      type: 'general',
      targetAudience: 'all',
      isPublic: true,
      isPinned: true,
      createdBy: admin._id
    },
    {
      title: 'Annual Examination Schedule',
      content: 'Annual examinations will be conducted from April 1-15, 2024. Time table has been shared with class teachers.',
      type: 'exam',
      targetAudience: 'all',
      isPublic: true,
      createdBy: admin._id
    },
    {
      title: 'Holiday Notice - Diwali',
      content: 'School will remain closed on November 1-3 on account of Diwali festival. Classes will resume on November 4.',
      type: 'holiday',
      targetAudience: 'all',
      isPublic: true,
      createdBy: admin._id
    },
    {
      title: 'Fee Collection Due Date',
      content: 'Kindly note that the last date for submitting term fees is March 31. Late payment will attract a fine of Rs.100 per day.',
      type: 'fee',
      targetAudience: 'parents',
      isPublic: false,
      createdBy: admin._id
    }
  ]);
  console.log('Sample notices created');

  console.log('\nSeed completed successfully.\n');
  console.log('Login credentials:');
  console.log('  Admin:   admin@school.com / admin123');
  console.log(`  Teacher: ramesh@school.com / ${teacher1Password}`);
  console.log(`  Student: arun.singh.stu@school.com / ${stu1Password}`);
  console.log(`  Parent:  parent@school.com / ${parentPassword}`);

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
