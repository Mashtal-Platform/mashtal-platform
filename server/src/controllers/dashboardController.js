const { Types } = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

function formatCategory(cat) {
  if (!cat || typeof cat !== 'string') return 'Plants';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function getPeriodRange(period) {
  const now = new Date();

  const days =
    period === 'week' ? 7 : period === 'month' ? 30 : 365; // fallback to year

  const currentEnd = now;
  const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const prevEnd = currentStart;
  const prevStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000);

  return { currentStart, currentEnd, prevStart, prevEnd };
}

async function aggregateTotals({ businessObjectId, start, end }) {
  const [row] = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lt: end } } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    { $match: { 'product.business': businessObjectId } },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: { $multiply: ['$items.quantity', '$items.priceAtPurchase'] },
        },
        totalSold: { $sum: '$items.quantity' },
        orderIds: { $addToSet: '$_id' },
      },
    },
  ]);

  return {
    totalRevenue: row?.totalRevenue ?? 0,
    totalSold: row?.totalSold ?? 0,
    orderCount: row?.orderIds?.length ?? 0,
  };
}

async function aggregateProductStats({ businessObjectId, start, end }) {
  return Order.aggregate([
    { $match: { createdAt: { $gte: start, $lt: end } } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    { $match: { 'product.business': businessObjectId } },
    {
      $group: {
        _id: '$product._id',
        unitsSold: { $sum: '$items.quantity' },
        revenue: {
          $sum: { $multiply: ['$items.quantity', '$items.priceAtPurchase'] },
        },
      },
    },
    { $sort: { revenue: -1 } },
  ]);
}

async function aggregateMonthlySeries({ businessObjectId, start, end }) {
  const rows = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lt: end } } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    { $match: { 'product.business': businessObjectId } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m', date: '$createdAt' },
        },
        revenue: {
          $sum: { $multiply: ['$items.quantity', '$items.priceAtPurchase'] },
        },
        orders: { $sum: '$items.quantity' }, // "orders" in UI == units sold
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill missing months between start..end with 0 values so charts look stable.
  const monthKeys = [];
  const startDate = new Date(start);
  const endDate = new Date(end);
  startDate.setDate(1);
  endDate.setDate(1);

  const cur = new Date(startDate);
  while (cur <= endDate) {
    monthKeys.push(cur.toISOString().slice(0, 7)); // YYYY-MM
    cur.setMonth(cur.getMonth() + 1);
  }

  const map = new Map((rows || []).map((r) => [r._id, r]));
  const toMonthLabel = (yyyyMm) => {
    const d = new Date(`${yyyyMm}-01T00:00:00.000Z`);
    return d.toLocaleString('en-US', { month: 'short' });
  };

  return monthKeys.map((k) => {
    const r = map.get(k);
    return {
      month: toMonthLabel(k),
      revenue: r?.revenue ?? 0,
      orders: r?.orders ?? 0,
    };
  });
}

async function getBusinessDashboard(req, res) {
  try {
    const { businessId: businessIdParam } = req.params;
    const period = req.query.period || 'month';

    // Secure: a business can only request its own analytics.
    const businessId =
      req.user?.role === 'business' ? req.user.id : businessIdParam;

    if (!businessId) return res.status(400).json({ message: 'businessId is required' });

    const businessObjectId = new Types.ObjectId(businessId);

    const safePeriod = period === 'week' || period === 'month' || period === 'year' ? period : 'month';
    const { currentStart, currentEnd, prevStart, prevEnd } = getPeriodRange(safePeriod);

    // Fetch products first so we can include zero-sales products in charts/table.
    const products = await Product.find({ business: businessObjectId })
      .select('name price image category stock')
      .lean();

    const [currentTotals, prevTotals, productStats, monthlySeries] = await Promise.all([
      aggregateTotals({ businessObjectId, start: currentStart, end: currentEnd }),
      aggregateTotals({ businessObjectId, start: prevStart, end: prevEnd }),
      aggregateProductStats({ businessObjectId, start: currentStart, end: currentEnd }),
      (async () => {
        const now = new Date();
        const start = new Date(now);
        start.setMonth(start.getMonth() - 5);
        start.setDate(1);
        return aggregateMonthlySeries({ businessObjectId, start, end: now });
      })(),
    ]);

    const statsMap = new Map((productStats || []).map((s) => [String(s._id), s]));

    const mergedProducts = (products || []).map((p) => {
      const s = statsMap.get(String(p._id));
      const sold = s?.unitsSold ?? 0;
      const revenue = s?.revenue ?? 0;
      return {
        id: String(p._id),
        name: p.name,
        price: Number(p.price) || 0,
        image: p.image || '',
        category: formatCategory(p.category),
        sold,
        revenue,
        stock: Number(p.stock) || 0,
      };
    });

    const sortedTopProducts = [...mergedProducts].sort((a, b) => b.revenue - a.revenue);
    const totalSold = currentTotals.totalSold;
    const totalRevenue = currentTotals.totalRevenue;

    const salesByProduct = sortedTopProducts.map((p) => ({
      name: p.name,
      value: p.sold,
      percentage: totalSold > 0 ? ((p.sold / totalSold) * 100).toFixed(1) : '0.0',
      productId: p.id,
    }));

    const revenueByProduct = sortedTopProducts.map((p) => ({
      name: p.name,
      value: p.revenue,
      percentage: totalRevenue > 0 ? ((p.revenue / totalRevenue) * 100).toFixed(1) : '0.0',
      productId: p.id,
    }));

    const currentConversion = currentTotals.orderCount > 0 ? currentTotals.totalSold / currentTotals.orderCount : 0;
    const prevConversion = prevTotals.orderCount > 0 ? prevTotals.totalSold / prevTotals.orderCount : 0;

    const revenueGrowth = prevTotals.totalRevenue > 0 ? ((totalRevenue - prevTotals.totalRevenue) / prevTotals.totalRevenue) * 100 : 0;
    const soldGrowth = prevTotals.totalSold > 0 ? ((totalSold - prevTotals.totalSold) / prevTotals.totalSold) * 100 : 0;
    const conversionGrowth = prevConversion > 0 ? ((currentConversion - prevConversion) / prevConversion) * 100 : 0;

    res.json({
      period: safePeriod,
      stats: {
        totalRevenue,
        totalSold,
        averageUnitsPerOrder: currentConversion,
        revenueGrowth,
        soldGrowth,
        conversionGrowth,
      },
      salesByProduct,
      revenueByProduct,
      monthlySeries,
      topProducts: sortedTopProducts,
    });
  } catch (err) {
    console.error('[Dashboard] getBusinessDashboard error:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard analytics' });
  }
}

async function getBusinessOrders(req, res) {
  try {
    const { businessId: businessIdParam } = req.params;

    const businessId =
      req.user?.role === 'business' ? req.user.id : businessIdParam;

    if (!businessId) return res.status(400).json({ message: 'businessId is required' });

    if (req.user?.role === 'business' && String(req.user.id) !== String(businessIdParam)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const businessObjectId = new Types.ObjectId(businessId);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);

    const rows = await Order.aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 500 },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      { $match: { 'product.business': businessObjectId } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'buyer',
        },
      },
      { $unwind: { path: '$buyer', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$_id',
          createdAt: { $first: '$createdAt' },
          status: { $first: '$status' },
          shipping: { $first: '$shipping' },
          buyer: {
            $first: {
              id: '$buyer._id',
              fullName: '$buyer.fullName',
              email: '$buyer.email',
              phone: '$buyer.phone',
              businessPhone: '$buyer.businessProfile.phone',
            },
          },
          items: {
            $push: {
              productId: '$product._id',
              name: '$product.name',
              image: '$product.image',
              quantity: '$items.quantity',
              priceAtPurchase: '$items.priceAtPurchase',
              lineTotal: { $multiply: ['$items.quantity', '$items.priceAtPurchase'] },
            },
          },
          sellerRevenue: {
            $sum: { $multiply: ['$items.quantity', '$items.priceAtPurchase'] },
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
    ]);

    const { normalizeOrderStatus } = require('../utils/orderStatus');

    const orders = (rows || []).map((r) => {
      const shipping = r.shipping || {};
      const buyerName =
        shipping.fullName ||
        r.buyer?.fullName ||
        'Customer';
      const buyerEmail = shipping.email || r.buyer?.email || '';
      const buyerPhone =
        shipping.phone || r.buyer?.phone || r.buyer?.businessPhone || '';
      return {
        id: String(r._id),
        createdAt: r.createdAt,
        status: normalizeOrderStatus(r.status || 'processing'),
        buyer: {
          id: r.buyer?.id ? String(r.buyer.id) : undefined,
          fullName: buyerName,
          email: buyerEmail,
          phone: buyerPhone,
          address: shipping.address || '',
          city: shipping.city || '',
        },
        items: (r.items || []).map((it) => ({
          productId: String(it.productId),
          name: it.name || 'Product',
          image: it.image || '',
          quantity: Number(it.quantity) || 0,
          priceAtPurchase: Number(it.priceAtPurchase) || 0,
          lineTotal: Number(it.lineTotal) || 0,
        })),
        sellerRevenue: Number(r.sellerRevenue) || 0,
      };
    });

    res.json({ orders });
  } catch (err) {
    console.error('[Dashboard] getBusinessOrders error:', err);
    res.status(500).json({ message: 'Failed to fetch business orders' });
  }
}

module.exports = {
  getBusinessDashboard,
  getBusinessOrders,
};

