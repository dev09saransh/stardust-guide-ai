/**
 * Migration: Add onboarding fields to users table + create nominees table
 */
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function migrate() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('🚀 Running onboarding migration...');

    // Add columns to users table (safe: IF NOT EXISTS via checking INFORMATION_SCHEMA)
    const colsToAdd = [
        { name: 'address', sql: 'ALTER TABLE users ADD COLUMN address TEXT DEFAULT NULL' },
        { name: 'gender', sql: "ALTER TABLE users ADD COLUMN gender ENUM('Male','Female','Other') DEFAULT NULL" },
        { name: 'dob', sql: 'ALTER TABLE users ADD COLUMN dob DATE DEFAULT NULL' },
        { name: 'has_completed_onboarding', sql: 'ALTER TABLE users ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT 0' },
    ];

    for (const col of colsToAdd) {
        const [rows] = await conn.query(
            `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = ?`,
            [process.env.DB_NAME, col.name]
        );
        if (rows[0].cnt === 0) {
            await conn.query(col.sql);
            console.log(`  ✅ Added column: users.${col.name}`);
        } else {
            console.log(`  ⏭️  Column users.${col.name} already exists`);
        }
    }

    // Create nominees table
    await conn.query(`
    CREATE TABLE IF NOT EXISTS nominees (
      nominee_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) DEFAULT NULL,
      mobile VARCHAR(20) DEFAULT NULL,
      relationship VARCHAR(100) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
    console.log('  ✅ nominees table ready');

    console.log('🎉 Migration complete!');
    await conn.end();
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
});
