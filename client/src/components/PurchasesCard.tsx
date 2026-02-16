import React from 'react';
import { ShoppingBag, ExternalLink } from 'lucide-react';
import { mockPurchases, getPurchaseStats } from '../data/purchaseData';

interface PurchasesCardProps {
  onClick?: () => void;
  userId?: string; // Optional: filter purchases by user
}

export function PurchasesCard({ onClick, userId }: PurchasesCardProps) {
  // Filter purchases by user if userId is provided, otherwise show all
  const userPurchases = userId 
    ? mockPurchases.filter(p => p.userId === userId)
    : mockPurchases;

  const stats = getPurchaseStats(userPurchases);

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="w-full p-6 flex items-center justify-between hover:bg-neutral-50 transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-neutral-900">
              Purchases
            </h3>
            <p className="text-sm text-neutral-500">
              {stats.totalOrders} {stats.totalOrders === 1 ? 'order' : 'orders'} · ${stats.totalSpent.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="text-neutral-400">
          <ExternalLink className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
