const db = require('./config/db');

async function addColumn() {
    try {
        console.log('Adding number column to counters table...');

        // Check if column exists first
        const [columns] = await db.query("SHOW COLUMNS FROM counters LIKE 'number'");
        if (columns.length > 0) {
            console.log('Column number already exists.');
        } else {
            await db.query("ALTER TABLE counters ADD COLUMN number VARCHAR(10) NOT NULL AFTER id");
            console.log('Column number added successfully.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

addColumn();
