/**
 * Localized in-app notification message templates (en / ar).
 */

function pick(lang, en, ar) {
  return lang === 'ar' ? ar : en;
}

function buildNotificationMessage(n, senderName, lang) {
  const L = lang === 'ar' ? 'ar' : 'en';
  const name = senderName || (L === 'ar' ? 'شخص ما' : 'Someone');
  const custom = n.message && String(n.message).trim();
  if (custom) return custom;

  switch (n.type) {
    case 'follow':
      return pick(
        L,
        `${name} started following you.`,
        `${name} بدأ بمتابعتك.`
      );
    case 'like_post':
      return pick(L, `${name} liked your post.`, `${name} أعجب بمنشورك.`);
    case 'like_thread':
      return pick(L, `${name} liked your thread.`, `${name} أعجب بنقاشك.`);
    case 'comment_post':
      return pick(
        L,
        `${name} commented on your post.`,
        `${name} علّق على منشورك.`
      );
    case 'comment_thread':
      return pick(
        L,
        `${name} commented on your thread.`,
        `${name} علّق على نقاشك.`
      );
    case 'order_created':
      return senderName
        ? pick(
            L,
            `${name} placed an order with you.`,
            `${name} قدم طلباً لديك.`
          )
        : pick(
            L,
            'Your order has been created successfully.',
            'تم إنشاء طلبك بنجاح.'
          );
    case 'payment_received':
      return senderName
        ? pick(
            L,
            `New payment from ${name}. Open the transaction in Admin.`,
            `دفعة جديدة من ${name}. افتح المعاملة في لوحة الإدارة.`
          )
        : pick(
            L,
            'A new payment was received. Open the transaction in Admin.',
            'تم استلام دفعة جديدة. افتح المعاملة في لوحة الإدارة.'
          );
    case 'business_report':
      return senderName
        ? pick(
            L,
            `${name} reported a business. Review it in Admin → Reports.`,
            `${name} أبلغ عن نشاط تجاري. راجع ذلك في الإدارة → البلاغات.`
          )
        : pick(
            L,
            'A business was reported. Review it in Admin → Reports.',
            'تم الإبلاغ عن نشاط تجاري. راجع ذلك في الإدارة → البلاغات.'
          );
    case 'admin_warning':
      return pick(
        L,
        'An administrator sent you a warning about your business account. Please review your profile and content.',
        'أرسل لك أحد المسؤولين تحذيراً بخصوص حساب نشاطك التجاري. يرجى مراجعة ملفك ومحتواك.'
      );
    case 'subscription_expiring':
      return pick(
        L,
        'Your Mashtal business subscription ends tomorrow. Renew payment to keep selling.',
        'ينتهي اشتراك نشاطك التجاري في مشتل غداً. جدّد الدفع للاستمرار في البيع.'
      );
    case 'subscription_expired':
      return pick(
        L,
        'Your Mashtal business subscription has ended. Renew payment to list products again.',
        'انتهى اشتراك نشاطك التجاري في مشتل. جدّد الدفع لإدراج المنتجات مجدداً.'
      );
    case 'chat_message': {
      const count = n.messageCount && n.messageCount > 0 ? n.messageCount : 1;
      if (count === 1) {
        return pick(L, `${name} sent you a message.`, `${name} أرسل لك رسالة.`);
      }
      return pick(
        L,
        `${name} has sent you ${count} messages.`,
        `${name} أرسل لك ${count} رسائل.`
      );
    }
    case 'order_cancelled':
      return pick(
        L,
        `${name} cancelled an order. A 25% fee applies; 75% will be refunded.`,
        `${name} ألغى طلباً. تُطبَّق رسوم إلغاء 25% ويُسترد 75%.`
      );
    case 'order_cancelled_admin':
      return pick(
        L,
        `${name} cancelled an order. Open Admin → Orders to review.`,
        `${name} ألغى طلباً. افتح الإدارة → الطلبات للمراجعة.`
      );
    case 'order_status_updated':
      return pick(
        L,
        'Your order status was updated.',
        'تم تحديث حالة طلبك.'
      );
    case 'order_ready_admin':
      return pick(
        L,
        `${name} marked an order as ready for delivery. Open Admin → Orders to review.`,
        `${name} عيّن طلباً كجاهز للتسليم. افتح الإدارة → الطلبات للمراجعة.`
      );
    case 'product_review':
      return pick(
        L,
        `${name} left a review on your product.`,
        `${name} ترك تقييماً على منتجك.`
      );
    default:
      return pick(L, 'You have a new notification.', 'لديك إشعار جديد.');
  }
}

module.exports = { buildNotificationMessage };
