const express = require('express');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { requireAuth } = require('../middleware/auth');
const { upload, publicFileUrl } = require('../middleware/upload');
const { mergeHashtags, EMOJIS } = require('../utils/constants');
const { friendIdsOf, publicAuthor } = require('../utils/friends');
const { serializePost } = require('../utils/posts');
const { deletePostAndComments } = require('../utils/deletePost');

const router = express.Router();

router.get('/feed/local', requireAuth, async (req, res) => {
  const ids = await friendIdsOf(req.session.userId);
  ids.push(req.session.userId);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 10;
  const posts = await Post.find({ creator: { $in: ids } })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('creator', 'name username profilePicture');
  const isAdmin = req.session.role === 'admin';
  const items = await Promise.all(posts.map((post) => serializePost(post, { isAdmin, includeComments: true })));
  return res.json({ posts: items, page, hasMore: posts.length === limit });
});

router.get('/feed/global', requireAuth, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 10;
  const posts = await Post.find({})
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('creator', 'name username profilePicture');
  const isAdmin = req.session.role === 'admin';
  const items = await Promise.all(posts.map((post) => serializePost(post, { isAdmin, includeComments: true })));
  return res.json({ posts: items, page, hasMore: posts.length === limit });
});

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'A photo is required' });
  const description = String((req.body && req.body.description) || '').slice(0, 1000);
  const hashtags = mergeHashtags(description, req.body && req.body.hashtags);
  const post = await Post.create({
    creator: req.session.userId,
    imageUrl: publicFileUrl(req.file.filename),
    description,
    hashtags,
  });
  await post.populate('creator', 'name username profilePicture');
  return res.status(201).json({
    post: await serializePost(post, { isAdmin: req.session.role === 'admin', includeComments: true }),
    message: 'Photo posted',
  });
});

router.get('/:id', requireAuth, async (req, res) => {
  const post = await Post.findById(req.params.id).populate('creator', 'name username profilePicture');
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const reveal = String(req.query.reveal) === '1';
  const isAdmin = req.session.role === 'admin';
  return res.json({ post: await serializePost(post, { reveal, isAdmin, includeComments: true }) });
});

router.patch('/:id', requireAuth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const isOwner = String(post.creator) === String(req.session.userId);
const isAdmin = req.session.role === 'admin';

if (!isOwner && !isAdmin) {
  return res.status(403).json({ error: 'You cannot edit this post' });
}
  if (req.body.imageUrl || req.body.image) {
    return res.status(400).json({ error: 'The photo cannot be replaced' });
  }
  if (req.body.description !== undefined) {
    post.description = String(req.body.description).slice(0, 1000);
  }
  post.hashtags = mergeHashtags(post.description, req.body.hashtags !== undefined ? req.body.hashtags : post.hashtags);
  await post.save();
  await post.populate('creator', 'name username profilePicture');
  return res.json({
    post: await serializePost(post, { isAdmin: req.session.role === 'admin', includeComments: true, reveal: true }),
    message: 'Post updated',
  });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const isOwner = String(post.creator) === String(req.session.userId);
  const isAdmin = req.session.role === 'admin';
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'You cannot delete this post' });
  }
  await deletePostAndComments(post, { notifyOwner: isAdmin && !isOwner, actorId: req.session.userId });
  return res.json({ message: 'Post deleted' });
});

router.post('/:id/comments', requireAuth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const emoji = req.body && req.body.emoji;
  let text = '';
  let isEmoji = false;
  if (emoji) {
    if (!EMOJIS.includes(emoji)) {
      return res.status(400).json({ error: 'Choose one of the five emoji reactions' });
    }
    text = emoji;
    isEmoji = true;
  } else {
    text = String((req.body && req.body.text) || '').trim();
    if (!text) return res.status(400).json({ error: 'Comment text is required' });
  }
  const comment = await Comment.create({
    post: post._id,
    author: req.session.userId,
    text: text.slice(0, 500),
    isEmoji,
  });
  await comment.populate('author', 'name username profilePicture');
  return res.status(201).json({
    comment: {
      id: String(comment._id),
      text: comment.text,
      isEmoji: comment.isEmoji,
      createdAt: comment.createdAt,
      author: publicAuthor(comment.author),
    },
    message: isEmoji ? 'Reaction added' : 'Comment added',
  });
});

module.exports = router;
