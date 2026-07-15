const mongoose = require('mongoose');

const MoneyTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['order_seller', 'order_tax', 'business_subscription'],
      required: true,
      index: true,
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    /** null = platform / Mashtal admin */
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    toWishPhone: { type: String, default: '' },
    toWishAccount: { type: String, default: '' },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', enum: ['USD', 'LBP'] },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'canceled', 'refunded'],
      default: 'pending',
      index: true,
    },
    stripePaymentIntentId: { type: String, index: true, sparse: true },
    /** Matches Payment.legs[].legKey — prevents duplicate ledger rows for same leg */
    legKey: { type: String, index: true, sparse: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
    subscriptionPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPayment',
      index: true,
    },
    /** Human label e.g. business name */
    toLabel: { type: String, default: '' },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

MoneyTransactionSchema.index({ createdAt: -1 });
MoneyTransactionSchema.index({ type: 1, status: 1, createdAt: -1 });
MoneyTransactionSchema.index(
  { payment: 1, legKey: 1 },
  { unique: true, partialFilterExpression: { payment: { $type: 'objectId' }, legKey: { $type: 'string' } } }
);

MoneyTransactionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('MoneyTransaction', MoneyTransactionSchema);
