#!/bin/bash

# 🛡️ STARDUST DB SYNC SCRIPT
# This script reads your .env and updates your RDS instance with missing defaults.

if [ ! -f .env ]; then
    echo "❌ [ERROR]: .env file not found in current directory."
    exit 1
fi

# Load variables safely
DB_HOST=$(grep DB_HOST .env | cut -d '=' -f2)
DB_USER=$(grep DB_USER .env | cut -d '=' -f2)
DB_PASS=$(grep DB_PASSWORD .env | cut -d '=' -f2)
DB_NAME=$(grep DB_NAME .env | cut -d '=' -f2)

echo "🛰️  Connecting to RDS: $DB_HOST..."

# Check if mysql-client is installed
if ! command -v mysql &> /dev/null; then
    echo "📦 [INSTALLING]: MySQL Client..."
    sudo apt-get update && sudo apt-get install -y mysql-client
fi

# Run SQL Commands
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" <<EOF
-- 1. Create missing tables if they vanished
CREATE TABLE IF NOT EXISTS vault_policies (
    policy_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    inactivity_trigger_period INT DEFAULT 9,
    reminder_interval INT DEFAULT 3,
    nominee_limit INT DEFAULT 2
);

-- 2. Insert Standard Policy (Critical Fix)
INSERT IGNORE INTO vault_policies (policy_id, name) VALUES (1, 'Standard Protection');

-- 3. Verify security questions
INSERT IGNORE INTO security_questions (question) VALUES 
('What was the name of your first pet?'),
('What is your mother\'s maiden name?'),
('What was the name of your first school?'),
('In which city were you born?');

-- 4. Fix User Defaults (Last resort column check)
ALTER TABLE users MODIFY COLUMN vault_policy_id INT DEFAULT 1;
UPDATE users SET vault_policy_id = 1 WHERE vault_policy_id IS NULL;

-- 5. Final check
SELECT 'DATABASE SYNC COMPLETE' as Result;
EOF

if [ $? -eq 0 ]; then
    echo "✅ [SUCCESS]: Database updated with mandatory defaults."
else
    echo "❌ [FAILED]: Database update failed. Check your RDS connectivity."
fi
