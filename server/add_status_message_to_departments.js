const db = require('./config/db');

async function addStatusMessageColumn() {
    try {
        console.log('Checking departments table...');

        // Check if column exists
        const [columns] = await db.query(`SHOW COLUMNS FROM departments LIKE 'status_message'`);

        if (columns.length === 0) {
            console.log('Adding status_message column...');
            await db.query(`ALTER TABLE departments ADD COLUMN status_message VARCHAR(255) DEFAULT NULL AFTER code`);
            console.log('✅ Column status_message added.');
        } else {
            console.log('ℹ️ Column status_message already exists.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

addStatusMessageColumn();
