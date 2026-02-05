const db = require('./config/db');

async function createSettingsTable() {
    try {
        console.log('Checking system_settings table...');

        // Create table if not exists
        await db.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        agency_name VARCHAR(255) DEFAULT 'สำนักงานเทศบาลนครนนทบุรี',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        console.log('✅ Table system_settings created or already exists.');

        // Check if default row exists
        const [rows] = await db.query('SELECT * FROM system_settings LIMIT 1');
        if (rows.length === 0) {
            await db.query(`INSERT INTO system_settings (agency_name) VALUES ('สำนักงานเทศบาลนครนนทบุรี')`);
            console.log('✅ Default settings inserted.');
        } else {
            console.log('ℹ️ Settings already exist.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

createSettingsTable();
