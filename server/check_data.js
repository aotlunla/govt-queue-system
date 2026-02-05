const db = require('./server/config/db');

async function checkData() {
    try {
        console.log('--- Departments ---');
        const [depts] = await db.query('SELECT * FROM departments');
        console.table(depts);

        console.log('\n--- Counters ---');
        const [counters] = await db.query('SELECT * FROM counters');
        console.table(counters);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
