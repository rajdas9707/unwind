const express = require('express');
const router = express.Router();
const verifyToken = require('../verifyToken');

const DailySummary = require('../models/DailySummary');
const Journal = require('../models/Journal');
const Mistake = require('../models/Mistake');
const Overthinking = require('../models/Overthinking');
const Todo = require('../models/Todo');

// DELETE /api/data/all - Purge all user data (except the user account)
router.delete('/all', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    const [ds, j, m, o, t] = await Promise.all([
      DailySummary.deleteMany({ userId }),
      Journal.deleteMany({ userId }),
      Mistake.deleteMany({ userId }),
      Overthinking.deleteMany({ userId }),
      Todo.deleteMany({ userId })
    ]);

    return res.status(200).json({
      success: true,
      deleted: {
        dailySummary: ds?.deletedCount ?? null,
        journal: j?.deletedCount ?? null,
        mistakes: m?.deletedCount ?? null,
        overthinking: o?.deletedCount ?? null,
        todos: t?.deletedCount ?? null
      }
    });
  } catch (error) {
    console.error('Error purging user data:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete user data' });
  }
});

module.exports = router;
