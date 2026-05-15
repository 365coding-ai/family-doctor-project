import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Video, ChevronRight, Ticket, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { doctorApi, type Doctor } from '../lib/api';

export default function BookingScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 选中的状态
  const [selectedService, setSelectedService] = useState('上门服务');
  const [selectedDate, setSelectedDate] = useState('2026-05-15');
  const [selectedTime, setSelectedTime] = useState('10:00');

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

  const handleSubmit = () => {
    navigate('/order/confirm', {
      state: {
        doctor,
        serviceType: selectedService,
        scheduleDate: selectedDate,
        scheduleTime: selectedTime,
        amount: selectedService === '上门服务' ? 299 : 50
      }
    });
  };

  return (
    <div className="pb-[100px] bg-background min-h-screen">
      <header className="flex items-center px-4 w-full h-14 z-50 bg-surface sticky top-0 border-b border-surface-variant">
        <button onClick={() => navigate(-1)} className="text-primary p-2 -ml-2 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-sans text-lg font-bold text-primary">预约服务</h1>
      </header>

      <main className="px-4 py-4 space-y-6 max-w-2xl mx-auto">
        <section>
          <h2 className="font-sans text-base font-bold mb-3 text-on-surface">服务类型</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '上门服务', icon: Home, price: 299 },
              { label: '视频问诊', icon: Video, price: 50 }
            ].map(svc => (
              <button 
                key={svc.label}
                onClick={() => setSelectedService(svc.label)}
                className={`rounded-xl p-4 flex flex-col items-center gap-2 border-2 transition-all ${
                  selectedService === svc.label ? 'bg-primary-container border-primary text-on-primary-container' : 'bg-surface border-surface-variant text-on-surface-variant'
                }`}
              >
                <svc.icon size={24} className={selectedService === svc.label ? 'fill-current' : ''} />
                <span className="text-sm font-bold">{svc.label}</span>
                <span className="text-xs opacity-80">¥{svc.price}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-surface border border-surface-variant rounded-2xl p-4 shadow-sm">
           <h2 className="font-sans text-base font-bold mb-4 text-on-surface">选择时间</h2>
           <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none">
             {['2026-05-14', '2026-05-15', '2026-05-16', '2026-05-17'].map((d) => {
                const isSelected = selectedDate === d;
                return (
                  <button 
                    key={d} 
                    onClick={() => setSelectedDate(d)}
                    className={`shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center transition-all ${
                      isSelected ? 'bg-primary text-on-primary shadow-lg' : 'bg-surface-container text-on-surface-variant border border-surface-variant'
                    }`}
                  >
                    <span className="text-[10px] font-bold opacity-80">{d.split('-').slice(1).join('/')}</span>
                    <span className="text-xl font-bold">{d.split('-')[2]}</span>
                  </button>
                );
             })}
           </div>
           <div className="grid grid-cols-3 gap-2">
             {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map((time) => (
                <button 
                  key={time} 
                  onClick={() => setSelectedTime(time)}
                  className={`py-2 rounded-lg text-sm font-bold transition-all ${
                    selectedTime === time ? 'bg-primary-container text-on-primary-container border border-primary' : 'border border-surface-variant text-on-surface'
                  }`}
                >
                  {time}
                </button>
             ))}
           </div>
        </section>

        <section className="bg-surface border border-surface-variant rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Ticket className="text-tertiary" size={20} />
                <span className="text-sm font-bold text-on-surface">优惠券</span>
            </div>
            <div className="flex items-center gap-1">
                <span className="text-tertiary text-xs font-bold">- ¥50.00</span>
                <ChevronRight className="text-outline" size={16} />
            </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 w-full z-50 bg-surface border-t border-surface-variant px-4 py-2 pb-safe flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
         <div>
            <div className="flex items-baseline gap-1">
               <span className="text-xs text-on-surface-variant">待支付</span>
               <span className="text-2xl font-bold text-error">¥{selectedService === '上门服务' ? 249 : 0}</span>
            </div>
         </div>
         <button 
           onClick={handleSubmit}
           className="bg-primary text-on-primary font-sans text-lg font-bold h-[52px] px-10 rounded-full shadow-lg active:scale-95 transition-all"
         >
            提交预约
         </button>
      </div>
    </div>
  );
}
