// create_license_columns.js — Add license columns to system_settings
const db = require('./config/db');

async function addLicenseColumns() {
    try {
        console.log('Adding license columns to system_settings...');

        // Add serial_key column
        await db.query(`
            ALTER TABLE system_settings
            ADD COLUMN IF NOT EXISTS serial_key VARCHAR(50) DEFAULT NULL
        `).catch(() => {
            // Column might already exist
            console.log('ℹ️ serial_key column may already exist, skipping...');
        });

        // Add licensed_domain column
        await db.query(`
            ALTER TABLE system_settings
            ADD COLUMN IF NOT EXISTS licensed_domain VARCHAR(255) DEFAULT NULL
        `).catch(() => {
            console.log('ℹ️ licensed_domain column may already exist, skipping...');
        });

        // Add license_activated_at column
        await db.query(`
            ALTER TABLE system_settings
            ADD COLUMN IF NOT EXISTS license_activated_at TIMESTAMP NULL
        `).catch(() => {
            console.log('ℹ️ license_activated_at column may already exist, skipping...');
        });

        console.log('✅ License columns added successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

addLicenseColumns();
