import { useNavigate } from 'react-router-dom';
import { ClipboardList, MessageCircle, User, LogOut, ChevronRight, Bell, Calendar } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { orderApi, type ServiceOrder } from '../lib/api';

export default function DoctorDashboardScreen() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingOrders, setPendingOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      // 调用医生端专有接口获取分配给自己的订单
      const res = await orderApi.getDoctorOrders({ page: 0, size: 20 });
      setPendingOrders(res.content.filter(o => o.status !== 'CANCELLED' && o.status !== 'COMPLETED'));
    } catch (err) {
      console.error('加载订单失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Header */}
      <header className="bg-primary text-on-primary px-6 pt-12 pb-8 rounded-b-[40px] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <User size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user?.nickname} 医生</h1>
              <p className="text-sm opacity-80">欢迎回来，今天有 {pendingOrders.length} 个待办事项</p>
            </div>
          </div>
          <button onClick={logout} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="px-4 -mt-6 relative z-20 space-y-6">
        {/* Quick Stats */}
        <section className="grid grid-cols-3 gap-4">
          {[
            { label: '今日问诊', count: 8, color: 'text-primary' },
            { label: '待处理', count: pendingOrders.length, color: 'text-amber-600' },
            { label: '总评价', count: '4.9', color: 'text-emerald-600' }
          ].map(stat => (
            <div key={stat.label} className="bg-surface border border-surface-variant rounded-2xl p-4 flex flex-col items-center shadow-sm">
              <span className={`text-xl font-bold ${stat.color}`}>{stat.count}</span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">{stat.label}</span>
            </div>
          ))}
        </section>

        {/* Pending Orders */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-lg font-bold text-on-surface">待服务订单</h2>
            <button className="text-primary text-sm font-bold">查看全部</button>
          </div>
          
          {loading ? (
            <div className="py-10 flex justify-center"><Loader /></div>
          ) : pendingOrders.length === 0 ? (
            <div className="bg-surface-container-low rounded-2xl p-8 text-center text-on-surface-variant">
              <ClipboardList size={40} className="mx-auto opacity-20 mb-3" />
              <p>暂无待处理订单</p>
            </div>
          ) : (
            pendingOrders.map(order => (
              <div 
                key={order.id}
                onClick={() => navigate(`/order/${order.id}`)}
                className="bg-surface border border-surface-variant rounded-2xl p-4 flex flex-col gap-3 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <span className="px-2 py-1 bg-primary-container text-on-primary-container text-[10px] font-bold rounded">
                    {order.serviceType}
                  </span>
                  <span className="text-xs text-on-surface-variant font-bold">{order.scheduleDate} {order.scheduleTime}</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-outline">
                         <User size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">患者: 138****0000</p>
                        <p className="text-xs text-on-surface-variant">地址: 建国路88号...</p>
                      </div>
                   </div>
                   <ChevronRight size={20} className="text-outline" />
                </div>
              </div>
            ))
          )}
        </section>

        {/* Menu Grid */}
        <section className="grid grid-cols-2 gap-4 pb-10">
          <button className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
               <Calendar size={24} />
            </div>
            <span className="text-sm font-bold text-emerald-900">排班管理</span>
          </button>
          <button onClick={() => navigate('/messages')} className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-200">
               <MessageCircle size={24} />
            </div>
            <span className="text-sm font-bold text-blue-900">我的消息</span>
          </button>
        </section>
      </main>
    </div>
  );
}

const Loader = () => (
  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
);
