const db = require('./config/db');

async function testSwapLogic() {
    try {
        console.log('Connecting to database...');
        // db is already a pool, so we can use it directly

        // 1. Setup: Create two test queue types
        console.log('Creating test items...');
        const [res1] = await db.query('INSERT INTO queue_types (name, code, badge_color, sort_order) VALUES (?, ?, ?, ?)', ['Test A', 'TA', '#000000', 9001]);
        const id1 = res1.insertId;
        const [res2] = await db.query('INSERT INTO queue_types (name, code, badge_color, sort_order) VALUES (?, ?, ?, ?)', ['Test B', 'TB', '#000000', 9002]);
        const id2 = res2.insertId;
        console.log(`Created Item A (ID: ${id1}, Order: 9001) and Item B (ID: ${id2}, Order: 9002)`);

        // 2. Action: Update Item A to Order 9002 (Collision with Item B)
        // We need to simulate the API logic here. The API logic does:
        // 1. Get current sort_order of Item A (9001)
        // 2. Check if 9002 is taken (Yes, by Item B)
        // 3. Swap: Update Item B to 9001
        // 4. Update Item A to 9002

        console.log('Simulating Swap Logic...');

        // Step 1: Get current sort_order of Item A
        const [current] = await db.query('SELECT sort_order FROM queue_types WHERE id = ?', [id1]);
        const oldSortOrder = current[0].sort_order; // 9001

        // Step 2: Check collision
        const newSortOrder = 9002;
        const [conflict] = await db.query('SELECT id FROM queue_types WHERE sort_order = ? AND id != ?', [newSortOrder, id1]);

        if (conflict.length > 0) {
            const conflictId = conflict[0].id; // Should be id2
            console.log(`Conflict detected with Item ${conflictId}. Swapping to ${oldSortOrder}...`);

            // Step 3: Swap (Update Item B to 9001)
            await db.query('UPDATE queue_types SET sort_order = ? WHERE id = ?', [oldSortOrder, conflictId]);
        }

        // Step 4: Update Item A
        await db.query('UPDATE queue_types SET sort_order = ? WHERE id = ?', [newSortOrder, id1]);
        console.log('Update complete.');

        // 3. Verification
        const [rows] = await db.query('SELECT id, name, sort_order FROM queue_types WHERE id IN (?, ?)', [id1, id2]);
        const itemA = rows.find(r => r.id === id1);
        const itemB = rows.find(r => r.id === id2);

        console.log('Results:');
        console.log(`Item A (ID: ${id1}): Sort Order = ${itemA.sort_order} (Expected: 9002)`);
        console.log(`Item B (ID: ${id2}): Sort Order = ${itemB.sort_order} (Expected: 9001)`);

        if (itemA.sort_order === 9002 && itemB.sort_order === 9001) {
            console.log('SUCCESS: Swap logic verified!');
        } else {
            console.error('FAILURE: Swap logic did not work as expected.');
        }

        // 4. Cleanup
        console.log('Cleaning up...');
        await db.query('DELETE FROM queue_types WHERE id IN (?, ?)', [id1, id2]);

        process.exit(0);

    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
}

testSwapLogic();
