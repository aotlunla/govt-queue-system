const db = require('./config/db');

async function checkCountersSchema() {
    try {
        console.log('Checking counters columns...');
        const [rows] = await db.query('DESCRIBE counters');
        console.log('Columns:', rows.map(r => r.Field).join(', '));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCountersSchema();
