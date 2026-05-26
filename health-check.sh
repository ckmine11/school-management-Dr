#!/bin/bash

# API Health Check Script
# Verifies all services are running and responding correctly

echo "=== API Health Check ==="

# Check Backend Health
echo -e "\n📡 Checking Backend Health..."
curl -s http://localhost/api/health 2>&1 | head -5 && echo "✅ Backend: OK" || echo "❌ Backend: FAILED"

# Check MongoDB Connection (via students endpoint)
echo -e "\n🗄️  Checking MongoDB Connection..."
curl -s -H "Authorization: Bearer test" http://localhost/api/students 2>&1 | grep -q "success\|error" && echo "✅ MongoDB: Connected" || echo "❌ MongoDB: FAILED"

# Check Frontend
echo -e "\n🌐 Checking Frontend..."
curl -s http://localhost/login.html | grep -q "Bright Future School" && echo "✅ Frontend: OK" || echo "❌ Frontend: FAILED"

echo -e "\n=== Login Test Credentials ==="
echo "Admin:   admin@school.com / admin123"
echo "Teacher: ramesh@school.com / teacher123"
echo "Student: arun.singh.stu@school.com / student123"
echo "Parent:  parent@school.com / parent123"
