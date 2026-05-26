# Authentication Testing Script
# Tests all user roles and authentication flows

Write-Host "=== School Management System - Authentication Test ===" -ForegroundColor Cyan

$testCases = @(
    @{ email = "admin@school.com"; password = "admin123"; role = "admin"; name = "Admin" },
    @{ email = "ramesh@school.com"; password = "teacher123"; role = "teacher"; name = "Teacher" },
    @{ email = "arun.singh.stu@school.com"; password = "student123"; role = "student"; name = "Student" },
    @{ email = "parent@school.com"; password = "parent123"; role = "parent"; name = "Parent" }
)

$baseUrl = "http://localhost/api"
$successCount = 0
$failCount = 0

foreach ($test in $testCases) {
    Write-Host "`nTesting $($test.name) Login..." -ForegroundColor Yellow
    
    try {
        $body = @{
            email = $test.email
            password = $test.password
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" `
            -Method Post `
            -ContentType "application/json" `
            -Body $body `
            -UseBasicParsing
        
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.success -and $data.user.role -eq $test.role) {
            Write-Host "✅ $($test.name) login successful" -ForegroundColor Green
            Write-Host "   Email: $($data.user.email)" -ForegroundColor Green
            Write-Host "   Role: $($data.user.role)" -ForegroundColor Green
            Write-Host "   Token: $($data.token.Substring(0, 20))..." -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "❌ $($test.name) login failed - role mismatch" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "❌ $($test.name) login error: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "✅ Passed: $successCount" -ForegroundColor Green
Write-Host "❌ Failed: $failCount" -ForegroundColor Red

if ($failCount -eq 0) {
    Write-Host "`n🎉 All authentication tests passed!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some tests failed. Check the output above." -ForegroundColor Yellow
}
