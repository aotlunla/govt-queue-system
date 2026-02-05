const db = require('./config/db');

async function migrateCounters() {
    try {
        console.log('Migrating counters table...');

        // Check columns
        const [rows] = await db.query('DESCRIBE counters');
        const columns = rows.map(r => r.Field);
        console.log('Current columns:', columns);

        if (!columns.includes('department_id')) {
            console.log('Adding department_id column...');
            await db.query('ALTER TABLE counters ADD COLUMN department_id INT DEFAULT NULL AFTER id');
        }

        if (!columns.includes('code')) {
            console.log('Adding code column...');
            await db.query('ALTER TABLE counters ADD COLUMN code VARCHAR(50) DEFAULT NULL AFTER name');
        }

        if (!columns.includes('sort_order')) {
            console.log('Adding sort_order column...');
            await db.query('ALTER TABLE counters ADD COLUMN sort_order INT DEFAULT 0');
        }

        console.log('Migration done.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

migrateCounters();
