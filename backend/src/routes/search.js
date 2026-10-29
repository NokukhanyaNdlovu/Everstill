const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const Album = require('../models/Album');
const { requireAuth } = require('../middleware/auth');
const { rankByFields } = require('../utils/fuzzy');
const { limitedProfile } = require('../utils/friends');
const { serializePost } = require('../utils/posts');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Enter a search term' });
  const isAdmin = req.session.role === 'admin';

  const [users, posts, albums] = await Promise.all([
    User.find({}).select('name username email profilePicture'),
    Post.find({}).populate('creator', 'name username profilePicture'),
    Album.find({}).populate('owner', 'name username profilePicture'),
  ]);

  const userHits = rankByFields(q, users, [
    (u) => u.name,
    (u) => u.username,
    (u) => u.email,
  ]).slice(0, 12);

  const postHits = rankByFields(q, posts, [
    (p) => p.description,
    (p) => (p.hashtags || []).join(' '),
  ]).slice(0, 12);

  const albumHits = rankByFields(q, albums, [
    (a) => a.name,
    (a) => a.description,
    (a) => (a.hashtags || []).join(' '),
  ]).slice(0, 12);

  const hashtagSet = new Set();
  for (const post of posts) (post.hashtags || []).forEach((tag) => hashtagSet.add(tag));
  for (const album of albums) (album.hashtags || []).forEach((tag) => hashtagSet.add(tag));
  const hashtagHits = rankByFields(
    q.replace(/^#/, ''),
    [...hashtagSet],
    [(tag) => tag]
  ).slice(0, 12);

  const serializedPosts = await Promise.all(
    postHits.map(async ({ item, score }) => ({ score, post: await serializePost(item, { isAdmin }) }))
  );

  return res.json({
    query: q,
    users: userHits.map(({ item, score }) => ({ score, user: limitedProfile(item) })),
    posts: serializedPosts,
    albums: albumHits.map(({ item, score }) => ({
      score,
      album: {
        id: String(item._id),
        name: item.name,
        description: item.description,
        hashtags: item.hashtags,
        owner: item.owner ? limitedProfile(item.owner) : null,
      },
    })),
    hashtags: hashtagHits.map(({ item, score }) => ({ score, hashtag: item })),
  });
});

router.get('/suggest', requireAuth, async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 1) return res.json({ suggestions: [] });
  const [users, posts, albums] = await Promise.all([
    User.find({}).select('name username profilePicture'),
    Post.find({}).select('description hashtags'),
    Album.find({}).select('name description hashtags'),
  ]);
  const suggestions = [];
  rankByFields(q, users, [(u) => u.name, (u) => u.username])
    .slice(0, 4)
    .forEach(({ item }) =>
      suggestions.push({ type: 'user', label: item.name, sublabel: `@${item.username}`, href: `/users/${item.username}` })
    );
  rankByFields(q, posts, [(p) => p.description])
    .slice(0, 3)
    .forEach(({ item }) =>
      suggestions.push({
        type: 'post',
        label: (item.description || 'Photo post').slice(0, 60),
        href: `/posts/${item._id}`,
      })
    );
  rankByFields(q, albums, [(a) => a.name, (a) => a.description])
    .slice(0, 3)
    .forEach(({ item }) =>
      suggestions.push({ type: 'album', label: item.name, href: `/albums/${item._id}` })
    );
  const tags = new Set();
  posts.forEach((p) => (p.hashtags || []).forEach((t) => tags.add(t)));
  albums.forEach((a) => (a.hashtags || []).forEach((t) => tags.add(t)));
  rankByFields(q.replace(/^#/, ''), [...tags], [(t) => t])
    .slice(0, 4)
    .forEach(({ item }) => suggestions.push({ type: 'hashtag', label: `#${item}`, href: `/search?q=${encodeURIComponent(item)}` }));
  return res.json({ suggestions: suggestions.slice(0, 10) });
});

module.exports = router;
