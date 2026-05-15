import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Phone, ShieldCheck, ArrowRight, Loader2, Bot, HeartPulse } from 'lucide-react';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, sendSmsCode } = useAuth();
  const navigate = useNavigate();

  const handleSendCode = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendSmsCode(phone);
      setCodeSent(true);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || '获取验证码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!phone || !code) {
      setError('请填写手机号和验证码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await login(phone, code);
      if (res.role === 'ROLE_DOCTOR' || res.role === 'ROLE_NURSE') {
        navigate('/doctor', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Consistent Header */}
      <header className="bg-surface h-14 flex items-center justify-center px-4 sticky top-0 z-50 border-b border-surface-variant shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <h1 className="font-sans text-xl font-bold text-primary">登录</h1>
      </header>

      <main className="flex-1 px-6 pt-10 max-w-md mx-auto w-full">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center mb-4">
            <HeartPulse className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-sans font-bold text-on-surface">医护到家</h2>
          <p className="text-sm text-on-surface-variant">专业便捷的上门医疗服务</p>
        </div>

        {/* Login Form */}
        <div className="space-y-5">
          {error && (
            <div className="bg-error-container text-on-error-container text-sm px-4 py-2.5 rounded-xl border border-error/10">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Phone Input */}
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
              <input
                type="tel"
                placeholder="请输入手机号"
                maxLength={11}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full h-13 bg-surface-container-low border border-surface-variant rounded-xl pl-12 pr-4 text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-outline"
              />
            </div>

            {/* Code Input */}
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
              <input
                type="text"
                placeholder="请输入验证码"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full h-13 bg-surface-container-low border border-surface-variant rounded-xl pl-12 pr-32 text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-outline"
              />
              <button
                onClick={handleSendCode}
                disabled={countdown > 0 || !phone}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-4 rounded-lg text-xs font-bold bg-primary-container text-on-primary-container disabled:opacity-50"
              >
                {countdown > 0 ? `${countdown}s` : '获取验证码'}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading || !phone || !code}
            className="w-full h-13 bg-primary text-on-primary rounded-full font-sans font-bold text-lg flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] disabled:opacity-50 transition-all mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '立即登录'}
          </button>
        </div>

        {/* Tip Box - Consistent with app cards */}
        <section className="mt-10 p-5 rounded-xl bg-surface-container-low border border-surface-variant">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="text-primary" size={18} />
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest">测试信息</h3>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            MVP 验证码固定为 <span className="font-bold text-primary">123456</span><br/>
            医生/护士测试账号：<span className="font-bold text-on-surface">18800188000</span>
          </p>
        </section>

        {/* Footer */}
        <footer className="mt-auto py-10 text-center">
          <p className="text-xs text-on-surface-variant/60">
            登录即代表同意 <span className="text-primary font-bold">用户协议</span> 和 <span className="text-primary font-bold">隐私政策</span>
          </p>
        </footer>
      </main>
    </div>
  );
}
