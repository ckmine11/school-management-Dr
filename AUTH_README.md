# School Management System - Authentication Guide

## ✅ System Status
All authentication features are **fully functional**.

## 🚀 Getting Started

### 1. Start the Application
```bash
docker compose up -d
```

### 2. Access the Application
- **Frontend**: http://localhost
- **Login Page**: http://localhost/login.html
- **API Base**: http://localhost/api

## 👥 Available Test Accounts

### Admin
- **Email**: admin@school.com
- **Password**: admin123
- **Access**: Dashboard at `admin/dashboard.html`

### Teacher
- **Email**: ramesh@school.com
- **Password**: teacher123
- **Access**: Dashboard at `teacher/dashboard.html`

### Student
- **Email**: arun.singh.stu@school.com
- **Password**: student123
- **Access**: Dashboard at `student/dashboard.html`

### Parent
- **Email**: parent@school.com
- **Password**: parent123
- **Access**: Dashboard at `parent/dashboard.html`

## 🔐 Authentication Flow

1. User enters email and password on login page
2. Frontend sends POST request to `/api/auth/login`
3. Backend validates credentials against MongoDB
4. On success, returns JWT token and user info
5. Token is stored in localStorage
6. Frontend redirects to role-specific dashboard
7. All subsequent requests include Bearer token in Authorization header

## 📋 API Endpoints

### Authentication
```
POST   /api/auth/login              - Login with email/password
GET    /api/auth/me                 - Get current user (requires auth)
PUT    /api/auth/change-password    - Change password (requires auth)
```

### Students
```
GET    /api/students               - List all students (requires auth)
POST   /api/students               - Create student (admin only)
GET    /api/students/:id           - Get student details
PUT    /api/students/:id           - Update student (admin only)
```

### Teachers
```
GET    /api/teachers               - List all teachers (requires auth)
POST   /api/teachers               - Create teacher (admin only)
GET    /api/teachers/:id           - Get teacher details
PUT    /api/teachers/:id           - Update teacher (admin only)
```

### Attendance
```
GET    /api/attendance             - Get attendance records
POST   /api/attendance             - Mark attendance (teacher/admin)
```

### Fees
```
GET    /api/fees                   - Get fee records
POST   /api/fees                   - Create fee record (admin only)
```

### Results
```
GET    /api/results                - Get result records
POST   /api/results                - Create result (teacher/admin)
```

### Notices
```
GET    /api/notices                - Get public notices
POST   /api/notices                - Create notice (admin only)
```

### Dashboard
```
GET    /api/dashboard/stats        - Get dashboard statistics (auth required)
```

## 🧪 Testing Authentication

Run the automated test script:
```powershell
powershell -ExecutionPolicy Bypass -File .\test-auth.ps1
```

Expected output:
```
✅ Admin login successful
✅ Teacher login successful
✅ Student login successful
✅ Parent login successful

🎉 All authentication tests passed!
```

## 🐳 Docker Services

### MongoDB (school-mongodb)
- **Port**: 27017
- **Database**: schoolmanagement
- **Health Check**: MongoDB admin command ping

### Backend (school-backend)
- **Port**: 5000
- **Health Check**: HTTP GET /api/health
- **Depends on**: MongoDB

### Frontend (school-frontend)
- **Port**: 80
- **Technology**: Nginx
- **Proxies API requests to backend**

## 🔧 Troubleshooting

### Login Returns 400 Bad Request
- ✅ **Fixed** - Updated api.js to properly handle Content-Type headers
- Ensure frontend container has been restarted after code changes

### Cannot access http://localhost
- Verify `docker compose ps` shows all containers running
- Check `docker compose logs frontend` for nginx errors

### Database connection failed
- Ensure MongoDB container is healthy: `docker compose ps | grep mongodb`
- Check `docker compose logs mongodb` for initialization errors

### Token expired
- Default token expiration: 7 days
- Use `/api/auth/change-password` to refresh session

## 📝 Session Management

### Token Storage
- Tokens are stored in `localStorage` as key `token`
- User data stored in `localStorage` as key `user` (JSON)

### Token Removal
- Logout removes both `token` and `user` from localStorage
- Redirects to login page

### Authorization Header
All authenticated requests include:
```
Authorization: Bearer <token>
```

## 🎯 Features by Role

### Admin
- View all users, students, teachers
- Manage fees and attendance
- Create notices and announcements
- View system statistics

### Teacher
- View assigned classes
- Mark attendance
- Enter student results
- View notices

### Student
- View personal attendance
- View academic results
- View fees status
- View school notices

### Parent
- View child's attendance
- View child's results
- View child's fees status
- View school notices

## 📞 Support
For issues or questions, check logs:
```bash
docker compose logs backend     # Backend logs
docker compose logs frontend    # Frontend logs
docker compose logs mongodb     # Database logs
```
