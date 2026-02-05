const db = require('./config/db');
const dotenv = require('dotenv');
dotenv.config();

async function checkQueues() {
    try {
        console.log('Checking queues for today...');
        const [rows] = await db.query("SELECT * FROM queues WHERE DATE(created_at) = CURDATE()");
        console.log('Found queues:', rows.length);
        if (rows.length > 0) {
            console.log('Sample queue numbers:', rows.map(r => r.queue_number).join(', '));
        } else {
            console.log('No queues found for today.');
            // Check all time
            const [allRows] = await db.query("SELECT * FROM queues ORDER BY created_at DESC LIMIT 5");
            console.log('Recent queues (any date):', allRows.map(r => `${r.queue_number} (${r.created_at})`).join(', '));
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkQueues();
