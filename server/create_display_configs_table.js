const db = require('./config/db');

async function createDisplayConfigsTable() {
    try {
        console.log('Checking display_configs table...');

        // Create table if not exists
        await db.query(`
      CREATE TABLE IF NOT EXISTS display_configs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        config JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        console.log('✅ Table display_configs created or already exists.');

        // Check if default row exists
        const [rows] = await db.query('SELECT * FROM display_configs LIMIT 1');
        if (rows.length === 0) {
            const defaultConfig = {
                departments: [], // Empty means all
                statuses: ['WAITING', 'PROCESSING'],
                show_queue_number: true,
                show_service_channel: true,
                show_waiting_count: true
            };

            await db.query(
                `INSERT INTO display_configs (name, config, is_active) VALUES (?, ?, ?)`,
                ['จอแสดงผลหลัก (Main Display)', JSON.stringify(defaultConfig), true]
            );
            console.log('✅ Default display config inserted.');
        } else {
            console.log('ℹ️ Display configs already exist.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

createDisplayConfigsTable();
