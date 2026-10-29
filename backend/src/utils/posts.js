const Comment = require('../models/Comment');
const Report = require('../models/Report');
const { REPORT_HIDE_THRESHOLD } = require('./constants');
const { publicAuthor } = require('./friends');

async function activeReportCount(postId) {
  return Report.countDocuments({ post: postId, status: 'active' });
}

async function serializePost(post, options = {}) {
  const { reveal = false, isAdmin = false, includeComments = false } = options;
  const reportCount = await activeReportCount(post._id);
  const hidden = reportCount >= REPORT_HIDE_THRESHOLD && !isAdmin && !reveal;
  const creator = post.creator && post.creator.username ? publicAuthor(post.creator) : { id: String(post.creator) };
  const base = {
    id: String(post._id),
    creator,
    hashtags: post.hashtags || [],
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    reportCount: isAdmin ? reportCount : hidden ? REPORT_HIDE_THRESHOLD : Math.min(reportCount, 2),
    hidden,
  };
  if (hidden) {
    return {
      ...base,
      imageUrl: null,
      description: null,
      comments: [],
      commentCount: 0,
    };
  }
  const commentQuery = Comment.find({ post: post._id }).sort({ createdAt: 1 }).populate('author', 'name username profilePicture');
  const comments = includeComments ? await commentQuery : [];
  const commentCount = includeComments ? comments.length : await Comment.countDocuments({ post: post._id });
  return {
    ...base,
    imageUrl: post.imageUrl,
    description: post.description,
    commentCount,
    comments: comments.map((comment) => ({
      id: String(comment._id),
      text: comment.text,
      isEmoji: comment.isEmoji,
      createdAt: comment.createdAt,
      author: comment.author ? publicAuthor(comment.author) : null,
    })),
  };
}

module.exports = { activeReportCount, serializePost };
