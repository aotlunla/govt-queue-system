// generate_serial.js — Generate a unique serial key for licensing
// Usage: node generate_serial.js
// Output: A serial key in XXXX-XXXX-XXXX-XXXX format

const crypto = require('crypto');

function generateSerial() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
    const segments = [];

    for (let s = 0; s < 4; s++) {
        let segment = '';
        for (let i = 0; i < 4; i++) {
            const randomIndex = crypto.randomInt(0, chars.length);
            segment += chars[randomIndex];
        }
        segments.push(segment);
    }

    return segments.join('-');
}

// Generate and display
const serial = generateSerial();
console.log('');
console.log('╔══════════════════════════════════════════╗');
console.log('║       LED Smart Queue - Serial Key       ║');
console.log('╠══════════════════════════════════════════╣');
console.log(`║   🔑  ${serial}              ║`);
console.log('╠══════════════════════════════════════════╣');
console.log('║   ส่งรหัสนี้ให้ลูกค้าเพื่อเปิดใช้งาน       ║');
console.log('╚══════════════════════════════════════════╝');
console.log('');
