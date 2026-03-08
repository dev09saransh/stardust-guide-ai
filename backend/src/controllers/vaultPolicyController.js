const db = require('../config/db');

/**
 * @route   GET api/vault-policies/:id
 * @desc    Get vault policy details
 * @access  Private (Admin/User)
 */
const getPolicy = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.execute('SELECT * FROM vault_policies WHERE policy_id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Policy not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching vault policy' });
    }
};

/**
 * @route   GET api/vault-policies
 * @desc    Get all vault policies
 * @access  Private (Admin)
 */
const getAllPolicies = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM vault_policies');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching vault policies' });
    }
};

/**
 * @route   POST api/vault-policies
 * @desc    Create a new vault policy
 * @access  Private (Admin)
 */
const createPolicy = async (req, res) => {
    const { name, inactivity_trigger_period, reminder_interval, nominee_limit, admin_verification_required } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO vault_policies (name, inactivity_trigger_period, reminder_interval, nominee_limit, admin_verification_required) VALUES (?, ?, ?, ?, ?)',
            [name, inactivity_trigger_period, reminder_interval, nominee_limit, admin_verification_required]
        );
        res.status(201).json({ message: 'Vault policy created', policyId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating vault policy' });
    }
};

module.exports = { getPolicy, getAllPolicies, createPolicy };
