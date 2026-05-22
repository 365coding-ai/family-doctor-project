import { useNavigate } from 'react-router-dom';
import { LogOut, Clock, CheckCircle, Truck, Loader2, User, MapPin, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { orderApi, type ServiceOrder } from '../lib/api';
import { useAuth } from '../lib/auth';
import { wsManager, type WsMessage } from '../lib/websocket';

type Tab = 'pending' | 'active' | 'completed';

export default function NurseDashboardScreen() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('pending');

  useEffect(() => {
    loadOrders();
    const unsub = wsManager.subscribe((msg: WsMessage) => {
      if (msg.type === 'ORDER_STATUS' || msg.type === 'NEW_ORDER' || msg.type === 'ORDER_PAY_SUCCESS') {
        loadOrders();
      }
    });
    return () => unsub();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderApi.getMyOrders();
      setOrders(data);
    } catch (err) {
      console.error('加载订单失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const nursingOrders = orders.filter(o => o.serviceType === 'HOME_NURSING');

  const filteredOrders = nursingOrders.filter(o => {
    if (activeTab === 'pending') return o.status === 'PAID';
    if (activeTab === 'active') return ['ACCEPTED', 'DEPARTED', 'ARRIVED', 'IN_SERVICE'].includes(o.status);
    return o.status === 'COMPLETED';
  });

  const counts = {
    pending: nursingOrders.filter(o => o.status === 'PAID').length,
    active: nursingOrders.filter(o => ['ACCEPTED', 'DEPARTED', 'ARRIVED', 'IN_SERVICE'].includes(o.status)).length,
    completed: nursingOrders.filter(o => o.status === 'COMPLETED').length,
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case 'PAID': return '待接单';
      case 'ACCEPTED': return '已接单';
      case 'DEPARTED': return '已出发';
      case 'ARRIVED': return '已到达';
      case 'IN_SERVICE': return '服务中';
      case 'COMPLETED': return '已完成';
      default: return s;
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'PAID': return 'bg-blue-100 text-blue-700';
      case 'ACCEPTED': return 'bg-emerald-100 text-emerald-700';
      case 'DEPARTED': return 'bg-indigo-100 text-indigo-700';
      case 'ARRIVED': return 'bg-purple-100 text-purple-700';
      case 'IN_SERVICE': return 'bg-amber-100 text-amber-700';
      case 'COMPLETED': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="bg-background min-h-screen pb-6">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-500 px-4 pt-12 pb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-90">护士工作台</p>
            <h1 className="font-sans text-xl font-bold mt-0.5">
              {user?.nickname || '护士'}，您好
            </h1>
          </div>
          <button onClick={handleLogout} className="p-2 bg-white/20 rounded-full">
            <LogOut size={20} />
          </button>
        </div>
        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: '待接单', count: counts.pending, icon: Clock, color: 'from-blue-500 to-blue-600' },
            { label: '进行中', count: counts.active, icon: Truck, color: 'from-amber-500 to-orange-500' },
            { label: '已完成', count: counts.completed, icon: CheckCircle, color: 'from-gray-500 to-gray-600' },
          ].map(item => (
            <div key={item.label} className={`bg-gradient-to-br ${item.color} rounded-xl p-3 text-center shadow-lg`}>
              <item.icon size={20} className="mx-auto mb-1 opacity-80" />
              <p className="text-2xl font-bold">{item.count}</p>
              <p className="text-[10px] opacity-80 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </header>

      {/* Tab 切换 */}
      <div className="px-4 mt-4">
        <div className="flex bg-surface-container rounded-xl p-1">
          {([
            ['pending', `待接单(${counts.pending})`],
            ['active', `进行中(${counts.active})`],
            ['completed', `已完成(${counts.completed})`],
          ] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === key
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 订单列表 */}
      <main className="px-4 pt-3 flex flex-col gap-3 max-w-3xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            <p className="text-sm">暂无{activeTab === 'pending' ? '待接单' : activeTab === 'active' ? '进行中' : '已完成'}订单</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <button
              key={order.id}
              onClick={() => navigate('/nurse/order', { state: { orderId: order.orderNo } })}
              className="bg-surface-container-lowest border border-surface-variant rounded-xl p-4 text-left active:scale-[0.98] transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-sans text-sm font-bold text-on-surface">{order.serviceType === 'HOME_NURSING' ? '上门护理' : order.serviceType}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1"><User size={11} />患者</span>
                    <span className="flex items-center gap-1"><Calendar size={11} />{order.scheduleDate} {order.scheduleTime}</span>
                  </div>
                </div>
                <p className="font-sans text-lg font-bold text-primary">¥{order.amount}</p>
              </div>
            </button>
          ))
        )}
      </main>
    </div>
  );
}
