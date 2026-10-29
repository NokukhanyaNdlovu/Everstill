const express = require('express');
const User = require('../models/User');
const Album = require('../models/Album');
const Post = require('../models/Post');
const { requireAuth } = require('../middleware/auth');
const { upload, publicFileUrl } = require('../middleware/upload');
const { areFriends, friendIdsOf, limitedProfile, fullProfile } = require('../utils/friends');
const { serializePost } = require('../utils/posts');

const router = express.Router();

router.get('/:id', requireAuth, async (req, res) => {
  const user = await User.findOne({
    $or: [
      { username: String(req.params.id).toLowerCase() },
      ...(req.params.id.match(/^[a-f0-9]{24}$/i) ? [{ _id: req.params.id }] : []),
    ],
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const self = String(user._id) === String(req.session.userId);
  const friend = self || (await areFriends(req.session.userId, user._id));
  const friends = friend ? await friendIdsOf(user._id) : [];
  const payload = friend
    ? fullProfile(user, { friendCount: friends.length, isFriend: !self && friend, isSelf: self })
    : { ...limitedProfile(user), isFriend: false, isSelf: false, limited: true };
  return res.json({ user: payload });
});

router.patch('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { name, bio, location, website } = req.body || {};
  if (name !== undefined) {
    if (!String(name).trim()) return res.status(400).json({ error: 'Name cannot be empty' });
    user.name = String(name).trim();
  }
  if (bio !== undefined) user.bio = String(bio).slice(0, 280);
  if (location !== undefined) user.location = String(location).slice(0, 80);
  if (website !== undefined) user.website = String(website).slice(0, 120);
  await user.save();
  return res.json({ user: fullProfile(user), message: 'Profile updated' });
});

router.post('/me/avatar', requireAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Profile picture is required' });
  const user = await User.findById(req.session.userId);
  user.profilePicture = publicFileUrl(req.file.filename);
  await user.save();
  return res.json({ user: fullProfile(user), message: 'Profile picture updated' });
});

router.get('/:id/albums', requireAuth, async (req, res) => {
  const user = await User.findOne({
    $or: [
      { username: String(req.params.id).toLowerCase() },
      ...(req.params.id.match(/^[a-f0-9]{24}$/i) ? [{ _id: req.params.id }] : []),
    ],
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const friend = String(user._id) === String(req.session.userId) || (await areFriends(req.session.userId, user._id));
  if (!friend) {
    return res.json({ albums: [], limited: true });
  }
  const albums = await Album.find({ owner: user._id }).sort({ createdAt: -1 });
  return res.json({
    albums: albums.map((album) => ({
      id: String(album._id),
      name: album.name,
      description: album.description,
      hashtags: album.hashtags,
      postCount: album.posts.length,
      createdAt: album.createdAt,
    })),
  });
});

router.get('/:id/posts', requireAuth, async (req, res) => {
  const user = await User.findOne({
    $or: [
      { username: String(req.params.id).toLowerCase() },
      ...(req.params.id.match(/^[a-f0-9]{24}$/i) ? [{ _id: req.params.id }] : []),
    ],
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const friend = String(user._id) === String(req.session.userId) || (await areFriends(req.session.userId, user._id));
  if (!friend) {
    return res.json({ posts: [], limited: true });
  }
  const posts = await Post.find({ creator: user._id }).sort({ createdAt: -1 }).populate('creator', 'name username profilePicture');
  const isAdmin = req.session.role === 'admin';
  const serialized = await Promise.all(posts.map((post) => serializePost(post, { isAdmin, includeComments: true })));
  return res.json({ posts: serialized });
});

module.exports = router;
