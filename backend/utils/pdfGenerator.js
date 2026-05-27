import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { getSettings } from '../models/SchoolSettings.js';

const SUCCESS = '#16a34a';
const GRAY = '#6b7280';
const LIGHT = '#f8fafc';

async function getSchoolConfig() {
  try {
    const s = await getSettings();
    return {
      name: s.schoolName || process.env.SCHOOL_NAME || 'My School',
      email: s.email || process.env.SCHOOL_EMAIL || '',
      address: s.address || '',
      phone: s.phone || '',
      currencySymbol: s.currencySymbol || '₹',
      primaryColor: s.primaryColor || '#1e3a5f',
    };
  } catch {
    return {
      name: process.env.SCHOOL_NAME || 'My School',
      email: process.env.SCHOOL_EMAIL || '',
      address: '',
      phone: '',
      currencySymbol: '₹',
      primaryColor: '#1e3a5f',
    };
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtMoney(n, sym) {
  return `${sym || '₹'} ${Number(n || 0).toLocaleString('en-IN')}`;
}
function row(doc, label, value, y, lx = 60, vx = 220, color = GRAY) {
  doc.font('Helvetica').fontSize(10).fillColor(color).text(label, lx, y);
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#111').text(String(value || '-'), vx, y);
}

// ─── Fee Receipt ─────────────────────────────────────────────────────────────

export async function generateFeeReceipt(fee, res) {
  const school = await getSchoolConfig();
  const PRIMARY = school.primaryColor;

  const doc = new PDFDocument({ size: 'A5', margin: 0, bufferPages: true });
  doc.pipe(res);

  const W = doc.page.width;  // 419.53

  // Header background
  doc.rect(0, 0, W, 90).fill(PRIMARY);

  // School initial circle
  doc.circle(48, 45, 24).fillAndStroke('white', PRIMARY);
  doc.font('Helvetica-Bold').fontSize(20).fillColor(PRIMARY).text(school.name[0].toUpperCase(), 39, 33);

  // School name + subtitle
  doc.font('Helvetica-Bold').fontSize(16).fillColor('white').text(school.name, 82, 22);
  doc.font('Helvetica').fontSize(10).fillColor('rgba(255,255,255,0.8)').text('Fee Receipt', 82, 44);

  // Status badge top-right
  const st = fee.status;
  const stColor = st === 'paid' ? '#16a34a' : st === 'partial' ? '#d97706' : '#dc2626';
  doc.roundedRect(W - 90, 28, 74, 24, 4).fill(stColor);
  doc.font('Helvetica-Bold').fontSize(10).fillColor('white')
    .text(st.toUpperCase(), W - 90, 35, { width: 74, align: 'center' });

  // ── Receipt meta ──
  let y = 108;
  doc.font('Helvetica').fontSize(9).fillColor(GRAY)
    .text(`Receipt: ${fee.receiptNo}`, 60, y)
    .text(`Date: ${fmtDate(fee.paidDate || fee.createdAt)}`, W - 180, y, { width: 120, align: 'right' });

  y = 126;
  doc.moveTo(40, y).lineTo(W - 40, y).lineWidth(0.5).strokeColor('#e2e8f0').stroke();

  // ── Student info ──
  y = 138;
  doc.rect(40, y, W - 80, 68).fill(LIGHT).stroke('#e2e8f0');
  const s = fee.studentId || {};
  row(doc, 'Student Name', s.name, y + 10, 52, 180);
  row(doc, 'Class / Section', `${s.class || '-'} - ${s.section || '-'}`, y + 26, 52, 180);
  row(doc, 'Roll No', s.rollNo || '-', y + 42, 52, 180);
  row(doc, 'Parent Name', s.parentName || '-', y + 58, 52, 180);

  // ── Payment details ──
  y = 222;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(PRIMARY).text('PAYMENT DETAILS', 40, y);
  y += 12;
  doc.moveTo(40, y).lineTo(W - 40, y).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
  y += 8;

  const leftX = 40, midX = W / 2 + 10;
  row(doc, 'Fee Type', fee.feeType || '-', y, leftX + 10, leftX + 110);
  row(doc, 'Due Date', fmtDate(fee.dueDate), y, midX, midX + 90);
  y += 18;
  row(doc, 'Total Amount', fmtMoney(fee.amount, school.currencySymbol), y, leftX + 10, leftX + 110);
  row(doc, 'Paid Amount', fmtMoney(fee.paidAmount, school.currencySymbol), y, midX, midX + 90);
  y += 18;
  row(doc, 'Payment Method', (fee.paymentMethod || 'cash').toUpperCase(), y, leftX + 10, leftX + 110);
  if (fee.month) row(doc, 'Month / Year', `${fee.month} ${fee.year || ''}`, y, midX, midX + 90);

  // ── Total paid box ──
  y += 28;
  doc.rect(40, y, W - 80, 36).fill('#f0fdf4').stroke('#bbf7d0');
  doc.font('Helvetica-Bold').fontSize(13).fillColor(SUCCESS)
    .text(`Total Paid: ${fmtMoney(fee.paidAmount, school.currencySymbol)}`, 40, y + 10, { width: W - 80, align: 'center' });

  // ── Footer ──
  y = doc.page.height - 52;
  doc.moveTo(40, y).lineTo(W - 40, y).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
  y += 8;
  doc.font('Helvetica').fontSize(8).fillColor(GRAY)
    .text('Thank you for your payment! This is a computer-generated receipt.', 40, y, { width: W - 80, align: 'center' });
  if (school.email) doc.text(school.email, 40, y + 12, { width: W - 80, align: 'center' });

  doc.end();
}

// ─── Student ID Card ─────────────────────────────────────────────────────────

export async function generateIdCard(student, res) {
  const school = await getSchoolConfig();
  const PRIMARY = school.primaryColor;

  // A6 landscape = 420 × 297pt  (close to credit-card-sized card)
  const doc = new PDFDocument({ size: [420, 270], margin: 0, bufferPages: true });
  doc.pipe(res);

  const W = 420, H = 270;

  // Background
  doc.rect(0, 0, W, H).fill('#f8fafc');

  // Left accent stripe
  doc.rect(0, 0, 10, H).fill(PRIMARY);

  // Header bar
  doc.rect(10, 0, W - 10, 62).fill(PRIMARY);

  // School initial
  doc.circle(46, 31, 18).fillAndStroke('white', PRIMARY);
  doc.font('Helvetica-Bold').fontSize(16).fillColor(PRIMARY).text(school.name[0].toUpperCase(), 38, 21);

  // School name
  doc.font('Helvetica-Bold').fontSize(14).fillColor('white').text(school.name, 74, 14);
  doc.font('Helvetica').fontSize(9).fillColor('rgba(255,255,255,0.75)').text('STUDENT IDENTITY CARD', 74, 34);

  // ── Photo box ──
  const photoX = 22, photoY = 76, photoW = 90, photoH = 115;
  doc.rect(photoX, photoY, photoW, photoH).fill('white').stroke('#cbd5e1');

  if (student.photo) {
    const photoPath = path.resolve(`uploads/photos/${student.photo}`);
    if (fs.existsSync(photoPath)) {
      try {
        doc.image(photoPath, photoX + 2, photoY + 2, { width: photoW - 4, height: photoH - 4, cover: [photoW - 4, photoH - 4] });
      } catch {}
    }
  }
  if (!student.photo || !fs.existsSync(path.resolve(`uploads/photos/${student.photo}`))) {
    doc.font('Helvetica-Bold').fontSize(28).fillColor('#cbd5e1')
      .text(((student.name || 'S')[0]).toUpperCase(), photoX, photoY + 38, { width: photoW, align: 'center' });
  }

  // ── Student details ──
  const dX = 130, dY = 76;
  const field = (label, value, y) => {
    doc.font('Helvetica').fontSize(8).fillColor(GRAY).text(label, dX, y);
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e293b').text(String(value || '-'), dX, y + 11);
  };

  field('STUDENT NAME', student.name, dY);
  field('CLASS / SECTION', `${student.class} - ${student.section}`, dY + 40);
  field('ROLL NUMBER', student.rollNo || '-', dY + 78);

  // ID badge
  doc.roundedRect(dX, dY + 116, 100, 22, 4).fill(PRIMARY);
  doc.font('Helvetica-Bold').fontSize(10).fillColor('white')
    .text(student.studentId || '-', dX, dY + 122, { width: 100, align: 'center' });

  // ── Right side: Academic year + parent ──
  const rX = 280, rY = 76;
  try {
    const settingsAY = (await getSettings()).academicYear;
    doc.font('Helvetica').fontSize(8).fillColor(GRAY).text('ACADEMIC YEAR', rX, rY);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e293b').text(settingsAY || '-', rX, rY + 11);
  } catch {
    const now = new Date();
    const yr = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    doc.font('Helvetica').fontSize(8).fillColor(GRAY).text('ACADEMIC YEAR', rX, rY);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e293b').text(`${yr} - ${yr + 1}`, rX, rY + 11);
  }

  doc.font('Helvetica').fontSize(8).fillColor(GRAY).text('PARENT / GUARDIAN', rX, rY + 36);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#1e293b')
    .text(student.parentName || '-', rX, rY + 47, { width: 120 });

  doc.font('Helvetica').fontSize(8).fillColor(GRAY).text('CONTACT', rX, rY + 72);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#1e293b')
    .text(student.parentPhone || student.phone || '-', rX, rY + 83);

  // ── Bottom bar ──
  doc.rect(10, H - 44, W - 10, 44).fill(PRIMARY);
  doc.font('Helvetica').fontSize(8).fillColor('rgba(255,255,255,0.7)')
    .text('If found, please return to:', 22, H - 36);
  doc.font('Helvetica-Bold').fontSize(8).fillColor('white')
    .text(`${school.name}${school.email ? '  |  ' + school.email : ''}`, 22, H - 24, { width: W - 44 });

  doc.end();
}
