const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    imageUrl: { type: String, required: true },
    description: { type: String, default: '', maxlength: 1000 },
    hashtags: [{ type: String, lowercase: true, trim: true }],
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ hashtags: 1 });

module.exports = mongoose.model('Post', postSchema);
