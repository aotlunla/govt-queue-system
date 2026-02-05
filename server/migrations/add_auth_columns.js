const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function migrate() {
    try {
        console.log('Starting migration: Add Auth Columns to Personnel...');

        // 1. Check if columns exist
        const [columns] = await db.query('SHOW COLUMNS FROM personnel');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('username')) {
            await db.query('ALTER TABLE personnel ADD COLUMN username VARCHAR(50) UNIQUE AFTER nickname');
            console.log('✅ Added username column');
        }

        if (!columnNames.includes('password')) {
            await db.query('ALTER TABLE personnel ADD COLUMN password VARCHAR(255) AFTER username');
            console.log('✅ Added password column');
        }

        if (!columnNames.includes('role')) {
            await db.query("ALTER TABLE personnel ADD COLUMN role ENUM('admin', 'staff') DEFAULT 'staff' AFTER password");
            console.log('✅ Added role column');
        }

        // 2. Set default values for existing users
        const defaultPassword = await bcrypt.hash('password', 10);

        // Update users without username
        const [users] = await db.query('SELECT id, fullname FROM personnel WHERE username IS NULL');
        for (const user of users) {
            // Generate simple username: firstname (lowercase)
            const username = user.fullname.split(' ')[0].toLowerCase() + user.id;
            await db.query('UPDATE personnel SET username = ?, password = ?, role = ? WHERE id = ?', [username, defaultPassword, 'staff', user.id]);
            console.log(`Updated user ${user.id}: username=${username}, role=staff`);
        }

        // Ensure at least one admin exists (optional, or manual)
        // For now, we just ensure data integrity.

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
