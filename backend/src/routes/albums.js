const express = require('express');
const Album = require('../models/Album');
const Post = require('../models/Post');
const { requireAuth } = require('../middleware/auth');
const { mergeHashtags } = require('../utils/constants');
const { limitedProfile } = require('../utils/friends');
const { serializePost } = require('../utils/posts');

const router = express.Router();

function serializeAlbum(album) {
  return {
    id: String(album._id),
    name: album.name,
    description: album.description,
    hashtags: album.hashtags,
    postIds: (album.posts || []).map((post) => String(post._id || post)),
    owner: album.owner && album.owner.username ? limitedProfile(album.owner) : { id: String(album.owner) },
    createdAt: album.createdAt,
    updatedAt: album.updatedAt,
  };
}

router.post('/', requireAuth, async (req, res) => {
  const { name, description, hashtags } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Album name is required' });
  const album = await Album.create({
    owner: req.session.userId,
    name: String(name).trim(),
    description: String(description || '').slice(0, 500),
    hashtags: mergeHashtags(description, hashtags),
    posts: [],
  });
  await album.populate('owner', 'name username profilePicture');
  return res.status(201).json({ album: serializeAlbum(album), message: 'Album created' });
});

router.get('/:id', requireAuth, async (req, res) => {
  const album = await Album.findById(req.params.id).populate('owner', 'name username profilePicture');
  if (!album) return res.status(404).json({ error: 'Album not found' });
  const posts = await Post.find({ _id: { $in: album.posts } }).populate('creator', 'name username profilePicture');
  const order = album.posts.map(String);
  posts.sort((a, b) => order.indexOf(String(a._id)) - order.indexOf(String(b._id)));
  const isAdmin = req.session.role === 'admin';
  const serializedPosts = await Promise.all(posts.map((post) => serializePost(post, { isAdmin, includeComments: true })));
  return res.json({ album: { ...serializeAlbum(album), posts: serializedPosts } });
});

router.patch('/:id', requireAuth, async (req, res) => {
  const album = await Album.findById(req.params.id);
  if (!album) return res.status(404).json({ error: 'Album not found' });
  if (String(album.owner) !== String(req.session.userId)) {
    return res.status(403).json({ error: 'You can only edit your own albums' });
  }
  if (req.body.name !== undefined) {
    if (!String(req.body.name).trim()) return res.status(400).json({ error: 'Album name cannot be empty' });
    album.name = String(req.body.name).trim();
  }
  if (req.body.description !== undefined) album.description = String(req.body.description).slice(0, 500);
  if (req.body.hashtags !== undefined || req.body.description !== undefined) {
    album.hashtags = mergeHashtags(album.description, req.body.hashtags !== undefined ? req.body.hashtags : album.hashtags);
  }
  await album.save();
  await album.populate('owner', 'name username profilePicture');
  return res.json({ album: serializeAlbum(album), message: 'Album updated' });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const album = await Album.findById(req.params.id);
  if (!album) return res.status(404).json({ error: 'Album not found' });
  if (String(album.owner) !== String(req.session.userId)) {
    return res.status(403).json({ error: 'You can only delete your own albums' });
  }
  await album.deleteOne();
  return res.json({ message: 'Album deleted. Posts were not deleted.' });
});

router.post('/:id/posts', requireAuth, async (req, res) => {
  const album = await Album.findById(req.params.id);
  if (!album) return res.status(404).json({ error: 'Album not found' });
  if (String(album.owner) !== String(req.session.userId)) {
    return res.status(403).json({ error: 'You can only change your own albums' });
  }
  const { postId } = req.body || {};
  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (String(post.creator) !== String(req.session.userId)) {
    return res.status(403).json({ error: 'You can only add your own posts to albums' });
  }
  if (!album.posts.some((id) => String(id) === String(post._id))) {
    album.posts.push(post._id);
    await album.save();
  }
  return res.json({ message: 'Post added to album', album: serializeAlbum(album) });
});

router.delete('/:id/posts/:postId', requireAuth, async (req, res) => {
  const album = await Album.findById(req.params.id);
  if (!album) return res.status(404).json({ error: 'Album not found' });
  if (String(album.owner) !== String(req.session.userId)) {
    return res.status(403).json({ error: 'You can only change your own albums' });
  }
  album.posts = album.posts.filter((id) => String(id) !== String(req.params.postId));
  await album.save();
  return res.json({ message: 'Post removed from album', album: serializeAlbum(album) });
});

module.exports = router;
