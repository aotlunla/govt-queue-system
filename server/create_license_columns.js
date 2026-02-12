const db = require('./config/db');

async function addCol(table, colDef) {
    try {
        await db.query(`ALTER TABLE ${table} ADD COLUMN ${colDef}`);
        console.log(`✅ Added column: ${colDef.split(' ')[0]}`);
    } catch (err) {
        // Error 1060: Duplicate column name
        if (err.errno === 1060 || err.code === 'ER_DUP_FIELDNAME') {
            console.log(`ℹ️ Column ${colDef.split(' ')[0]} already exists.`);
        } else {
            console.error(`❌ Failed to add column ${colDef.split(' ')[0]}:`, err.message);
        }
    }
}

async function addLicenseColumns() {
    try {
        console.log('Adding license columns to system_settings...');

        await addCol('system_settings', 'serial_key VARCHAR(50) DEFAULT NULL');
        await addCol('system_settings', 'licensed_domain VARCHAR(255) DEFAULT NULL');
        await addCol('system_settings', 'license_activated_at TIMESTAMP NULL');

        console.log('✅ Migration completed!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

addLicenseColumns();
