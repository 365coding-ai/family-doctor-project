import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import React from 'react';

export default function PaymentSuccessScreen() {
  const location = useLocation();
  const { order } = location.state || {};

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pt-[80px] pb-8 max-w-md mx-auto bg-background">
      <div className="flex flex-col items-center w-full animate-fade-in-up">
        <div className="w-[88px] h-[88px] rounded-full bg-emerald-100 flex items-center justify-center mb-6 shadow-sm">
          <CheckCircle2 size={48} className="text-emerald-600 fill-current bg-white rounded-full" />
        </div>
        <h1 className="font-sans text-3xl font-bold mb-2 text-on-surface">预约成功</h1>
        <p className="font-sans text-base text-on-surface-variant text-center px-6">您的订单已预约成功，护士/医生将按照预约时间为您提供服务。</p>
      </div>

      <div className="mt-8 mb-6 w-full flex justify-center">
        <span className="font-sans text-4xl font-bold text-primary">¥ {order?.amount || '0.00'}</span>
      </div>

      <div className="w-full bg-surface border border-surface-variant rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
        <div className="flex justify-between items-center w-full">
          <span className="text-sm text-on-surface-variant">订单编号</span>
          <span className="text-sm font-bold tracking-wide">{order?.orderNo || '---'}</span>
        </div>
        <div className="w-full h-px bg-surface-variant/50"></div>
        <div className="flex justify-between items-center w-full">
           <span className="text-sm text-on-surface-variant">服务类型</span>
           <span className="text-sm font-bold">{order?.serviceType || '---'}</span>
        </div>
         <div className="w-full h-px bg-surface-variant/50"></div>
        <div className="flex justify-between items-center w-full">
           <span className="text-sm text-on-surface-variant">预约时间</span>
           <span className="text-sm font-bold">{order?.scheduleDate} {order?.scheduleTime}</span>
        </div>
      </div>

      <div className="w-full mt-auto pt-8 flex flex-col gap-4">
         <Link 
           to={order ? "/order" : "/orders"} 
           state={order ? { orderId: order.orderNo } : undefined}
           className="w-full h-[56px] bg-primary text-on-primary rounded-full font-sans text-lg font-bold flex items-center justify-center shadow-lg active:scale-95 transition-all"
         >
            查看详情
         </Link>
         <Link 
           to="/" 
           className="w-full h-[56px] bg-surface-container-low text-on-surface-variant rounded-full font-sans text-base font-bold flex items-center justify-center active:scale-95 transition-all"
         >
            返回首页
         </Link>
      </div>
    </div>
  );
}
