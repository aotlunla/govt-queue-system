const db = require('./config/db');

const API_URL = 'http://localhost:5000/api/queues';

async function testDashboardLogic() {
    try {
        console.log('Testing Dashboard Logic...');

        // 1. Test Stats Endpoint
        console.log('1. Testing GET /stats/dashboard...');
        const statsRes = await fetch(`${API_URL}/stats/dashboard`);
        if (statsRes.ok) {
            const stats = await statsRes.json();
            console.log('✅ Stats fetched:', stats);
            if (stats.total !== undefined && stats.waiting !== undefined) {
                console.log('✅ Stats structure is correct.');
            } else {
                console.error('❌ Stats structure is invalid.');
            }
        } else {
            console.error(`❌ Failed to fetch stats: ${statsRes.status}`);
        }

        // 2. Test Auto-Cancel Logic
        console.log('\n2. Testing Auto-Cancel Logic...');

        // 2.1 Insert an old queue (yesterday)
        const [type] = await db.query('SELECT id FROM queue_types LIMIT 1');
        const typeId = type[0].id;

        const [insert] = await db.query(`
            INSERT INTO queues (queue_number, type_id, status, created_at, updated_at) 
            VALUES ('TEST-OLD', ?, 'WAITING', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY))
        `, [typeId]);
        const queueId = insert.insertId;
        console.log(`   Inserted old queue ID ${queueId} (WAITING, Yesterday)`);

        // 2.2 Call GET / (Workstation List) - This should trigger auto-cancel
        console.log('   Calling GET / (Workstation List)...');
        await fetch(`${API_URL}/`);

        // 2.3 Check status
        const [check] = await db.query('SELECT status FROM queues WHERE id = ?', [queueId]);
        const status = check[0].status;

        if (status === 'CANCELLED') {
            console.log(`✅ Success: Queue ${queueId} was auto-cancelled.`);
        } else {
            console.error(`❌ Failed: Queue ${queueId} status is ${status} (Expected CANCELLED).`);
        }

        // Cleanup
        await db.query('DELETE FROM queues WHERE id = ?', [queueId]);

        process.exit(0);
    } catch (err) {
        console.error('Test script error:', err);
        process.exit(1);
    }
}

testDashboardLogic();
