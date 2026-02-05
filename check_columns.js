const db = require('./server/config/db');

async function check() {
    try {
        console.log('Checking queue_types columns...');
        const [qRows] = await db.query('SHOW COLUMNS FROM queue_types');
        console.log('queue_types columns:', qRows.map(r => r.Field).join(', '));

        console.log('Checking case_roles columns...');
        const [cRows] = await db.query('SHOW COLUMNS FROM case_roles');
        console.log('case_roles columns:', cRows.map(r => r.Field).join(', '));

        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

check();
