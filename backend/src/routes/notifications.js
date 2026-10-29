
const express = require('express');
const Notification = require('../models/Notification');
const Friendship = require('../models/Friendship');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const userId = req.session.userId;

  const [items, pendingFriendRequests] = await Promise.all([
    Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20),
    Friendship.countDocuments({
      recipient: userId,
      status: 'pending',
    }),
  ]);

  return res.json({
    notifications: items.map((item) => ({
      id: String(item._id),
      type: item.type,
      message: item.message,
      read: item.read,
      createdAt: item.createdAt,
    })),
    pendingFriendRequests,
  });
});

router.post('/:id/read', requireAuth, async (req, res) => {
  await Notification.updateOne(
    { _id: req.params.id, user: req.session.userId },
    { read: true }
  );

  return res.json({ message: 'Notification marked read' });
});

module.exports = router;
