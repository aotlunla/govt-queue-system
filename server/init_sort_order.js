const db = require('./config/db');

async function initSortOrder() {
    try {
        console.log('Initializing sort_order for queue_types...');
        await db.query('UPDATE queue_types SET sort_order = id WHERE sort_order = 0');
        console.log('Done.');

        console.log('Initializing sort_order for case_roles...');
        await db.query('UPDATE case_roles SET sort_order = id WHERE sort_order = 0');
        console.log('Done.');

        process.exit(0);
    } catch (err) {
        console.error('Init failed:', err);
        process.exit(1);
    }
}

initSortOrder();
