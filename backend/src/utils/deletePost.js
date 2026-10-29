const Comment = require('../models/Comment');
const Report = require('../models/Report');
const Album = require('../models/Album');
const Notification = require('../models/Notification');

async function deletePostAndComments(post, { notifyOwner = false, actorId } = {}) {
  await Comment.deleteMany({ post: post._id });
  await Report.deleteMany({ post: post._id });
  await Album.updateMany({ posts: post._id }, { $pull: { posts: post._id } });
  if (notifyOwner && String(post.creator) !== String(actorId)) {
    await Notification.create({
      user: post.creator,
      type: 'post_deleted',
      message: 'An administrator removed one of your posts.',
    });
  }
  await post.deleteOne();
}

module.exports = { deletePostAndComments };
