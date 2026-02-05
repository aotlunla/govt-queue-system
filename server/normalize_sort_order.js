const db = require('./config/db');

async function normalizeTable(tableName) {
    console.log(`Normalizing ${tableName}...`);
    const [rows] = await db.query(`SELECT id FROM ${tableName} ORDER BY sort_order ASC, id ASC`);

    for (let i = 0; i < rows.length; i++) {
        const newOrder = i + 1;
        await db.query(`UPDATE ${tableName} SET sort_order = ? WHERE id = ?`, [newOrder, rows[i].id]);
    }
    console.log(`Normalized ${rows.length} items in ${tableName}.`);
}

async function run() {
    try {
        await normalizeTable('departments');
        await normalizeTable('queue_types');
        await normalizeTable('case_roles');
        console.log('All tables normalized successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();
