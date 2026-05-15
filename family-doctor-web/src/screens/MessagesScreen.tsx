import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Truck, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { notificationApi, type Notification } from '../lib/api';

export default function MessagesScreen() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getList(0, 20);
      setNotifications(res.content);
    } catch (err) {
      console.error('加载通知失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('标记已读失败:', err);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) {
      return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 172800000) return '昨天';
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="pb-24">
      <header className="flex items-center px-4 w-full h-14 z-50 sticky top-0 bg-surface">
        <button onClick={() => navigate(-1)} className="text-primary p-2 -ml-2 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-sans text-2xl font-bold text-primary flex-1 text-center pr-8">消息</h1>
      </header>

      <main className="px-4 py-4 max-w-3xl mx-auto">
        <div className="flex border-b border-surface-variant mb-6">
          <button className="flex-1 py-3 text-center border-b-2 border-primary text-primary font-sans text-lg font-semibold">系统通知</button>
          <button className="flex-1 py-3 text-center text-on-surface-variant border-b-2 border-transparent font-sans text-lg font-semibold">医生消息</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant">
            <Bell className="w-12 h-12 mx-auto mb-3 text-outline" />
            <p className="text-lg font-semibold mb-1">暂无消息</p>
            <p className="text-sm">新的通知将显示在这里</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
                className="bg-surface-container-lowest p-4 rounded-xl border border-surface-variant flex gap-4 items-start relative cursor-pointer hover:bg-surface-container-low transition-colors"
              >
                {!n.isRead && (
                  <div className="w-2 h-2 bg-error rounded-full absolute top-6 left-2"></div>
                )}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${!n.isRead ? 'ml-2' : 'ml-4'} ${
                  n.type === 'ORDER' ? 'bg-primary-container text-on-primary-container' : 'bg-secondary-container text-on-secondary-container'
                }`}>
                  {n.type === 'ORDER' ? <Truck className="fill-current" size={24} /> : <Bell className="fill-current" size={24} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-sans text-xl font-semibold">{n.title}</h3>
                    <span className="font-['Atkinson_Hyperlegible_Next'] text-[10px] text-outline">{formatTime(n.createdAt)}</span>
                  </div>
                  <p className="font-sans text-sm text-on-surface-variant mb-2">{n.content}</p>
                  <button className="text-primary font-['Atkinson_Hyperlegible_Next'] text-[10px] uppercase tracking-wider">查看详情</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
