const { SecurityLog } = require('../models');

exports.getLogs = async (req, res) => {
  try {
    const logs = await SecurityLog.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 50
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
