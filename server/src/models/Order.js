const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    priceAtPurchase: { type: Number, required: true },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [OrderItemSchema],
    status: {
      type: String,
      enum: [
        'pending',
        'processing',
        'ready',
        'completed',
        'cancelled',
        // legacy (normalized on read/update)
        'shipped',
        'delivered',
        'canceled',
      ],
      default: 'pending',
      index: true,
    },
    total: { type: Number, required: true },

    shipping: {
      fullName: { type: String },
      email: { type: String },
      phone: { type: String },
      address: { type: String },
      city: { type: String },
      postalCode: { type: String },
    },

    /** Who cancelled: buyer | admin | system */
    cancelledBy: {
      type: String,
      enum: ['buyer', 'admin', 'system', null],
      default: null,
    },
    cancelledAt: { type: Date },
    cancelFeePercent: { type: Number, default: null },
    cancelRefundPercent: { type: Number, default: null },
    statusUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    statusUpdatedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

OrderSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Order', OrderSchema);
