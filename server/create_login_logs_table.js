require('dotenv').config();
const db = require('./config/db');

const createLoginLogsTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS login_logs (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                personnel_id INT NULL,
                username VARCHAR(50) NULL,
                role VARCHAR(20) NULL,
                action_type ENUM('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT') NOT NULL,
                ip_address VARCHAR(45) NULL,
                user_agent TEXT NULL,
                details VARCHAR(255) NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await db.query(query);
        console.log('✅ Created "login_logs" table successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating table:', error);
        process.exit(1);
    }
};

createLoginLogsTable();
