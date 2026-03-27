const mysql = require('mysql2');
require('dotenv').config();
const path = require('path');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 25,
    queueLimit: 0,
    connectTimeout: 30000,
    acquireTimeout: 30000,
    timeout: 30000,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null
});

module.exports = pool.promise();
