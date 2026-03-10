-- Upgrade users table to support dynamic inactivity triggers
ALTER TABLE users 
ADD COLUMN inactivity_trigger_period INT DEFAULT 9 AFTER vault_policy_id,
ADD COLUMN reminder_interval INT DEFAULT 3 AFTER inactivity_trigger_period,
ADD COLUMN nominee_limit INT DEFAULT 2 AFTER reminder_interval;

-- Copy values from vault_policies for existing users
UPDATE users u
JOIN vault_policies vp ON u.vault_policy_id = vp.policy_id
SET u.inactivity_trigger_period = vp.inactivity_trigger_period,
    u.reminder_interval = vp.reminder_interval,
    u.nominee_limit = vp.nominee_limit;
