const db = require('./config/db');

async function migrate() {
    try {
        console.log('Migrating display_configs table...');

        // Check columns
        const [rows] = await db.query('DESCRIBE display_configs');
        const columns = rows.map(r => r.Field);
        console.log('Current columns:', columns);

        if (!columns.includes('config')) {
            console.log('Adding config column...');
            await db.query('ALTER TABLE display_configs ADD COLUMN config JSON AFTER name');
        }

        if (columns.includes('type')) {
            // We can drop or keep it. Let's keep for now to avoid data loss if needed, but we won't use it.
            console.log('Column "type" exists (will be ignored)');
        }

        console.log('Migration done.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

migrate();
