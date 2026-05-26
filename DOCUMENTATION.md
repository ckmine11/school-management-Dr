# School Management System — Complete Documentation

**Version:** 1.0.0  
**Last Updated:** May 2026  
**Stack:** Node.js + Express + MongoDB + Nginx (Docker)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Folder Structure](#4-folder-structure)
5. [Environment Variables](#5-environment-variables)
   - [5a. How to Generate JWT_SECRET](#5a-how-to-generate-jwt_secret)
6. [Installation & Deployment](#6-installation--deployment)
7. [Default Credentials](#7-default-credentials)
8. [User Roles & Permissions](#8-user-roles--permissions)
9. [Features by Module](#9-features-by-module)
10. [API Reference](#10-api-reference)
11. [Database Models](#11-database-models)
12. [WhatsApp Integration](#12-whatsapp-integration)
13. [PDF Generation](#13-pdf-generation)
14. [Frontend Pages](#14-frontend-pages)
15. [Security](#15-security)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Project Overview

A full-featured school management system built for small to medium schools. It supports four types of users — **Admin**, **Teacher**, **Student**, and **Parent** — each with their own dashboard and capabilities.

### Key Highlights

- Role-based access control (Admin / Teacher / Student / Parent)
- WhatsApp notifications for fee payments, exam reminders, absence alerts, and broadcasts
- PDF generation for fee receipts and student ID cards
- Weekly timetable management per class and section
- Exam scheduling with automatic 24-hour WhatsApp reminders
- Student and parent login accounts auto-created when adding a student
- Mobile-responsive UI (works on phones and desktops)
- Fully containerized with Docker (3 containers: MongoDB, Backend, Frontend/Nginx)

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    User (Browser)                    │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP (port 80)
                        ▼
┌─────────────────────────────────────────────────────┐
│              Nginx (school-frontend)                 │
│  Static HTML/CSS/JS  +  Reverse Proxy to backend    │
│  Port 80 → /api/* forwarded to backend:5000         │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP (internal docker network)
                        ▼
┌─────────────────────────────────────────────────────┐
│           Node.js / Express (school-backend)         │
│  Port 5000 — REST API, JWT auth, PDF, WhatsApp      │
│  Rate limiting, CORS, File uploads (multer/sharp)   │
└───────────────────────┬─────────────────────────────┘
                        │ TCP (internal docker network)
                        ▼
┌─────────────────────────────────────────────────────┐
│              MongoDB (school-mongodb)                │
│  Port 27017 (internal only) — Database: schoolmgmt  │
└─────────────────────────────────────────────────────┘
```

### Docker Volumes

| Volume | Purpose |
|---|---|
| `mongodb_data` | MongoDB database files (persistent) |
| `uploads_data` | Student/teacher photos and uploads |
| `whatsapp_session` | WhatsApp Web authentication session |

---

## 3. Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | ^4.18.3 | HTTP framework |
| Mongoose | ^8.3.1 | MongoDB ODM |
| jsonwebtoken | ^9.0.2 | JWT authentication |
| bcryptjs | ^2.4.3 | Password hashing |
| multer | ^1.4.5 | File upload handling |
| sharp | ^0.33.4 | Image compression |
| pdfkit | ^0.15.0 | PDF receipt & ID card generation |
| node-cron | ^3.0.3 | Scheduled exam reminders |
| whatsapp-web.js | ^1.26.0 | WhatsApp Web automation |
| express-rate-limit | ^7.4.1 | API rate limiting |
| cookie-parser | ^1.4.6 | JWT cookie handling |
| cors | ^2.8.5 | Cross-origin requests |

### Frontend
| Technology | Purpose |
|---|---|
| HTML5 + Vanilla JS | UI pages (no framework) |
| Tailwind CSS (CDN) | Utility-first styling |
| Font Awesome 6 | Icons |
| Custom CSS (`style.css`) | Layout, sidebar, mobile responsive |

### Infrastructure
| Tool | Purpose |
|---|---|
| Docker + Docker Compose | Container orchestration |
| Nginx (Alpine) | Static file server + reverse proxy |
| MongoDB 7 (Jammy) | Database |

---

## 4. Folder Structure

```
school-management/
├── docker-compose.yml          # Multi-container setup
├── .env                        # Environment variables (not committed)
├── .env.example                # Template for .env
├── .gitignore
│
├── backend/
│   ├── server.js               # Express app entry point
│   ├── package.json
│   ├── Dockerfile
│   ├── seed.js                 # Database seeding script
│   │
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   │
│   ├── middleware/
│   │   └── auth.js             # JWT protect + authorize middleware
│   │
│   ├── models/
│   │   ├── User.js             # Login accounts (all roles)
│   │   ├── Student.js          # Student records
│   │   ├── Teacher.js          # Teacher records
│   │   ├── Attendance.js       # Daily attendance
│   │   ├── Fee.js              # Fee payments
│   │   ├── Result.js           # Exam results
│   │   ├── Notice.js           # School notices/announcements
│   │   ├── ExamSchedule.js     # Exam timetable
│   │   ├── Timetable.js        # Weekly class schedule
│   │   ├── Gallery.js          # Photo gallery
│   │   └── MessageQueue.js     # WhatsApp message queue
│   │
│   ├── routes/
│   │   ├── auth.js             # Login, logout, change password
│   │   ├── students.js         # CRUD + ID card PDF
│   │   ├── teachers.js         # CRUD
│   │   ├── attendance.js       # Bulk mark, reports
│   │   ├── fees.js             # CRUD + pay + receipt PDF
│   │   ├── results.js          # CRUD, grade calculation
│   │   ├── notices.js          # CRUD, WhatsApp broadcast
│   │   ├── timetable.js        # Week schedule per class
│   │   ├── examSchedule.js     # Exam scheduling + reminders
│   │   ├── dashboard.js        # Admin stats
│   │   ├── whatsapp.js         # WA status, QR, queue
│   │   ├── gallery.js          # Photo gallery
│   │   └── notifications.js    # Push notifications
│   │
│   ├── services/
│   │   ├── whatsappClient.js   # WhatsApp Web client wrapper
│   │   ├── messageQueue.js     # Persistent WA message queue
│   │   └── reminderCron.js     # Daily exam reminder cron job
│   │
│   └── utils/
│       ├── pdfGenerator.js     # Fee receipt + ID card PDFs
│       ├── authAccess.js       # Role-based access helpers
│       ├── accountSync.js      # Student/parent user sync
│       ├── imageProcessor.js   # Photo compression with sharp
│       ├── notification.js     # Push notification helpers
│       └── whatsapp.js         # Legacy WA helper
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf              # Nginx config (proxy + static)
    │
    ├── index.html              # Public homepage
    ├── login.html              # Login page
    ├── about.html              # About school page
    ├── contact.html            # Contact page
    ├── admission.html          # Admission enquiry
    ├── gallery.html            # Public gallery
    ├── change-password.html    # Force password change page
    │
    ├── css/
    │   └── style.css           # Global styles + mobile responsive
    │
    ├── js/
    │   ├── api.js              # Axios-like API wrapper
    │   ├── auth.js             # Auth helpers (login, logout, guard)
    │   ├── layout.js           # Sidebar + topbar builder
    │   └── inline-fallback.js  # Inline script fallback
    │
    ├── admin/                  # Admin-only pages
    │   ├── dashboard.html
    │   ├── students.html
    │   ├── teachers.html
    │   ├── attendance.html
    │   ├── fees.html
    │   ├── results.html
    │   ├── notices.html
    │   ├── timetable.html
    │   ├── exams.html
    │   ├── gallery.html
    │   └── whatsapp.html
    │
    ├── teacher/                # Teacher pages
    │   ├── dashboard.html
    │   ├── attendance.html
    │   ├── results.html
    │   ├── timetable.html
    │   └── exams.html
    │
    ├── student/                # Student pages
    │   ├── dashboard.html
    │   ├── attendance.html
    │   ├── fees.html
    │   ├── results.html
    │   ├── timetable.html
    │   └── exams.html
    │
    └── parent/                 # Parent pages
        ├── dashboard.html
        ├── timetable.html
        └── exams.html
```

---

## 5. Environment Variables

Create a `.env` file in the root `school-management/` folder:

```env
# ── Server ──────────────────────────────────────────
PORT=5000
NODE_ENV=production

# ── Database ─────────────────────────────────────────
MONGODB_URI=mongodb://mongodb:27017/schoolmanagement

# ── Authentication ────────────────────────────────────
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_64_char_random_hex_string
JWT_EXPIRE=7d

# ── Admin Recovery ────────────────────────────────────
# Used to reset admin password if locked out
ADMIN_RECOVERY_SECRET=YourSecretRecoveryPhrase

# ── School Info ───────────────────────────────────────
SCHOOL_NAME=Bright Future School
SCHOOL_EMAIL=admin@brightfutureschool.com

# ── URLs ─────────────────────────────────────────────
# Change to your server IP or domain when deployed
FRONTEND_URL=http://localhost

# ── Docker Ports ─────────────────────────────────────
BACKEND_PORT=5000
FRONTEND_PORT=80

# ── Push Notifications (optional) ────────────────────
ONESIGNAL_APP_ID=
ONESIGNAL_REST_API_KEY=
```

### Important Notes

- **JWT_SECRET** must be at least 32 characters. See Section 5a below for full generation guide.
- **ADMIN_RECOVERY_SECRET** is used to reset the admin password if you get locked out. Keep it safe.
- **FRONTEND_URL** must match your actual domain or IP, e.g., `http://152.67.x.x` for Oracle Cloud.
- Never commit `.env` to Git — it is already in `.gitignore`.

---

## 5a. How to Generate JWT_SECRET

### What is JWT_SECRET?

JWT (JSON Web Token) is how the app verifies that a logged-in user is genuine. The `JWT_SECRET` is a long random string used to **sign** and **verify** these tokens. If someone gets this key, they can fake any login — so it must be:

- Long (minimum 32 characters, recommended 64+)
- Random (not a dictionary word or phrase)
- Kept private (only in `.env`, never shared or committed to Git)

---

### Method 1 — Node.js (Recommended, works everywhere)

If Node.js is installed on your machine:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Example output:**
```
8771252d04aa6012a6d2444e8e6ffc9aceb53814d1baddf60b162a6e10a965a1
2d7fb5a1015d7e4ce269e47417466d9ef37259d3da7405fde8e1946a0f33f8d1
```

Copy this entire output and paste it as your `JWT_SECRET` value.

---

### Method 2 — Inside the Docker Container (if Node.js not on your PC)

After starting the containers:

```bash
docker exec school-backend node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste into your `.env` file.

---

### Method 3 — Python (if Python is installed)

```bash
python3 -c "import secrets; print(secrets.token_hex(64))"
```

---

### Method 4 — OpenSSL (Linux/Mac terminal)

```bash
openssl rand -hex 64
```

---

### Method 5 — PowerShell (Windows)

```powershell
-join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
```

---

### Step-by-Step: Generate and Set JWT_SECRET

**Step 1** — Open terminal and run:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Step 2** — You will see something like:
```
a3f8c2e1b4d7903abc56ef1234567890abcdef1234567890abcdef1234567890ab
```

**Step 3** — Open your `.env` file:
```bash
nano .env          # Linux/Mac
notepad .env       # Windows
```

**Step 4** — Find the line:
```
JWT_SECRET=your_64_char_random_hex_string
```

**Step 5** — Replace the placeholder with your generated value:
```
JWT_SECRET=a3f8c2e1b4d7903abc56ef1234567890abcdef1234567890abcdef1234567890ab
```

**Step 6** — Save the file and restart the backend:
```bash
docker-compose restart backend
```

---

### Rules for JWT_SECRET

| Rule | Why |
|---|---|
| Minimum 32 characters (recommended 64+) | Shorter = easier to brute-force |
| Fully random — never a word or sentence | Predictable strings can be guessed |
| Never commit to Git | Anyone with the key can forge tokens |
| Different for every deployment | If one client's key leaks, others stay safe |
| Store only in `.env` file | `.env` is in `.gitignore` and never uploaded |

---

### What happens if JWT_SECRET changes?

If you change `JWT_SECRET` after users are already logged in:
- All existing login sessions become invalid immediately
- All users will be logged out and must log in again
- This is expected behaviour — new tokens are signed with the new key

---

## 6. Installation & Deployment

### Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine + Docker Compose (Linux)
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/ckmine11/school-management-Dr.git
cd school-management-Dr
```

### Step 2: Create the .env File

```bash
cp .env.example .env
# Edit .env with your values
```

### Step 3: Start the Application

```bash
docker-compose up -d --build
```

This will:
1. Build the backend image (Node.js + npm install)
2. Build the frontend image (copy files into Nginx)
3. Start MongoDB, backend, and frontend containers
4. Backend waits for MongoDB health check before starting
5. Frontend waits for backend health check before starting

### Step 4: Access the Application

| URL | Purpose |
|---|---|
| `http://localhost` | Frontend (public homepage) |
| `http://localhost/login.html` | Login page |
| `http://localhost:5000/api/health` | Backend health check |

### Seed Default Admin Account

After first start, run the seed script to create the default admin:

```bash
docker exec school-backend node seed.js
```

### Common Docker Commands

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

# Enter backend shell
docker exec -it school-backend sh
```

### Deploying to Oracle Cloud (Free Tier)

1. Create VM: **VM.Standard.A1.Flex** (ARM) — 4 OCPU, 24GB RAM
2. Boot volume: 100GB
3. OS: Ubuntu 22.04
4. Open ports in Security List: 80 (HTTP), 22 (SSH)
5. SSH into VM and run:

```bash
# Install Docker
sudo apt update && sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu
# Re-login, then:

# Clone and deploy
git clone https://github.com/ckmine11/school-management-Dr.git
cd school-management-Dr
cp .env.example .env
nano .env   # Edit with your values, set FRONTEND_URL=http://YOUR_VM_IP
docker-compose up -d --build
docker exec school-backend node seed.js
```

6. Access at `http://YOUR_VM_IP`

---

## 7. Default Credentials

After running `node seed.js`, use these to log in:

| Role | Email | Password |
|---|---|---|
| Admin | admin@school.com | admin123 |

**You must change the admin password after first login.**

Student and parent accounts are automatically created when you add a student from the Admin panel. Credentials are shown once after creation.

---

## 8. User Roles & Permissions

### Admin
Full access to all features.
- Add/edit/delete students, teachers
- Mark and view attendance for all classes
- Add/edit/delete fees, mark payments
- Add exam schedules, send reminders
- Create notices with optional WhatsApp broadcast
- Manage weekly timetables
- View and upload gallery photos
- Configure WhatsApp connection
- View dashboard stats

### Teacher
Read/write access scoped to their assigned classes.
- View students in their assigned class/section
- Mark attendance for their class
- Add/edit results for their class
- View exam schedule for their class
- View timetable for their class

### Student
Read-only access to their own data.
- View own attendance records
- View own fee records (cannot pay)
- View own exam results
- View their class timetable
- View upcoming exam schedule for their class

### Parent
Read-only access to their linked child's data.
- View child's attendance
- View child's fee records
- View child's exam results
- View child's class timetable
- View child's exam schedule

---

## 9. Features by Module

### Student Management
- Auto-generated Student IDs in format `STU0001`, `STU0002`, etc.
- Fields: name, DOB, gender, class, section, roll number, address, phone, parent name, parent phone, parent email, admission date, status
- Photo upload (auto-compressed to 800px width using sharp)
- Status: active / inactive / transferred
- When a student is added:
  - A **student login account** is created (email: student email, temp password shown once)
  - A **parent login account** is created (email: parent email, temp password shown once)
- Download **Student ID Card** as PDF from the students list
- Deactivating a student also deactivates linked login accounts

### Teacher Management
- Auto-generated Teacher IDs in format `TCH001`, `TCH002`, etc.
- Fields: name, DOB, gender, qualification, experience, subjects (multiple), assigned classes/sections, join date, salary, status
- Photo upload (auto-compressed)
- A **teacher login account** is created when a teacher is added
- Login credentials shown once after creation

### Attendance
- Admin and teachers can mark attendance in bulk per class/section
- Each student: present / absent / late / holiday
- Duplicate entries prevented (upsert by student + date)
- **Auto WhatsApp notification** sent to parent when student is marked absent
- Attendance reports filterable by class, section, date range

### Fee Management
- Auto-generated receipt numbers: `RCP000001`, `RCP000002`, etc.
- Fee types: tuition, transport, library, sports, exam, other
- Status: unpaid / partial / paid
- Payment methods: cash, bank transfer, online, cheque
- Mark payment with amount and method via "Pay" button
- **Auto WhatsApp notification** sent to parent after payment
- Download **Fee Receipt as PDF** (A5 size, professional layout)
- Filter fees by student, status, month, year, fee type

### Results
- Multiple subjects per result entry
- Auto-calculates: total marks, percentage, overall grade
- Grade scale: A+ (≥90%), A (≥80%), B+ (≥70%), B (≥60%), C (≥50%), D (≥33%), F (<33%)
- Supports exam types: unit-test, midterm, final, quarterly
- Per-subject grades also calculated automatically
- Students and parents can view only their own results

### Notices & Announcements
- Types: general, exam, holiday, event, fee, result
- Target audience: all / teachers only / students only / parents only
- Pin important notices to the top
- Set expiry date (auto-hides after expiry)
- Optional: Send notice as **WhatsApp broadcast** to relevant phone numbers at time of creation

### Timetable
- Weekly schedule per class and section (Monday to Saturday)
- Each period: period number, start time, end time, subject, teacher (dropdown)
- Admin can edit any class timetable
- Teachers see timetable for their assigned classes
- Students and parents see timetable for their class (today's day highlighted)

### Exam Schedule
- Fields: exam type, academic year, class, section, subject, date, start time, duration, max marks, room, notes
- Section can be "All" (applies to entire class) or specific
- **Automatic reminder** sent via WhatsApp 24 hours before exam (cron runs at 8:00 AM IST)
- **Manual reminder** button to send immediately
- Reminders go to parent phones (or student phone as fallback)
- Students and parents see upcoming and past exams with countdown

### Dashboard (Admin)
Live stats shown on admin dashboard:
- Total active students
- Total active teachers
- Fee amount collected this year
- Total fee amount billed this year
- Today's attendance percentage
- Present today / absent today counts
- Recent 5 notices

### WhatsApp Integration
- Connect your WhatsApp by scanning a QR code
- Session persists across server restarts (stored in Docker volume)
- All messages go through a **persistent queue** (MongoDB-backed)
- Queue survives server restarts — messages are delivered after reconnect
- Failed messages automatically retried (exponential backoff)
- Admin can view queue stats (pending / sent / failed) and retry failed messages
- Broadcast to all parents, teachers, or students at once

### Gallery
- Admin can upload school event photos
- Public gallery page visible without login

---

## 10. API Reference

All API endpoints are prefixed with `/api`. Authentication is via JWT cookie (set on login) or `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login with email + password |
| POST | `/api/auth/logout` | Protected | Clear auth cookie |
| GET | `/api/auth/me` | Protected | Get current user info |
| PUT | `/api/auth/change-password` | Protected | Change password |
| POST | `/api/auth/admin-recovery` | Public | Reset admin password using recovery secret |

**Login request:**
```json
{ "email": "admin@school.com", "password": "admin123" }
```

**Login response:**
```json
{
  "success": true,
  "token": "eyJ...",
  "user": {
    "_id": "...",
    "name": "Admin",
    "email": "admin@school.com",
    "role": "admin",
    "roleId": null
  }
}
```

---

### Students

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/students` | Admin/Teacher | List students (filters: status, search, page, limit) |
| POST | `/api/students` | Admin | Add new student + create login accounts |
| GET | `/api/students/:id` | Admin/Teacher/Own | Get student by ID |
| PUT | `/api/students/:id` | Admin | Update student info |
| DELETE | `/api/students/:id` | Admin | Delete student + linked accounts |
| GET | `/api/students/:id/idcard` | Admin | Download ID card PDF |
| GET | `/api/students/:id/credentials` | Admin | View login credentials |

**Query filters for GET /api/students:**
- `status` — active / inactive / transferred
- `search` — search by name, studentId, class, section
- `page`, `limit` — pagination (max 200 per page)

---

### Teachers

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/teachers` | Admin | List teachers (filters: status, search) |
| POST | `/api/teachers` | Admin | Add new teacher + create login account |
| GET | `/api/teachers/:id` | Admin | Get teacher by ID |
| PUT | `/api/teachers/:id` | Admin | Update teacher |
| DELETE | `/api/teachers/:id` | Admin | Delete teacher |
| GET | `/api/teachers/:id/credentials` | Admin | View login credentials |

---

### Attendance

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/attendance/mark` | Admin/Teacher | Bulk mark attendance for a class |
| GET | `/api/attendance` | Admin/Teacher | List attendance (filters: class, section, date, studentId) |

**Mark attendance body:**
```json
{
  "class": "10",
  "section": "A",
  "date": "2026-05-26",
  "records": [
    { "studentId": "...", "status": "present" },
    { "studentId": "...", "status": "absent" }
  ]
}
```

---

### Fees

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/fees` | Admin/Student/Parent | List fees (filters: studentId, status, month, year, feeType) |
| POST | `/api/fees` | Admin | Create fee record |
| GET | `/api/fees/:id` | Admin/Own | Get single fee record |
| PUT | `/api/fees/:id` | Admin | Update fee record |
| PUT | `/api/fees/:id/pay` | Admin | Mark payment (sends WhatsApp) |
| DELETE | `/api/fees/:id` | Admin | Delete fee record |
| GET | `/api/fees/:id/receipt` | Admin/Own | Download PDF receipt |
| GET | `/api/fees/stats/summary` | Admin | Fee collection summary |

**Pay fee body:**
```json
{ "paidAmount": 5000, "paymentMethod": "cash" }
```

---

### Results

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/results` | All | List results (students see only own) |
| POST | `/api/results` | Admin/Teacher | Add result |
| GET | `/api/results/:id` | Admin/Own | Get single result |
| PUT | `/api/results/:id` | Admin/Teacher | Update result |
| DELETE | `/api/results/:id` | Admin | Delete result |

**Create result body:**
```json
{
  "studentId": "...",
  "examType": "midterm",
  "class": "10",
  "section": "A",
  "academicYear": "2025-2026",
  "subjects": [
    { "name": "Mathematics", "maxMarks": 100, "obtainedMarks": 87 },
    { "name": "Science", "maxMarks": 100, "obtainedMarks": 91 }
  ]
}
```

---

### Notices

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notices` | Public | List active non-expired notices |
| POST | `/api/notices` | Admin | Create notice (optional WhatsApp broadcast) |
| GET | `/api/notices/:id` | Public | Get single notice |
| PUT | `/api/notices/:id` | Admin | Update notice |
| DELETE | `/api/notices/:id` | Admin | Delete notice |

---

### Timetable

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/timetable?class=X&section=Y` | Protected | Get full week for a class |
| PUT | `/api/timetable` | Admin | Save/update one day's schedule |
| DELETE | `/api/timetable?class=X&section=Y&day=Monday` | Admin | Delete one day |

**PUT body:**
```json
{
  "class": "10",
  "section": "A",
  "day": "Monday",
  "periods": [
    { "periodNo": 1, "startTime": "08:00", "endTime": "08:45", "subject": "Maths", "teacherName": "Mr. Kumar", "teacherId": "..." }
  ]
}
```

---

### Exam Schedule

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/exams` | Protected | List exams (filters: class, section, examType, academicYear) |
| POST | `/api/exams` | Admin | Create exam |
| PUT | `/api/exams/:id` | Admin | Update exam |
| DELETE | `/api/exams/:id` | Admin | Delete exam |
| POST | `/api/exams/send-reminder` | Admin | Send WhatsApp reminder for an exam |

---

### WhatsApp

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/whatsapp/status` | Admin | Connection status |
| GET | `/api/whatsapp/qr` | Admin | QR code (base64 image) |
| POST | `/api/whatsapp/init` | Admin | Start WhatsApp client |
| POST | `/api/whatsapp/logout` | Admin | Disconnect WhatsApp |
| POST | `/api/whatsapp/send` | Admin | Send single message |
| POST | `/api/whatsapp/send-bulk` | Admin | Queue bulk messages |
| GET | `/api/whatsapp/queue` | Admin | Queue stats + recent messages |
| POST | `/api/whatsapp/queue/retry` | Admin | Retry all failed messages |

---

### Dashboard

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard/stats` | Admin | Summary statistics |
| GET | `/api/dashboard/class-stats` | Admin | Students grouped by class/section |

---

## 11. Database Models

### User
```
email         String (unique, lowercase)
password      String (bcrypt hashed, min 6 chars)
name          String
role          Enum: admin | teacher | student | parent
roleId        ObjectId (ref to Student or Teacher)
roleModel     String: 'Student' | 'Teacher'
isActive      Boolean (default: true)
mustChangePassword  Boolean (default: false)
lastLogin     Date
```

### Student
```
studentId     String (auto: STU0001, STU0002...)
name          String (required)
email         String
dob           Date
gender        Enum: male | female | other
photo         String (filename)
class         String (required)
section       String (required)
rollNo        String
address       String
phone         String
parentName    String
parentPhone   String  ← used for WhatsApp notifications
parentEmail   String
admissionDate Date
status        Enum: active | inactive | transferred
userId        ObjectId (ref: User) ← student login account
```

### Teacher
```
teacherId     String (auto: TCH001, TCH002...)
name          String (required)
dob           Date
gender        Enum: male | female | other
photo         String
email         String
phone         String  ← used for WhatsApp notifications
address       String
qualification String
experience    Number (years)
subjects      [String]
assignedClasses  [{ class, section }]
joinDate      Date
salary        Number
status        Enum: active | inactive
userId        ObjectId (ref: User)
```

### Fee
```
receiptNo     String (auto: RCP000001...)
studentId     ObjectId (ref: Student, required)
feeType       Enum: tuition | transport | library | sports | exam | other
amount        Number (required)
dueDate       Date
paidDate      Date
status        Enum: unpaid | partial | paid (default: unpaid)
paidAmount    Number (default: 0)
paymentMethod Enum: cash | bank | online | cheque
month         String
year          Number
remarks       String
collectedBy   ObjectId (ref: User)
```

### Attendance
```
studentId     ObjectId (ref: Student, required)
date          Date (required)
class         String
section       String
status        Enum: present | absent | late | holiday
remarks       String
markedBy      ObjectId (ref: User)
```
*Unique index on `studentId + date` — prevents duplicate entries.*

### Result
```
studentId       ObjectId (ref: Student)
examType        Enum: unit-test | midterm | final | quarterly
class           String
section         String
academicYear    String (e.g. "2025-2026")
subjects        [{ name, maxMarks, obtainedMarks, grade }]
totalMaxMarks   Number (auto-calculated)
totalObtainedMarks Number (auto-calculated)
percentage      Number (auto-calculated)
grade           String (auto: A+, A, B+, B, C, D, F)
rank            Number
status          Enum: pass | fail | promoted
remarks         String
addedBy         ObjectId (ref: User)
```

### ExamSchedule
```
examType        Enum: unit-test | midterm | final | quarterly | other
academicYear    String
class           String (required)
section         String (default: 'All')
subject         String (required)
examDate        Date (required)
startTime       String (e.g. "10:00")
duration        Number (minutes, default: 180)
maxMarks        Number (default: 100)
room            String
notes           String
reminderSent    Boolean (default: false)
```

### Timetable
```
class     String (required)
section   String (required)
day       Enum: Monday | Tuesday | Wednesday | Thursday | Friday | Saturday
periods   [{
  periodNo    Number
  startTime   String
  endTime     String
  subject     String
  teacherName String
  teacherId   ObjectId (ref: Teacher)
}]
```
*Unique index on `class + section + day`.*

### Notice
```
title           String (required)
content         String (required)
type            Enum: general | exam | holiday | event | fee | result
targetAudience  Enum: all | teachers | students | parents
isPublic        Boolean (default: true)
isPinned        Boolean (default: false)
expiresAt       Date
createdBy       ObjectId (ref: User)
```

---

## 12. WhatsApp Integration

### How It Works

1. Admin goes to **WhatsApp Setup** page
2. Clicks **Connect WhatsApp**
3. Scans QR code with their WhatsApp phone (Linked Devices)
4. Session is saved to Docker volume (`whatsapp_session`) — survives restarts
5. Messages are sent through a **MongoDB-backed queue** — messages survive server restarts

### Auto-Triggered Messages

| Event | Recipient | Message Content |
|---|---|---|
| Student marked absent | Parent (parentPhone) | Absence notification with student name, class, date |
| Fee payment recorded | Parent (parentPhone) | Receipt no, fee type, amount paid, method, status |
| Exam scheduled / reminder | Parent / Student | Subject, date, time, duration, marks, room |
| Notice created (if broadcast selected) | Target audience | Notice title + content |

### Message Queue

- All messages go into a MongoDB queue (`MessageQueue` collection)
- Queue processor runs every 5 seconds
- If WhatsApp is disconnected, messages stay in queue as `pending`
- Once reconnected, pending messages are delivered
- Failed messages: retry with exponential backoff (30s × attempt number)
- Max retry attempts: configurable
- Admin can manually retry all failed messages from the WhatsApp Setup page

### Broadcast

Admin can send a custom message to:
- All parents (from parentPhone of all active students)
- All teachers (from teacher phone numbers)
- All students (from student phone numbers)

### Phone Number Format

- Store numbers without country code or with `+91` prefix — the system normalizes them
- Example: `9876543210` or `+919876543210`

---

## 13. PDF Generation

### Fee Receipt (A5 size)

Downloaded from **Fees → Download Receipt** button.

Contents:
- School name and branding header
- Payment status badge (PAID / PARTIAL / UNPAID) with color coding
- Receipt number and date
- Student details: name, class/section, roll number, parent name
- Payment details: fee type, due date, total amount, paid amount, payment method, month/year
- Total paid amount highlighted box
- Footer with school email and thank-you message

### Student ID Card (A6 Landscape)

Downloaded from **Students → ID Card** button.

Contents:
- School header with name and "STUDENT IDENTITY CARD" label
- Student photo (if uploaded) or initial letter placeholder
- Student name, class/section, roll number
- Auto-generated student ID badge
- Academic year (dynamically calculated from current date)
- Parent/guardian name and contact number
- Footer with school contact details

---

## 14. Frontend Pages

### Public Pages (no login required)
| Page | URL | Description |
|---|---|---|
| Home | `/` or `/index.html` | School homepage |
| Login | `/login.html` | Universal login for all roles |
| About | `/about.html` | About the school |
| Contact | `/contact.html` | Contact information |
| Admission | `/admission.html` | Admission enquiry form |
| Gallery | `/gallery.html` | Public photo gallery |

### Admin Pages
| Page | URL | Description |
|---|---|---|
| Dashboard | `/admin/dashboard.html` | Stats overview |
| Students | `/admin/students.html` | Add/edit/delete students, ID card |
| Teachers | `/admin/teachers.html` | Add/edit/delete teachers |
| Attendance | `/admin/attendance.html` | Mark daily attendance |
| Fees | `/admin/fees.html` | Manage fees, mark payment, receipt |
| Results | `/admin/results.html` | Add/edit exam results |
| Notices | `/admin/notices.html` | Post announcements |
| Timetable | `/admin/timetable.html` | Edit weekly schedule per class |
| Exams | `/admin/exams.html` | Schedule exams, send reminders |
| Gallery | `/admin/gallery.html` | Upload gallery photos |
| WhatsApp | `/admin/whatsapp.html` | Connect WhatsApp, broadcast, queue |

### Teacher Pages
| Page | URL | Description |
|---|---|---|
| Dashboard | `/teacher/dashboard.html` | Summary for their classes |
| Attendance | `/teacher/attendance.html` | Mark attendance for their class |
| Results | `/teacher/results.html` | Add results for their class |
| Timetable | `/teacher/timetable.html` | View class timetable (read-only) |
| Exams | `/teacher/exams.html` | View exam schedule (read-only) |

### Student Pages
| Page | URL | Description |
|---|---|---|
| Dashboard | `/student/dashboard.html` | Overview |
| Attendance | `/student/attendance.html` | Own attendance records |
| Fees | `/student/fees.html` | Own fee records |
| Results | `/student/results.html` | Own exam results |
| Timetable | `/student/timetable.html` | Class timetable (today highlighted) |
| Exams | `/student/exams.html` | Upcoming/past exams with countdown |

### Parent Pages
| Page | URL | Description |
|---|---|---|
| Dashboard | `/parent/dashboard.html` | Child's overview |
| Timetable | `/parent/timetable.html` | Child's class timetable |
| Exams | `/parent/exams.html` | Child's upcoming exams |

---

## 15. Security

### Authentication
- JWT tokens stored in **httpOnly cookies** — not accessible to JavaScript, prevents XSS token theft
- `secure` flag set in production (HTTPS only)
- `sameSite: strict` — prevents CSRF attacks
- Token expiry: 7 days (configurable via `JWT_EXPIRE`)
- Passwords hashed with **bcryptjs** (salt rounds: 10)

### Authorization
- Every protected route checks JWT via `protect` middleware
- Role checks via `authorize(...roles)` middleware
- Students and parents can only access their own data — checked by comparing `req.user.roleId` to the resource's `studentId`
- Teachers can only manage data for their assigned classes

### Rate Limiting
- Auth endpoints: 15 requests per 15 minutes
- General API: 300 requests per minute
- `trust proxy: 1` set for accurate IP detection behind Nginx

### Input Validation
- Mongoose schema validation on all models
- Multer file type and size limits (2MB max, images only for photos)

### File Uploads
- Photos stored outside web root (`/app/uploads/photos/`)
- Served via backend route (cannot be browsed directly)
- Auto-compressed with sharp (max 800px width, 80% JPEG quality)

---

## 16. Troubleshooting

### App not starting

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs mongodb
```

### MongoDB connection failed

- Ensure `MONGODB_URI` is set correctly in `.env`
- In Docker: use `mongodb://mongodb:27017/schoolmanagement` (service name, not localhost)
- Check MongoDB container is healthy: `docker-compose ps`

### Cannot login (invalid credentials)

- Run seed script to create admin: `docker exec school-backend node seed.js`
- Default: `admin@school.com` / `admin123`
- If locked out: use admin recovery endpoint with `ADMIN_RECOVERY_SECRET`

### WhatsApp QR not appearing

- WhatsApp needs ~10-15 seconds to initialize
- Click "Refresh" after waiting
- Check backend logs: `docker-compose logs -f backend`
- If session is corrupted: `docker-compose down`, remove `whatsapp_session` volume, restart

### "No parent phones found" error when sending reminder

- The students in that class have no phone number saved
- Go to Students, edit each student, and add `Parent Phone` number
- Phone format: `9876543210` (10 digits, no spaces or country code)

### Rate limit error (429)

- You've exceeded 300 requests/minute from the same IP
- Wait 1 minute and try again
- Normal usage should never hit this limit

### Uploads not persisting after rebuild

- Upload data is stored in the `uploads_data` Docker volume
- Use `docker-compose down` (not `docker-compose down -v`) to preserve volumes
- The `-v` flag deletes volumes and all uploaded files

### PDF download not working

- Ensure the backend is running and healthy
- Check backend logs for pdfkit errors
- For ID card: make sure the student record exists and is populated

---

## Appendix: Auto-Generated ID Formats

| Type | Format | Example |
|---|---|---|
| Student ID | STU + 4 digits | STU0001 |
| Teacher ID | TCH + 3 digits | TCH001 |
| Fee Receipt | RCP + 6 digits | RCP000001 |

---

## Production Deployment Checklist

Complete this checklist before handing over to a client or going live.

### Step 1 — Configure `.env`

```env
# Generate a fresh secret — never use the placeholder value
JWT_SECRET=<node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">

# Memorable phrase — used only for admin password recovery
ADMIN_RECOVERY_SECRET=SomethingOnlyYouKnow

# Must match the actual server IP or domain
FRONTEND_URL=http://152.67.x.x      # or https://yourdomain.com

# School branding (appears in PDFs and WhatsApp messages)
SCHOOL_NAME=Your School Name
SCHOOL_EMAIL=admin@yourschool.com
```

### Step 2 — Deploy

```bash
git clone https://github.com/ckmine11/school-management-Dr.git
cd school-management-Dr
cp .env.example .env
nano .env          # fill in real values from Step 1
docker-compose up -d --build
```

Wait ~60 seconds for all three containers to pass their health checks:
```bash
docker-compose ps   # all should show "healthy" or "running"
```

### Step 3 — Seed Admin (first time only)

```bash
docker exec school-backend node seed.js
```

The seed script creates the admin account only if no admin exists — it will **not** overwrite data if run again later.

### Step 4 — Open Firewall Port

On Oracle Cloud (or any VPS), open port **80** in the Security List / firewall rules. Port 5000 should remain closed to the public — all traffic goes through Nginx on port 80.

### Step 5 — First Login

1. Open `http://YOUR_SERVER_IP/login.html`
2. Login: `admin@school.com` / `admin123`
3. **Change the admin password immediately**
4. Update school name and email in Settings if needed

### Step 6 — Connect WhatsApp

1. Go to **Admin → WhatsApp Setup**
2. Click **Connect WhatsApp**
3. Scan QR code with the school's WhatsApp number
4. Wait for **Connected ✓** status

### Step 7 — Add Real Data

1. **Students** → Add all students (parent phone numbers are critical for WhatsApp notifications)
2. **Teachers** → Add all teachers with their assigned classes
3. **Timetable** → Set up weekly schedule for each class
4. **Exam Schedule** → Add upcoming exams

---

### Production Readiness Summary

| Component | Status | Notes |
|---|---|---|
| Docker Compose | ✅ Ready | 3 containers, healthchecks, named volumes |
| JWT Authentication | ✅ Ready | httpOnly cookies, `secure` flag in production |
| Password Hashing | ✅ Ready | bcryptjs, 10 salt rounds |
| Role-Based Access | ✅ Ready | 4 roles, scope-enforced on every endpoint |
| Rate Limiting | ✅ Ready | Auth: 15 req/15min, API: 300 req/min |
| CORS | ✅ Ready | Whitelist only — blocks unknown origins |
| Nginx Reverse Proxy | ✅ Ready | Gzip, security headers, 100MB upload limit |
| WhatsApp Queue | ✅ Ready | MongoDB-backed, survives server restarts |
| Exam Auto-Reminders | ✅ Ready | Cron at 8:00 AM IST daily |
| PDF Generation | ✅ Ready | Fee receipts + Student ID cards |
| Mobile Responsive | ✅ Ready | Works on phones and desktops |
| Data Safety | ✅ Ready | seed.js skips if data already exists |
| Upload Storage | ✅ Ready | Persistent Docker volume, not lost on rebuild |
| Session Storage | ✅ Ready | WhatsApp session in Docker volume |

---

---

## Scaling, Backup & High Availability

See [SCALING.md](SCALING.md) for the complete guide. Quick summary:

### Keep App Always Running

Run once after deploying on server:
```bash
sudo bash scripts/setup-server.sh
```

This sets up:
- Docker auto-start on every server reboot
- App auto-restart within 15 seconds after a crash
- Daily database backup at 2:00 AM
- Health check every 5 minutes — auto-restarts containers if API fails
- Log rotation (14 days kept, older deleted automatically)

### Daily Backup

```bash
# Manual backup anytime
bash scripts/backup.sh

# Restore from a backup
bash scripts/restore.sh 2026-05-26_02-00

# View backup logs
tail -f /home/ubuntu/logs/backup.log
```

Backups are stored in `/home/ubuntu/backups/school-db/` — last 7 days kept automatically.

### DB Scaling

Single-node MongoDB handles up to approximately 10,000 students comfortably. For larger scale, see [SCALING.md — DB Scaling](SCALING.md) for MongoDB Atlas and multi-VM options.

---

*For issues or support, check the GitHub repository: https://github.com/ckmine11/school-management-Dr*
