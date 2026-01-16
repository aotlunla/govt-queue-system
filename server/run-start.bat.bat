@echo off
echo Starting Govt Queue System...

:: เข้าไปที่ path ของโปรเจค (แก้ path ให้ตรงกับเครื่องคุณ)
cd /d "C:\Users\frontnonthaburi\govt-queue-system\server"

:: รันคำสั่ง
npm run start

:: คำสั่งนี้ช่วยให้หน้าต่างไม่ปิดทันทีถ้ามี error (เพื่อให้เราอ่าน log ได้)
cmd /k