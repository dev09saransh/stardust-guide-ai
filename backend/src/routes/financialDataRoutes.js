const express = require('express');
const router = express.Router();
const financialService = require('../services/financialDataService');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

// All financial data routes are protected
router.use(auth);

/**
 * @route   POST /api/financial/consent
 * @desc    Initiate Account Aggregator consent (Banking, MF, Insurance)
 */
router.post('/consent', async (req, res) => {
    const { pan, types } = req.body;
    try {
        const consentRequest = await financialService.createConsentRequest(pan, types);
        res.json(consentRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/financial/status/:consentId
 * @desc    Check status of a consent request
 */
router.get('/status/:consentId', async (req, res) => {
    try {
        const status = await financialService.getConsentStatus(req.params.consentId);
        res.json(status);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   POST /api/financial/sync
 * @desc    Fetch and save AA data (Banking, Investments, etc.)
 */
router.post('/sync', async (req, res) => {
    const { consentId } = req.body;
    const userId = req.user.id;
    try {
        const assets = await financialService.fetchHoldings(consentId);
        const savedAssets = [];
        for (const asset of assets) {
            const [result] = await db.execute(
                'INSERT INTO assets (user_id, category, title, metadata, is_encrypted) VALUES (?, ?, ?, ?, ?)',
                [userId, asset.category, asset.title, JSON.stringify(asset.metadata), 1]
            );
            savedAssets.push({ id: result.insertId, ...asset });
        }
        res.json({ count: assets.length, assets: savedAssets });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
