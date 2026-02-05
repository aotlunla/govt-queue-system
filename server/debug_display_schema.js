const db = require('./config/db');

async function checkSchema() {
    try {
        console.log('Checking display_configs columns...');
        const [rows] = await db.query('DESCRIBE display_configs');
        console.log('Columns:', rows.map(r => r.Field).join(', '));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
