const db = require('./config/db');

const API_URL = 'http://localhost:5000/api/admin';

async function testValidation() {
    try {
        console.log('Testing Sort Order Validation...');

        // 1. Get a department to test with
        const [depts] = await db.query('SELECT id FROM departments LIMIT 1');
        if (depts.length === 0) {
            console.log('No departments found to test.');
            return;
        }
        const id = depts[0].id;

        // Helper for requests
        const putSortOrder = async (order) => {
            const res = await fetch(`${API_URL}/departments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sort_order: order })
            });
            return res;
        };

        // 2. Test sort_order = 0 (Should Fail)
        try {
            const res = await putSortOrder(0);
            if (res.status === 400) {
                console.log('✅ Success: sort_order 0 was rejected (400).');
            } else {
                console.error(`❌ Failed: sort_order 0 returned status ${res.status}`);
            }
        } catch (err) {
            console.error('❌ Failed: Network error for 0:', err.message);
        }

        // 3. Test sort_order = -1 (Should Fail)
        try {
            const res = await putSortOrder(-1);
            if (res.status === 400) {
                console.log('✅ Success: sort_order -1 was rejected (400).');
            } else {
                console.error(`❌ Failed: sort_order -1 returned status ${res.status}`);
            }
        } catch (err) {
            console.error('❌ Failed: Network error for -1:', err.message);
        }

        // 4. Test sort_order = 1 (Should Succeed)
        try {
            const res = await putSortOrder(1);
            if (res.ok) {
                console.log('✅ Success: sort_order 1 was accepted.');
            } else {
                console.error(`❌ Failed: sort_order 1 returned status ${res.status}`);
            }
        } catch (err) {
            console.error('❌ Failed: Network error for 1:', err.message);
        }

        process.exit(0);
    } catch (err) {
        console.error('Test script error:', err);
        process.exit(1);
    }
}

testValidation();
