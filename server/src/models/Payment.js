const mongoose = require('mongoose');

const PaymentCartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    priceAtPurchase: { type: Number, required: true, min: 0 },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { _id: false }
);

const PaymentLegSchema = new mongoose.Schema(
  {
    legKey: { type: String, required: true },
    type: {
      type: String,
      enum: ['order_seller', 'order_tax'],
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    toLabel: { type: String, default: '' },
    toWishPhone: { type: String, default: '' },
    toWishAccount: { type: String, default: '' },
    amount: { type: Number, required: true, min: 0 },
    stripePaymentIntentId: { type: String, index: true, sparse: true },
    status: {
      type: String,
      enum: ['initiated', 'processing', 'succeeded', 'failed', 'canceled', 'refunded'],
      default: 'initiated',
    },
  },
  { _id: true }
);

const PaymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    /** Legacy single-intent field (kept for older payments) */
    stripePaymentIntentId: {
      type: String,
      required: false,
      index: true,
      unique: true,
      sparse: true,
    },

    idempotencyKey: { type: String, required: true, index: true, unique: true },

    status: {
      type: String,
      enum: [
        'initiated',
        'processing',
        'succeeded',
        'failed',
        'canceled',
        'refunded',
      ],
      default: 'initiated',
      index: true,
    },

    currency: { type: String, default: 'USD' },

    amountSubtotal: { type: Number, required: true },
    amountTax: { type: Number, required: true },
    amountShipping: { type: Number, required: false, default: 0 },
    amountTotal: { type: Number, required: true },

    cart: { type: [PaymentCartItemSchema], required: true },
    legs: { type: [PaymentLegSchema], default: [] },

    shipping: {
      fullName: { type: String, required: false },
      email: { type: String, required: false },
      phone: { type: String, required: false },
      address: { type: String, required: false },
      city: { type: String, required: false },
      postalCode: { type: String, required: false },
    },

    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true }
);

PaymentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Payment', PaymentSchema);
