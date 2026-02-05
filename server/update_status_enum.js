const db = require('./config/db');

async function updateStatusEnum() {
    try {
        console.log('Updating status ENUM...');
        await db.query(`
      ALTER TABLE queues 
      MODIFY COLUMN status ENUM('WAITING', 'IN_PROGRESS', 'PROCESSING', 'COMPLETED', 'CANCELLED') 
      DEFAULT 'WAITING'
    `);
        console.log('✅ Status ENUM updated to include PROCESSING.');

        // Also fix existing empty statuses to PROCESSING if they were meant to be
        await db.query(`
        UPDATE queues SET status = 'PROCESSING' WHERE status = ''
    `);
        console.log('✅ Fixed empty statuses.');

        await db.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

updateStatusEnum();
