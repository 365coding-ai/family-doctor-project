import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, CreditCard, CheckCircle, Truck, MapPin, MessageCircle, Loader2, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { orderApi, userApi, type ServiceOrder, type User as UserType } from '../lib/api';
import { wsManager, type WsMessage } from '../lib/websocket';

export default function DoctorOrderDetailScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [patient, setPatient] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  // 从 navigation state 或 sessionStorage 获取，保障刷新页面依然有效
  const orderId = (state?.orderId as string | undefined) || sessionStorage.getItem('fd_active_doc_order_id') || '';

  useEffect(() => {
    if (orderId) {
      sessionStorage.setItem('fd_active_doc_order_id', orderId);
      loadOrder(orderId);
      const unsubscribe = wsManager.subscribe((msg: WsMessage) => {
        if (msg.type === 'ORDER_STATUS' || msg.type === 'ORDER_PAY_SUCCESS') {
          const updated = msg.payload as ServiceOrder;
          if (String(updated.id) === orderId || updated.orderNo === orderId) setOrder(updated);
        }
      });
      return () => unsubscribe();
    } else {
      navigate('/doctor');
    }
  }, [orderId]);

  const loadOrder = async (targetId: string) => {
    try {
      setLoading(true);
      const data = await orderApi.getDetail(targetId);
      setOrder(data);
      // 加载患者信息
      try {
        const u = await userApi.getById(data.userId);
        setPatient(u);
      } catch {}
    } catch (err) {
      console.error('加载订单失败:', err);
    } finally {
      setLoading(false);
    }
  };

  /** 进入图文咨询房间 */
  const handleEnterConsult = () => {
    if (!order?.roomId) return;
    navigate('/chat', { state: { roomId: order.roomId } });
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
      case 'PENDING': return { label: '待患者支付', icon: Clock, color: 'bg-amber-500' };
      case 'PAID': return { label: isOnlineConsult ? '已支付 · 待接诊' : '已支付 · 待接诊', icon: CreditCard, color: 'bg-blue-500' };
      case 'ACCEPTED': return { label: isOnlineConsult ? '咨询中' : '已接诊', icon: isOnlineConsult ? MessageCircle : CheckCircle, color: 'bg-emerald-500' };
      case 'DEPARTED': return { label: isOnlineConsult ? '咨询中' : '已出发', icon: isOnlineConsult ? MessageCircle : Truck, color: 'bg-indigo-500' };
      case 'ARRIVED': return { label: isOnlineConsult ? '咨询中' : '已到达', icon: isOnlineConsult ? MessageCircle : MapPin, color: 'bg-purple-500' };
      case 'COMPLETED': return { label: isOnlineConsult ? '咨询已结束' : '服务已完成', icon: CheckCircle, color: 'bg-gray-500' };
      case 'CANCELLED': return { label: '已取消', icon: Clock, color: 'bg-gray-400' };
      default: return { label: status, icon: Clock, color: 'bg-primary' };
    }
  };

  const serviceLabel = (type: string) => {
    switch (type) {
      case 'GRAPHIC_CONSULT': return '图文咨询';
      case 'VIDEO_CONSULT': return '视频问诊';
      case 'HOME_VISIT': return '上门服务';
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
        {/* Status Banner */}
        <div className={`${statusInfo.color} rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden shadow-lg`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8"></div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <statusInfo.icon size={24} className="text-white" />
          </div>
          <div className="relative z-10 text-white">
            <p className="font-sans text-xl font-bold">{statusInfo.label}</p>
            <p className="font-sans text-sm opacity-90 mt-0.5">订单编号: {order.orderNo}</p>
          </div>
        </div>

        {/* 患者信息 */}
        <section className="bg-surface-container-lowest border border-surface-variant rounded-xl p-4">
          <h3 className="font-sans text-sm font-bold text-on-surface-variant mb-3">患者信息</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
              <User size={20} className="text-on-surface-variant" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-on-surface">{patient?.nickname || '患者'}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{patient?.phone || '---'}</p>
            </div>
          </div>
        </section>

        {/* 订单信息 */}
        <section className="bg-surface-container-lowest border border-surface-variant rounded-xl p-4 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-sans text-lg font-bold text-on-surface">{serviceLabel(order.serviceType)}</h2>
              {order.scheduleDate && (
                <p className="text-sm text-on-surface-variant mt-1">预约时间：{order.scheduleDate} {order.scheduleTime}</p>
              )}
            </div>
            <p className="font-sans text-xl font-bold text-primary">¥{order.amount}</p>
          </div>

          {order.remark && (
            <>
              <div className="h-px bg-surface-variant"></div>
              <div>
                <p className="text-sm font-bold text-on-surface mb-1">患者备注</p>
                <p className="text-xs text-on-surface-variant">{order.remark}</p>
              </div>
            </>
          )}
        </section>

        {/* 图文咨询入口 */}
        {order.serviceType === 'GRAPHIC_CONSULT' && ['PAID', 'ACCEPTED'].includes(order.status) && order.roomId && (
          <section className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <MessageCircle size={20} className="text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-sans text-sm font-bold text-emerald-900">
                  {order.status === 'ACCEPTED' ? '咨询进行中' : '患者已付费，可开始咨询'}
                </p>
                <p className="font-sans text-xs text-emerald-700 mt-1">
                  {order.status === 'ACCEPTED'
                    ? '您已接诊，可继续进入咨询房间与患者沟通。'
                    : '点击下方按钮接诊并进入咨询房间，与患者沟通。'}
                </p>
                {order.expireAt && (
                  <p className="font-sans text-[11px] text-emerald-500 mt-1.5">
                    有效期至: {new Date(order.expireAt).toLocaleString('zh-CN')}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 操作按钮 (模拟) - 仅上门服务显示 */}
        {order.status === 'PAID' && !isOnlineConsult && (
          <section className="bg-surface-container-low border border-dashed border-primary/30 rounded-xl p-4">
            <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">操作</h4>
            <div className="flex flex-wrap gap-2">
              {[{ key: 'ACCEPTED', label: '接诊' }, { key: 'DEPARTED', label: '出发' }, { key: 'ARRIVED', label: '到达' }, { key: 'COMPLETED', label: '完成' }].map(s => (
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
        )}
      </main>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 w-full bg-surface border-t border-surface-variant px-4 py-3 pb-safe z-50 flex items-center gap-3">
        {/* 图文咨询 - 待接诊: 接诊并进入咨询 */}
        {order.serviceType === 'GRAPHIC_CONSULT' && order.status === 'PAID' && order.roomId && (
          <button
            onClick={async () => {
              await orderApi.updateStatus(order.id, 'ACCEPTED');
              handleEnterConsult();
            }}
            className="flex-1 min-h-[48px] bg-primary text-on-primary font-sans text-lg font-bold rounded-full shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle size={20} />
            接诊并进入咨询
          </button>
        )}
        {/* 图文咨询 - 咨询中: 进入咨询 + 结束咨询 */}
        {order.serviceType === 'GRAPHIC_CONSULT' && order.status === 'ACCEPTED' && order.roomId && (
          <>
            <button
              onClick={handleEnterConsult}
              className="flex-1 min-h-[48px] bg-primary text-on-primary font-sans text-lg font-bold rounded-full shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle size={20} />
              进入咨询
            </button>
            <button
              onClick={() => {
                if (window.confirm('确定要结束本次咨询吗？结束后患者将无法继续发送消息。')) {
                  orderApi.updateStatus(order.id, 'COMPLETED');
                }
              }}
              className="min-h-[48px] px-6 bg-red-50 text-red-600 border border-red-200 font-sans text-base font-bold rounded-full active:scale-95 transition-all"
            >
              结束咨询
            </button>
          </>
        )}
        {/* 上门服务 - 待接单 */}
        {order.status === 'PAID' && !isOnlineConsult && (
          <button
            onClick={() => orderApi.updateStatus(order.id, 'ACCEPTED')}
            className="flex-1 min-h-[48px] bg-primary text-on-primary font-sans text-lg font-bold rounded-full shadow-lg active:scale-95 transition-all"
          >
            接受订单
          </button>
        )}
      </div>
    </div>
  );
}
