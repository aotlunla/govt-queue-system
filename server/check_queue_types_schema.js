const db = require('./config/db');
const dotenv = require('dotenv');
dotenv.config();

async function checkQueueTypesSchema() {
    try {
        const [rows] = await db.query('DESCRIBE queue_types');
        console.log(rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkQueueTypesSchema();
