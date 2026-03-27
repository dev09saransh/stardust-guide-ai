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
    ssl: process.env.DB_SSL === 'true' ? (() => {
        const possiblePaths = [
            path.join(__dirname, '../../global-bundle.pem'),
            path.join(__dirname, '../global-bundle.pem'),
            path.join(process.cwd(), 'global-bundle.pem'),
            path.join(path.dirname(process.execPath), 'global-bundle.pem'),
            '/home/ubuntu/global-bundle.pem'
        ];
        
        let ca = null;
        for (const p of possiblePaths) {
            try {
                if (require('fs').existsSync(p)) {
                    ca = require('fs').readFileSync(p);
                    console.log(`✅ [DB CERT]: Loaded from ${p}`);
                    break;
                }
            } catch (e) {}
        }

        if (ca) return { ca };
        
        console.warn('⚠️ [DB WARNING]: SSL requested but no CA cert found. Falling back to non-verified SSL.');
        return { rejectUnauthorized: false };
    })() : null
});

module.exports = pool.promise();
