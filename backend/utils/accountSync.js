import crypto from 'node:crypto';
import User from '../models/User.js';

const FALLBACK_DOMAIN = 'school.com';
const TEMP_PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%';

const slugify = (value = 'user') => {
  const slug = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');

  return slug || 'user';
};

const normalizeEmail = (email) => {
  if (!email) return '';
  return String(email).trim().toLowerCase();
};

export const createTemporaryPassword = (length = 12) => {
  const bytes = crypto.randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i += 1) {
    password += TEMP_PASSWORD_ALPHABET[bytes[i] % TEMP_PASSWORD_ALPHABET.length];
  }

  return password;
};

export const issueTemporaryPasswordForUser = async (user) => {
  const temporaryPassword = createTemporaryPassword();
  user.password = temporaryPassword;
  user.mustChangePassword = true;
  user.lastLogin = null;
  await user.save();

  return temporaryPassword;
};

const ensureEmailAvailable = async (email, currentUserId = null) => {
  const existingUser = await User.findOne({ email });
  if (existingUser && String(existingUser._id) !== String(currentUserId || '')) {
    const error = new Error(`Login email already in use: ${email}`);
    error.statusCode = 400;
    throw error;
  }
};

export const buildStudentLoginEmail = (student) => {
  const provided = normalizeEmail(student.email);
  if (provided) return provided;
  return `${slugify(student.name)}.${String(student.studentId).toLowerCase()}.stu@${FALLBACK_DOMAIN}`;
};

export const buildParentLoginEmail = (student, studentLoginEmail) => {
  const provided = normalizeEmail(student.parentEmail);
  if (provided && provided !== studentLoginEmail) return provided;
  return `parent.${String(student.studentId).toLowerCase()}@${FALLBACK_DOMAIN}`;
};

export const buildTeacherLoginEmail = (teacher) => {
  const provided = normalizeEmail(teacher.email);
  if (provided) return provided;
  return `${slugify(teacher.name)}.${String(teacher.teacherId).toLowerCase()}@${FALLBACK_DOMAIN}`;
};

export const validateStudentAccountEmails = async (student) => {
  const studentEmail = buildStudentLoginEmail(student);
  const parentEmail = buildParentLoginEmail(student, studentEmail);
  const parentUser = await User.findOne({ role: 'parent', roleId: student._id }).select('_id');

  await ensureEmailAvailable(studentEmail, student.userId);
  await ensureEmailAvailable(parentEmail, parentUser?._id);

  return { studentEmail, parentEmail };
};

export const validateTeacherAccountEmail = async (teacher) => {
  const teacherEmail = buildTeacherLoginEmail(teacher);
  await ensureEmailAvailable(teacherEmail, teacher.userId);
  return teacherEmail;
};

export const syncStudentUser = async (student) => {
  const email = buildStudentLoginEmail(student);
  const isActive = student.status === 'active';
  const temporaryPassword = createTemporaryPassword();

  let user = student.userId ? await User.findById(student.userId) : null;
  let created = false;

  if (!user) {
    user = await User.create({
      name: student.name,
      email,
      password: temporaryPassword,
      role: 'student',
      roleId: student._id,
      roleModel: 'Student',
      isActive,
      mustChangePassword: true
    });
    created = true;
  } else {
    user.name = student.name;
    user.email = email;
    user.role = 'student';
    user.roleId = student._id;
    user.roleModel = 'Student';
    user.isActive = isActive;
    await user.save();
  }

  if (!student.userId || String(student.userId) !== String(user._id)) {
    student.userId = user._id;
    student.email = email;
    await student.save();
  } else if (student.email !== email) {
    student.email = email;
    await student.save();
  }

  return {
    user,
    created,
    email,
    temporaryPassword: created ? temporaryPassword : null
  };
};

export const syncParentUser = async (student) => {
  const studentLoginEmail = buildStudentLoginEmail(student);
  const email = buildParentLoginEmail(student, studentLoginEmail);
  const isActive = student.status === 'active';
  const temporaryPassword = createTemporaryPassword();

  let user = await User.findOne({ role: 'parent', roleId: student._id });
  let created = false;

  if (!user) {
    user = await User.create({
      name: student.parentName?.trim() || `${student.name} Parent`,
      email,
      password: temporaryPassword,
      role: 'parent',
      roleId: student._id,
      roleModel: 'Student',
      isActive,
      mustChangePassword: true
    });
    created = true;
  } else {
    user.name = student.parentName?.trim() || `${student.name} Parent`;
    user.email = email;
    user.role = 'parent';
    user.roleId = student._id;
    user.roleModel = 'Student';
    user.isActive = isActive;
    await user.save();
  }

  return {
    user,
    created,
    email,
    temporaryPassword: created ? temporaryPassword : null
  };
};

export const syncTeacherUser = async (teacher) => {
  const email = buildTeacherLoginEmail(teacher);
  const isActive = teacher.status === 'active';
  const temporaryPassword = createTemporaryPassword();

  let user = teacher.userId ? await User.findById(teacher.userId) : null;
  let created = false;

  if (!user) {
    user = await User.create({
      name: teacher.name,
      email,
      password: temporaryPassword,
      role: 'teacher',
      roleId: teacher._id,
      roleModel: 'Teacher',
      isActive,
      mustChangePassword: true
    });
    created = true;
  } else {
    user.name = teacher.name;
    user.email = email;
    user.role = 'teacher';
    user.roleId = teacher._id;
    user.roleModel = 'Teacher';
    user.isActive = isActive;
    await user.save();
  }

  if (!teacher.userId || String(teacher.userId) !== String(user._id)) {
    teacher.userId = user._id;
    teacher.email = email;
    await teacher.save();
  } else if (teacher.email !== email) {
    teacher.email = email;
    await teacher.save();
  }

  return {
    user,
    created,
    email,
    temporaryPassword: created ? temporaryPassword : null
  };
};

export const removeStudentLinkedUsers = async (student) => {
  const ids = [];
  if (student?.userId) ids.push(student.userId);

  const parentUser = await User.findOne({ role: 'parent', roleId: student._id });
  if (parentUser?._id) ids.push(parentUser._id);

  if (ids.length) {
    await User.deleteMany({ _id: { $in: ids } });
  }
};
