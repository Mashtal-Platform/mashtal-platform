const mongoose = require('mongoose');

const REPORT_REASONS = [
  'spam',
  'fake_or_misleading',
  'inappropriate_content',
  'scam_or_fraud',
  'harassment',
  'other',
];

const BusinessReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: REPORT_REASONS,
      required: true,
    },
    details: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed', 'action_taken'],
      default: 'pending',
      index: true,
    },
    adminNote: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// One report per user per business
BusinessReportSchema.index({ reporter: 1, business: 1 }, { unique: true });

module.exports = {
  BusinessReport: mongoose.model('BusinessReport', BusinessReportSchema),
  REPORT_REASONS,
};
