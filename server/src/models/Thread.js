const mongoose = require('mongoose');

const ThreadSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: [String],

    author: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    commentsCount: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },

    isLiked: { type: Boolean, default: false },
    isSaved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ThreadSchema.virtual('likesCount').get(function () {
  return this.likes.length;
});

ThreadSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    ret.likes = ret.likes.length;
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Thread', ThreadSchema);
