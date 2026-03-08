const db = require('../src/config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'succession_migration.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Remove comments and empty lines
        const cleanSql = sql
            .replace(/--.*$/gm, '') // Remove single line comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
            .trim();

        const commands = cleanSql
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.toLowerCase().startsWith('use'));

        console.log(`🚀 Starting migration with ${commands.length} commands...`);

        for (const cmd of commands) {
            console.log(`Executing: ${cmd.substring(0, 50)}...`);
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
