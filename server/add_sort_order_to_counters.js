const db = require('./config/db');
const dotenv = require('dotenv');
dotenv.config();

async function addSortOrderToCounters() {
    try {
        console.log('Checking counters table for sort_order column...');
        const [columns] = await db.query("SHOW COLUMNS FROM counters LIKE 'sort_order'");

        if (columns.length === 0) {
            console.log('Adding sort_order column...');
            await db.query("ALTER TABLE counters ADD COLUMN sort_order INT DEFAULT 0");

            // Initialize sort_order based on id
            console.log('Initializing sort_order values...');
            await db.query("SET @rank = 0;");
            await db.query("UPDATE counters SET sort_order = (@rank := @rank + 1) ORDER BY id;");

            console.log('✅ Column sort_order added and initialized successfully.');
        } else {
            console.log('ℹ️ Column sort_order already exists.');
        }
        process.exit(0);
    } catch (err) {
        console.error('❌ Error adding column:', err);
        process.exit(1);
    }
}

addSortOrderToCounters();
