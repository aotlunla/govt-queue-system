const db = require('./config/db');

async function addAnnouncementColumns() {
    try {
        console.log('Checking for announcement columns in system_settings...');

        const columns = [
            "ADD COLUMN announcement_text TEXT DEFAULT NULL",
            "ADD COLUMN announcement_start DATETIME DEFAULT NULL",
            "ADD COLUMN announcement_end DATETIME DEFAULT NULL",
            "ADD COLUMN announcement_active BOOLEAN DEFAULT 0"
        ];

        for (const col of columns) {
            try {
                await db.query(`ALTER TABLE system_settings ${col}`);
                console.log(`✅ Added: ${col}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`ℹ️ Column already exists: ${col}`);
                } else {
                    console.error(`❌ Error adding column: ${col}`, err);
                }
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

addAnnouncementColumns();
