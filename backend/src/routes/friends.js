const express = require('express');
const mongoose = require('mongoose');
const Friendship = require('../models/Friendship');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { limitedProfile } = require('../utils/friends');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const me = req.session.userId;
  const rows = await Friendship.find({
    status: 'accepted',
    $or: [{ requester: me }, { recipient: me }],
  }).populate('requester recipient', 'name username profilePicture');
  const friends = rows.map((row) => {
    const other = String(row.requester._id) === String(me) ? row.recipient : row.requester;
    return limitedProfile(other);
  });
  return res.json({ friends });
});

router.get('/requests', requireAuth, async (req, res) => {
  const me = req.session.userId;
  const incoming = await Friendship.find({ recipient: me, status: 'pending' }).populate(
    'requester',
    'name username profilePicture'
  );
  const outgoing = await Friendship.find({ requester: me, status: 'pending' }).populate(
    'recipient',
    'name username profilePicture'
  );
  return res.json({
    incoming: incoming.map((row) => ({ id: String(row._id), user: limitedProfile(row.requester) })),
    outgoing: outgoing.map((row) => ({ id: String(row._id), user: limitedProfile(row.recipient) })),
  });
});

router.post('/request', requireAuth, async (req, res) => {
  const { userId } = req.body || {};
  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ error: 'A valid userId is required' });
  }
  if (String(userId) === String(req.session.userId)) {
    return res.status(400).json({ error: 'You cannot send a friend request to yourself' });
  }
  const target = await User.findById(userId);
  if (!target) return res.status(404).json({ error: 'User not found' });
  const existing = await Friendship.findOne({
    $or: [
      { requester: req.session.userId, recipient: userId },
      { requester: userId, recipient: req.session.userId },
    ],
  });
  if (existing) {
    if (existing.status === 'accepted') return res.status(409).json({ error: 'You are already friends' });
    if (existing.status === 'pending') return res.status(409).json({ error: 'A friend request already exists' });
    existing.requester = req.session.userId;
    existing.recipient = userId;
    existing.status = 'pending';
    await existing.save();
    return res.json({ message: 'Friend request sent' });
  }
  await Friendship.create({ requester: req.session.userId, recipient: userId, status: 'pending' });
  return res.status(201).json({ message: 'Friend request sent' });
});

router.post('/accept', requireAuth, async (req, res) => {
  const { requestId } = req.body || {};
  const row = await Friendship.findOne({ _id: requestId, recipient: req.session.userId, status: 'pending' });
  if (!row) return res.status(404).json({ error: 'Friend request not found' });
  row.status = 'accepted';
  await row.save();
  return res.json({ message: 'Friend request accepted' });
});

router.post('/decline', requireAuth, async (req, res) => {
  const { requestId } = req.body || {};
  const row = await Friendship.findOne({ _id: requestId, recipient: req.session.userId, status: 'pending' });
  if (!row) return res.status(404).json({ error: 'Friend request not found' });
  row.status = 'declined';
  await row.save();
  return res.json({ message: 'Friend request declined' });
});

router.post('/unfriend', requireAuth, async (req, res) => {
  const { userId } = req.body || {};
  const row = await Friendship.findOne({
    status: 'accepted',
    $or: [
      { requester: req.session.userId, recipient: userId },
      { requester: userId, recipient: req.session.userId },
    ],
  });
  if (!row) return res.status(404).json({ error: 'Friendship not found' });
  await row.deleteOne();
  return res.json({ message: 'Unfriended' });
});

module.exports = router;
