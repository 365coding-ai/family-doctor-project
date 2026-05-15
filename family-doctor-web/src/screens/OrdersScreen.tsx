import { Link } from 'react-router-dom';
import { Video, Stethoscope, Clock, Car, MapPin, Loader2, AlertCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { orderApi, type ServiceOrder } from '../lib/api';
import { cn } from '../lib/utils';

const tabs = [
  { label: '待服务', value: 'PENDING,PAID,ACCEPTED,DEPARTED,ARRIVED' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' }
];

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      // 后端逻辑：传多个状态逗号分隔，或者在前端过滤
      // 这里简单处理：获取所有订单并在前端根据 Tab 逻辑过滤
      const res = await orderApi.getMyOrders({ page: 0, size: 50 });
      
      const filtered = res.content.filter(order => {
        const statusList = activeTab.value.split(',');
        return statusList.includes(order.status);
      });
      
      setOrders(filtered);
    } catch (err) {
      console.error('加载订单失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING': return { label: '待支付', color: 'text-amber-600 bg-amber-50' };
      case 'PAID': return { label: '待接单', color: 'text-blue-600 bg-blue-50' };
      case 'ACCEPTED': return { label: '已接单', color: 'text-emerald-600 bg-emerald-50' };
      case 'DEPARTED': return { label: '护士已出发', color: 'text-indigo-600 bg-indigo-50' };
      case 'ARRIVED': return { label: '护士已到达', color: 'text-purple-600 bg-purple-50' };
      case 'COMPLETED': return { label: '已完成', color: 'text-gray-600 bg-gray-50' };
      case 'CANCELLED': return { label: '已取消', color: 'text-red-600 bg-red-50' };
      default: return { label: status, color: 'text-primary bg-primary-container' };
    }
  };

  return (
    <div className="pb-24 bg-background min-h-screen">
      {/* Header */}
      <header className="bg-surface flex items-center justify-between px-4 w-full h-14 z-50 sticky top-0 border-b border-surface-variant">
        <h1 className="font-sans text-xl font-bold text-primary flex-1 text-center">我的订单</h1>
      </header>

      {/* Tabs */}
      <nav className="sticky top-14 z-40 bg-surface border-b border-surface-variant">
        <ul className="flex w-full px-4 justify-around">
          {tabs.map((tab) => (
            <li
              key={tab.label}
              onClick={() => setActiveTab(tab)}
              className="py-3 relative cursor-pointer"
            >
              <span className={cn(
                "font-sans text-base font-semibold transition-colors",
                activeTab.label === tab.label ? "text-primary" : "text-on-surface-variant"
              )}>{tab.label}</span>
              {activeTab.label === tab.label && (
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full"></div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Order List */}
      <main className="px-4 py-4 flex flex-col gap-4 max-w-3xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <AlertCircle className="w-12 h-12 opacity-20 mb-2" />
            <p>暂无相关订单</p>
          </div>
        ) : (
          orders.map((order) => {
            const status = getStatusDisplay(order.status);
            return (
              <Link 
                key={order.id} 
                to={`/order/${order.id}`}
                className="bg-surface-container-lowest rounded-2xl border border-surface-variant p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {order.serviceType.includes('视频') ? <Video size={18} className="text-primary" /> : <Stethoscope size={18} className="text-secondary" />}
                    <span className="font-sans text-lg font-bold">{order.serviceType}</span>
                  </div>
                  <span className={cn("text-[10px] font-bold px-2 py-1 rounded", status.color)}>
                    {status.label}
                  </span>
                </div>

                <div className="flex gap-3">
                  <div className="w-14 h-14 bg-surface-container rounded-xl flex items-center justify-center shrink-0">
                    <UserIcon />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-on-surface">预约时间: {order.scheduleDate} {order.scheduleTime}</p>
                    <p className="text-xs text-on-surface-variant mt-1">订单号: {order.orderNo}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-surface-variant">
                  <span className="text-xs text-on-surface-variant">总价: <span className="text-on-surface font-bold">¥{order.amount}</span></span>
                  <div className="flex gap-2">
                    <button className="px-4 py-1.5 rounded-full border border-outline text-xs font-bold text-on-surface">查看详情</button>
                    {order.status === 'PENDING' && (
                      <button className="px-4 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold">立即支付</button>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </main>
    </div>
  );
}

const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-outline">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
