const db = require('./config/db');

async function testCounters() {
    try {
        console.log('Testing GET /counters...');
        // Simulate the query used in adminRoutes.js
        const department_id = 2;
        let sql = 'SELECT * FROM counters WHERE is_active = 1';
        const params = [];
        if (department_id) {
            sql += ' AND department_id = ?';
            params.push(department_id);
        }
        sql += ' ORDER BY number';

        const [rows] = await db.query(sql, params);
        console.log('Success! Rows found:', rows.length);
        console.table(rows);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

testCounters();
