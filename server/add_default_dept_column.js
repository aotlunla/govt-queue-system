const db = require('./config/db');
const dotenv = require('dotenv');
dotenv.config();

async function addDefaultDeptColumn() {
    try {
        console.log('Checking queue_types table for default_department_id column...');
        const [columns] = await db.query("SHOW COLUMNS FROM queue_types LIKE 'default_department_id'");

        if (columns.length === 0) {
            console.log('Adding default_department_id column...');
            await db.query("ALTER TABLE queue_types ADD COLUMN default_department_id INT DEFAULT NULL");
            console.log('✅ Column default_department_id added successfully.');
        } else {
            console.log('ℹ️ Column default_department_id already exists.');
        }
        process.exit(0);
    } catch (err) {
        console.error('❌ Error adding column:', err);
        process.exit(1);
    }
}

addDefaultDeptColumn();
