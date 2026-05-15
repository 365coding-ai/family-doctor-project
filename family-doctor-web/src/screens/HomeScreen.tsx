import { Link } from 'react-router-dom';
import { Search, Bell, Calendar, Home, MessageCircle, ChevronRight, Star, MapPin, ChevronDown, Stethoscope, Syringe, Thermometer, HeartPulse, Baby, Pill } from 'lucide-react';
import { useState } from 'react';

const hotServices = [
  { icon: Stethoscope, label: '上门问诊', desc: '医生上门', color: 'bg-primary-container text-on-primary-container' },
  { icon: Syringe, label: '上门输液', desc: '专业护士', color: 'bg-secondary-container text-on-secondary-container' },
  { icon: HeartPulse, label: '上门护理', desc: '术后康复', color: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' },
  { icon: Thermometer, label: '上门体检', desc: '全面检查', color: 'bg-primary-fixed text-on-primary-fixed-variant' },
  { icon: Baby, label: '母婴护理', desc: '新生儿照护', color: 'bg-secondary-fixed text-on-secondary-fixed-variant' },
  { icon: Pill, label: '伤口换药', desc: '无菌操作', color: 'bg-error-container text-on-error-container' },
];

export default function HomeScreen() {
  const [address] = useState('朝阳区建国路88号 国贸中心');

  return (
    <div className="flex flex-col gap-5">
      {/* Header with Location */}
      <header className="bg-surface flex flex-col w-full z-50 sticky top-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="w-10"></div>
          <h1 className="font-sans text-xl font-bold text-primary flex-1 text-center">医护到家</h1>
          <Link to="/messages" className="relative text-on-surface-variant p-2 -mr-2 rounded-full hover:bg-surface-container-low transition-colors">
            <Bell size={24} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-surface"></span>
          </Link>
        </div>
        {/* Location Bar */}
        <button className="flex items-center gap-1.5 px-4 pb-3 group">
          <MapPin size={16} className="text-primary shrink-0" />
          <span className="font-sans text-sm font-semibold text-on-surface truncate max-w-[240px]">{address}</span>
          <ChevronDown size={14} className="text-on-surface-variant shrink-0 group-hover:text-primary transition-colors" />
        </button>
      </header>

      {/* Search */}
      <section className="px-4 flex flex-col gap-4">
        <Link to="/search" className="relative w-full block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
          <div className="w-full bg-surface-container-low border-none rounded-full py-3 pl-12 pr-4 font-sans text-sm text-outline">搜索医生、服务或科室...</div>
        </Link>

        {/* Hero Banner */}
        <div className="relative w-full h-[180px] rounded-xl overflow-hidden shadow-sm bg-surface-container-highest">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2053&ixlib=rb-4.0.3')" }}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-on-background/80 to-transparent"></div>
          <div className="absolute inset-0 p-6 flex flex-col justify-center">
            <span className="font-['Atkinson_Hyperlegible_Next'] text-[12px] text-inverse-primary uppercase tracking-widest mb-1">本周推荐</span>
            <h2 className="font-sans text-2xl font-bold text-on-primary max-w-[200px] leading-tight mb-2">顶级医疗团队<br />为您护航</h2>
            <p className="font-sans text-sm text-surface-container-low max-w-[180px]">知名三甲医院专家入驻</p>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="px-4">
        <div className="grid grid-cols-4 gap-3 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
          <Link to="/search" className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center"><Calendar size={24} /></div>
            <span className="font-['Atkinson_Hyperlegible_Next'] text-xs font-semibold text-on-surface">预约挂号</span>
          </Link>
          <Link to="/search" className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center"><Home size={24} /></div>
            <span className="font-['Atkinson_Hyperlegible_Next'] text-xs font-semibold text-on-surface">上门服务</span>
          </Link>
          <Link to="/messages" className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant flex items-center justify-center"><MessageCircle size={24} /></div>
            <span className="font-['Atkinson_Hyperlegible_Next'] text-xs font-semibold text-on-surface">健康咨询</span>
          </Link>
          <Link to="/ai" className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center"><Stethoscope size={24} /></div>
            <span className="font-['Atkinson_Hyperlegible_Next'] text-xs font-semibold text-on-surface">AI问诊</span>
          </Link>
        </div>
      </section>

      {/* Hot Services */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-sans text-xl font-semibold text-on-background">热门服务</h2>
          <button className="font-['Atkinson_Hyperlegible_Next'] text-xs font-semibold text-primary flex items-center">全部服务 <ChevronRight size={16} /></button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {hotServices.map((svc) => (
            <Link key={svc.label} to="/search" className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4 flex flex-col items-center gap-2.5 shadow-sm hover:shadow-md transition-all active:scale-[0.97]">
              <div className={`w-11 h-11 rounded-xl ${svc.color} flex items-center justify-center`}>
                <svc.icon size={22} />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-sans text-sm font-semibold text-on-surface">{svc.label}</span>
                <span className="font-sans text-[11px] text-on-surface-variant mt-0.5">{svc.desc}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Nearby Hot Doctors */}
      <section className="pl-4 pt-1 pb-4">
        <div className="flex items-center justify-between pr-4 mb-4">
          <h2 className="font-sans text-xl font-semibold text-on-background">附近医生</h2>
          <Link to="/search" className="font-['Atkinson_Hyperlegible_Next'] text-xs font-semibold text-primary flex items-center">查看全部 <ChevronRight size={16} /></Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 pr-4 scrollbar-none">
          {/* Doctor Card 1 */}
          <Link to="/doctor/1" className="w-[280px] shrink-0 bg-surface-container-lowest rounded-xl border border-outline-variant/50 p-4 flex flex-col gap-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary-fixed/20 rounded-bl-full -z-10"></div>
            <div className="flex items-start gap-4">
              <div className="relative">
                <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200" alt="Dr" className="w-16 h-16 rounded-xl object-cover border border-surface-variant" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#10b981] border-2 border-surface-container-lowest rounded-full"></div>
              </div>
              <div className="flex flex-col flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-sans text-lg font-semibold text-on-background">李秀英</h3>
                  <div className="flex items-center gap-1 bg-tertiary-fixed/30 px-2 py-0.5 rounded text-tertiary">
                    <Star size={12} className="fill-current" />
                    <span className="font-['Atkinson_Hyperlegible_Next'] text-[10px] font-semibold">4.9</span>
                  </div>
                </div>
                <span className="font-['Atkinson_Hyperlegible_Next'] text-xs font-semibold text-on-surface-variant mb-1">主任医师</span>
                <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded w-max font-['Atkinson_Hyperlegible_Next'] text-[10px] font-semibold">心血管内科</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant border-t border-surface-variant pt-3">
              <div className="flex items-center gap-1">
                <MapPin size={12} className="text-primary" />
                <span className="font-sans text-[12px]">距您 1.2km</span>
              </div>
              <span className="font-sans text-[12px] text-secondary font-semibold">可上门</span>
            </div>
          </Link>
          {/* Doctor Card 2 */}
          <Link to="/doctor/2" className="w-[280px] shrink-0 bg-surface-container-lowest rounded-xl border border-outline-variant/50 p-4 flex flex-col gap-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-secondary-fixed/20 rounded-bl-full -z-10"></div>
            <div className="flex items-start gap-4">
              <div className="relative">
                <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200" alt="Dr" className="w-16 h-16 rounded-xl object-cover border border-surface-variant" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-outline-variant border-2 border-surface-container-lowest rounded-full"></div>
              </div>
              <div className="flex flex-col flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-sans text-lg font-semibold text-on-background">王建国</h3>
                  <div className="flex items-center gap-1 bg-tertiary-fixed/30 px-2 py-0.5 rounded text-tertiary">
                    <Star size={12} className="fill-current" />
                    <span className="font-['Atkinson_Hyperlegible_Next'] text-[10px] font-semibold">4.8</span>
                  </div>
                </div>
                <span className="font-['Atkinson_Hyperlegible_Next'] text-xs font-semibold text-on-surface-variant mb-1">副主任医师</span>
                <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded w-max font-['Atkinson_Hyperlegible_Next'] text-[10px] font-semibold">儿科</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant border-t border-surface-variant pt-3">
              <div className="flex items-center gap-1">
                <MapPin size={12} className="text-primary" />
                <span className="font-sans text-[12px]">距您 2.8km</span>
              </div>
              <span className="font-sans text-[12px] text-on-surface-variant">暂不可上门</span>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
