async function testCounters() {
    try {
        // 1. Fetch departments
        const deptsRes = await fetch('http://localhost:5000/api/admin/departments');
        const depts = await deptsRes.json();

        if (depts.length === 0) {
            console.log('No departments found to test.');
            return;
        }

        const deptId = depts[0].id;
        console.log(`Testing with Department ID: ${deptId}`);

        // 2. Fetch counters for this department
        const countersRes = await fetch(`http://localhost:5000/api/admin/counters?department_id=${deptId}`);
        const counters = await countersRes.json();
        console.log(`Counters for Dept ${deptId}:`, counters.length);

        // Verify that all returned counters actually belong to this department
        const invalidCounters = counters.filter(c => c.department_id !== deptId);
        if (invalidCounters.length > 0) {
            console.error('FAILED: Found counters from other departments:', invalidCounters);
        } else {
            console.log('SUCCESS: All counters belong to the selected department.');
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

testCounters();
