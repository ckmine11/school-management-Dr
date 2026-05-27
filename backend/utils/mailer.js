import nodemailer from 'nodemailer';

// Returns null if SMTP not configured — callers must handle gracefully
function createTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendAdmissionNotification(enq, schoolEmail) {
  const transporter = createTransport();
  if (!transporter || !schoolEmail) return { sent: false, reason: 'SMTP not configured' };

  try {
    await transporter.sendMail({
      from: `"School Website" <${process.env.SMTP_USER}>`,
      to: schoolEmail,
      subject: `New Admission Enquiry: ${enq.studentName} — ${enq.applyingClass}`,
      html: `
        <h2 style="color:#1e3a5f;">New Admission Enquiry</h2>
        <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px;">
          <tr><td style="padding:8px;background:#f8fafc;font-weight:bold;width:140px;">Student Name</td><td style="padding:8px;">${enq.studentName}</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;font-weight:bold;">Date of Birth</td><td style="padding:8px;">${enq.dob || '-'}</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;font-weight:bold;">Applying for</td><td style="padding:8px;">${enq.applyingClass}</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;font-weight:bold;">Parent Name</td><td style="padding:8px;">${enq.parentName}</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;font-weight:bold;">Phone</td><td style="padding:8px;">${enq.phone}</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;font-weight:bold;">Email</td><td style="padding:8px;">${enq.email || '-'}</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;font-weight:bold;">Current School</td><td style="padding:8px;">${enq.currentSchool || '-'}</td></tr>
          ${enq.message ? `<tr><td style="padding:8px;background:#f8fafc;font-weight:bold;vertical-align:top;">Message</td><td style="padding:8px;">${enq.message.replace(/\n/g, '<br>')}</td></tr>` : ''}
          <tr><td style="padding:8px;background:#f8fafc;font-weight:bold;">Received</td><td style="padding:8px;">${new Date().toLocaleString('en-IN')}</td></tr>
        </table>
        <p style="margin-top:16px;color:#64748b;font-size:12px;">Login to admin panel: <a href="${process.env.FRONTEND_URL}/admin/admissions.html">Admin → Admissions</a></p>
      `
    });
    return { sent: true };
  } catch (err) {
    console.error('[Mailer]', err.message);
    return { sent: false, reason: err.message };
  }
}

export async function sendContactNotification(msg, schoolEmail) {
  const transporter = createTransport();
  if (!transporter || !schoolEmail) return { sent: false, reason: 'SMTP not configured' };

  try {
    await transporter.sendMail({
      from: `"School Website" <${process.env.SMTP_USER}>`,
      to: schoolEmail,
      subject: `New Contact Message: ${msg.subject}`,
      html: `
        <h2 style="color:#1e3a5f;">New Contact Message</h2>
        <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px;">
          <tr><td style="padding:8px;background:#f8fafc;font-weight:bold;width:120px;">Name</td><td style="padding:8px;">${msg.name}</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;font-weight:bold;">Email</td><td style="padding:8px;">${msg.email}</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;font-weight:bold;">Phone</td><td style="padding:8px;">${msg.phone || '-'}</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;font-weight:bold;">Subject</td><td style="padding:8px;">${msg.subject}</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;font-weight:bold;vertical-align:top;">Message</td><td style="padding:8px;">${msg.message.replace(/\n/g, '<br>')}</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;font-weight:bold;">Received</td><td style="padding:8px;">${new Date().toLocaleString('en-IN')}</td></tr>
        </table>
        <p style="margin-top:16px;color:#64748b;font-size:12px;">Login to admin panel to view and reply: <a href="${process.env.FRONTEND_URL}/admin/contacts.html">Admin → Contact Messages</a></p>
      `
    });
    return { sent: true };
  } catch (err) {
    console.error('[Mailer]', err.message);
    return { sent: false, reason: err.message };
  }
}
