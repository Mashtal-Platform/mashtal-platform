import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, X, Percent, Bell } from 'lucide-react';
import { Button } from './ui/button';

interface CancelOrderModalProps {
  isOpen: boolean;
  feeAmount: string;
  refundAmount: string;
  orderTotal?: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelOrderModal({
  isOpen,
  feeAmount,
  refundAmount,
  orderTotal,
  busy = false,
  onClose,
  onConfirm,
}: CancelOrderModalProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={busy ? undefined : onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-order-title"
      >
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-amber-50 border border-amber-100">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 id="cancel-order-title" className="text-lg font-semibold text-neutral-900">
                {t('purchaseHistory.cancelModalTitle')}
              </h2>
              <p className="text-sm text-neutral-500 mt-0.5">
                {t('purchaseHistory.cancelModalSubtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
            aria-label={t('common.cancel')}
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {orderTotal ? (
            <p className="text-sm text-neutral-600">
              {t('purchaseHistory.cancelModalOrderTotal', { total: orderTotal })}
            </p>
          ) : null}

          <div className="rounded-xl border border-neutral-200 overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-50 border-b border-red-100">
              <div className="flex items-center gap-2 text-sm font-medium text-red-900">
                <Percent className="w-4 h-4 text-red-600" />
                {t('purchaseHistory.cancelModalFeeLabel')}
              </div>
              <span className="text-sm font-semibold text-red-700">${feeAmount}</span>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-green-50">
              <div className="flex items-center gap-2 text-sm font-medium text-green-900">
                <Percent className="w-4 h-4 text-green-600" />
                {t('purchaseHistory.cancelModalRefundLabel')}
              </div>
              <span className="text-sm font-semibold text-green-700">${refundAmount}</span>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <Bell className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
            <p className="text-sm text-neutral-600 leading-relaxed">
              {t('purchaseHistory.cancelModalNotify')}
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={busy}
              className="flex-1"
            >
              {t('purchaseHistory.cancelModalKeep')}
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="flex-1 bg-red-600 text-white hover:bg-red-700"
            >
              {busy ? '…' : t('purchaseHistory.cancelModalConfirm')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
