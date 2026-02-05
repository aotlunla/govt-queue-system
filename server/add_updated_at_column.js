const db = require('./config/db');
const dotenv = require('dotenv');
dotenv.config();

async function addUpdatedAtColumn() {
    try {
        console.log('Checking system_settings table for updated_at column...');
        const [columns] = await db.query("SHOW COLUMNS FROM system_settings LIKE 'updated_at'");

        if (columns.length === 0) {
            console.log('Adding updated_at column...');
            await db.query("ALTER TABLE system_settings ADD COLUMN updated_at DATETIME DEFAULT NULL");
            console.log('✅ Column updated_at added successfully.');
        } else {
            console.log('ℹ️ Column updated_at already exists.');
        }
        process.exit(0);
    } catch (err) {
        console.error('❌ Error adding column:', err);
        process.exit(1);
    }
}

addUpdatedAtColumn();
