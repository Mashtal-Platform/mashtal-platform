const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    category: {
      type: String,
      enum: ['seeds', 'tools', 'fertilizers', 'plants', 'irrigation'],
      required: true,
    },
    stock: { type: Number, default: 0 },
    rating: { type: Number, default: 3.5 },
    reviewsCount: { type: Number, default: 0 },
    // Optional external businessId to align with existing mock data
    businessExternalId: { type: String },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ business: 1, createdAt: -1 });

ProductSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Product', ProductSchema);

