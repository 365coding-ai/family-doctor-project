import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Stethoscope, CalendarDays, MessageCircle, Video, Home, CreditCard, MessageSquare, Loader2, Zap, Clock, Package, Star, FileText, Info, Shield } from 'lucide-react';
import React, { useState } from 'react';
import { orderApi } from '../lib/api';

const SERVICE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  GRAPHIC_CONSULT: { label: '图文咨询', icon: MessageCircle, color: 'text-blue-500' },
  VIDEO_CONSULT:   { label: '视频问诊', icon: Video, color: 'text-purple-500' },
  HOME_VISIT:      { label: '上门医生', icon: Home, color: 'text-emerald-500' },
  HOME_NURSING:    { label: '上门护理', icon: Home, color: 'text-emerald-500' },
};

const BILLING_LABELS: Record<string, { label: string; icon: any; desc: string }> = {
  PER_SESSION:  { label: '按次计费', icon: Zap, desc: '¥30/次，24小时内有效' },
  PER_MINUTE:   { label: '按时计费', icon: Clock, desc: '¥10/5分钟，最高封顶¥60' },
  SUBSCRIPTION: { label: '套餐抵扣', icon: Package, desc: '扣减套餐次数1次' },
  FIRST_FREE:   { label: '首单免费', icon: Star, desc: '新用户首次咨询免费' },
};

export default function OrderConfirmationScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state || {};
  const { 
    doctor, 
    nurse, 
    serviceItemId, 
    specId, 
    trafficFee,
    serviceType, 
    billingType = 'PER_SESSION', 
    scheduleDate, 
    scheduleTime, 
    amount, 
    addons = [] 
  } = bookingData;

  const [payMethod, setPayMethod] = useState('wechat');
  const [submitting, setSubmitting] = useState(false);

  if (!doctor && !nurse) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <p className="text-on-surface-variant mb-4">订单信息缺失，请重新预约</p>
        <button onClick={() => navigate('/')} className="bg-primary text-on-primary px-6 py-2 rounded-full">返回首页</button>
      </div>
    );
  }

  const addonTotal = addons.reduce((s: number, a: any) => s + (a.addonPrice || 0), 0);
  const isFree = amount === 0 || billingType === 'SUBSCRIPTION' || billingType === 'FIRST_FREE';

  const svcDef = SERVICE_LABELS[serviceType] || { label: serviceType, icon: Stethoscope, color: 'text-primary' };
  const billingDef = BILLING_LABELS[billingType] || { label: billingType, icon: Zap, desc: '' };

  const handlePay = async () => {
    try {
      setSubmitting(true);

      const order = await orderApi.create({
        doctorId: doctor?.id,
        nurseId: nurse?.id,
        serviceItemId,
        specId,
        trafficFee,
        serviceType,
        billingType,
        amount,
        scheduleDate,
        scheduleTime,
        remark: '',
        addons: addons.length > 0 ? addons : undefined,
      });

      // 免费订单 (首单/套餐) 已在后端自动标记 PAID，直接跳成功页
      if (isFree) {
        navigate('/success', { state: { order } });
        return;
      }

      // 需付费: 调用支付
      await orderApi.pay(order.id);
      navigate('/success', { state: { order } });

    } catch (err: any) {
      alert(err.message || '预约失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 w-full h-14 z-50 sticky top-0 bg-surface border-b border-surface-variant">
        <button onClick={() => navigate(-1)} className="text-primary p-2 -ml-2 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-sans text-lg font-bold text-primary flex-1 text-center pr-10">确认订单</h1>
      </header>

      <main className="flex-1 px-4 py-5 flex flex-col gap-4 max-w-2xl mx-auto w-full pb-[120px]">

        {/* 医生/护士信息卡 */}
        <section className="bg-surface border border-surface-variant rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <img
            src={(doctor || nurse)?.avatarUrl || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=80'}
            alt={(doctor || nurse)?.name}
            className="w-14 h-14 rounded-xl object-cover shrink-0"
          />
          <div>
            <p className="font-bold text-base text-on-surface">{(doctor || nurse)?.name} · {(doctor || nurse)?.title}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{(doctor || nurse)?.hospital} · {(doctor || nurse)?.department}</p>
          </div>
        </section>

        {/* 服务明细 */}
        <section className="bg-surface border border-surface-variant rounded-2xl p-5 space-y-3 shadow-sm">
          <h2 className="text-sm font-black text-on-surface-variant uppercase tracking-widest">服务明细</h2>

          <div className="flex justify-between items-center text-sm py-1">
            <span className="text-on-surface-variant flex items-center gap-2">
              <svcDef.icon size={16} className={svcDef.color} />服务类型
            </span>
            <span className="font-bold text-on-surface">{svcDef.label}</span>
          </div>

          {/* 计费模式 (图文咨询时显示) */}
          {serviceType === 'GRAPHIC_CONSULT' && (
            <div className="flex justify-between items-center text-sm py-1">
              <span className="text-on-surface-variant flex items-center gap-2">
                <billingDef.icon size={16} className="text-primary" />计费方式
              </span>
              <div className="text-right">
                <p className="font-bold text-on-surface">{billingDef.label}</p>
                <p className="text-[10px] text-on-surface-variant">{billingDef.desc}</p>
              </div>
            </div>
          )}

          {/* 预约时间 (视频/上门) */}
          {scheduleDate && (
            <div className="flex justify-between items-center text-sm py-1">
              <span className="text-on-surface-variant flex items-center gap-2">
                <CalendarDays size={16} />预约时间
              </span>
              <span className="font-bold text-on-surface">{scheduleDate} {scheduleTime}</span>
            </div>
          )}

          {/* 图文咨询有效期提示 */}
          {serviceType === 'GRAPHIC_CONSULT' && (
            <div className="flex items-start gap-2 bg-blue-50 rounded-xl px-3 py-2.5">
              <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">本次咨询有效期为 <strong>24小时</strong>，期间可无限次发送消息，医生结束对话后自动完成</p>
            </div>
          )}

          {serviceType === 'HOME_NURSING' && (
            <>
              <div className="flex justify-between items-center text-sm py-1">
                <span className="text-on-surface-variant flex items-center gap-2">
                  <Package size={16} />服务项目
                </span>
                <span className="font-bold text-on-surface">{bookingData.serviceItemName}</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1">
                <span className="text-on-surface-variant flex items-center gap-2">
                  <FileText size={16} />规格
                </span>
                <span className="font-bold text-on-surface">{bookingData.specName}</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1">
                <span className="text-on-surface-variant flex items-center gap-2">
                  上门交通费
                </span>
                <span className="font-bold text-on-surface">¥{trafficFee}</span>
              </div>
            </>
          )}

          {/* 增值服务 */}
          {addons.length > 0 && (
            <>
              <div className="h-px bg-surface-variant" />
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">增值服务</p>
              {addons.map((a: any) => (
                <div key={a.addonType} className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant flex items-center gap-2">
                    {a.addonType === 'PRIORITY_QUEUE' ? <Star size={14} className="text-tertiary" /> : <FileText size={14} className="text-tertiary" />}
                    {a.addonName}
                  </span>
                  <span className="font-bold text-tertiary">+¥{a.addonPrice}</span>
                </div>
              ))}
            </>
          )}

          <div className="h-px bg-surface-variant" />
          <div className="flex justify-between items-center">
            <span className="text-sm text-on-surface-variant">合计</span>
            <span className={`text-xl font-black ${isFree ? 'text-[#10b981]' : 'text-error'}`}>
              {isFree ? '免费' : `¥${amount}`}
            </span>
          </div>
        </section>

        {/* 支付方式 (仅付费订单显示) */}
        {!isFree && (
          <section className="bg-surface border border-surface-variant rounded-2xl p-5 space-y-3 shadow-sm">
            <h2 className="text-sm font-black text-on-surface-variant uppercase tracking-widest">支付方式</h2>
            <div className="space-y-2">
              {[
                { id: 'wechat', label: '微信支付', icon: MessageSquare, color: 'bg-emerald-500' },
                { id: 'alipay', label: '支付宝', icon: CreditCard, color: 'bg-blue-500' },
              ].map(m => (
                <label key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-surface-variant cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${m.color} flex items-center justify-center text-white`}>
                      <m.icon size={18} />
                    </div>
                    <span className="font-bold text-sm text-on-surface">{m.label}</span>
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
        )}

        {/* 安全提示 */}
        <div className="flex items-center gap-2 text-xs text-on-surface-variant justify-center">
          <Shield size={14} className="text-[#10b981]" />
          <span>订单受平台保障 · 支付安全加密 · 随时可退款</span>
        </div>
      </main>

      {/* 底部支付栏 */}
      <div className="fixed bottom-0 left-0 w-full bg-surface border-t border-surface-variant p-4 pb-safe flex items-center justify-between z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">
            {isFree ? '本次服务' : '实付金额'}
          </span>
          <span className={`text-2xl font-black ${isFree ? 'text-[#10b981]' : 'text-error'}`}>
            {isFree ? (billingType === 'FIRST_FREE' ? '首单免费' : '套餐抵扣') : `¥${amount}`}
          </span>
        </div>
        <button
          onClick={handlePay}
          disabled={submitting}
          className="bg-primary text-on-primary font-sans text-base font-bold h-[52px] px-10 rounded-full flex items-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          {submitting && <Loader2 size={18} className="animate-spin" />}
          {isFree ? '立即开始咨询' : '立即支付'}
        </button>
      </div>
    </div>
  );
}
