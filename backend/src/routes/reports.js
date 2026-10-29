const express = require('express');
const Post = require('../models/Post');
const Report = require('../models/Report');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { REPORT_REASONS } = require('../utils/constants');
const { serializePost } = require('../utils/posts');
const { publicAuthor } = require('../utils/friends');
const { deletePostAndComments } = require('../utils/deletePost');

const router = express.Router();

router.get('/reasons', requireAuth, (_req, res) => {
  res.json({ reasons: REPORT_REASONS });
});

router.post('/', requireAuth, async (req, res) => {
  const { postId, reason, explanation } = req.body || {};
  if (!postId || !reason) return res.status(400).json({ error: 'Post and reason are required' });
  if (!REPORT_REASONS.includes(reason)) return res.status(400).json({ error: 'Choose a valid report reason' });
  if (reason === 'Other' && !String(explanation || '').trim()) {
    return res.status(400).json({ error: 'Please add a short explanation for Other' });
  }
  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const duplicate = await Report.findOne({ post: postId, reporter: req.session.userId, status: 'active' });
  if (duplicate) return res.status(409).json({ error: 'You already reported this post' });
  await Report.create({
    post: postId,
    reporter: req.session.userId,
    reason,
    explanation: String(explanation || '').slice(0, 400),
  });
  return res.status(201).json({ message: 'Report submitted' });
});

router.get('/admin', requireAdmin, async (_req, res) => {
  const reports = await Report.find({ status: 'active' })
    .sort({ createdAt: -1 })
    .populate('reporter', 'name username profilePicture')
    .populate({ path: 'post', populate: { path: 'creator', select: 'name username profilePicture' } });

  const grouped = new Map();
  for (const report of reports) {
    if (!report.post) continue;
    const key = String(report.post._id);
    if (!grouped.has(key)) grouped.set(key, { post: report.post, reports: [] });
    grouped.get(key).reports.push({
      id: String(report._id),
      reason: report.reason,
      explanation: report.explanation,
      createdAt: report.createdAt,
      reporter: publicAuthor(report.reporter),
    });
  }

  const items = [];
  for (const group of grouped.values()) {
    items.push({
      post: await serializePost(group.post, { isAdmin: true, includeComments: true, reveal: true }),
      reportCount: group.reports.length,
      reports: group.reports,
    });
  }
  items.sort((a, b) => b.reportCount - a.reportCount);
  return res.json({ items });
});

router.delete('/admin/reports/:reportId', requireAdmin, async (req, res) => {
  const report = await Report.findById(req.params.reportId);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  report.status = 'removed';
  await report.save();
  return res.json({ message: 'Report removed' });
});

router.post('/admin/posts/:postId/clear-reports', requireAdmin, async (req, res) => {
  await Report.updateMany({ post: req.params.postId, status: 'active' }, { status: 'removed' });
  return res.json({ message: 'All active reports on this post were removed' });
});

router.delete('/admin/posts/:postId', requireAdmin, async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  await deletePostAndComments(post, { notifyOwner: true, actorId: req.session.userId });
  return res.json({ message: 'Reported post deleted' });
});

module.exports = router;
