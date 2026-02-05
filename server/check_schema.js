const db = require('./config/db');

async function checkSchema() {
    try {
        const [rows] = await db.query('DESCRIBE counters');
        console.log('Counters Table Schema:');
        console.table(rows);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkSchema();
