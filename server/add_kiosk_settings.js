const db = require('./config/db');

async function addKioskSettings() {
    try {
        console.log('Checking system_settings table for kiosk_settings column...');

        const [columns] = await db.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'system_settings' 
            AND COLUMN_NAME = 'kiosk_settings'
        `);

        if (columns.length === 0) {
            console.log('Adding kiosk_settings column...');
            await db.query(`
                ALTER TABLE system_settings 
                ADD COLUMN kiosk_settings JSON DEFAULT NULL
            `);
            console.log('✅ kiosk_settings column added successfully.');
        } else {
            console.log('✅ kiosk_settings column already exists.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

addKioskSettings();
