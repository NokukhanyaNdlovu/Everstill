const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    reason: { type: String, required: true },
    explanation: { type: String, default: '', maxlength: 400 },
    status: { type: String, enum: ['active', 'removed'], default: 'active' },
  },
  { timestamps: true }
);

reportSchema.index({ post: 1, reporter: 1, status: 1 });

module.exports = mongoose.model('Report', reportSchema);
