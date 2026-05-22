import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Video, MessageCircle, ChevronRight, Ticket, Loader2, Info, Clock, Package, Star, FileText, Zap } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { doctorApi, type Doctor } from '../lib/api';

// ─── 服务类型定义 ───────────────────────────────────────────
const SERVICE_TYPES = [
  {
    key: 'GRAPHIC_CONSULT',
    icon: MessageCircle,
    label: '图文咨询',
    desc: '发文字/图片，医生24h内回复',
    color: 'text-[#3b82f6]',
    bgSelected: 'bg-blue-50 border-blue-400',
  },
  {
    key: 'VIDEO_CONSULT',
    icon: Video,
    label: '视频问诊',
    desc: '15分钟视频面对面解答',
    color: 'text-[#8b5cf6]',
    bgSelected: 'bg-purple-50 border-purple-400',
  },
  {
    key: 'HOME_VISIT',
    icon: Home,
    label: '上门服务',
    desc: '医生携带设备上门看诊',
    color: 'text-[#10b981]',
    bgSelected: 'bg-emerald-50 border-emerald-400',
  },
];

// ─── 图文咨询计费模式 ─────────────────────────────────────────
const GRAPHIC_BILLING = [
  {
    key: 'PER_SESSION',
    icon: Zap,
    label: '按次咨询',
    price: 30,
    priceLabel: '¥30 / 次',
    desc: '一次完整咨询，24小时内有效',
    tag: '最常用',
    tagColor: 'bg-primary text-on-primary',
  },
  {
    key: 'PER_MINUTE',
    icon: Clock,
    label: '按时咨询',
    price: 60,
    priceLabel: '¥10 / 5分钟',
    desc: '深度解答，30分钟封顶 ¥60',
    tag: '适合复杂病情',
    tagColor: 'bg-surface-container text-on-surface-variant',
  },
  {
    key: 'SUBSCRIPTION',
    icon: Package,
    label: '使用套餐',
    price: 0,
    priceLabel: '套餐抵扣',
    desc: '您的套餐剩余次数将被扣减',
    tag: '省钱',
    tagColor: 'bg-tertiary-container text-on-tertiary-container',
  },
];

// ─── 增值服务 ──────────────────────────────────────────────────
const ADDON_OPTIONS = [
  { key: 'PRIORITY_QUEUE', icon: Star, label: '优先排队', desc: '排在其他患者前面，医生优先回复', price: 5 },
  { key: 'REPORT_ANALYSIS', icon: FileText, label: '病历深度解读', desc: '医生提供详细的检查报告分析', price: 10 },
];

export default function BookingScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedService, setSelectedService] = useState('GRAPHIC_CONSULT');
  const [selectedBilling, setSelectedBilling] = useState('PER_SESSION');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [hasPackage] = useState(false); // TODO: 从API获取套餐状态
  const [packageRemaining] = useState(8); // TODO: 从API获取

  // 动态生成未来7天日期
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (!selectedDate && dates.length > 0) setSelectedDate(dates[0]);
  }, []);

  useEffect(() => {
    if (id) {
      doctorApi.getDetail(Number(id)).then(setDoctor).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── 计算总价 ──────────────────────────────────────────────
  const getBasePrice = () => {
    if (selectedService === 'GRAPHIC_CONSULT') {
      if (selectedBilling === 'SUBSCRIPTION') return 0;
      if (selectedBilling === 'PER_MINUTE') return 60;
      return 30; // PER_SESSION
    }
    if (selectedService === 'VIDEO_CONSULT') return doctor?.consultPrice || 50;
    if (selectedService === 'HOME_VISIT') return doctor?.homeVisitPrice || 299;
    return 0;
  };

  const addonTotal = ADDON_OPTIONS
    .filter(a => selectedAddons.includes(a.key))
    .reduce((sum, a) => sum + a.price, 0);

  const totalPrice = getBasePrice() + addonTotal;

  const toggleAddon = (key: string) => {
    setSelectedAddons(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = () => {
    const billingType = selectedService === 'GRAPHIC_CONSULT' ? selectedBilling : 'PER_SESSION';
    navigate('/order/confirm', {
      state: {
        doctor,
        serviceType: selectedService,
        billingType,
        scheduleDate: selectedService !== 'GRAPHIC_CONSULT' ? selectedDate : undefined,
        scheduleTime: selectedService !== 'GRAPHIC_CONSULT' ? selectedTime : undefined,
        amount: totalPrice,
        addons: ADDON_OPTIONS.filter(a => selectedAddons.includes(a.key)).map(a => ({
          addonType: a.key,
          addonName: a.label,
          addonPrice: a.price,
        })),
      }
    });
  };

  const selectedSvcDef = SERVICE_TYPES.find(s => s.key === selectedService);

  return (
    <div className="pb-[96px] bg-background min-h-screen">
      <header className="flex items-center px-4 w-full h-14 z-50 bg-surface sticky top-0 border-b border-surface-variant">
        <button onClick={() => navigate(-1)} className="text-primary p-2 -ml-2 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-sans text-lg font-bold text-primary flex-1 text-center pr-8">预约服务</h1>
      </header>

      <main className="px-4 py-5 space-y-5 max-w-2xl mx-auto">

        {/* 医生信息条 */}
        {doctor && (
          <div className="flex items-center gap-3 bg-surface border border-surface-variant rounded-2xl p-4">
            <img src={doctor.avatarUrl} alt={doctor.name} className="w-12 h-12 rounded-xl object-cover" />
            <div>
              <p className="font-bold text-on-surface">{doctor.name} · {doctor.title}</p>
              <p className="text-xs text-on-surface-variant">{doctor.hospital} · {doctor.department}</p>
            </div>
          </div>
        )}

        {/* 服务类型选择 */}
        <section>
          <h2 className="font-sans text-sm font-bold mb-3 text-on-surface uppercase tracking-widest text-on-surface-variant">选择服务类型</h2>
          <div className="grid grid-cols-3 gap-2">
            {SERVICE_TYPES.map(svc => {
              const isSelected = selectedService === svc.key;
              return (
                <button
                  key={svc.key}
                  onClick={() => setSelectedService(svc.key)}
                  className={`rounded-2xl p-3 flex flex-col items-center gap-1.5 border-2 transition-all ${
                    isSelected ? svc.bgSelected : 'bg-surface border-surface-variant text-on-surface-variant'
                  }`}
                >
                  <svc.icon size={22} className={isSelected ? svc.color : 'text-on-surface-variant'} />
                  <span className={`text-xs font-bold ${isSelected ? 'text-on-surface' : 'text-on-surface-variant'}`}>{svc.label}</span>
                </button>
              );
            })}
          </div>
          {selectedSvcDef && (
            <p className="text-xs text-on-surface-variant mt-2 flex items-center gap-1">
              <Info size={12} /> {selectedSvcDef.desc}
            </p>
          )}
        </section>

        {/* 图文咨询: 计费模式选择 */}
        {selectedService === 'GRAPHIC_CONSULT' && (
          <section>
            <h2 className="font-sans text-sm font-bold mb-3 text-on-surface-variant uppercase tracking-widest">计费方式</h2>
            <div className="space-y-2">
              {GRAPHIC_BILLING.map(b => {
                const isSelected = selectedBilling === b.key;
                const isDisabled = b.key === 'SUBSCRIPTION' && !hasPackage;
                return (
                  <button
                    key={b.key}
                    onClick={() => !isDisabled && setSelectedBilling(b.key)}
                    disabled={isDisabled}
                    className={`w-full rounded-2xl p-4 flex items-center justify-between border-2 transition-all text-left ${
                      isDisabled ? 'opacity-40 cursor-not-allowed bg-surface border-surface-variant' :
                      isSelected ? 'bg-primary/5 border-primary' : 'bg-surface border-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <b.icon size={20} className={isSelected ? 'text-primary' : 'text-on-surface-variant'} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-on-surface">{b.label}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.tagColor}`}>{b.tag}</span>
                          {b.key === 'SUBSCRIPTION' && hasPackage && (
                            <span className="text-[10px] text-primary font-bold">剩余 {packageRemaining} 次</span>
                          )}
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">{b.desc}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-bold text-base ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{b.priceLabel}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 视频/上门: 选择时间 */}
        {selectedService !== 'GRAPHIC_CONSULT' && (
          <section className="bg-surface border border-surface-variant rounded-2xl p-4">
            <h2 className="font-sans text-sm font-bold mb-4 text-on-surface-variant uppercase tracking-widest">选择时间</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-3">
              {dates.map((d) => {
                const isSelected = selectedDate === d;
                const dt = new Date(d);
                const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    className={`shrink-0 w-[60px] h-[68px] rounded-xl flex flex-col items-center justify-center transition-all ${
                      isSelected ? 'bg-primary text-on-primary shadow-lg' : 'bg-surface-container text-on-surface-variant border border-surface-variant'
                    }`}
                  >
                    <span className="text-[10px] font-bold opacity-80">{dayNames[dt.getDay()]}</span>
                    <span className="text-lg font-bold">{dt.getDate()}</span>
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`py-2 rounded-xl text-sm font-bold transition-all ${
                    selectedTime === time ? 'bg-primary-container text-on-primary-container border-2 border-primary' : 'border border-surface-variant text-on-surface'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 增值服务 */}
        <section>
          <h2 className="font-sans text-sm font-bold mb-3 text-on-surface-variant uppercase tracking-widest">增值服务 (可选)</h2>
          <div className="space-y-2">
            {ADDON_OPTIONS.map(addon => {
              const isOn = selectedAddons.includes(addon.key);
              return (
                <div
                  key={addon.key}
                  onClick={() => toggleAddon(addon.key)}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    isOn ? 'bg-primary/5 border-primary' : 'bg-surface border-surface-variant'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <addon.icon size={20} className={isOn ? 'text-primary' : 'text-on-surface-variant'} />
                    <div>
                      <p className="font-bold text-sm text-on-surface">{addon.label}</p>
                      <p className="text-xs text-on-surface-variant">{addon.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-tertiary">+¥{addon.price}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isOn ? 'bg-primary border-primary' : 'border-outline-variant'
                    }`}>
                      {isOn && <div className="w-2 h-2 rounded-full bg-on-primary" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 优惠券 */}
        <section className="bg-surface border border-surface-variant rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="text-tertiary" size={20} />
            <span className="text-sm font-bold text-on-surface">优惠券</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-on-surface-variant text-xs">暂无可用</span>
            <ChevronRight className="text-outline" size={16} />
          </div>
        </section>

        {/* 费用说明 */}
        {selectedService === 'GRAPHIC_CONSULT' && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 leading-relaxed">
              {selectedBilling === 'PER_SESSION' && <>发送消息前将收取 <strong>¥30</strong>，咨询有效期 <strong>24小时</strong>。<strong>首次咨询免费</strong>，快去试试！</>}
              {selectedBilling === 'PER_MINUTE' && <>按实际咨询时长计费，每5分钟 <strong>¥10</strong>，30分钟封顶 <strong>¥60</strong>。计时从医生开始回复时算起。</>}
              {selectedBilling === 'SUBSCRIPTION' && <>本次将扣减套餐次数 <strong>1次</strong>，当前套餐剩余 <strong>{packageRemaining}次</strong>。</>}
            </div>
          </div>
        )}
      </main>

      {/* 底部确认栏 */}
      <div className="fixed bottom-0 left-0 w-full z-50 bg-surface border-t border-surface-variant px-4 py-3 pb-safe flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
            {selectedBilling === 'SUBSCRIPTION' ? '套餐抵扣' : '实付金额'}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-error">
              {selectedBilling === 'SUBSCRIPTION' ? '免费' : `¥${totalPrice}`}
            </span>
            {addonTotal > 0 && (
              <span className="text-xs text-on-surface-variant">(含增值 ¥{addonTotal})</span>
            )}
          </div>
        </div>
        <button
          onClick={handleSubmit}
          className="bg-primary text-on-primary font-sans text-base font-bold h-[52px] px-10 rounded-full shadow-lg active:scale-95 transition-all"
        >
          确认预约
        </button>
      </div>
    </div>
  );
}
