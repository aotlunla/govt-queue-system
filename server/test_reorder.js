const db = require('./config/db');

async function testReorder() {
    try {
        console.log('--- Initial State ---');
        const [initial] = await db.query('SELECT id, name, sort_order FROM queue_types ORDER BY sort_order');
        console.table(initial);

        // Simulate reorder: Reverse the order of the first two items
        if (initial.length < 2) {
            console.log('Not enough items to test reorder');
            process.exit(0);
        }

        const item1 = initial[0];
        const item2 = initial[1];

        console.log(`Swapping ${item1.name} (id: ${item1.id}) and ${item2.name} (id: ${item2.id})`);

        const updates = [
            { id: item1.id, sort_order: 2 },
            { id: item2.id, sort_order: 1 }
        ];

        console.log('Sending updates:', updates);

        for (const item of updates) {
            await db.query('UPDATE queue_types SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
        }

        console.log('--- After Update ---');
        const [after] = await db.query('SELECT id, name, sort_order FROM queue_types ORDER BY sort_order');
        console.table(after);

        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
}

testReorder();
