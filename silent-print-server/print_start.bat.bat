@echo off
echo Starting Govt Queue System...

:: เข้าไปที่ path ของโปรเจค (แก้ path ให้ตรงกับเครื่องคุณ)
cd /d "D:\govt-queue-system\silent-print-server"

:: รันคำสั่ง
node server.js

:: คำสั่งนี้ช่วยให้หน้าต่างไม่ปิดทันทีถ้ามี error (เพื่อให้เราอ่าน log ได้)
cmd /k