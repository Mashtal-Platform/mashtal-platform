const mongoose = require('mongoose');
const { BusinessReport, REPORT_REASONS } = require('../models/BusinessReport');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { respondIfUnsafe } = require('../utils/assertContentSafe');

const REASON_LABELS = {
  spam: 'Spam or unwanted promotion',
  fake_or_misleading: 'Fake or misleading business',
  inappropriate_content: 'Inappropriate content',
  scam_or_fraud: 'Scam or fraud',
  harassment: 'Harassment or abuse',
  other: 'Other',
};

function shapeReport(doc) {
  if (!doc) return null;
  const r = doc.toObject ? doc.toObject() : doc;
  const business = r.business && typeof r.business === 'object' ? r.business : null;
  const reporter = r.reporter && typeof r.reporter === 'object' ? r.reporter : null;
  const bp = business?.businessProfile || {};

  return {
    id: r._id.toString(),
    reason: r.reason,
    reasonLabel: REASON_LABELS[r.reason] || r.reason,
    details: r.details || '',
    status: r.status,
    adminNote: r.adminNote || '',
    createdAt: r.createdAt,
    resolvedAt: r.resolvedAt || null,
    business: business
      ? {
          id: business._id.toString(),
          fullName: business.fullName || '',
          email: business.email || '',
          companyName: bp.companyName || business.fullName || '',
          avatar: business.avatar || '',
          role: business.role,
        }
      : { id: String(r.business) },
    reporter: reporter
      ? {
          id: reporter._id.toString(),
          fullName: reporter.fullName || '',
          email: reporter.email || '',
          avatar: reporter.avatar || '',
        }
      : { id: String(r.reporter) },
    resolvedBy: r.resolvedBy ? String(r.resolvedBy._id || r.resolvedBy) : null,
  };
}

/** POST /api/reports/business/:businessId — one report per user */
async function createBusinessReport(req, res) {
  try {
    const reporterId = req.user.id;
    const businessId = req.params.businessId;
    const reason = String(req.body?.reason || '').trim();
    const details = req.body?.details != null ? String(req.body.details).trim().slice(0, 1000) : '';

    if (!REPORT_REASONS.includes(reason)) {
      return res.status(400).json({
        message: 'Invalid report reason',
        allowedReasons: REPORT_REASONS,
        reasonLabels: REASON_LABELS,
      });
    }

    if (details) {
      const allowed = await respondIfUnsafe(res, { text: details });
      if (!allowed) return;
    }

    const business = await User.findById(businessId);
    if (!business || business.role !== 'business') {
      return res.status(404).json({ message: 'Business not found' });
    }
    if (String(business._id) === String(reporterId)) {
      return res.status(400).json({ message: 'You cannot report your own business' });
    }

    const existing = await BusinessReport.findOne({ reporter: reporterId, business: businessId });
    if (existing) {
      return res.status(409).json({
        message: 'You have already reported this business',
        report: shapeReport(existing),
      });
    }

    const report = await BusinessReport.create({
      reporter: reporterId,
      business: businessId,
      reason,
      details,
      status: 'pending',
    });

    // Notify all admins
    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    if (admins.length) {
      await Notification.insertMany(
        admins.map((a) => ({
          recipient: a._id,
          sender: reporterId,
          type: 'business_report',
          entityId: report._id,
        }))
      );
    }

    const populated = await BusinessReport.findById(report._id)
      .populate('business', 'fullName email avatar role businessProfile')
      .populate('reporter', 'fullName email avatar')
      .lean();

    res.status(201).json({ report: shapeReport(populated) });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'You have already reported this business' });
    }
    console.error('[Reports] createBusinessReport error:', err);
    res.status(500).json({ message: 'Failed to submit report' });
  }
}

/** GET /api/reports/business/:businessId/mine */
async function getMyBusinessReport(req, res) {
  try {
    const report = await BusinessReport.findOne({
      reporter: req.user.id,
      business: req.params.businessId,
    }).lean();
    res.json({
      reported: !!report,
      report: report ? shapeReport(report) : null,
      reasons: REPORT_REASONS.map((id) => ({ id, label: REASON_LABELS[id] })),
    });
  } catch (err) {
    console.error('[Reports] getMyBusinessReport error:', err);
    res.status(500).json({ message: 'Failed to fetch report status' });
  }
}

/** GET /api/reports/reasons */
async function listReportReasons(_req, res) {
  res.json({
    reasons: REPORT_REASONS.map((id) => ({ id, label: REASON_LABELS[id] })),
  });
}

/** GET /api/admin/reports */
async function listReports(req, res) {
  try {
    const status = req.query?.status ? String(req.query.status) : '';
    const filter = {};
    if (status && ['pending', 'reviewed', 'dismissed', 'action_taken'].includes(status)) {
      filter.status = status;
    }
    const reports = await BusinessReport.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('business', 'fullName email avatar role businessProfile')
      .populate('reporter', 'fullName email avatar')
      .populate('resolvedBy', 'fullName email')
      .lean();

    const businessIds = [
      ...new Set(
        reports
          .map((r) => (r.business && r.business._id ? r.business._id : r.business))
          .filter(Boolean)
          .map((id) => String(id))
      ),
    ].map((id) => new mongoose.Types.ObjectId(id));

    const countRows = businessIds.length
      ? await BusinessReport.aggregate([
          { $match: { business: { $in: businessIds } } },
          {
            $group: {
              _id: '$business',
              reportsCount: { $sum: 1 },
              pendingReportsCount: {
                $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
              },
            },
          },
        ])
      : [];
    const countsByBusiness = new Map(
      countRows.map((row) => [
        String(row._id),
        {
          reportsCount: row.reportsCount || 0,
          pendingReportsCount: row.pendingReportsCount || 0,
        },
      ])
    );

    res.json({
      reports: reports.map((doc) => {
        const shaped = shapeReport(doc);
        const bid = shaped?.business?.id;
        const counts = (bid && countsByBusiness.get(bid)) || {
          reportsCount: 0,
          pendingReportsCount: 0,
        };
        return {
          ...shaped,
          business: shaped.business
            ? {
                ...shaped.business,
                reportsCount: counts.reportsCount,
                pendingReportsCount: counts.pendingReportsCount,
              }
            : shaped.business,
        };
      }),
      pendingCount: await BusinessReport.countDocuments({ status: 'pending' }),
    });
  } catch (err) {
    console.error('[Reports] listReports error:', err);
    res.status(500).json({ message: 'Failed to list reports' });
  }
}

/**
 * POST /api/admin/reports/:id/resolve
 * body: { action: 'dismiss' | 'notify' | 'delete', message?: string, adminNote?: string }
 */
async function resolveReport(req, res) {
  try {
    const { id } = req.params;
    const action = String(req.body?.action || '').trim();
    const adminNote = req.body?.adminNote != null ? String(req.body.adminNote).trim().slice(0, 1000) : '';
    const customMessage =
      req.body?.message != null ? String(req.body.message).trim().slice(0, 1000) : '';

    if (!['dismiss', 'notify', 'delete'].includes(action)) {
      return res.status(400).json({ message: 'action must be dismiss, notify, or delete' });
    }

    const report = await BusinessReport.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const business = await User.findById(report.business);
    if (!business && action !== 'dismiss') {
      // Business already gone — mark dismissed
      report.status = 'dismissed';
      report.adminNote = adminNote || 'Business account no longer exists';
      report.resolvedBy = req.user.id;
      report.resolvedAt = new Date();
      await report.save();
      return res.json({ ok: true, report: shapeReport(report), businessDeleted: true });
    }

    if (action === 'dismiss') {
      report.status = 'dismissed';
      report.adminNote = adminNote || 'Dismissed by admin';
      report.resolvedBy = req.user.id;
      report.resolvedAt = new Date();
      await report.save();
      return res.json({ ok: true, report: shapeReport(await report.populate([
        { path: 'business', select: 'fullName email avatar role businessProfile' },
        { path: 'reporter', select: 'fullName email avatar' },
      ])) });
    }

    if (action === 'notify') {
      if (!business) return res.status(404).json({ message: 'Business not found' });
      const reasonLabel = REASON_LABELS[report.reason] || report.reason;
      const message =
        customMessage ||
        `Your business account was reported for: ${reasonLabel}. Please review your listings and profile content to stay within Mashtal guidelines.`;

      await Notification.create({
        recipient: business._id,
        sender: req.user.id,
        type: 'admin_warning',
        entityId: report._id,
        message,
      });

      report.status = 'reviewed';
      report.adminNote = adminNote || 'Warning notification sent';
      report.resolvedBy = req.user.id;
      report.resolvedAt = new Date();
      await report.save();

      return res.json({
        ok: true,
        notified: true,
        report: shapeReport(
          await BusinessReport.findById(report._id)
            .populate('business', 'fullName email avatar role businessProfile')
            .populate('reporter', 'fullName email avatar')
            .lean()
        ),
      });
    }

    if (action === 'delete') {
      if (!business) return res.status(404).json({ message: 'Business not found' });
      if (business.role === 'admin') {
        return res.status(400).json({ message: 'Cannot delete an admin account via reports' });
      }
      if (String(business._id) === String(req.user.id)) {
        return res.status(400).json({ message: 'You cannot delete your own account' });
      }

      const deletedId = business._id.toString();
      await User.findByIdAndDelete(business._id);

      // Close related open reports on this business
      await BusinessReport.updateMany(
        { business: deletedId, status: 'pending' },
        {
          $set: {
            status: 'action_taken',
            adminNote: adminNote || 'Business account deleted by admin',
            resolvedBy: req.user.id,
            resolvedAt: new Date(),
          },
        }
      );

      report.status = 'action_taken';
      report.adminNote = adminNote || 'Business account deleted by admin';
      report.resolvedBy = req.user.id;
      report.resolvedAt = new Date();
      await report.save();

      return res.json({ ok: true, deleted: true, businessId: deletedId, report: shapeReport(report) });
    }

    res.status(400).json({ message: 'Unknown action' });
  } catch (err) {
    console.error('[Reports] resolveReport error:', err);
    res.status(500).json({ message: 'Failed to resolve report' });
  }
}

module.exports = {
  createBusinessReport,
  getMyBusinessReport,
  listReportReasons,
  listReports,
  resolveReport,
  REASON_LABELS,
  REPORT_REASONS,
};
