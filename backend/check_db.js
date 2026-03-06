const db = require('./src/config/db');

async function check() {
    try {
        const [userResult] = await db.execute('SELECT COUNT(*) as total FROM users');
        console.log('Total Users:', userResult[0].total);
        const [rows] = await db.execute('SELECT full_name FROM users');
        console.log('Users:', rows.map(r => r.full_name));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
