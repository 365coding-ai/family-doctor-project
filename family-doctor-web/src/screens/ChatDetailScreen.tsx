import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, User, Image as ImageIcon } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { chatApi, userApi, type ChatMessage } from '../lib/api';
import { wsManager, type WsMessage } from '../lib/websocket';
import { useAuth } from '../lib/auth';

export default function ChatDetailScreen() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId) {
      loadHistory();
      loadTargetUser();
      
      // 订阅实时消息
      const unsubscribe = wsManager.subscribe((msg: WsMessage) => {
        if (msg.type === 'CHAT') {
          const chatMsg = msg.payload as ChatMessage;
          // 只处理当前会话的消息
          if (chatMsg.senderId === Number(userId) || chatMsg.receiverId === Number(userId)) {
            setMessages(prev => [...prev, chatMsg]);
          }
        }
      });

      return () => unsubscribe();
    }
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await chatApi.getHistory(Number(userId));
      setMessages(data.reverse()); // 假设返回的是倒序，展示需要正序
    } catch (err) {
      console.error('加载聊天记录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTargetUser = async () => {
    try {
      const data = await userApi.getById(Number(userId));
      setTargetUser(data);
    } catch (err) {
      console.error('加载用户信息失败:', err);
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() || !userId) return;

    const payload = {
      receiverId: Number(userId),
      content: inputValue.trim(),
      type: 'text'
    };

    // 通过 WebSocket 发送
    wsManager.sendMessage('/chat.send', payload);
    
    // 本地先展示一条（乐观更新）
    const optimisticMsg: ChatMessage = {
      id: Date.now(),
      senderId: currentUser!.id,
      receiverId: Number(userId),
      content: inputValue.trim(),
      type: 'text',
      isRead: true,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setInputValue('');
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center px-4 w-full h-14 z-50 sticky top-0 bg-surface border-b border-surface-variant shrink-0">
        <button onClick={() => navigate(-1)} className="text-primary p-2 -ml-2 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 text-center pr-8">
          <h1 className="font-sans text-lg font-bold text-primary">
            {targetUser?.nickname || '在线咨询'}
          </h1>
          <p className="text-[11px] font-medium text-on-surface-variant flex items-center justify-center gap-1">
            {currentUser?.role === 'ROLE_DOCTOR' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                正在为患者提供服务
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                执业医生 · 极速响应
              </>
            )}
          </p>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 bg-surface-container-lowest">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* System Greeting / Service Card */}
            <div className="flex justify-center pt-2">
              <div className="max-w-[90%] bg-surface border border-surface-variant/30 px-5 py-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-surface-variant/30">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[11px] font-black text-primary uppercase tracking-widest">服务单已开启</span>
                </div>
                <p className="text-[13px] text-on-surface-variant leading-relaxed">
                  {currentUser?.role === 'ROLE_DOCTOR' ? (
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
                  {/* Sender Name & Role Label */}
                  <span className="text-[11px] font-bold text-on-surface-variant/60 mb-1.5 px-1 tracking-wide">
                    {senderRole} · {senderName}
                  </span>
                  
                  <div className={`flex gap-2.5 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      isMe ? 'bg-primary/10' : 'bg-surface-container-high'
                    }`}>
                      <User size={20} className={isMe ? 'text-primary' : 'text-on-surface-variant'} />
                    </div>
                    <div className={`p-3.5 rounded-2xl shadow-sm ${
                      isMe 
                        ? 'bg-primary text-on-primary rounded-tr-none' 
                        : 'bg-surface border border-surface-variant/50 text-on-surface rounded-tl-none'
                    }`}>
                      <p className="text-[15px] leading-relaxed break-words font-medium">{msg.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </main>

      {/* Input Area */}
      <div className="p-4 bg-surface border-t border-surface-variant pb-safe">
        <div className="flex items-center gap-2">
          <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full">
            <ImageIcon size={24} />
          </button>
          <div className="flex-1 bg-surface-container-low rounded-full px-4 flex items-center h-10 border border-transparent focus-within:border-primary/30">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="请输入消息..."
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
      </div>
    </div>
  );
}
