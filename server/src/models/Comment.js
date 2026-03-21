const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ['post', 'thread'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

CommentSchema.virtual('likesCount').get(function () {
  return Array.isArray(this.likes) ? this.likes.length : 0;
});

CommentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    if (Array.isArray(ret.likes)) {
      ret.likes = ret.likes.length;
    }
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Comment', CommentSchema);

