/**
 * API 客户端 — 封装 fetch，自动附加 JWT Token、处理统一响应
 */

const API_BASE = '/api/v1';

// ==================== Token 管理 ====================
const TOKEN_KEY = 'fd_access_token';
const REFRESH_KEY = 'fd_refresh_token';
const USER_KEY = 'fd_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getSavedUser(): { userId: number; phone: string; nickname: string; role: string } | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveUser(user: { userId: number; phone: string; nickname: string; role: string }) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// ==================== 统一响应类型 ====================
export interface ApiResult<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PageData<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ==================== 核心请求方法 ====================
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // 401 未授权 → 清除 token，跳转登录
  if (res.status === 401) {
    clearTokens();
    window.location.href = '/login';
    throw new Error('未登录或登录已过期');
  }

  const json: ApiResult<T> = await res.json();

  if (json.code !== 200) {
    throw new Error(json.message || '请求失败');
  }

  return json.data;
}

function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

function post<T>(path: string, body?: any): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

function put<T>(path: string, body?: any): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}

// ==================== Auth API ====================
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  phone: string;
  nickname: string;
  role: string;
}

export const authApi = {
  sendSmsCode: (phone: string) =>
    post<void>(`/auth/sms-code?phone=${encodeURIComponent(phone)}`),

  login: async (phone: string, code: string): Promise<LoginResponse> => {
    const data = await post<LoginResponse>('/auth/login', { phone, code });
    setTokens(data.accessToken, data.refreshToken);
    saveUser({ userId: data.userId, phone: data.phone, nickname: data.nickname, role: data.role });
    return data;
  },

  logout: () => {
    clearTokens();
  },
};

// ==================== User API ====================
export interface User {
  id: number;
  phone: string;
  nickname: string;
  avatarUrl: string | null;
  gender: number | null;
  birthDate: string | null;
  role: string;
  createdAt: string;
}

export interface UserAddress {
  id: number;
  userId: number;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
}

export const userApi = {
  getMe: () => get<User>('/users/me'),
  getById: (id: number | string) => get<User>(`/users/${id}`),
  updateMe: (updates: Partial<User>) => put<User>('/users/me', updates),
  getAddresses: () => get<UserAddress[]>('/users/me/addresses'),
  addAddress: (addr: Partial<UserAddress>) => post<UserAddress>('/users/me/addresses', addr),
  updateAddress: (id: number, addr: Partial<UserAddress>) => put<UserAddress>(`/users/me/addresses/${id}`, addr),
  deleteAddress: (id: number) => del<void>(`/users/me/addresses/${id}`),
};

// ==================== Doctor API ====================
export interface Doctor {
  id: number;
  name: string;
  title: string;
  department: string;
  hospital: string;
  avatarUrl: string;
  rating: number;
  serviceCount: number;
  specialties: string;
  introduction: string;
  consultPrice: number;
  homeVisitPrice: number;
  canHomeVisit: boolean;
  status: number;
  userId: number;
}

export interface DoctorSchedule {
  id: number;
  doctorId: number;
  date: string;
  timeSlot: string;
  maxAppointments: number;
  currentAppointments: number;
}

export const doctorApi = {
  search: (params: { keyword?: string; department?: string; page?: number; size?: number }) => {
    const qs = new URLSearchParams();
    if (params.keyword) qs.set('keyword', params.keyword);
    if (params.department) qs.set('department', params.department);
    qs.set('page', String(params.page ?? 0));
    qs.set('size', String(params.size ?? 10));
    return get<PageData<Doctor>>(`/doctors?${qs.toString()}`);
  },
  getDetail: (id: number | string) => get<Doctor>(`/doctors/${id}`),
  getSchedules: (id: number | string, date?: string) => {
    const qs = date ? `?date=${date}` : '';
    return get<DoctorSchedule[]>(`/doctors/${id}/schedules${qs}`);
  },
  getNearby: (lat: number, lng: number, radiusKm = 5) =>
    get<Doctor[]>(`/doctors/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`),
};

// ==================== Order API ====================
export interface ServiceOrder {
  id: number;
  orderNo: string;
  userId: number;
  doctorId: number;
  /** GRAPHIC_CONSULT / VIDEO_CONSULT / HOME_VISIT */
  serviceType: string;
  /** PER_SESSION / PER_MINUTE / SUBSCRIPTION / FIRST_FREE */
  billingType: string;
  billingUnitPrice: number | null;
  billingDurationMin: number | null;
  billingMaxAmount: number | null;
  isFirstFree: number;
  packageId: number | null;
  serviceItemId?: number;
  nurseId?: number;
  specId?: number;
  trafficFee?: number;
  materialFee?: number;
  expireAt: string | null;
  amount: number;
  status: string;
  addressId: number | null;
  scheduleDate: string;
  scheduleTime: string;
  remark: string;
  payMethod: string | null;
  payTime: string | null;
  cancelReason: string | null;
  roomId: string | null;
  createdAt: string;
}

export interface UserPackage {
  id: number;
  userId: number;
  packageType: string;
  packageName: string;
  price: number;
  totalTimes: number | null;
  remainingTimes: number | null;
  startedAt: string | null;
  expiredAt: string;
  status: string;
  createdAt: string;
}

export interface AddonItem {
  addonType: string;
  addonName: string;
  addonPrice: number;
}

export const orderApi = {
  create: (data: {
    doctorId?: number;
    nurseId?: number;
    serviceItemId?: number;
    specId?: number;
    trafficFee?: number;
    serviceType: string;
    billingType?: string;
    billingUnitPrice?: number;
    billingDurationMin?: number;
    billingMaxAmount?: number;
    packageId?: number;
    amount: number;
    addressId?: number;
    scheduleDate?: string;
    scheduleTime?: string;
    remark?: string;
    addons?: AddonItem[];
  }) => post<ServiceOrder>('/orders', data),

  getMyOrders: (params: { status?: string; page?: number; size?: number }) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    qs.set('page', String(params.page ?? 0));
    qs.set('size', String(params.size ?? 10));
    return get<PageData<ServiceOrder>>(`/orders?${qs.toString()}`);
  },

  getDoctorOrders: (params: { page?: number; size?: number }) =>
    get<PageData<ServiceOrder>>(`/orders/doctor?${new URLSearchParams(params as any)}`),

  getDetail: (id: number | string) => get<ServiceOrder>(`/orders/${id}`),

  pay: (id: number | string) => post<ServiceOrder>(`/orders/${id}/pay`),

  /** 检查用户与医生之间是否有有效的已支付图文咨询 */
  checkConsultStatus: (doctorId: number | string) =>
    get<{ hasActive: boolean; order: ServiceOrder | null }>(`/orders/consult/check?doctorId=${doctorId}`),

  updateStatus: (id: number | string, status: string) =>
    put<ServiceOrder>(`/orders/${id}/status?status=${status}`),

  cancel: (id: number | string, reason?: string) => {
    const qs = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    return put<ServiceOrder>(`/orders/${id}/cancel${qs}`);
  },

  /** 根据房间号获取订单 */
  getByRoom: (roomId: string) => get<ServiceOrder>(`/orders/room/${roomId}`),
};

// ==================== Package API ====================
export const packageApi = {
  /** 获取当前用户有效套餐 */
  getActive: () => get<UserPackage | null>('/packages/active'),
  /** 获取可购买的套餐列表 */
  getConfigs: () => get<any[]>('/packages/configs'),
  /** 购买套餐 */
  purchase: (packageConfigId: number) => post<UserPackage>('/packages/purchase', { packageConfigId }),
};

// ==================== Payment API ====================
export const paymentApi = {
  create: (orderNo: string, payMethod: string) =>
    post<{ orderNo: string; status: string; message: string }>('/payments/create', { orderNo, payMethod }),
};

// ==================== AI API — 统一信封 SSE 协议 (Envelope Pattern) ====================

export interface AiConversation {
  id: number;
  userId: number;
  title: string;
  createdAt: string;
}

export interface AiMessage {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: string;
}

// ==================== 信封结构类型定义 ====================

/** Chunk Type 枚举 — 核心路由键 */
export type ChunkType = 'STATUS' | 'TEXT_CHUNK' | 'COMPONENT' | 'ERROR' | 'FINISH';

/** 统一信封结构 */
export interface StreamChunk {
  chunkId: string;
  type: ChunkType;
  data: any;
  metadata?: Record<string, any>;
}

/** STATUS 载荷 */
export interface StatusData {
  status: string;
  message: string;
}

/** TEXT_CHUNK 载荷 */
export interface TextChunkData {
  text: string;
}

/** COMPONENT 载荷 — 生成式 UI 卡片 */
export interface ComponentData {
  componentType: string;
  props: Record<string, any>;
  actions?: Record<string, {
    type: string;
    target: string;
    params?: Record<string, any>;
  }>;
}

/** ERROR 载荷 */
export interface ErrorData {
  code: number;
  message: string;
  level: string;
}

/** FINISH 载荷 */
export interface FinishData {
  sessionId: string;
  fullText: string;
  stopReason: string;
}

// ==================== 统一事件回调 ====================

export interface StreamCallbacks {
  /** 状态汇报（思考过程、RAG 检索、工具调用） */
  onStatus?: (data: StatusData) => void;
  /** 文本增量（打字机效果） */
  onTextChunk?: (data: TextChunkData) => void;
  /** 生成式 UI 卡片（动态组件渲染） */
  onComponent?: (data: ComponentData) => void;
  /** 异常中断 */
  onError?: (data: ErrorData) => void;
  /** 流结束与汇总 */
  onFinish?: (data: FinishData, metadata?: Record<string, any>) => void;
}

export const aiApi = {
  /**
   * 统一信封 SSE 流式对话
   *
   * 所有事件走 SSE data: 域，JSON.parse 后根据 type 字段路由分发。
   * 前端只需一个 switch(chunk.type) 即可覆盖全场景。
   */
  streamChat: async (
    message: string,
    sessionId: string | undefined,
    callbacks: StreamCallbacks
  ) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sessionId,
          message: { text: message, attachments: [] },
        }),
      });

      if (!res.ok) {
        callbacks.onError?.({ code: res.status, message: `HTTP ${res.status}`, level: 'FATAL' });
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        callbacks.onError?.({ code: 0, message: '无法读取响应流', level: 'FATAL' });
        return;
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 按 SSE 协议以 \n\n 分割完整帧
        const frames = buffer.split('\n\n');
        buffer = frames.pop() || '';

        for (const frame of frames) {
          if (!frame.trim()) continue;

          // 提取 data: 行
          for (const line of frame.split('\n')) {
            if (line.startsWith('data:')) {
              const jsonStr = line.slice(5).trim();
              if (!jsonStr) continue;

              try {
                const chunk: StreamChunk = JSON.parse(jsonStr);
                dispatchChunk(chunk, callbacks);
              } catch {
                // JSON 解析失败，跳过
              }
            }
          }
        }
      }

      // 处理残留 buffer
      if (buffer.trim()) {
        for (const line of buffer.split('\n')) {
          if (line.startsWith('data:')) {
            try {
              const chunk: StreamChunk = JSON.parse(line.slice(5).trim());
              dispatchChunk(chunk, callbacks);
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      callbacks.onError?.({ code: 0, message: (err as Error).message, level: 'FATAL' });
    }
  },

  getConversations: () => get<AiConversation[]>('/ai/conversations'),
  getMessages: (conversationId: number) => get<AiMessage[]>(`/ai/conversations/${conversationId}/messages`),
};

/**
 * 核心调度器 — 根据 chunk.type 路由到对应回调
 *
 * 未来无论新增什么 COMPONENT 组件，这段代码一行都不用改！
 */
function dispatchChunk(chunk: StreamChunk, callbacks: StreamCallbacks) {
  switch (chunk.type) {
    case 'STATUS':
      callbacks.onStatus?.(chunk.data as StatusData);
      break;
    case 'TEXT_CHUNK':
      callbacks.onTextChunk?.(chunk.data as TextChunkData);
      break;
    case 'COMPONENT':
      callbacks.onComponent?.(chunk.data as ComponentData);
      break;
    case 'ERROR':
      callbacks.onError?.(chunk.data as ErrorData);
      break;
    case 'FINISH':
      callbacks.onFinish?.(chunk.data as FinishData, chunk.metadata);
      break;
    default:
      console.warn('未知的 Chunk 类型:', chunk.type);
  }
}

// ==================== Notification API ====================
export interface Notification {
  id: number;
  userId: number;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  getList: (page = 0, size = 20) =>
    get<PageData<Notification>>(`/notifications?page=${page}&size=${size}`),
  getUnreadCount: () => get<{ count: number }>('/notifications/unread-count'),
  markAsRead: (id: number) => put<void>(`/notifications/${id}/read`),
};

// ==================== Chat API ====================
export interface ChatMessage {
  id: number;
  msgId?: string;
  senderId: number;
  receiverId: number;
  content: string;
  mediaUrl?: string;
  mediaWidth?: number;
  mediaHeight?: number;
  type: string; // 'TEXT' | 'IMAGE' | 'ORDER_CARD'
  isRead: boolean;
  readAt?: string;
  roomId?: string;
  createdAt: string;
}

export const chatApi = {
  getHistory: (userId: number, roomId?: string, page = 0, size = 20) => {
    const qs = new URLSearchParams({ userId: String(userId), page: String(page), size: String(size) });
    if (roomId) qs.set('roomId', roomId);
    return get<ChatMessage[]>(`/chat/history?${qs.toString()}`);
  },
  markRead: (fromUserId: number, roomId?: string) => {
    const qs = roomId ? `?roomId=${roomId}` : '';
    return put<void>(`/chat/read/${fromUserId}${qs}`);
  },
};

// ==================== Upload API ====================
export const uploadApi = {
  uploadChatImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const res = await fetch(`${API_BASE}/upload/chat-image`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    
    // 处理 401
    if (res.status === 401) {
      clearTokens();
      window.location.href = '/login';
      throw new Error('未登录或登录已过期');
    }
    
    const json: ApiResult<{ url: string; size: number; contentType: string }> = await res.json();
    if (json.code !== 200) throw new Error(json.message);
    return json.data;
  }
};

// ==================== 上门护理服务 ====================

export interface ServiceCategory {
  id: number;
  name: string;
  iconUrl: string | null;
  description: string;
  sortOrder: number;
  status: number;
}

export interface ServiceItemSpec {
  id: number;
  itemId: number;
  specName: string;
  price: number;
  originalPrice: number;
  description: string | null;
  sortOrder: number;
}

export interface ServiceItemMaterial {
  id: number;
  itemId: number;
  materialName: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface ServiceItem {
  id: number;
  categoryId: number;
  itemName: string;
  itemNo: string;
  description: string;
  coverUrl: string | null;
  serviceDuration: number;
  basePrice: number;
  trafficFee: number;
  suitablePeople: string;
  contraindications: string;
  riskNotice: string;
  notes: string;
  specs?: ServiceItemSpec[];
  materials?: ServiceItemMaterial[];
}

export interface Nurse {
  id: number;
  userId: number;
  name: string;
  avatarUrl: string | null;
  phone: string;
  title: string;
  hospital: string;
  department: string;
  introduction: string;
  serviceYears: number;
  rating: number;
  serviceCount: number;
}

export const serviceCategoryApi = {
  getAll: (limit?: number) => {
    const qs = limit ? `?limit=${limit}` : '';
    return get<ServiceCategory[]>(`/nursing/service-categories${qs}`);
  },
};

export const serviceItemApi = {
  getByCategory: (categoryId: number) => get<ServiceItem[]>(`/nursing/service-items?categoryId=${categoryId}`),
  getDetail: (id: number) => get<ServiceItem>(`/nursing/service-items/${id}`),
  getNurses: (itemId: number) => get<Nurse[]>(`/nursing/service-items/${itemId}/nurses`),
};

export const nurseApi = {
  getAll: () => get<Nurse[]>('/nursing/nurses'),
  getById: (id: number) => get<Nurse>(`/nursing/nurses/${id}`),
};
