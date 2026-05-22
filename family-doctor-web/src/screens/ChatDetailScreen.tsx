import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, User, Image as ImageIcon, MessageCircle, X, Zap, Clock, Package, Info } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { chatApi, userApi, orderApi, doctorApi, uploadApi, type ChatMessage, type ServiceOrder } from '../lib/api';
import { wsManager, type WsMessage } from '../lib/websocket';
import { useAuth } from '../lib/auth';

// ─── 计费模式对应文案 ─────────────────────────────────────────
const BILLING_OPTIONS = [
  { key: 'PER_SESSION', icon: Zap, label: '按次咨询', price: 30, priceLabel: '¥30/次', desc: '24小时内有效，可无限发消息', tag: '最常用' },
  { key: 'PER_MINUTE', icon: Clock, label: '按时咨询', price: 60, priceLabel: '¥10/5分钟', desc: '深度解答，30分钟封顶¥60', tag: '' },
  { key: 'SUBSCRIPTION', icon: Package, label: '使用套餐', price: 0, priceLabel: '套餐抵扣', desc: '扣减套餐次数1次', tag: '省钱' },
];

export default function ChatDetailScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const roomId = (location.state as any)?.roomId as string | undefined;

  // 通过 roomId 解析出对方的 userId
  const [targetUserId, setTargetUserId] = useState<number | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [targetDoctor, setTargetDoctor] = useState<any>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 计费校验相关 (roomId 进入则已付费)
  const [consultStatus, setConsultStatus] = useState<{ hasActive: boolean; order: ServiceOrder | null } | null>(null);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState('PER_SESSION');
  const [startingConsult, setStartingConsult] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Step 1: 通过 roomId 解析出对方的 userId
  useEffect(() => {
    if (!roomId) {
      // 无 roomId，无法进入聊天
      navigate(-1);
      return;
    }
    resolveTargetUser();
  }, [roomId]);

  const resolveTargetUser = async () => {
    try {
      const order = await orderApi.getByRoom(roomId!);
      const isDoctor = currentUser?.role === 'ROLE_DOCTOR';
      if (isDoctor) {
        // 医生端 → 对方是患者
        setTargetUserId(order.userId);
      } else {
        // 患者端 → 对方是医生，需要通过 doctorId 找到医生的 userId
        const doctor = await doctorApi.getDetail(order.doctorId);
        setTargetUserId(doctor.userId);
      }
      // roomId 进入 = 已付费
      setConsultStatus({ hasActive: true, order });
    } catch (err) {
      console.error('解析房间失败:', err);
      navigate(-1);
    }
  };

  // Step 2: targetUserId 确定后，加载聊天数据
  useEffect(() => {
    if (!targetUserId) return;

    loadHistory();
    loadTargetUser();

    const unsubscribe = wsManager.subscribe((msg: WsMessage) => {
        if (msg.type === 'CHAT') {
          const chatMsg = msg.payload as ChatMessage;
          if (
            (Number(chatMsg.senderId) === Number(targetUserId) || Number(chatMsg.receiverId) === Number(targetUserId)) &&
            (!roomId || !chatMsg.roomId || chatMsg.roomId === roomId)
          ) {
            setMessages(prev => [...prev, chatMsg]);
            if (Number(chatMsg.senderId) === Number(targetUserId)) {
              wsManager.sendMessage('/chat.read', { fromUserId: targetUserId, messageIds: [chatMsg.id], roomId });
            }
          }
        } else if (msg.type === 'TYPING') {
          const payload = msg.payload as { fromUserId: number; isTyping: boolean };
          if (Number(payload.fromUserId) === Number(targetUserId)) {
            setIsTyping(payload.isTyping);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (payload.isTyping) {
              typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
            }
          }
        } else if (msg.type === 'READ_RECEIPT') {
          const payload = msg.payload as { readBy: number; messageIds?: number[]; readAt: string; roomId?: string };
          if (Number(payload.readBy) === Number(targetUserId) && (!roomId || !payload.roomId || payload.roomId === roomId)) {
            setMessages(prev => prev.map(m => 
              (Number(m.senderId) === Number(currentUser!.id) && (!payload.messageIds || payload.messageIds.includes(m.id))) 
                ? { ...m, isRead: true, readAt: payload.readAt } : m
            ));
          }
        } else if (msg.type === 'CHAT_ACK') {
          const payload = msg.payload as { msgId: string; id: number };
          setMessages(prev => prev.map(m => m.msgId === payload.msgId ? { ...m, id: payload.id } : m));
        }
      });

      return () => unsubscribe();
  }, [targetUserId]);

  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      if (isInitialLoadRef.current) {
        // 初始加载: 使用 auto 瞬间滚动到最下方，避免平滑滚动动画
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        // 延迟一帧/小会儿再次滚动，确保 DOM 高度和图片布局渲染完成，确保 100% 到底部
        const timer = setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
          isInitialLoadRef.current = false;
        }, 60);
        return () => clearTimeout(timer);
      } else {
        // 实时新消息: 使用 smooth 平滑滚动
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, loading]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      isInitialLoadRef.current = true;
      const data = await chatApi.getHistory(targetUserId!, roomId);
      setMessages(data.reverse());
      await chatApi.markRead(targetUserId!, roomId);
    } catch (err) {
      console.error('加载聊天记录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTargetUser = async () => {
    try {
      const data = await userApi.getById(targetUserId!);
      setTargetUser(data);
    } catch (err) {
      console.error('加载用户信息失败:', err);
    }
  };

  const checkConsultStatus = async () => {
    try {
      // 找到对方医生的 doctorId (通过 targetUser.role 判断)
      // 直接用 userId 作为参数传给后端, 后端通过 userId 找到对应 doctor
      const status = await orderApi.checkConsultStatus(userId!);
      setConsultStatus(status);
      // 无有效订单则弹出计费选择
      if (!status.hasActive) {
        setShowBillingModal(true);
      }
    } catch {
      // 接口失败时不阻断聊天
    }
  };

  // 患者发起付费咨询
  const handleStartConsult = async () => {
    try {
      setStartingConsult(true);
      const amount = selectedBilling === 'PER_SESSION' ? 30 : selectedBilling === 'PER_MINUTE' ? 60 : 0;
      const order = await orderApi.create({
        doctorId: Number(userId), // 注意: userId 在这里实际是医生的 userId, 后端需通过 userId 找 doctorId
        serviceType: 'GRAPHIC_CONSULT',
        billingType: selectedBilling,
        amount,
      });
      if (amount > 0) {
        await orderApi.pay(order.id);
      }
      setConsultStatus({ hasActive: true, order });
      setShowBillingModal(false);
    } catch (err: any) {
      alert(err.message || '发起咨询失败，请重试');
    } finally {
      setStartingConsult(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    wsManager.sendMessage('/chat.typing', { toUserId: targetUserId, isTyping: e.target.value.length > 0 });
  };

  const handleSend = () => {
    if (!inputValue.trim() || !targetUserId) return;

    // 患者: 若无有效咨询则弹出计费弹层
    if (currentUser?.role !== 'ROLE_DOCTOR' && consultStatus && !consultStatus.hasActive) {
      setShowBillingModal(true);
      return;
    }

    const msgId = crypto.randomUUID();
    const payload = { receiverId: targetUserId, content: inputValue.trim(), type: 'TEXT', msgId, roomId };
    wsManager.sendMessage('/chat.send', payload);
    wsManager.sendMessage('/chat.typing', { toUserId: targetUserId, isTyping: false });

    const optimisticMsg: ChatMessage = {
      id: Date.now(),
      msgId,
      senderId: currentUser!.id,
      receiverId: targetUserId,
      content: inputValue.trim(),
      type: 'TEXT',
      isRead: false,
      roomId,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setInputValue('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetUserId) return;
    
    if (currentUser?.role !== 'ROLE_DOCTOR' && consultStatus && !consultStatus.hasActive) {
      setShowBillingModal(true);
      return;
    }

    try {
      setUploading(true);
      const res = await uploadApi.uploadChatImage(file);
      const msgId = crypto.randomUUID();
      const payload = { 
        receiverId: targetUserId, 
        content: '[图片]', 
        mediaUrl: res.url, 
        type: 'IMAGE', 
        msgId,
        roomId
      };
      wsManager.sendMessage('/chat.send', payload);

      const optimisticMsg: ChatMessage = {
        id: Date.now(),
        msgId,
        senderId: currentUser!.id,
        receiverId: targetUserId,
        content: '[图片]',
        mediaUrl: res.url,
        type: 'IMAGE',
        isRead: false,
        roomId,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, optimisticMsg]);
    } catch (err: any) {
      alert(err.message || '图片上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isDoctor = currentUser?.role === 'ROLE_DOCTOR';
  const hasActiveConsult = isDoctor || (consultStatus?.hasActive === true);

  // 剩余有效时间
  const getExpireLabel = () => {
    if (!consultStatus?.order?.expireAt) return null;
    const diff = new Date(consultStatus.order.expireAt).getTime() - Date.now();
    if (diff <= 0) return '已过期';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `剩余 ${h}h${m}m`;
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center px-4 w-full h-14 z-50 sticky top-0 bg-surface border-b border-surface-variant shrink-0">
        <button onClick={() => navigate(-1)} className="text-primary p-2 -ml-2 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 text-center pr-8">
          <h1 className="font-sans text-base font-bold text-primary">{targetUser?.nickname || '在线咨询'}</h1>
          <p className="text-[11px] font-medium text-on-surface-variant flex items-center justify-center gap-1">
            {isTyping ? (
              <span className="text-primary font-bold animate-pulse">对方正在输入...</span>
            ) : isDoctor ? (
              <><span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />正在为患者提供服务</>
            ) : (
              <><span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />执业医生 · 极速响应</>
            )}
          </p>
        </div>
      </header>

      {/* 有效期 Banner (有付费订单时显示) */}
      {!isDoctor && consultStatus?.hasActive && getExpireLabel() && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle size={14} className="text-blue-500" />
            <span className="text-xs text-blue-700">图文咨询已开启</span>
          </div>
          <span className="text-xs font-bold text-blue-600">{getExpireLabel()}</span>
        </div>
      )}

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 bg-surface-container-lowest">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* 服务单卡片 */}
            <div className="flex justify-center pt-2">
              <div className="max-w-[90%] bg-surface border border-surface-variant/30 px-5 py-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-surface-variant/30">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[11px] font-black text-primary uppercase tracking-widest">服务单已开启</span>
                </div>
                <p className="text-[13px] text-on-surface-variant leading-relaxed">
                  {isDoctor ? (
                    <>您已进入 <span className="font-bold text-on-surface">图文咨询</span> 模式。患者 <span className="font-bold text-primary">{targetUser?.nickname}</span> 正在等待您的专业解答，请尽量在15分钟内回复。</>
                  ) : (
                    <>您好！已为您连接到 <span className="font-bold text-primary">{targetUser?.nickname} 医生</span>。本次咨询时长为24小时，医生会在百忙之中尽快回复，请详细描述您的症状。</>
                  )}
                </p>
              </div>
            </div>

            {messages.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;
              const senderName = isMe ? currentUser?.nickname : targetUser?.nickname;
              const senderRole = isMe
                ? (currentUser?.role === 'ROLE_DOCTOR' ? '医生' : '患者')
                : (targetUser?.role === 'ROLE_DOCTOR' ? '医生' : '患者');

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[11px] font-bold text-on-surface-variant/60 mb-1.5 px-1 tracking-wide">
                    {senderRole} · {senderName}
                  </span>
                  <div className={`flex gap-2.5 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${isMe ? 'bg-primary/10' : 'bg-surface-container-high'}`}>
                      <User size={20} className={isMe ? 'text-primary' : 'text-on-surface-variant'} />
                    </div>
                      {msg.type === 'IMAGE' && msg.mediaUrl ? (
                        <div className="overflow-hidden rounded-2xl border-0 outline-none">
                          <img 
                            src={msg.mediaUrl} 
                            alt="chat-img" 
                            className="max-w-[200px] max-h-[300px] cursor-pointer object-cover block border-0 outline-none rounded-2xl" 
                          />
                        </div>
                      ) : (
                        <div className={`p-3.5 rounded-2xl shadow-sm ${isMe ? 'bg-primary text-on-primary rounded-tr-none' : 'bg-surface border border-surface-variant/50 text-on-surface rounded-tl-none'}`}>
                          <p className="text-[15px] leading-relaxed break-words font-medium">{msg.content}</p>
                        </div>
                      )}
                  </div>
                  {isMe && (
                    <span className={`text-[10px] mt-1 mr-10 ${msg.isRead ? 'text-primary font-bold' : 'text-on-surface-variant/60'}`}>
                      {msg.isRead ? '已读' : '送达'}
                    </span>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </main>

      {/* Input Area */}
      <div className="p-4 bg-surface border-t border-surface-variant pb-safe shrink-0">
        {!isDoctor && !hasActiveConsult ? (
          // 未付费: 显示发起咨询按钮
          <button
            onClick={() => setShowBillingModal(true)}
            className="w-full h-12 bg-primary text-on-primary font-bold rounded-full flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
          >
            <MessageCircle size={20} />
            发起图文咨询
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input type="file" accept="image/*,application/pdf" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full disabled:opacity-50"
            >
              {uploading ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />}
            </button>
            <div className="flex-1 bg-surface-container-low rounded-full px-4 flex items-center h-10 border border-transparent focus-within:border-primary/30">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isDoctor ? '回复患者...' : '描述您的症状或问题...'}
                className="w-full bg-transparent border-none focus:ring-0 text-[15px] text-on-surface outline-none"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-50 active:scale-90 transition-all shadow-sm"
            >
              <Send size={20} className="ml-0.5" />
            </button>
          </div>
        )}
      </div>

      {/* 计费选择弹层 */}
      {showBillingModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowBillingModal(false)}>
          <div className="w-full max-w-lg bg-surface rounded-t-3xl p-6 pb-safe" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg text-on-surface">选择咨询方式</h2>
              <button onClick={() => setShowBillingModal(false)} className="p-1 text-on-surface-variant">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-2 mb-5">
              {BILLING_OPTIONS.map(b => {
                const isSelected = selectedBilling === b.key;
                return (
                  <button
                    key={b.key}
                    onClick={() => setSelectedBilling(b.key)}
                    className={`w-full rounded-2xl p-4 flex items-center justify-between border-2 transition-all text-left ${isSelected ? 'bg-primary/5 border-primary' : 'bg-surface-container-lowest border-surface-variant'}`}
                  >
                    <div className="flex items-center gap-3">
                      <b.icon size={20} className={isSelected ? 'text-primary' : 'text-on-surface-variant'} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-on-surface">{b.label}</span>
                          {b.tag && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary text-on-primary rounded-full">{b.tag}</span>}
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">{b.desc}</p>
                      </div>
                    </div>
                    <span className={`font-bold text-sm shrink-0 ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{b.priceLabel}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-start gap-2 bg-blue-50 rounded-xl px-3 py-2.5 mb-5">
              <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">首次咨询该医生<strong>免费</strong>。咨询开始后24小时内，可与医生反复沟通直到问题解决。</p>
            </div>

            <button
              onClick={handleStartConsult}
              disabled={startingConsult}
              className="w-full h-12 bg-primary text-on-primary font-bold rounded-full flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              {startingConsult && <Loader2 size={18} className="animate-spin" />}
              {selectedBilling === 'SUBSCRIPTION' ? '套餐抵扣，开始咨询' : selectedBilling === 'PER_SESSION' ? '支付 ¥30，开始咨询' : '支付 ¥60，开始咨询'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
