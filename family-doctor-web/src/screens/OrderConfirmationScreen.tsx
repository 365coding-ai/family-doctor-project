import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Stethoscope, CalendarDays, MapPin, MessageSquare, CreditCard, Wallet, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { orderApi } from '../lib/api';

export default function OrderConfirmationScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state || {};
  const { doctor, serviceType, scheduleDate, scheduleTime, amount } = bookingData;

  const [payMethod, setPayMethod] = useState('wechat');
  const [submitting, setSubmitting] = useState(false);

  if (!doctor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <p className="text-on-surface-variant mb-4">订单信息缺失，请重新预约</p>
        <button onClick={() => navigate('/')} className="bg-primary text-on-primary px-6 py-2 rounded-full">返回首页</button>
      </div>
    );
  }

  const handlePay = async () => {
    try {
      setSubmitting(true);
      
      // 1. 创建订单
      const order = await orderApi.create({
        doctorId: doctor.id,
        serviceType: serviceType,
        amount: amount,
        scheduleDate: scheduleDate,
        scheduleTime: scheduleTime,
        remark: '无'
      });

      // 2. 模拟支付 (调用我们刚写的支付接口)
      await orderApi.pay(order.id);

      // 3. 跳转成功页
      navigate('/success', { state: { order } });
    } catch (err) {
      console.error('支付失败:', err);
      alert('预约失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 w-full h-14 z-50 sticky top-0 bg-surface border-b border-surface-variant">
        <button onClick={() => navigate(-1)} className="text-primary p-2 -ml-2 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-sans text-lg font-bold text-primary flex-1 text-center pr-10">订单确认</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 flex flex-col gap-6 max-w-2xl mx-auto w-full pb-[120px]">
        {/* Order Summary Card */}
        <section className="bg-surface border border-surface-variant rounded-2xl p-5 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-on-surface">服务明细</h2>

          {/* Doctor Info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-surface-container rounded-xl flex items-center justify-center shrink-0">
               <UserIcon />
            </div>
            <div>
              <p className="text-lg font-bold text-on-surface">{doctor.nickname || '医生'}</p>
              <p className="text-xs text-on-surface-variant">{doctor.department} · {doctor.position || '副主任医师'}</p>
            </div>
          </div>

          <div className="h-px bg-surface-variant w-full"></div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-on-surface-variant flex items-center gap-2">
                <Stethoscope size={16} />服务类型
              </span>
              <span className="font-bold text-on-surface">{serviceType}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-on-surface-variant flex items-center gap-2">
                <CalendarDays size={16} />预约时间
              </span>
              <span className="font-bold text-on-surface">{scheduleDate} {scheduleTime}</span>
            </div>
            <div className="flex justify-between items-start text-sm">
              <span className="text-on-surface-variant flex items-center gap-2 pt-0.5">
                <MapPin size={16} />服务地址
              </span>
              <span className="text-right font-bold text-on-surface">
                北京市朝阳区建国路88号 (示例)
              </span>
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="bg-surface border border-surface-variant rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-bold text-on-surface">支付方式</h2>
          <div className="space-y-2">
            {[
              { id: 'wechat', label: '微信支付', icon: MessageSquare, color: 'bg-emerald-500' },
              { id: 'alipay', label: '支付宝', icon: CreditCard, color: 'bg-blue-500' }
            ].map(m => (
              <label key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-surface-variant cursor-pointer active:bg-surface-container-low transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full ${m.color} flex items-center justify-center text-white`}>
                    <m.icon size={20} />
                  </div>
                  <span className="font-bold text-on-surface">{m.label}</span>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={payMethod === m.id}
                  onChange={() => setPayMethod(m.id)}
                  className="w-5 h-5 accent-primary"
                />
              </label>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-surface border-t border-surface-variant p-4 pb-safe flex items-center justify-between z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col">
          <span className="text-xs text-on-surface-variant">合计待支付</span>
          <span className="text-2xl font-bold text-error">¥{amount}</span>
        </div>
        <button
          onClick={handlePay}
          disabled={submitting}
          className="bg-primary text-on-primary font-sans text-lg font-bold h-[56px] px-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          {submitting ? <Loader2 className="animate-spin mr-2" /> : null}
          立即支付
        </button>
      </div>
    </div>
  );
}

const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-outline">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
