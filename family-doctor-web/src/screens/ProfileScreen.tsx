import { Link } from 'react-router-dom';
import { MapPin, ChevronRight, Ticket, Receipt, Settings, User, Wallet, Edit3, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // 手机号脱敏
  const maskedPhone = user?.phone
    ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    : '';

  return (
    <div className="pb-24 max-w-3xl mx-auto w-full">
      {/* Header */}
      <header className="bg-surface flex items-center justify-between px-4 w-full h-14 z-50 sticky top-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="w-10"></div>
        <h1 className="font-sans text-xl font-bold text-primary flex-1 text-center">我的中心</h1>
        <div className="w-10"></div>
      </header>

      <main className="max-w-3xl mx-auto w-full">
        {/* User Profile Card */}
        <section className="px-4 mt-4 mb-6">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_4px_20px_rgba(0,78,159,0.06)] overflow-hidden">
            {/* Top: Avatar & Info */}
            <div className="p-6 flex items-center gap-4 border-b border-surface-variant">
              <div className="relative shrink-0">
                <img
                  src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nickname || 'U')}&background=e3f2fd&color=004e9f&size=128`}
                  alt="头像"
                  className="w-16 h-16 rounded-full object-cover border-2 border-surface-container-lowest shadow-sm"
                />
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-secondary border-2 border-surface-container-lowest rounded-full"></span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-sans text-xl font-semibold text-on-surface truncate">{user?.nickname || '用户'}</h2>
                <p className="font-sans text-sm text-on-surface-variant mt-1">{maskedPhone}</p>
              </div>
              <button className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant">
                <Edit3 size={20} />
              </button>
            </div>

            {/* Bottom: Wallet & Stats */}
            <div className="flex items-stretch bg-surface-bright">
              <div className="flex-1 p-4 flex flex-col items-center justify-center relative">
                <span className="font-sans text-xl font-semibold text-primary">¥ 0.00</span>
                <span className="font-sans text-sm text-on-surface-variant mt-1">余额</span>
                <div className="absolute right-0 top-4 bottom-4 w-px bg-surface-variant"></div>
              </div>
              <div className="flex-1 p-4 flex flex-col items-center justify-center relative">
                <span className="font-sans text-xl font-semibold text-on-surface">0</span>
                <span className="font-sans text-sm text-on-surface-variant mt-1">积分</span>
                <div className="absolute right-0 top-4 bottom-4 w-px bg-surface-variant"></div>
              </div>
              <button className="flex-1 p-4 flex flex-col items-center justify-center hover:bg-surface-container-low transition-colors group">
                <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                  <Wallet size={18} />
                </div>
                <span className="font-sans text-sm text-on-surface-variant">账户明细</span>
              </button>
            </div>
          </div>
        </section>

        {/* Navigation Groups */}
        <section className="px-4 space-y-4">
          {/* Group 1: Transactional */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <Link to="/orders" className="flex items-center p-4 hover:bg-surface-container-low transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary mr-4 group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                <Receipt size={20} />
              </div>
              <span className="flex-1 font-sans text-lg font-semibold text-on-surface">历史订单</span>
              <ChevronRight size={20} className="text-outline-variant group-hover:text-primary transition-colors" />
            </Link>
            <div className="h-px bg-surface-variant ml-14"></div>
            <Link to="/" className="flex items-center p-4 hover:bg-surface-container-low transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-tertiary mr-4 group-hover:bg-tertiary-container group-hover:text-on-tertiary-container transition-colors">
                <Ticket size={20} />
              </div>
              <span className="flex-1 font-sans text-lg font-semibold text-on-surface">优惠券管理</span>
              <ChevronRight size={20} className="text-outline-variant group-hover:text-primary transition-colors" />
            </Link>
          </div>

          {/* Group 2: Account Management */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <Link to="/" className="flex items-center p-4 hover:bg-surface-container-low transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant mr-4 group-hover:bg-surface-variant transition-colors">
                <User size={20} />
              </div>
              <span className="flex-1 font-sans text-lg font-semibold text-on-surface">个人信息管理</span>
              <ChevronRight size={20} className="text-outline-variant group-hover:text-primary transition-colors" />
            </Link>
            <div className="h-px bg-surface-variant ml-14"></div>
            <Link to="/address" className="flex items-center p-4 hover:bg-surface-container-low transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant mr-4 group-hover:bg-surface-variant transition-colors">
                <MapPin size={20} />
              </div>
              <span className="flex-1 font-sans text-lg font-semibold text-on-surface">地址管理</span>
              <ChevronRight size={20} className="text-outline-variant group-hover:text-primary transition-colors" />
            </Link>
            <div className="h-px bg-surface-variant ml-14"></div>
            <Link to="/settings" className="flex items-center p-4 hover:bg-surface-container-low transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant mr-4 group-hover:bg-surface-variant transition-colors">
                <Settings size={20} />
              </div>
              <span className="flex-1 font-sans text-lg font-semibold text-on-surface">设置</span>
              <ChevronRight size={20} className="text-outline-variant group-hover:text-primary transition-colors" />
            </Link>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex items-center p-4 hover:bg-error-container/30 transition-colors group mb-8"
          >
            <div className="w-10 h-10 rounded-lg bg-error-container flex items-center justify-center text-on-error-container mr-4 transition-colors">
              <LogOut size={20} />
            </div>
            <span className="flex-1 font-sans text-lg font-semibold text-error text-left">退出登录</span>
          </button>
        </section>
      </main>
    </div>
  );
}
