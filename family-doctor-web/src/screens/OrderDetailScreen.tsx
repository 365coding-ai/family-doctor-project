import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Video, Clock, MapPin, Phone, CalendarDays, CreditCard, Copy, MessageCircle, Loader2, CheckCircle, Truck, Map } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { orderApi, serviceItemApi, nurseApi, type ServiceOrder, type ServiceItem, type Nurse } from '../lib/api';
import { wsManager, type WsMessage } from '../lib/websocket';
import { useAuth } from '../lib/auth';

export default function OrderDetailScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user: currentUser } = useAuth();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [serviceItem, setServiceItem] = useState<ServiceItem | null>(null);
  const [nurse, setNurse] = useState<Nurse | null>(null);
  const [loading, setLoading] = useState(true);

  // 从 navigation state 或 sessionStorage 获取，保障刷新页面依然有效
  const orderId = (state?.orderId as string | undefined) || sessionStorage.getItem('fd_active_order_id') || '';

  /** 进入图文咨询房间 */
  const handleEnterConsult = async () => {
    if (!order?.roomId) return;
    navigate('/chat', { state: { roomId: order.roomId } });
  };


  useEffect(() => {
    if (orderId) {
      // 记录到 sessionStorage，方便刷新页面时还原
      sessionStorage.setItem('fd_active_order_id', orderId);
      loadOrder(orderId);

      // 订阅实时状态更新
      const unsubscribe = wsManager.subscribe((msg: WsMessage) => {
        if (msg.type === 'ORDER_STATUS' || msg.type === 'ORDER_PAY_SUCCESS') {
          const updatedOrder = msg.payload as ServiceOrder;
          if (String(updatedOrder.id) === orderId || updatedOrder.orderNo === orderId) {
            setOrder(updatedOrder);
          }
        }
      });

      return () => unsubscribe();
    } else {
      // 如果完全没有订单标识，退回到订单列表页
      navigate('/orders');
    }
  }, [orderId]);

  const loadOrder = async (targetId: string) => {
    try {
      setLoading(true);
      const data = await orderApi.getDetail(targetId);
      setOrder(data);
      if (data.serviceType === 'HOME_NURSING' && data.serviceItemId) {
        serviceItemApi.getDetail(data.serviceItemId).then(setServiceItem).catch(console.error);
      }
      if (data.serviceType === 'HOME_NURSING' && data.nurseId) {
        nurseApi.getById(data.nurseId).then(setNurse).catch(console.error);
      }
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

  const isOnlineConsult = order.serviceType === 'GRAPHIC_CONSULT' || order.serviceType === 'VIDEO_CONSULT';

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING': return { label: '待支付', icon: Clock, color: 'bg-amber-500' };
      case 'PAID': return { label: isOnlineConsult ? '待接诊' : '待接单', icon: isOnlineConsult ? Clock : CreditCard, color: 'bg-blue-500' };
      case 'ACCEPTED': return { label: isOnlineConsult ? '咨询中' : '服务人员已接单', icon: isOnlineConsult ? MessageCircle : CheckCircle, color: 'bg-emerald-500' };
      case 'DEPARTED': return { label: isOnlineConsult ? '咨询中' : '服务人员已出发', icon: isOnlineConsult ? MessageCircle : Truck, color: 'bg-indigo-500' };
      case 'ARRIVED': return { label: isOnlineConsult ? '咨询中' : '服务人员已到达', icon: isOnlineConsult ? MessageCircle : MapPin, color: 'bg-purple-500' };
      case 'COMPLETED': return { label: isOnlineConsult ? '咨询已结束' : '服务已完成', icon: CheckCircle, color: 'bg-gray-500' };
      case 'CANCELLED': return { label: '已取消', icon: Clock, color: 'bg-gray-400' };
      default: return { label: status, icon: Clock, color: 'bg-primary' };
    }
  };

  const serviceLabel = (type: string) => {
    switch (type) {
      case 'GRAPHIC_CONSULT': return '图文咨询';
      case 'VIDEO_CONSULT': return '视频问诊';
      case 'HOME_VISIT': return '上门医生';
      case 'HOME_NURSING': return '上门护理';
      default: return type;
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
              <h2 className="font-sans text-lg font-bold text-on-surface">{serviceLabel(order.serviceType)}</h2>
              <p className="text-sm text-on-surface-variant mt-1">预约时间：{order.scheduleDate || '尽快安排'} {order.scheduleTime || ''}</p>
            </div>
            <p className="font-sans text-xl font-bold text-primary">¥{order.amount}</p>
          </div>
          
          <div className="h-px bg-surface-variant"></div>

          {order.serviceType === 'HOME_NURSING' && serviceItem && (
            <div className="space-y-2 py-2">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">服务项目</span>
                <span className="font-bold text-on-surface">{serviceItem.itemName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">服务规格</span>
                <span className="font-bold text-on-surface">
                  {serviceItem.specs?.find(s => s.id === order.specId)?.specName || '标准服务'}
                </span>
              </div>
              {order.trafficFee !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">上门交通费</span>
                  <span className="font-bold text-on-surface">¥{order.trafficFee}</span>
                </div>
              )}
            </div>
          )}
          
          {order.serviceType === 'HOME_NURSING' && nurse && (
            <>
              <div className="h-px bg-surface-variant"></div>
              <div className="flex items-center gap-3 py-1">
                <img src={nurse.avatarUrl || `https://ui-avatars.com/api/?name=${nurse.name}`} alt={nurse.name} className="w-10 h-10 rounded-full object-cover border border-surface-variant" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-on-surface">{nurse.name} <span className="text-xs font-normal text-on-surface-variant ml-1">{nurse.title}</span></p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{nurse.hospital} · {nurse.department}</p>
                </div>
              </div>
            </>
          )}

          {!isOnlineConsult && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                <MapPin size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-on-surface">服务地址</p>
                <p className="text-xs text-on-surface-variant mt-0.5">上海市静安区静安寺街道... (示例)</p>
              </div>
            </div>
          )}
        </section>

        {/* Simulation Buttons (Only for Testing) */}
        <section className="bg-surface-container-low border border-dashed border-primary/30 rounded-xl p-4">
          <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">模拟器 (MVP 测试专用)</h4>
          <div className="flex flex-wrap gap-2">
            {(isOnlineConsult
              ? [{ key: 'ACCEPTED', label: '设为 咨询中' }, { key: 'COMPLETED', label: '设为 已结束' }]
              : [{ key: 'ACCEPTED', label: '设为 已接单' }, { key: 'DEPARTED', label: '设为 已出发' }, { key: 'ARRIVED', label: '设为 已到达' }, { key: 'COMPLETED', label: '设为 已完成' }]
            ).map(s => (
              <button 
                key={s.key}
                onClick={() => orderApi.updateStatus(order.id, s.key)}
                className="px-3 py-1.5 bg-white border border-primary/20 rounded-lg text-[11px] font-bold text-primary hover:bg-primary hover:text-white transition-all"
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>

        {/* 图文咨询入口提示 (已支付或咨询中 + 图文咨询订单) */}
        {order.serviceType === 'GRAPHIC_CONSULT' && ['PAID', 'ACCEPTED'].includes(order.status) && order.roomId && (
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <MessageCircle size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-sans text-sm font-bold text-blue-900">
                  {order.status === 'ACCEPTED' ? '咨询进行中' : '图文咨询已开通'}
                </p>
                <p className="font-sans text-xs text-blue-700 mt-1">
                  {order.status === 'ACCEPTED'
                    ? '医生已接诊，您可以进入咨询房间继续沟通。'
                    : '订单已支付成功，您可以立即进入咨询房间与医生沟通。咨询有效期24小时，期间可无限发送消息。'}
                </p>
                {order.expireAt && (
                  <p className="font-sans text-[11px] text-blue-500 mt-1.5">
                    有效期至: {new Date(order.expireAt).toLocaleString('zh-CN')}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
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
        {order.serviceType === 'GRAPHIC_CONSULT' && ['PAID', 'ACCEPTED'].includes(order.status) && order.roomId && (
          <button
            onClick={handleEnterConsult}
            className="flex-1 min-h-[48px] bg-primary text-on-primary font-sans text-lg font-bold rounded-full shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle size={20} />
            进入图文咨询
          </button>
        )}
      </div>
    </div>
  );
}
