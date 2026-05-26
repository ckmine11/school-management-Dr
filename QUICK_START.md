# 🚀 QUICK START GUIDE

## Start Application
```powershell
cd c:\Users\Joy\Desktop\school-management
docker compose up -d
```

## Access System
```
http://localhost/login.html
```

## Test Logins

### Admin
```
Email: admin@school.com
Pass:  admin123
```

### Teacher
```
Email: ramesh@school.com
Pass:  teacher123
```

### Student
```
Email: arun.singh.stu@school.com
Pass:  student123
```

### Parent
```
Email: parent@school.com
Pass:  parent123
```

## View Logs
```powershell
docker compose logs backend -f      # Backend
docker compose logs frontend -f     # Frontend
docker compose logs mongodb -f      # Database
```

## Stop Application
```powershell
docker compose down
```

## Check Status
```powershell
docker compose ps
```

## Run Tests
```powershell
powershell -ExecutionPolicy Bypass -File .\test-auth.ps1
```

---

**✅ System is FULLY FUNCTIONAL - Ready to use!**
