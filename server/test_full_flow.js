const db = require('./config/db');

async function testFullFlow() {
    try {
        console.log('--- 1. Fetch Initial ---');
        const [initial] = await db.query('SELECT id, name, sort_order FROM queue_types WHERE is_active = 1 ORDER BY sort_order');
        console.table(initial);

        if (initial.length < 2) {
            console.log('Not enough items');
            process.exit(0);
        }

        // Simulate Frontend Logic: Swap index 0 and 1
        const items = [...initial];
        const [moved] = items.splice(0, 1); // Remove first
        items.splice(1, 0, moved); // Insert at index 1 (swap)

        // Assign new sort_order
        const payloadItems = items.map((item, index) => ({
            id: item.id,
            sort_order: index + 1
        }));

        console.log('--- 2. Sending Reorder Payload ---');
        console.log(payloadItems);

        // Simulate Route Handler Logic (Bulk Update)
        let sql = 'UPDATE queue_types SET sort_order = CASE id ';
        const ids = [];
        const params = [];

        payloadItems.forEach(item => {
            sql += 'WHEN ? THEN ? ';
            params.push(item.id, item.sort_order);
            ids.push(item.id);
        });

        sql += 'END WHERE id IN (?)';
        params.push(ids);

        console.log('Executing Bulk SQL:', sql);
        const [result] = await db.query(sql, params);
        console.log(`Bulk update completed. Affected: ${result.affectedRows}`);

        console.log('--- 3. Fetch After Update ---');
        const [after] = await db.query('SELECT id, name, sort_order FROM queue_types WHERE is_active = 1 ORDER BY sort_order');
        console.table(after);

        // Verification
        const firstIdAfter = after[0].id;
        const expectedFirstId = payloadItems[0].id;

        if (firstIdAfter === expectedFirstId) {
            console.log('✅ SUCCESS: Order persisted correctly.');
        } else {
            console.log('❌ FAILED: Order did not persist.');
            console.log(`Expected first ID: ${expectedFirstId}, Got: ${firstIdAfter}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
}

testFullFlow();
