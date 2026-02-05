const db = require('./config/db');

async function checkLatestQueue() {
    try {
        const [rows] = await db.query('SELECT * FROM queues ORDER BY id DESC LIMIT 1');
        if (rows.length > 0) {
            const q = rows[0];
            console.log('Latest Queue:', q);
            console.log('Created At (Local):', new Date(q.created_at).toLocaleString());
            console.log('Created At (UTC):', new Date(q.created_at).toISOString());

            // Test the query used in tracking
            const queueNum = q.queue_number;
            const date = new Date(q.created_at);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const trackingDate = `${year}-${month}-${day}`;

            console.log(`Testing query with queue_number='${queueNum}' and date='${trackingDate}'`);

            const [match] = await db.query(`
        SELECT * FROM queues q 
        WHERE q.queue_number = ? AND DATE(q.created_at) = ?
      `, [queueNum, trackingDate]);

            console.log('Match found:', match.length > 0);
        } else {
            console.log('No queues found.');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkLatestQueue();
