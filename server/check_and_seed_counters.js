const db = require('./config/db');

async function checkAndSeedCounters() {
    try {
        console.log('Checking counters...');
        const [rows] = await db.query('SELECT * FROM counters');
        console.log('Existing counters:', rows);

        if (rows.length === 0) {
            console.log('No counters found. Seeding default counters...');
            await db.query(`
        INSERT INTO counters (name, is_active) VALUES 
        ('ช่อง 1', 1),
        ('ช่อง 2', 1),
        ('ช่อง 3', 1)
      `);
            console.log('✅ Default counters seeded.');
        } else {
            console.log('✅ Counters already exist.');
        }
        await db.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

checkAndSeedCounters();
