const db = require('../src/config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'upgrade_vault_protocol.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        const cleanSql = sql
            .replace(/--.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .trim();

        const commands = cleanSql
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0);

        console.log(`🚀 Starting vault protocol migration with ${commands.length} commands...`);

        for (const cmd of commands) {
            console.log(`Executing: ${cmd.substring(0, 100)}...`);
            await db.execute(cmd);
        }

        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
