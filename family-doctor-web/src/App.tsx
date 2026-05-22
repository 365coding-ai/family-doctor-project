import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Home, Search, Calendar, User, ArrowLeft, Bell, Bot } from 'lucide-react';
import { cn } from './lib/utils';
import React from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { wsManager, type WsMessage } from './lib/websocket';
import { notificationApi } from './lib/api';

// Screens
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import DoctorDetailScreen from './screens/DoctorDetailScreen';
import BookingScreen from './screens/BookingScreen';
import OrderConfirmationScreen from './screens/OrderConfirmationScreen';
import OrdersScreen from './screens/OrdersScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import AddressManagementScreen from './screens/AddressManagementScreen';
import MessagesScreen from './screens/MessagesScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import PaymentSuccessScreen from './screens/PaymentSuccessScreen';
import AiScreen from './screens/AiScreen';
import SettingsScreen from './screens/SettingsScreen';
import LoginScreen from './screens/LoginScreen';
import ChatDetailScreen from './screens/ChatDetailScreen';
import DoctorDashboardScreen from './screens/DoctorDashboardScreen';
import DoctorOrderDetailScreen from './screens/DoctorOrderDetailScreen';
import ServiceCategoryListScreen from './screens/ServiceCategoryListScreen';
import ServiceItemListScreen from './screens/ServiceItemListScreen';
import ServiceItemDetailScreen from './screens/ServiceItemDetailScreen';
import NurseSelectScreen from './screens/NurseSelectScreen';
import NurseDashboardScreen from './screens/NurseDashboardScreen';

// ==================== 需要登录的路由守卫 ====================
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const BottomNav = ({ unreadCount }: { unreadCount: number }) => {
  const location = useLocation();
  const navItems = [
    { id: 'home', icon: Home, label: '首页', path: '/' },
    { id: 'search', icon: Search, label: '搜索', path: '/search' },
    { id: 'orders', icon: Calendar, label: '订单', path: '/orders' },
    { id: 'profile', icon: User, label: '我的', path: '/profile' }
  ];

  // Hidden on some screens
  if (!['/', '/search', '/orders', '/profile'].includes(location.pathname)) return null;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 pb-safe bg-surface shadow-[0_-4px_20px_rgba(0,92,186,0.06)] rounded-t-xl border-t border-surface-variant md:hidden">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.id}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center px-4 py-1 transition-all duration-200 relative",
              isActive ? "bg-primary-container text-on-primary-container rounded-full" : "text-on-surface-variant hover:opacity-80 active:scale-90"
            )}
          >
            {item.id === 'orders' && unreadCount > 0 && (
              <div className="absolute top-1 right-3 w-4 h-4 bg-error text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
            <item.icon size={24} className={isActive ? "fill-current" : ""} />
            <span className="font-['Atkinson_Hyperlegible_Next',_sans-serif] text-[12px] font-semibold mt-1 tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

const AiFab = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Only show on main tab screens
  if (!['/', '/search', '/orders', '/profile'].includes(location.pathname)) return null;

  return (
    <button
      id="ai-fab"
      onClick={() => navigate('/ai')}
      className="fixed z-50 right-5 bottom-[calc(72px+env(safe-area-inset-bottom,16px))] w-14 h-14 rounded-full bg-primary text-on-primary shadow-[0_6px_24px_rgba(0,78,159,0.35)] flex items-center justify-center hover:opacity-90 active:scale-90 transition-all animate-[fab-breathe_3s_ease-in-out_infinite]"
      aria-label="AI 健康助手"
    >
      <Bot className="w-7 h-7" />
    </button>
  );
};

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const location = useLocation();

  React.useEffect(() => {
    if (isAuthenticated) {
      // 1. 连接 WebSocket
      wsManager.connect();

      // 2. 加载初始未读数
      notificationApi.getUnreadCount().then(res => setUnreadCount(res.count));

      // 3. 监听实时消息
      const unsubscribe = wsManager.subscribe((msg: WsMessage) => {
        if (msg.type === 'NOTIFICATION_COUNT') {
          setUnreadCount(msg.payload as number);
        } else if (msg.type === 'ORDER_STATUS' || msg.type === 'ORDER_PAY_SUCCESS') {
          // 这里可以弹出全局 Toast 提醒
          console.log('收到订单状态更新:', msg.payload);
        }
      });

      return () => {
        unsubscribe();
        wsManager.disconnect();
      };
    }
  }, [isAuthenticated]);

  const showNav = ['/', '/search', '/orders', '/profile'].includes(location.pathname);

  return (
    <div className={cn("bg-background text-on-background font-sans min-h-screen", showNav ? "pb-24 md:pb-0" : "pb-0")}>
      <Routes>
        {/* 公开路由 */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/" element={<HomeScreen />} />
        <Route path="/search" element={<SearchScreen />} />
        <Route path="/doctor/:id" element={<DoctorDetailScreen />} />

        {/* 需要登录的路由 */}
        <Route path="/booking/:id" element={<ProtectedRoute><BookingScreen /></ProtectedRoute>} />
        <Route path="/order/confirm" element={<ProtectedRoute><OrderConfirmationScreen /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersScreen /></ProtectedRoute>} />
        <Route path="/order" element={<ProtectedRoute><OrderDetailScreen /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
        <Route path="/address" element={<ProtectedRoute><AddressManagementScreen /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><MessagesScreen /></ProtectedRoute>} />
        <Route path="/feedback" element={<ProtectedRoute><FeedbackScreen /></ProtectedRoute>} />
        <Route path="/success" element={<ProtectedRoute><PaymentSuccessScreen /></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute><AiScreen /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatDetailScreen /></ProtectedRoute>} />
        <Route path="/doctor" element={<ProtectedRoute><DoctorDashboardScreen /></ProtectedRoute>} />
        <Route path="/doctor/order" element={<ProtectedRoute><DoctorOrderDetailScreen /></ProtectedRoute>} />

        {/* 上门护理服务路由 */}
        <Route path="/service/categories" element={<ServiceCategoryListScreen />} />
        <Route path="/service/category" element={<ServiceItemListScreen />} />
        <Route path="/service/item" element={<ServiceItemDetailScreen />} />
        <Route path="/service/nurse" element={<ProtectedRoute><NurseSelectScreen /></ProtectedRoute>} />
        <Route path="/nurse" element={<ProtectedRoute><NurseDashboardScreen /></ProtectedRoute>} />
      </Routes>
      <AiFab />
      <BottomNav unreadCount={unreadCount} />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
