import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';

export const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const isAdmin = (user) => user?.role === 'admin';
export const isTeacher = (user) => user?.role === 'teacher';
export const isStudent = (user) => user?.role === 'student';
export const isParent = (user) => user?.role === 'parent';

export const getLinkedStudentId = (user) => {
  if (!isStudent(user) && !isParent(user)) return null;
  return user?.roleId ? String(user.roleId) : null;
};

export const ensureLinkedStudent = (user) => {
  const studentId = getLinkedStudentId(user);
  if (!studentId) throw createHttpError(403, 'This account is not linked to a student profile');
  return studentId;
};

export const ensureOwnStudentAccess = (user, studentId) => {
  const linkedStudentId = ensureLinkedStudent(user);
  if (linkedStudentId !== String(studentId)) {
    throw createHttpError(403, 'You are not allowed to access this student record');
  }
  return linkedStudentId;
};

export const getTeacherAssignments = async (user) => {
  if (!isTeacher(user) || !user?.roleId) return [];
  const teacher = await Teacher.findById(user.roleId).select('assignedClasses');
  return (teacher?.assignedClasses || []).filter((entry) => entry?.class && entry?.section);
};

export const buildTeacherScopeFilter = async (user, requestedClass, requestedSection) => {
  const assignedClasses = await getTeacherAssignments(user);

  if (!assignedClasses.length) {
    throw createHttpError(403, 'No class has been assigned to this teacher yet');
  }

  const matchesRequest = assignedClasses.filter((entry) => {
    const classMatches = !requestedClass || entry.class === requestedClass;
    const sectionMatches = !requestedSection || entry.section === requestedSection;
    return classMatches && sectionMatches;
  });

  if (!matchesRequest.length) {
    throw createHttpError(403, 'You are not assigned to the requested class and section');
  }

  if (requestedClass && requestedSection) {
    return { class: requestedClass, section: requestedSection };
  }

  return {
    $or: matchesRequest.map((entry) => ({
      class: entry.class,
      section: entry.section
    }))
  };
};

export const ensureTeacherClassAccess = async (user, className, section) => {
  if (!isTeacher(user)) return;
  await buildTeacherScopeFilter(user, className, section);
};

export const ensureStudentRecordAccess = async (user, studentId) => {
  if (isAdmin(user)) return null;

  if (isStudent(user) || isParent(user)) {
    ensureOwnStudentAccess(user, studentId);
    return null;
  }

  if (isTeacher(user)) {
    const student = await Student.findById(studentId).select('class section');
    if (!student) throw createHttpError(404, 'Student not found');
    await ensureTeacherClassAccess(user, student.class, student.section);
    return student;
  }

  throw createHttpError(403, 'You are not allowed to access this student record');
};

export const buildMongoFilters = (filters) => {
  const cleaned = filters.filter(Boolean);
  if (!cleaned.length) return {};
  if (cleaned.length === 1) return cleaned[0];
  return { $and: cleaned };
};
