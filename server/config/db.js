// config/db.js
const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.MYSQL_HOST || process.env.DB_HOST,
  port: process.env.MYSQLPORT || process.env.MYSQL_PORT || process.env.DB_PORT || 3306,
  user: process.env.MYSQLUSER || process.env.MYSQL_USER || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 60000,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

// แปลงเป็น Promise เพื่อให้ใช้ Async/Await ได้ง่ายๆ
module.exports = pool.promise();
