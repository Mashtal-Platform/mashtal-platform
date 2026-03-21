import React from 'react';
import { ShoppingBag, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchMyOrders, OrderDto } from '../shared/api/orders';

interface PurchasesCardProps {
  onClick?: () => void;
}

export function PurchasesCard({ onClick }: PurchasesCardProps) {
  const [orders, setOrders] = useState<OrderDto[]>([]);

  useEffect(() => {
    fetchMyOrders()
      .then(setOrders)
      .catch((err) => {
        console.error('[PurchasesCard] Failed to load orders from API:', err);
      });
  }, []);

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);

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
              {totalOrders} {totalOrders === 1 ? 'order' : 'orders'} · ${totalSpent.toFixed(2)}
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
