import React from 'react';
import { AdminMetrics } from '../../types/admin';
import { DollarSign, ShoppingBag, Package, AlertTriangle, Users } from 'lucide-react';

interface AdminMetricsCardsProps {
  metrics: AdminMetrics;
}

export const AdminMetricsCards: React.FC<AdminMetricsCardsProps> = ({ metrics }) => {
  const cards = [
    {
      label: 'Total Revenue',
      value: `$${metrics.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'From settled customer orders',
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
      badge: 'Settled',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      borderGlow: 'hover:border-emerald-500/40',
    },
    {
      label: 'Total Orders',
      value: metrics.total_orders.toString(),
      subtitle: `${metrics.recent_orders.length} recent orders logged`,
      icon: <ShoppingBag className="w-5 h-5 text-indigo-400" />,
      badge: 'All-time',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      borderGlow: 'hover:border-indigo-500/40',
    },
    {
      label: 'Catalogue Products',
      value: `${metrics.active_products} / ${metrics.total_products}`,
      subtitle: 'Active vs Total registered',
      icon: <Package className="w-5 h-5 text-purple-400" />,
      badge: 'Inventory',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      borderGlow: 'hover:border-purple-500/40',
    },
    {
      label: 'Low Stock Alerts',
      value: metrics.low_stock_products.toString(),
      subtitle: `${metrics.out_of_stock_products} completely depleted`,
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      badge: metrics.low_stock_products > 0 ? 'Action Needed' : 'Healthy',
      badgeColor:
        metrics.low_stock_products > 0
          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          : 'bg-slate-800 text-slate-400 border-slate-700',
      borderGlow: metrics.low_stock_products > 0 ? 'border-amber-500/30 hover:border-amber-500/60' : 'hover:border-slate-700',
    },
    {
      label: 'Registered Customers',
      value: metrics.registered_customers.toString(),
      subtitle: 'Verified user accounts',
      icon: <Users className="w-5 h-5 text-sky-400" />,
      badge: 'Accounts',
      badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      borderGlow: 'hover:border-sky-500/40',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className={`p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm transition-all duration-200 ${c.borderGlow} flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {c.label}
              </span>
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
                {c.icon}
              </div>
            </div>
            <div className="text-2xl font-black text-white tracking-tight">{c.value}</div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
            <span className="text-slate-400 truncate max-w-[130px]">{c.subtitle}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.badgeColor}`}>
              {c.badge}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
