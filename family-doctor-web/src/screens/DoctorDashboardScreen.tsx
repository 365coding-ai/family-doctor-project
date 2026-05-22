import { useNavigate } from 'react-router-dom';
import { ClipboardList, MessageCircle, User, LogOut, ChevronRight, Bell, Calendar, Loader2, Sparkles, Phone, Award, ShieldCheck, MapPin } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { orderApi, userApi, type ServiceOrder } from '../lib/api';

const SERVICE_TYPE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  GRAPHIC_CONSULT: { label: '图文咨询', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
  VIDEO_CONSULT: { label: '视频问诊', color: 'text-purple-700', bg: 'bg-purple-50 border border-purple-200/50' },
  HOME_VISIT: { label: '上门医护', color: 'text-emerald-700', bg: 'bg-emerald-50 border border-emerald-200/50' }
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: '待付款', color: 'text-amber-700', bg: 'bg-amber-50 border border-amber-200/50' },
  PAID: { label: '待接诊', color: 'text-blue-700', bg: 'bg-blue-50 border border-blue-200/50' },
  ACCEPTED: { label: '已接诊', color: 'text-emerald-700', bg: 'bg-emerald-50 border border-emerald-200/50' },
  DEPARTED: { label: '医生已出发', color: 'text-indigo-700', bg: 'bg-indigo-50 border border-indigo-200/50' },
  ARRIVED: { label: '医生已到达', color: 'text-purple-700', bg: 'bg-purple-50 border border-purple-200/50' },
  COMPLETED: { label: '服务完成', color: 'text-gray-500', bg: 'bg-gray-50 border border-gray-200/50' },
  CANCELLED: { label: '已取消', color: 'text-neutral-500', bg: 'bg-neutral-50 border border-neutral-200/50' }
};

function PatientRow({ userId }: { userId: number }) {
  const [patient, setPatient] = useState<{ nickname: string; phone: string } | null>(null);

  useEffect(() => {
    let active = true;
    userApi.getById(userId)
      .then(u => {
        if (active) setPatient({ nickname: u.nickname, phone: u.phone });
      })
      .catch(err => console.error('获取患者信息失败:', err));
    return () => { active = false; };
  }, [userId]);

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 shadow-sm border border-surface-variant/30">
        <User size={18} className="text-primary" />
      </div>
      <div>
        <p className="text-sm font-bold text-on-surface">
          {patient ? `患者: ${patient.nickname}` : '加载患者中...'}
        </p>
        <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
          <Phone size={11} className="opacity-70" />
          {patient ? patient.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '---'}
        </p>
      </div>
    </div>
  );
}

export default function DoctorDashboardScreen() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [allOrders, setAllOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 过滤 Tab 状态
  const [typeTab, setTypeTab] = useState<'ALL' | 'GRAPHIC_CONSULT' | 'VIDEO_CONSULT' | 'HOME_VISIT'>('ALL');
  const [statusTab, setStatusTab] = useState<'TODO' | 'DONE'>('TODO');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getDoctorOrders({ page: 0, size: 50 });
      setAllOrders(res.content);
    } catch (err) {
      console.error('加载订单失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 统计数据
  const todoOrders = allOrders.filter(o => ['PENDING', 'PAID', 'ACCEPTED', 'DEPARTED', 'ARRIVED'].includes(o.status));
  const doneOrders = allOrders.filter(o => ['COMPLETED', 'CANCELLED'].includes(o.status));

  const stats = {
    todoCount: todoOrders.length,
    graphicCount: todoOrders.filter(o => o.serviceType === 'GRAPHIC_CONSULT').length,
    homeVisitCount: todoOrders.filter(o => o.serviceType === 'HOME_VISIT').length,
  };

  // 根据当前选择的 Tab 进行数据过滤
  const filteredOrders = allOrders.filter(order => {
    // 1. 类型过滤
    if (typeTab !== 'ALL' && order.serviceType !== typeTab) return false;

    // 2. 状态过滤
    if (statusTab === 'TODO') {
      return ['PENDING', 'PAID', 'ACCEPTED', 'DEPARTED', 'ARRIVED'].includes(order.status);
    } else {
      return ['COMPLETED', 'CANCELLED'].includes(order.status);
    }
  });

  return (
    <div className="bg-background min-h-screen pb-20 font-sans antialiased text-on-surface">
      {/* Header Banner */}
      <header className="bg-gradient-to-b from-primary to-primary-container text-on-primary px-6 pt-12 pb-14 rounded-b-[40px] shadow-lg relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-60 h-60 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary-container/10 rounded-full -ml-10 -mb-10 blur-2xl" />
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-md">
              <User size={32} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{user?.nickname || '医生'} 医生</h1>
                <span className="flex items-center gap-0.5 px-2 py-0.5 bg-secondary text-on-secondary text-[10px] font-black rounded-full shadow-sm">
                  <ShieldCheck size={10} />
                  执业中
                </span>
              </div>
              <p className="text-sm opacity-90 font-medium mt-1">
                欢迎回来，今天有 <span className="font-black underline underline-offset-4 decoration-2">{stats.todoCount}</span> 个待办服务
              </p>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="p-3 bg-white/10 rounded-full hover:bg-white/20 active:scale-90 transition-all shadow-sm flex items-center justify-center text-white"
            title="退出登录"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="px-4 -mt-8 relative z-20 space-y-6">
        {/* Dynamic Interactive Quick Stats */}
        <section className="grid grid-cols-3 gap-4">
          {[
            { label: '待处理服务', count: stats.todoCount, color: 'text-primary', active: statusTab === 'TODO', onClick: () => setStatusTab('TODO') },
            { label: '图文问诊', count: stats.graphicCount, color: 'text-blue-600', active: typeTab === 'GRAPHIC_CONSULT', onClick: () => { setTypeTab('GRAPHIC_CONSULT'); setStatusTab('TODO'); } },
            { label: '上门医护', count: stats.homeVisitCount, color: 'text-emerald-600', active: typeTab === 'HOME_VISIT', onClick: () => { setTypeTab('HOME_VISIT'); setStatusTab('TODO'); } }
          ].map(stat => (
            <button 
              key={stat.label} 
              onClick={stat.onClick}
              className={`border rounded-2xl p-4 flex flex-col items-center shadow-sm active:scale-95 transition-all text-center ${stat.active ? 'bg-primary/5 border-primary ring-2 ring-primary/20' : 'bg-surface border-surface-variant'}`}
            >
              <span className={`text-2xl font-black ${stat.color}`}>{stat.count}</span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">{stat.label}</span>
            </button>
          ))}
        </section>

        {/* Dashboard Tabs & Filters */}
        <section className="bg-surface border border-surface-variant/40 rounded-3xl p-4 shadow-sm space-y-4">
          {/* Status Tabs */}
          <div className="flex border-b border-surface-variant/60 pb-1">
            <button 
              onClick={() => setStatusTab('TODO')}
              className={`flex-1 pb-3 text-sm font-bold transition-all relative ${statusTab === 'TODO' ? 'text-primary' : 'text-on-surface-variant/70'}`}
            >
              待服务 ({todoOrders.length})
              {statusTab === 'TODO' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
            </button>
            <button 
              onClick={() => setStatusTab('DONE')}
              className={`flex-1 pb-3 text-sm font-bold transition-all relative ${statusTab === 'DONE' ? 'text-primary' : 'text-on-surface-variant/70'}`}
            >
              历史服务 ({doneOrders.length})
              {statusTab === 'DONE' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
            </button>
          </div>

          {/* Service Type Sliding Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { key: 'ALL', label: '全部' },
              { key: 'GRAPHIC_CONSULT', label: '图文咨询' },
              { key: 'VIDEO_CONSULT', label: '视频问诊' },
              { key: 'HOME_VISIT', label: '上门医护' }
            ].map(t => {
              const isActive = typeTab === t.key;
              const count = t.key === 'ALL' 
                ? (statusTab === 'TODO' ? todoOrders.length : doneOrders.length)
                : allOrders.filter(o => o.serviceType === t.key && (statusTab === 'TODO' ? ['PENDING', 'PAID', 'ACCEPTED', 'DEPARTED', 'ARRIVED'].includes(o.status) : ['COMPLETED', 'CANCELLED'].includes(o.status))).length;

              return (
                <button
                  key={t.key}
                  onClick={() => setTypeTab(t.key as any)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 border ${isActive ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant border-transparent hover:bg-surface-container-high'}`}
                >
                  {t.label} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>
        </section>

        {/* Dynamic Orders List */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-lg font-black text-on-surface">
              {statusTab === 'TODO' ? '待执行任务' : '已处理任务'} ({filteredOrders.length})
            </h2>
            <button onClick={loadOrders} className="text-primary text-xs font-bold active:scale-90 transition-all flex items-center gap-1">
              刷新列表
            </button>
          </div>
          
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs text-on-surface-variant">获取任务队列中...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-surface-container-low rounded-3xl p-10 text-center border border-dashed border-surface-variant/60">
              <ClipboardList size={44} className="mx-auto text-primary opacity-20 mb-3" />
              <p className="text-sm font-bold text-on-surface-variant">暂无相关订单记录</p>
              <p className="text-xs text-on-surface-variant/60 mt-1">如果接诊到新订单，将会第一时间在这里呈现</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => {
                const typeInfo = SERVICE_TYPE_MAP[order.serviceType] || { label: order.serviceType, color: 'text-primary', bg: 'bg-primary/10 border border-primary/20' };
                const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: 'text-gray-600', bg: 'bg-gray-100 border border-gray-200' };

                return (
                  <div 
                    key={order.id}
                    onClick={() => navigate('/doctor/order', { state: { orderId: order.orderNo } })}
                    className="bg-surface border border-surface-variant rounded-3xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md active:scale-[0.99] transition-all cursor-pointer relative overflow-hidden"
                  >
                    {/* Left status color accent bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${order.status === 'PAID' ? 'bg-blue-500' : ['ACCEPTED', 'DEPARTED', 'ARRIVED'].includes(order.status) ? 'bg-emerald-500' : 'bg-gray-300'}`} />

                    {/* Badge header row */}
                    <div className="flex justify-between items-center pl-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${typeInfo.bg} ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <span className="text-sm font-black text-primary">
                        ¥{order.amount}
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-surface-variant/40" />

                    {/* Dynamic Patient Details */}
                    <div className="pl-1.5">
                      <PatientRow userId={order.userId} />
                    </div>

                    {/* Footer / Shortcuts */}
                    <div className="flex justify-between items-center pl-1.5 bg-surface-container-low/50 rounded-2xl p-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-bold">
                          <Calendar size={13} className="text-primary" />
                          <span>{order.scheduleDate || '今日'} {order.scheduleTime || '尽快'}</span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant/50 font-medium">
                          单号: {order.orderNo}
                        </span>
                      </div>
                      
                      {/* Action trigger */}
                      <div>
                        {order.serviceType === 'GRAPHIC_CONSULT' && order.status === 'PAID' && order.roomId ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/chat', { state: { roomId: order.roomId } });
                            }}
                            className="px-4 py-2 bg-primary text-on-primary text-xs font-black rounded-full hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <MessageCircle size={14} />
                            进入咨询
                          </button>
                        ) : order.status === 'PAID' ? (
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await orderApi.updateStatus(order.id, 'ACCEPTED');
                                loadOrders();
                              } catch (err: any) {
                                alert(err.message || '接诊失败');
                              }
                            }}
                            className="px-4 py-2 bg-emerald-600 text-white text-xs font-black rounded-full hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
                          >
                            立即接诊
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-primary text-xs font-black">
                            <span>详情</span>
                            <ChevronRight size={14} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Doctor Console Menu Grid */}
        <section className="grid grid-cols-2 gap-4 pb-12">
          <button className="bg-emerald-50/50 border border-emerald-100/60 p-6 rounded-3xl flex flex-col items-center gap-3 active:scale-95 transition-all hover:bg-emerald-50">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
               <Calendar size={24} />
            </div>
            <span className="text-sm font-bold text-emerald-950">排班管理</span>
          </button>
          <button 
            onClick={() => navigate('/messages')} 
            className="bg-blue-50/50 border border-blue-100/60 p-6 rounded-3xl flex flex-col items-center gap-3 active:scale-95 transition-all hover:bg-blue-50"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-100">
               <MessageCircle size={24} />
            </div>
            <span className="text-sm font-bold text-blue-950">我的消息</span>
          </button>
        </section>
      </main>
    </div>
  );
}
