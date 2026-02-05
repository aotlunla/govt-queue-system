const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'govt_queue_db',
};

async function addSlugColumn() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);

        console.log('Checking if slug column exists in display_configs table...');
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'display_configs' AND COLUMN_NAME = 'slug'
        `, [dbConfig.database]);

        if (columns.length > 0) {
            console.log('✅ Slug column already exists.');
        } else {
            console.log('Adding slug column to display_configs...');
            // Add slug column, unique index
            await connection.query(`
                ALTER TABLE display_configs
                ADD COLUMN slug VARCHAR(100) NULL AFTER name,
                ADD UNIQUE INDEX idx_slug (slug);
            `);
            console.log('✅ Slug column added successfully.');
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        if (connection) await connection.end();
    }
}

addSlugColumn();
