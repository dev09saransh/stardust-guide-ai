const db = require('../config/db');

exports.submitFeedback = async (req, res) => {
    try {
        const { id } = req.user;
        const { q1, q2, q3, q4, q5, textFeedback } = req.body;

        if (!q1 || !q2 || !q3 || !q4 || !q5) {
            return res.status(400).json({ message: 'All 5 ratings are required.' });
        }

        // Check if user already submitted feedback
        const [existing] = await db.execute('SELECT id FROM customer_feedbacks WHERE user_id = ?', [id]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Feedback already submitted.' });
        }

        await db.execute(
            'INSERT INTO customer_feedbacks (user_id, q1_rating, q2_rating, q3_rating, q4_rating, q5_rating, text_feedback) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, q1, q2, q3, q4, q5, textFeedback || '']
        );

        res.status(201).json({ message: 'Feedback successfully submitted.' });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ message: 'Failed to submit feedback', error: error.message });
    }
};

exports.getAllFeedback = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT f.*, u.full_name, u.email, u.mobile 
            FROM customer_feedbacks f
            JOIN users u ON f.user_id = u.user_id
            ORDER BY f.created_at DESC
        `);

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching feedbacks:', error);
        res.status(500).json({ message: 'Failed to fetch feedbacks', error: error.message });
    }
};
