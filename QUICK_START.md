# Quick Start Guide

## 1. Setup

```bash
git clone https://github.com/ckmine11/school-management-Dr.git
cd school-management-Dr
cp .env.example .env
```

Edit `.env` — set these required values:
```env
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
ADMIN_RECOVERY_SECRET=YourSecretPhrase
SCHOOL_NAME=Your School Name
SCHOOL_EMAIL=admin@yourschool.com
FRONTEND_URL=http://localhost        # change to your server IP when deploying
```

## 2. Start

```bash
docker-compose up -d --build
```

Wait ~60 seconds for all containers to be healthy.

## 3. Create Admin Account

```bash
docker exec school-backend node seed.js
```

## 4. Open in Browser

```
http://localhost/login.html
```

Login: `admin@school.com` / `admin123`  
**Change the password immediately after first login.**

---

## All Pages

### Public
| Page | URL |
|---|---|
| Home | `/index.html` |
| Login | `/login.html` |
| About | `/about.html` |
| Gallery | `/gallery.html` |
| Contact | `/contact.html` |
| Admission | `/admission.html` |

### Admin
| Page | URL |
|---|---|
| Dashboard | `/admin/dashboard.html` |
| Students | `/admin/students.html` |
| Teachers | `/admin/teachers.html` |
| Attendance | `/admin/attendance.html` |
| Fees | `/admin/fees.html` |
| Results | `/admin/results.html` |
| Notices | `/admin/notices.html` |
| Timetable | `/admin/timetable.html` |
| Exam Schedule | `/admin/exams.html` |
| Gallery | `/admin/gallery.html` |
| WhatsApp Setup | `/admin/whatsapp.html` |

### Teacher
| Page | URL |
|---|---|
| Dashboard | `/teacher/dashboard.html` |
| Attendance | `/teacher/attendance.html` |
| Results | `/teacher/results.html` |
| Timetable | `/teacher/timetable.html` |
| Exams | `/teacher/exams.html` |

### Student
| Page | URL |
|---|---|
| Dashboard | `/student/dashboard.html` |
| Attendance | `/student/attendance.html` |
| Fees | `/student/fees.html` |
| Results | `/student/results.html` |
| Timetable | `/student/timetable.html` |
| Exams | `/student/exams.html` |

### Parent
| Page | URL |
|---|---|
| Dashboard | `/parent/dashboard.html` |
| Timetable | `/parent/timetable.html` |
| Exams | `/parent/exams.html` |

---

## Common Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart one service
docker-compose restart backend

# Check container status
docker-compose ps

# Backend shell
docker exec -it school-backend sh
```

---

## WhatsApp Setup

1. Go to `/admin/whatsapp.html`
2. Click **Connect WhatsApp**
3. Scan QR code with your phone (WhatsApp → Linked Devices → Link a Device)
4. Status shows **Connected ✓**

---

## Health Check

```bash
curl http://localhost:5000/api/health
# Response: { "status": "OK" }
```

---

## Before Client Handover — Checklist

```
☐  .env updated with real values:
     - JWT_SECRET        → fresh 64-char random hex
     - ADMIN_RECOVERY_SECRET → memorable secret phrase
     - FRONTEND_URL      → http://SERVER_IP or https://domain.com
     - SCHOOL_NAME       → client's school name
     - SCHOOL_EMAIL      → client's email

☐  Port 80 open in server firewall / security group
   (Port 5000 must stay closed — only Nginx on 80 is public)

☐  docker-compose up -d --build  (fresh build with real .env)

☐  docker exec school-backend node seed.js  (first time only)
   Note: safe to run again — skips if admin already exists

☐  First login: admin@school.com / admin123
   → Change admin password immediately after login

☐  WhatsApp connected:
     Admin → WhatsApp Setup → Connect WhatsApp → Scan QR

☐  Real data entered:
     → Students added (with parent phone numbers for WhatsApp)
     → Teachers added with assigned classes
     → Timetable set up per class/section
     → Exam schedule added

☐  Test end-to-end:
     → Mark one student absent → parent gets WhatsApp
     → Record one fee payment → parent gets receipt on WhatsApp
     → Download one fee receipt PDF
     → Download one student ID card PDF
```

---

## Full Documentation

- [DOCUMENTATION.md](DOCUMENTATION.md) — Complete technical reference + Production Readiness Summary
- [USER_GUIDE_HINDI.md](USER_GUIDE_HINDI.md) — Hindi user guide for school staff
