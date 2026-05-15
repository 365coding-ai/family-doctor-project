import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Video, Clock, MapPin, Phone, CalendarDays, CreditCard, Copy, MessageCircle, Loader2, CheckCircle, Truck, Map } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { orderApi, doctorApi, type ServiceOrder } from '../lib/api';
import { wsManager, type WsMessage } from '../lib/websocket';
import { useAuth } from '../lib/auth';

export default function OrderDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const handleChat = async () => {
    if (!order || !currentUser) return;

    if (currentUser.id === order.userId) {
      // 当前用户是患者 → 联系医生
      try {
        const doctor = await doctorApi.getDetail(order.doctorId);
        navigate(`/chat/${doctor.userId}`);
      } catch (err) {
        console.error('获取医生信息失败:', err);
      }
    } else {
      // 当前用户是医生/护士 → 联系患者
      navigate(`/chat/${order.userId}`);
    }
  };

  useEffect(() => {
    if (id) {
      loadOrder();

      // 订阅实时状态更新
      const unsubscribe = wsManager.subscribe((msg: WsMessage) => {
        if (msg.type === 'ORDER_STATUS' || msg.type === 'ORDER_PAY_SUCCESS') {
          const updatedOrder = msg.payload as ServiceOrder;
          if (updatedOrder.id === Number(id)) {
            setOrder(updatedOrder);
          }
        }
      });

      return () => unsubscribe();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await orderApi.getDetail(Number(id));
      setOrder(data);
    } catch (err) {
      console.error('加载订单失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) return null;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING': return { label: '待支付', icon: Clock, color: 'bg-amber-500' };
      case 'PAID': return { label: '待接单', icon: CreditCard, color: 'bg-blue-500' };
      case 'ACCEPTED': return { label: '护士已接单', icon: CheckCircle, color: 'bg-emerald-500' };
      case 'DEPARTED': return { label: '护士已出发', icon: Truck, color: 'bg-indigo-500' };
      case 'ARRIVED': return { label: '护士已到达', icon: MapPin, color: 'bg-purple-500' };
      case 'COMPLETED': return { label: '服务已完成', icon: CheckCircle, color: 'bg-gray-500' };
      case 'CANCELLED': return { label: '已取消', icon: Clock, color: 'bg-gray-400' };
      default: return { label: status, icon: Clock, color: 'bg-primary' };
    }
  };

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="pb-[100px] bg-background min-h-screen">
      {/* Header */}
      <header className="bg-surface flex items-center justify-between px-4 w-full h-14 z-50 sticky top-0 border-b border-surface-variant">
        <button onClick={() => navigate(-1)} className="text-primary p-2 -ml-2 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-sans text-lg font-bold text-primary">订单详情</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-4 pt-4 flex flex-col gap-4 max-w-3xl mx-auto">
        {/* Status Banner (Real-time Updated) */}
        <div className={`${statusInfo.color} rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden shadow-lg transition-colors duration-500`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8"></div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <statusInfo.icon size={24} className="text-white" />
          </div>
          <div className="relative z-10 text-white">
            <p className="font-sans text-xl font-bold">{statusInfo.label}</p>
            <p className="font-sans text-sm opacity-90 mt-0.5">
              订单编号: {order.orderNo}
            </p>
          </div>
        </div>

        {/* Order Details */}
        <section className="bg-surface-container-lowest border border-surface-variant rounded-xl p-4 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-sans text-lg font-bold text-on-surface">{order.serviceType}</h2>
              <p className="text-sm text-on-surface-variant mt-1">预约时间：{order.scheduleDate} {order.scheduleTime}</p>
            </div>
            <p className="font-sans text-xl font-bold text-primary">¥{order.amount}</p>
          </div>
          
          <div className="h-px bg-surface-variant"></div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
              <MapPin size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-on-surface">服务地址</p>
              <p className="text-xs text-on-surface-variant mt-0.5">上海市静安区静安寺街道... (示例)</p>
            </div>
          </div>
        </section>

        {/* Simulation Buttons (Only for Testing) */}
        <section className="bg-surface-container-low border border-dashed border-primary/30 rounded-xl p-4">
          <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">模拟器 (MVP 测试专用)</h4>
          <div className="flex flex-wrap gap-2">
            {['ACCEPTED', 'DEPARTED', 'ARRIVED', 'COMPLETED'].map(s => (
              <button 
                key={s}
                onClick={() => orderApi.updateStatus(order.id, s)}
                className="px-3 py-1.5 bg-white border border-primary/20 rounded-lg text-[11px] font-bold text-primary hover:bg-primary hover:text-white transition-all"
              >
                设为 {s}
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 w-full bg-surface border-t border-surface-variant px-4 py-3 pb-safe z-50 flex items-center justify-end gap-3">
        {order.status === 'PENDING' && (
          <button 
            onClick={() => orderApi.pay(order.id)}
            className="flex-1 min-h-[48px] bg-primary text-on-primary font-sans text-lg font-bold rounded-full shadow-lg active:scale-95 transition-all"
          >
            立即支付
          </button>
        )}
        <button onClick={handleChat} className="w-12 h-12 rounded-full border border-surface-variant flex items-center justify-center text-primary hover:bg-surface-container-low transition-colors">
          <MessageCircle size={24} />
        </button>
      </div>
    </div>
  );
}
