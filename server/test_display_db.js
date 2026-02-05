const db = require('./config/db');

async function testDB() {
    try {
        console.log('Testing INSERT...');
        const config = { departments: [1, 2], statuses: ['WAITING'] };
        const [res] = await db.query(
            'INSERT INTO display_configs (name, config, is_active) VALUES (?, ?, ?)',
            ['Test Display', JSON.stringify(config), true]
        );
        console.log('INSERT Success, ID:', res.insertId);

        console.log('Testing UPDATE...');
        await db.query(
            'UPDATE display_configs SET name=?, config=?, is_active=? WHERE id=?',
            ['Updated Display', JSON.stringify(config), false, res.insertId]
        );
        console.log('UPDATE Success');

        console.log('Testing DELETE...');
        await db.query('DELETE FROM display_configs WHERE id = ?', [res.insertId]);
        console.log('DELETE Success');

        process.exit(0);
    } catch (err) {
        console.error('DB Operation Failed:', err);
        process.exit(1);
    }
}

testDB();
