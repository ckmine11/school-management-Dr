# School Management System - Complete Access Guide

## 🎓 System Information
- **Name**: Bright Future School Management System
- **Status**: ✅ FULLY OPERATIONAL
- **Frontend**: http://localhost
- **Login Page**: http://localhost/login.html
- **API Base**: http://localhost/api

---

## 👤 User Accounts

### Account 1: Administrator
| Property | Value |
|----------|-------|
| **Role** | Admin |
| **Name** | School Admin |
| **Email** | admin@school.com |
| **Password** | admin123 |
| **Dashboard** | http://localhost/admin/dashboard.html |
| **Access** | Full system administration |

### Account 2: Teacher
| Property | Value |
|----------|-------|
| **Role** | Teacher |
| **Name** | Ramesh Kumar |
| **Email** | ramesh@school.com |
| **Password** | teacher123 |
| **Dashboard** | http://localhost/teacher/dashboard.html |
| **Subject** | Mathematics, Physics |
| **Experience** | 8 years |
| **Access** | Class management, attendance, grades |

### Account 3: Student
| Property | Value |
|----------|-------|
| **Role** | Student |
| **Name** | Arun Singh |
| **Email** | arun.singh.stu@school.com |
| **Password** | student123 |
| **Dashboard** | http://localhost/student/dashboard.html |
| **Class** | Class 10, Section A |
| **Roll No** | 01 |
| **Access** | View attendance, grades, fees |

### Account 4: Parent
| Property | Value |
|----------|-------|
| **Role** | Parent |
| **Name** | Suresh Singh (Parent) |
| **Email** | parent@school.com |
| **Password** | parent123 |
| **Dashboard** | http://localhost/parent/dashboard.html |
| **Child** | Arun Singh (Student) |
| **Access** | Monitor child's progress |

---

## 🌐 Available URLs

### Frontend Pages
| Page | URL |
|------|-----|
| **Home** | http://localhost/index.html |
| **Login** | http://localhost/login.html |
| **About** | http://localhost/about.html |
| **Admission** | http://localhost/admission.html |
| **Contact** | http://localhost/contact.html |
| **Gallery** | http://localhost/gallery.html |

### Admin Pages
| Page | URL |
|------|-----|
| **Dashboard** | http://localhost/admin/dashboard.html |
| **Students** | http://localhost/admin/students.html |
| **Teachers** | http://localhost/admin/teachers.html |
| **Attendance** | http://localhost/admin/attendance.html |
| **Fees** | http://localhost/admin/fees.html |
| **Results** | http://localhost/admin/results.html |
| **Notices** | http://localhost/admin/notices.html |

### Teacher Pages
| Page | URL |
|------|-----|
| **Dashboard** | http://localhost/teacher/dashboard.html |
| **Attendance** | http://localhost/teacher/attendance.html |
| **Results** | http://localhost/teacher/results.html |

### Student Pages
| Page | URL |
|------|-----|
| **Dashboard** | http://localhost/student/dashboard.html |
| **Attendance** | http://localhost/student/attendance.html |
| **Results** | http://localhost/student/results.html |
| **Fees** | http://localhost/student/fees.html |

### Parent Pages
| Page | URL |
|------|-----|
| **Dashboard** | http://localhost/parent/dashboard.html |

---

## 🔌 API Endpoints

### Authentication Endpoints
```
POST   /api/auth/login                     - Login (body: {email, password})
GET    /api/auth/me                        - Get current user (requires auth)
PUT    /api/auth/change-password           - Change password (requires auth)
```

### Students Endpoints
```
GET    /api/students                       - List all students
GET    /api/students/:id                   - Get student details
POST   /api/students                       - Create student (admin only)
PUT    /api/students/:id                   - Update student (admin only)
```

### Teachers Endpoints
```
GET    /api/teachers                       - List all teachers
GET    /api/teachers/:id                   - Get teacher details
POST   /api/teachers                       - Create teacher (admin only)
PUT    /api/teachers/:id                   - Update teacher (admin only)
```

### Attendance Endpoints
```
GET    /api/attendance                     - Get attendance records
POST   /api/attendance                     - Mark attendance (teacher/admin)
GET    /api/attendance/:id                 - Get attendance details
```

### Fees Endpoints
```
GET    /api/fees                           - Get fee records
POST   /api/fees                           - Create fee record (admin)
GET    /api/fees/:id                       - Get fee details
PUT    /api/fees/:id                       - Update fee record (admin)
```

### Results Endpoints
```
GET    /api/results                        - Get result records
POST   /api/results                        - Create result (teacher/admin)
GET    /api/results/:id                    - Get result details
PUT    /api/results/:id                    - Update result (teacher/admin)
```

### Notices Endpoints
```
GET    /api/notices                        - Get public notices
POST   /api/notices                        - Create notice (admin only)
GET    /api/notices/:id                    - Get notice details
DELETE /api/notices/:id                    - Delete notice (admin only)
```

### Dashboard Endpoints
```
GET    /api/dashboard/stats                - Get dashboard statistics (auth required)
```

---

## 🧪 Testing Tips

### Method 1: Browser
1. Open http://localhost/login.html
2. Select desired role from buttons
3. Enter credentials
4. Click "Sign In"

### Method 2: PowerShell (API Test)
```powershell
$body = @{email="admin@school.com";password="admin123"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body -UseBasicParsing `
  | Select-Object -ExpandProperty Content
```

### Method 3: Automated Tests
```powershell
powershell -ExecutionPolicy Bypass -File .\test-auth.ps1
```

---

## 📋 Key Features by Role

### Admin Capabilities
- ✅ Manage all users (students, teachers, parents)
- ✅ Create and edit student records
- ✅ Create and edit teacher records
- ✅ Manage fees and payments
- ✅ Create and announce notices
- ✅ View system statistics
- ✅ Manage attendance records
- ✅ View all results

### Teacher Capabilities
- ✅ Mark attendance for assigned classes
- ✅ Enter student results/grades
- ✅ View assigned class list
- ✅ View notices
- ✅ Change own password

### Student Capabilities
- ✅ View own attendance record
- ✅ View own grades/results
- ✅ View fees status
- ✅ View school notices
- ✅ Change own password

### Parent Capabilities
- ✅ View child's attendance
- ✅ View child's grades/results
- ✅ View child's fees status
- ✅ View school notices
- ✅ Change own password

---

## 🔐 Security Notes

- All passwords are securely hashed using bcryptjs
- JWT tokens expire after 7 days
- Tokens are stored in browser localStorage
- All API requests require Bearer token authentication
- Role-based access control is enforced
- Passwords are never sent in API responses

---

## 🆘 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **Cannot access http://localhost** | Ensure `docker compose up -d` is running |
| **Login returns 400 error** | Check if frontend container restarted after code changes |
| **"Invalid credentials" error** | Verify email and password match test accounts |
| **Token expired message** | Logout and login again to get new token |
| **Nginx 404 errors** | Check if frontend container is running: `docker compose ps` |

---

## 📞 Support Information

- **System**: School Management System v1.0
- **Technology Stack**: Node.js + Express + MongoDB + Nginx
- **Docker Compose**: Running on Docker Desktop
- **Status**: Production Ready ✅

---

**Last Updated**: May 22, 2026  
**Created by**: GitHub Copilot  
**Status**: FULLY FUNCTIONAL ✅
