import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, BellOff, Shield, Moon, Sun, Type, Trash2, Info, MessageSquare, LogOut, ChevronRight, Globe, Lock, Eye } from 'lucide-react';
import { useState } from 'react';

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${enabled ? 'bg-primary' : 'bg-outline-variant'
        }`}
    >
      <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${enabled ? 'left-[22px]' : 'left-0.5'
        }`}></div>
    </button>
  );
}

export default function SettingsScreen() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [marketingPush, setMarketingPush] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState<'小' | '标准' | '大'>('标准');

  return (
    <div className="pb-24 bg-background min-h-screen">
      {/* Header */}
      <header className="bg-surface flex items-center justify-between px-4 w-full h-14 z-50 sticky top-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <button onClick={() => navigate(-1)} className="text-primary hover:bg-surface-container-low active:scale-95 transition-all p-2 -ml-2 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-sans text-xl font-bold text-primary flex-1 text-center pr-10">设置</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-4 pt-4 flex flex-col gap-4 max-w-3xl mx-auto">
        {/* Notification Settings */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h3 className="font-['Atkinson_Hyperlegible_Next'] text-xs font-semibold text-on-surface-variant tracking-wide uppercase">通知设置</h3>
          </div>

          <div className="flex items-center justify-between p-4 border-b border-surface-variant">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant">
                <Bell size={20} />
              </div>
              <div>
                <p className="font-sans text-base font-semibold text-on-surface">推送通知</p>
                <p className="font-sans text-[13px] text-on-surface-variant">接收订单和服务提醒</p>
              </div>
            </div>
            <Toggle enabled={notifications} onToggle={() => setNotifications(!notifications)} />
          </div>

          <div className="flex items-center justify-between p-4 border-b border-surface-variant">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed-variant">
                <BellOff size={20} />
              </div>
              <div>
                <p className="font-sans text-base font-semibold text-on-surface">订单状态更新</p>
                <p className="font-sans text-[13px] text-on-surface-variant">医生接单、出发等状态变化</p>
              </div>
            </div>
            <Toggle enabled={orderUpdates} onToggle={() => setOrderUpdates(!orderUpdates)} />
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed-variant">
                <MessageSquare size={20} />
              </div>
              <div>
                <p className="font-sans text-base font-semibold text-on-surface">营销活动推送</p>
                <p className="font-sans text-[13px] text-on-surface-variant">优惠券、折扣等活动信息</p>
              </div>
            </div>
            <Toggle enabled={marketingPush} onToggle={() => setMarketingPush(!marketingPush)} />
          </div>
        </section>

        {/* Privacy & Security */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h3 className="font-['Atkinson_Hyperlegible_Next'] text-xs font-semibold text-on-surface-variant tracking-wide uppercase">隐私与安全</h3>
          </div>

          <button className="w-full flex items-center justify-between p-4 border-b border-surface-variant hover:bg-surface-container-low transition-colors text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <Lock size={20} />
              </div>
              <div>
                <p className="font-sans text-base font-semibold text-on-surface">修改密码</p>
                <p className="font-sans text-[13px] text-on-surface-variant">上次修改: 30天前</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-outline-variant" />
          </button>

          <button className="w-full flex items-center justify-between p-4 border-b border-surface-variant hover:bg-surface-container-low transition-colors text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
                <Eye size={20} />
              </div>
              <p className="font-sans text-base font-semibold text-on-surface">隐私协议</p>
            </div>
            <ChevronRight size={20} className="text-outline-variant" />
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
                <Shield size={20} />
              </div>
              <p className="font-sans text-base font-semibold text-on-surface">用户服务协议</p>
            </div>
            <ChevronRight size={20} className="text-outline-variant" />
          </button>
        </section>

        {/* Display Settings */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h3 className="font-['Atkinson_Hyperlegible_Next'] text-xs font-semibold text-on-surface-variant tracking-wide uppercase">显示设置</h3>
          </div>

          <div className="flex items-center justify-between p-4 border-b border-surface-variant">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-inverse-surface flex items-center justify-center text-inverse-on-surface">
                {darkMode ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <p className="font-sans text-base font-semibold text-on-surface">深色模式</p>
                <p className="font-sans text-[13px] text-on-surface-variant">{darkMode ? '已开启' : '跟随系统'}</p>
              </div>
            </div>
            <Toggle enabled={darkMode} onToggle={() => setDarkMode(!darkMode)} />
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
                <Type size={20} />
              </div>
              <p className="font-sans text-base font-semibold text-on-surface">字体大小</p>
            </div>
            <div className="flex items-center gap-1">
              {(['小', '标准', '大'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-3 py-1.5 rounded-full font-sans text-sm font-medium transition-colors ${fontSize === size
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* About & Others */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h3 className="font-['Atkinson_Hyperlegible_Next'] text-xs font-semibold text-on-surface-variant tracking-wide uppercase">其他</h3>
          </div>

          <button className="w-full flex items-center justify-between p-4 border-b border-surface-variant hover:bg-surface-container-low transition-colors text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
                <Globe size={20} />
              </div>
              <div>
                <p className="font-sans text-base font-semibold text-on-surface">语言设置</p>
                <p className="font-sans text-[13px] text-on-surface-variant">简体中文</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-outline-variant" />
          </button>

          <button className="w-full flex items-center justify-between p-4 border-b border-surface-variant hover:bg-surface-container-low transition-colors text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
                <Trash2 size={20} />
              </div>
              <div>
                <p className="font-sans text-base font-semibold text-on-surface">清除缓存</p>
                <p className="font-sans text-[13px] text-on-surface-variant">当前缓存: 23.5 MB</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-outline-variant" />
          </button>

          <button
            onClick={() => navigate('/feedback')}
            className="w-full flex items-center justify-between p-4 border-b border-surface-variant hover:bg-surface-container-low transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
                <MessageSquare size={20} />
              </div>
              <p className="font-sans text-base font-semibold text-on-surface">意见反馈</p>
            </div>
            <ChevronRight size={20} className="text-outline-variant" />
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
                <Info size={20} />
              </div>
              <div>
                <p className="font-sans text-base font-semibold text-on-surface">关于医护到家</p>
                <p className="font-sans text-[13px] text-on-surface-variant">版本 1.0.0</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-outline-variant" />
          </button>
        </section>

        {/* Logout Button */}
        <button className="w-full py-4 rounded-xl border-2 border-error/30 text-error font-sans text-base font-bold hover:bg-error-container/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-8">
          <LogOut size={20} />
          退出登录
        </button>
      </main>
    </div>
  );
}
