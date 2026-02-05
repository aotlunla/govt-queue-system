const db = require('./config/db');

async function addColorToCaseRoles() {
    try {
        // Check if column exists
        const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'case_roles' 
      AND COLUMN_NAME = 'badge_color'
    `);

        if (columns.length === 0) {
            console.log('Adding badge_color column to case_roles table...');
            await db.query(`
        ALTER TABLE case_roles 
        ADD COLUMN badge_color VARCHAR(50) DEFAULT NULL AFTER name
      `);
            console.log('Successfully added badge_color column');
        } else {
            console.log('badge_color column already exists in case_roles');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error adding column:', err);
        process.exit(1);
    }
}

addColorToCaseRoles();
