const express = require('express');
const ptp = require('pdf-to-printer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '30mb' }));

app.post('/print', async (req, res) => {
    try {
        const { base64Pdf } = req.body;
        const filePath = path.join(__dirname, 'temp_print.pdf');

        // บันทึกไฟล์ PDF ชั่วคราว
        fs.writeFileSync(filePath, base64Pdf, 'base64');

        // สั่งปริ้นไปยังเครื่องพิมพ์ชื่อ XP-80C (แก้ชื่อให้ตรงกับในเครื่องคุณ)
        await ptp.print(filePath, {
            printer: "XP-80C",
            orientation: "portrait",
            monochrome: true,
            scale: "fit"
        });

        res.send({ status: "Success" });
    } catch (error) {
        res.status(500).send({ status: "Error", message: error.message });
    }
});

app.listen(3003, () => console.log('Print Server running on port 3003'));