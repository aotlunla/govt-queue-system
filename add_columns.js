const db = require('./server/config/db');

async function migrate() {
    try {
        console.log('Adding sort_order to queue_types...');
        try {
            await db.query('ALTER TABLE queue_types ADD COLUMN sort_order INT DEFAULT 0');
            console.log('Success: Added sort_order to queue_types');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Skipped: sort_order already exists in queue_types');
            } else {
                console.error('Error altering queue_types:', err.message);
            }
        }

        console.log('Adding sort_order to case_roles...');
        try {
            await db.query('ALTER TABLE case_roles ADD COLUMN sort_order INT DEFAULT 0');
            console.log('Success: Added sort_order to case_roles');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Skipped: sort_order already exists in case_roles');
            } else {
                console.error('Error altering case_roles:', err.message);
            }
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
