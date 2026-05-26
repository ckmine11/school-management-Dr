# School Management System

A full-featured school management web application built with Node.js, MongoDB, and Nginx — fully containerized with Docker.

**Roles:** Admin · Teacher · Student · Parent  
**Notifications:** WhatsApp (auto + broadcast)  
**PDFs:** Fee Receipts · Student ID Cards  
**Deploy:** Docker Compose (works on any Linux VPS or Oracle Cloud Free Tier)

---

## Quick Start

### 1. Clone & Configure

```bash
git clone https://github.com/ckmine11/school-management-Dr.git
cd school-management-Dr
cp .env.example .env
# Edit .env — set JWT_SECRET, ADMIN_RECOVERY_SECRET, SCHOOL_NAME
```

### 2. Start

```bash
docker-compose up -d --build
```

### 3. Seed Admin Account

```bash
docker exec school-backend node seed.js
```

### 4. Open in Browser

```
http://localhost/login.html
```

---

## Default Login

| Role | Email | Password |
|---|---|---|
| Admin | admin@school.com | admin123 |

> Change the admin password after first login. Student and parent accounts are auto-created when you add a student.

---

## Features

### Student & Teacher Management
- Auto-generated IDs (STU0001, TCH001)
- Photo upload with auto-compression
- Login accounts auto-created for students and parents
- Student ID Card download (PDF)

### Attendance
- Bulk mark attendance per class/section
- Auto WhatsApp notification to parent when student is absent

### Fee Management
- Multiple fee types (tuition, transport, library, sports, exam)
- Mark payments with method (cash, bank, online, cheque)
- Auto WhatsApp receipt to parent after payment
- Download fee receipt as PDF

### Results
- Multi-subject results with auto grade calculation
- Grade scale: A+ (≥90%) to F (<33%)
- Students and parents see only their own results

### Timetable
- Weekly schedule (Mon–Sat) per class and section
- Teacher assigned per period
- Today's schedule highlighted for students/parents

### Exam Schedule
- Schedule exams with time, duration, room, max marks
- Auto WhatsApp reminder 24 hours before exam (8 AM IST daily cron)
- Manual reminder broadcast button
- Upcoming/past exam view with countdown for students

### Notices
- Post announcements with type and target audience
- Optional WhatsApp broadcast to parents/teachers/students
- Pin important notices, set expiry dates

### WhatsApp Integration
- Connect via QR code scan (WhatsApp Web)
- Persistent session (survives restarts via Docker volume)
- MongoDB-backed message queue — messages survive server restarts
- Broadcast to all parents, teachers, or students at once
- Admin queue dashboard: pending / sent / failed counts + retry

### Dashboard
- Live stats: students, teachers, fee collection, attendance %
- Today's present/absent breakdown
- Recent notices

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express |
| Database | MongoDB 7 |
| Auth | JWT (httpOnly cookies) + bcryptjs |
| Frontend | HTML + Tailwind CSS + Vanilla JS |
| Web Server | Nginx (reverse proxy + static files) |
| WhatsApp | whatsapp-web.js |
| PDF | pdfkit |
| Images | sharp (auto-compress uploads) |
| Scheduler | node-cron |
| Containers | Docker + Docker Compose |

---

## Environment Variables

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/schoolmanagement

JWT_SECRET=your_64_char_random_hex_string
JWT_EXPIRE=7d
ADMIN_RECOVERY_SECRET=YourSecretRecoveryPhrase

SCHOOL_NAME=Bright Future School
SCHOOL_EMAIL=admin@brightfutureschool.com
FRONTEND_URL=http://localhost

BACKEND_PORT=5000
FRONTEND_PORT=80

ONESIGNAL_APP_ID=
ONESIGNAL_REST_API_KEY=
```

Generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Deploy to Oracle Cloud (Free)

1. Create VM: **VM.Standard.A1.Flex** — 4 OCPU, 24GB RAM, 100GB boot volume
2. OS: Ubuntu 22.04 — open port 80 in Security List
3. SSH in and run:

```bash
sudo apt update && sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu
# re-login, then:
git clone https://github.com/ckmine11/school-management-Dr.git
cd school-management-Dr
cp .env.example .env
nano .env   # set FRONTEND_URL=http://YOUR_VM_IP
docker-compose up -d --build
docker exec school-backend node seed.js
```

---

## Project Structure

```
school-management/
├── backend/
│   ├── models/          # MongoDB schemas (11 models)
│   ├── routes/          # REST API routes (13 route files)
│   ├── services/        # WhatsApp client, message queue, cron
│   ├── utils/           # PDF generator, image processor, auth helpers
│   ├── middleware/       # JWT auth + role authorization
│   └── server.js        # Express entry point
├── frontend/
│   ├── admin/           # 11 admin pages
│   ├── teacher/         # 5 teacher pages
│   ├── student/         # 6 student pages
│   ├── parent/          # 3 parent pages
│   ├── js/              # api.js, auth.js, layout.js
│   ├── css/style.css    # Global styles + mobile responsive
│   └── nginx.conf       # Nginx reverse proxy config
└── docker-compose.yml
```

---

## API Overview

Base URL: `/api`  
Auth: JWT cookie (set on login) or `Authorization: Bearer <token>`

| Resource | Endpoints |
|---|---|
| Auth | POST /auth/login, POST /auth/logout, GET /auth/me, PUT /auth/change-password |
| Students | GET/POST /students, GET/PUT/DELETE /students/:id, GET /students/:id/idcard |
| Teachers | GET/POST /teachers, GET/PUT/DELETE /teachers/:id |
| Attendance | POST /attendance/mark, GET /attendance |
| Fees | GET/POST /fees, PUT /fees/:id/pay, GET /fees/:id/receipt |
| Results | GET/POST /results, GET/PUT/DELETE /results/:id |
| Notices | GET/POST /notices, GET/PUT/DELETE /notices/:id |
| Timetable | GET /timetable, PUT /timetable, DELETE /timetable |
| Exams | GET/POST /exams, PUT/DELETE /exams/:id, POST /exams/send-reminder |
| WhatsApp | GET /whatsapp/status, POST /whatsapp/init, POST /whatsapp/send-bulk |
| Dashboard | GET /dashboard/stats, GET /dashboard/class-stats |

Full API docs → [DOCUMENTATION.md](DOCUMENTATION.md)

---

## Docker Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Logs
docker-compose logs -f backend

# Backend shell
docker exec -it school-backend sh
```

---

## Common Issues

**Cannot login** — Run `docker exec school-backend node seed.js` to create admin account.

**WhatsApp QR not showing** — Wait 15 seconds, click Refresh. Check `docker-compose logs -f backend`.

**"No parent phones found"** — Add parent phone numbers to student records in the Students page.

**Out of capacity (Oracle Cloud ARM)** — Try Availability Domain AD-2 or AD-3. Retry during off-peak hours (1–5 AM IST).

---

## Full Documentation

See [DOCUMENTATION.md](DOCUMENTATION.md) for:
- Complete API reference with request/response examples
- All database model fields
- WhatsApp queue details
- Security implementation
- Detailed troubleshooting guide

---

*Stack: Node.js · Express · MongoDB · Nginx · Docker · whatsapp-web.js*
