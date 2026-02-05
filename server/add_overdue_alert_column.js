const db = require('./config/db');

async function addOverdueAlertColumn() {
    try {
        console.log('Checking system_settings table for overdue_alert_minutes column...');

        // Check if column exists
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'system_settings' 
            AND COLUMN_NAME = 'overdue_alert_minutes'
        `);

        if (columns.length === 0) {
            console.log('Adding overdue_alert_minutes column...');
            await db.query(`
                ALTER TABLE system_settings 
                ADD COLUMN overdue_alert_minutes INT DEFAULT 0
            `);
            console.log('✅ Column overdue_alert_minutes added successfully.');
        } else {
            console.log('ℹ️ Column overdue_alert_minutes already exists.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

addOverdueAlertColumn();
