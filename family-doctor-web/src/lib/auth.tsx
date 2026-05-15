import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, userApi, getSavedUser, isLoggedIn, clearTokens, type User, type LoginResponse } from './api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, code: string) => Promise<LoginResponse>;
  sendSmsCode: (phone: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化：检查本地 token 是否有效
  useEffect(() => {
    if (isLoggedIn()) {
      userApi.getMe()
        .then(setUser)
        .catch(() => clearTokens())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (phone: string, code: string) => {
    const res = await authApi.login(phone, code);
    // 获取完整用户信息
    const fullUser = await userApi.getMe();
    setUser(fullUser);
    return res;
  };

  const sendSmsCode = async (phone: string) => {
    await authApi.sendSmsCode(phone);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    if (isLoggedIn()) {
      const u = await userApi.getMe();
      setUser(u);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        sendSmsCode,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
