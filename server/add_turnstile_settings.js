const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });
const db = require('./config/db');

async function migrate() {
    try {
        console.log('Migrating database...');

        // Add turnstile_site_key
        try {
            await db.query(`
                ALTER TABLE system_settings 
                ADD COLUMN turnstile_site_key VARCHAR(255) NULL AFTER kiosk_settings
            `);
            console.log('Added turnstile_site_key column');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('turnstile_site_key already exists');
            } else {
                throw err;
            }
        }

        // Add turnstile_secret_key
        try {
            await db.query(`
                ALTER TABLE system_settings 
                ADD COLUMN turnstile_secret_key VARCHAR(255) NULL AFTER turnstile_site_key
            `);
            console.log('Added turnstile_secret_key column');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('turnstile_secret_key already exists');
            } else {
                throw err;
            }
        }

        console.log('Migration complete');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
