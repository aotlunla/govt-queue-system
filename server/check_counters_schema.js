const db = require('./config/db');
const dotenv = require('dotenv');
dotenv.config();

async function checkCountersSchema() {
    try {
        const [rows] = await db.query('DESCRIBE counters');
        console.log(rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCountersSchema();
