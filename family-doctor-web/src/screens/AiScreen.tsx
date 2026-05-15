import {
  ArrowLeft, History, Bot, User, Loader2, Send,
  ChevronDown, ChevronRight, Brain, Sparkles,
  Calendar, MapPin, Phone, ArrowRight, BookOpen,
  Stethoscope, AlertTriangle, X, Plus
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiApi, type ComponentData, type StatusData, type ErrorData, type AiConversation } from '../lib/api';

// ==================== 对话数据结构 ====================

/** 状态块 — STATUS 类型 chunk */
interface StatusBlock {
  blockType: 'status';
  status: string;
  message: string;
}

/** 文本块 — TEXT_CHUNK 累积 */
interface TextBlock {
  blockType: 'text';
  content: string;
  isStreaming: boolean;
}

/** 组件块 — COMPONENT 类型 chunk (生成式 UI) */
interface UIComponentBlock {
  blockType: 'component';
  componentType: string;
  props: Record<string, any>;
  actions?: Record<string, any>;
}

/** 错误块 — ERROR 类型 */
interface ErrorBlock {
  blockType: 'error';
  code: number;
  message: string;
}

type ChatBlock = StatusBlock | TextBlock | UIComponentBlock | ErrorBlock;

interface ChatMessage {
  role: 'user' | 'assistant';
  content?: string;
  blocks?: ChatBlock[];
  isStreaming?: boolean;
}

// ==================== 主组件 ====================

export default function AiScreen() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 加载历史会话列表
  const loadHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const data = await aiApi.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // 切换会话
  const selectConversation = async (conv: AiConversation) => {
    setIsHistoryOpen(false);
    setIsLoading(true);
    setSessionId(`ses_${conv.id}`);
    
    try {
      const data = await aiApi.getMessages(conv.id);
        const historyMsgs: ChatMessage[] = data.map(m => {
          if (m.role === 'user') {
            return { role: 'user', content: m.content };
          } else {
            return { 
              role: 'assistant', 
              blocks: parseMessageContent(m.content)
            };
          }
        });
      setMessages(historyMsgs);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 新开启会话
  const startNewChat = () => {
    setMessages([]);
    setSessionId(undefined);
    setIsHistoryOpen(false);
  };

  // ==================== 发送消息 ====================

  const handleSend = async (text?: string) => {
    const msg = text || inputValue.trim();
    if (!msg || isLoading) return;

    setInputValue('');
    setIsLoading(true);

    // 用户消息
    setMessages(prev => [...prev, { role: 'user', content: msg }]);

    // AI 消息占位
    setMessages(prev => [...prev, { role: 'assistant', blocks: [], isStreaming: true }]);

    try {
      await aiApi.streamChat(msg, sessionId, {
        onStatus: (data) => {
          setMessages(prev => updateLastAssistant(prev, blocks => {
            const lastBlock = blocks[blocks.length - 1];
            if (lastBlock?.blockType === 'status') {
              blocks[blocks.length - 1] = { blockType: 'status', ...data };
            } else {
              blocks.push({ blockType: 'status', ...data });
            }

            if (data.status === 'session_ready') {
              const match = data.message.match(/#(ses_\d+)/);
              if (match) setSessionId(match[1]);
            }
          }));
        },

        onTextChunk: (data) => {
          setMessages(prev => updateLastAssistant(prev, blocks => {
            const statusIdx = blocks.findIndex(b => b.blockType === 'status');
            if (statusIdx >= 0) blocks.splice(statusIdx, 1);

            const textBlockIdx = blocks.findIndex(b => b.blockType === 'text');
            if (textBlockIdx >= 0) {
              const oldTextBlock = blocks[textBlockIdx] as TextBlock;
              // 避免直接修改对象属性引发 React StrictMode 双重调用下的文本重复累加问题
              blocks[textBlockIdx] = {
                ...oldTextBlock,
                content: oldTextBlock.content + data.text,
              };
            } else {
              blocks.push({ blockType: 'text', content: data.text, isStreaming: true });
            }
          }));
        },

        onComponent: (data) => {
          setMessages(prev => updateLastAssistant(prev, blocks => {
            blocks.push({
              blockType: 'component',
              componentType: data.componentType,
              props: data.props,
              actions: data.actions,
            });
          }));
        },

        onError: (data) => {
          setMessages(prev => {
            const updated = updateLastAssistant(prev, blocks => {
              const statusIdx = blocks.findIndex(b => b.blockType === 'status');
              if (statusIdx >= 0) blocks.splice(statusIdx, 1);
              blocks.push({ blockType: 'error', code: data.code, message: data.message });
            });
            const last = updated[updated.length - 1];
            if (last) last.isStreaming = false;
            return updated;
          });
          setIsLoading(false);
        },

        onFinish: (data) => {
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === 'assistant') {
              last.isStreaming = false;
              if (last.blocks) {
                const textBlockIdx = last.blocks.findIndex(b => b.blockType === 'text');
                if (textBlockIdx >= 0) {
                  // 直接使用后端传来的纯净最终完整文本覆盖，完美规避流式标签截断展示问题
                  last.blocks[textBlockIdx] = {
                    blockType: 'text',
                    content: data.fullText || (last.blocks[textBlockIdx] as TextBlock).content,
                    isStreaming: false,
                  };
                }
                last.blocks = last.blocks.filter(b => b.blockType !== 'status');
              }
            }
            return [...updated];
          });
          setIsLoading(false);
        },
      });
    } finally {
      setIsLoading(false);
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.isStreaming) {
          last.isStreaming = false;
        }
        return updated;
      });
    }
  };

  function parseMessageContent(content: string): ChatBlock[] {
    const blocks: ChatBlock[] = [];
    let cleanText = content;

    // 1. 解析科室
    const deptMatch = content.match(/<suggest_department>(.*?)<\/suggest_department>/s);
    if (deptMatch) {
      cleanText = cleanText.replace(deptMatch[0], '');
      const depts = deptMatch[1].split(/[,，]/).map(d => ({ name: d.trim(), reason: '推荐就诊科室' }));
      blocks.push({
        blockType: 'component',
        componentType: 'DepartmentCard',
        props: { departments: depts }
      });
    }

    // 2. 解析动作
    const actionMatch = content.match(/<suggest_action>(.*?)<\/suggest_action>/s);
    if (actionMatch) {
      cleanText = cleanText.replace(actionMatch[0], '');
      const actions = actionMatch[1].split(/[,，]/).map(act => {
        const [name, label] = act.trim().split(/[:：]/);
        return { action: name, label, icon: name === 'book_doctor' ? 'calendar' : name === 'nearby_doctor' ? 'map-pin' : 'arrow-right' };
      });
      blocks.push({
        blockType: 'component',
        componentType: 'ActionButtons',
        props: { buttons: actions }
      });
    }

    // 3. 剩余文本作为 TextBlock (放在最前面)
    if (cleanText.trim()) {
      blocks.unshift({
        blockType: 'text',
        content: cleanText.trim(),
        isStreaming: false
      });
    }

    return blocks;
  }

  function updateLastAssistant(prev: ChatMessage[], updater: (blocks: ChatBlock[]) => void): ChatMessage[] {
    const updated = [...prev];
    const last = updated[updated.length - 1];
    if (last?.role === 'assistant' && last.blocks) {
      const newBlocks = [...last.blocks];
      updater(newBlocks);
      updated[updated.length - 1] = { ...last, blocks: newBlocks };
    }
    return updated;
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const quickChips = ['发热怎么办', '附近全科医生', '解读化验单'];

  // ==================== 渲染 ====================

  return (
    <div className="flex flex-col h-screen bg-background text-on-surface font-sans antialiased">
      {/* Header */}
      <header className="bg-background flex items-center justify-between px-4 w-full h-[60px] z-50 shrink-0 border-b border-surface-variant sticky top-0">
        <button onClick={() => navigate(-1)} className="text-primary hover:bg-surface-container-low active:scale-95 transition-all p-2 rounded-full -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="font-bold text-[20px] text-primary leading-tight">AI 健康助手</h1>
          <span className="text-[11px] font-semibold text-on-surface-variant opacity-70 tracking-wide mt-0.5">
            AI 建议仅供参考，不作为最终诊断
          </span>
        </div>
        <button 
          onClick={() => { setIsHistoryOpen(true); loadHistory(); }}
          className="text-primary hover:bg-surface-container-low active:scale-95 transition-all p-2 rounded-full -mr-2"
        >
          <History className="w-6 h-6" />
        </button>
      </header>

      {/* Chat Canvas */}
      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 pb-[120px]">
        {/* Welcome */}
        <div className="flex items-start gap-3">
          <AvatarBot />
          <div className="flex flex-col gap-3 max-w-[85%]">
            <div className="bg-white border border-surface-variant rounded-2xl rounded-tl-sm p-4 shadow-[0_2px_10px_rgba(0,78,159,0.02)]">
              <p className="text-[15px] leading-relaxed text-on-surface">
                您好！我是您的智能健康助手。请描述您的症状，或点击下方快捷词。
              </p>
            </div>
            {messages.length === 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -ml-1 pl-1">
                {quickChips.map(t => (
                  <button key={t} onClick={() => handleSend(t)}
                    className="shrink-0 bg-primary-fixed-dim bg-opacity-20 hover:bg-opacity-30 text-primary border border-primary-fixed px-4 py-2 rounded-full text-[14px] font-medium transition-colors whitespace-nowrap">
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'assistant' ? <AvatarBot /> : <AvatarUser />}
            {msg.role === 'user' ? (
              <div className="bg-primary text-on-primary rounded-2xl rounded-tr-sm p-4 shadow-[0_4px_20px_rgba(0,78,159,0.1)] max-w-[80%]">
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-w-[85%]">
                {(!msg.blocks || msg.blocks.length === 0) && msg.isStreaming && (
                  <div className="bg-white border border-surface-variant rounded-2xl rounded-tl-sm p-4">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <Loader2 className="w-[18px] h-[18px] animate-spin text-primary" />
                      <span className="text-[14px]">正在连接 AI 服务...</span>
                    </div>
                  </div>
                )}
                {msg.blocks?.map((block, j) => (
                  <React.Fragment key={j}>
                    <BlockRouter block={block} navigate={navigate} />
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-background border-t border-surface-variant p-4 pb-safe z-50">
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          <div className="flex-1 bg-surface-container-low rounded-2xl flex items-center px-4 h-[50px] border border-transparent focus-within:border-primary/30 transition-colors">
            <input ref={inputRef} type="text"
              className="w-full h-full bg-transparent border-none focus:ring-0 text-[15px] text-on-surface placeholder:text-on-surface-variant/70 outline-none"
              placeholder="描述您的症状或健康问题"
              value={inputValue} onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown} disabled={isLoading} />
          </div>
          <button onClick={() => handleSend()} disabled={isLoading || !inputValue.trim()}
            className="bg-primary text-on-primary h-[50px] w-[50px] rounded-2xl shrink-0 hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center justify-center disabled:opacity-50">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
          </button>
        </div>
      </div>

      {/* History Drawer Overlay */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={() => setIsHistoryOpen(false)}
          />
          
          {/* Drawer Content */}
          <div className="relative w-[85%] max-w-[360px] h-full bg-surface-container-lowest shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-surface-variant flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-primary flex items-center gap-2">
                <History className="w-5 h-5" />
                历史记录
              </h2>
              <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-surface-variant rounded-full">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="p-3">
              <button 
                onClick={startNewChat}
                className="w-full py-3 px-4 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" />
                开启新对话
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-6">
              {isHistoryLoading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-on-surface-variant">
                  <Loader2 className="w-8 h-8 animate-spin opacity-40" />
                  <span className="text-sm">加载中...</span>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-20 text-on-surface-variant opacity-60">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">暂无历史对话</p>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all active:scale-[0.98] ${
                        sessionId === `ses_${conv.id}` 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-surface-variant hover:border-primary/30 hover:bg-primary/5'
                      }`}
                    >
                      <div className="text-[14px] font-bold text-on-surface line-clamp-1 mb-1">
                        {conv.title || '无标题会话'}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-on-surface-variant opacity-70">
                          {new Date(conv.createdAt).toLocaleString('zh-CN', { 
                            month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                        {sessionId === `ses_${conv.id}` && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-primary text-on-primary rounded font-bold uppercase tracking-tighter">当前</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 头像组件 ====================

function AvatarBot() {
  return (
    <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
      <Bot className="w-5 h-5 text-on-primary-fixed-variant" />
    </div>
  );
}

function AvatarUser() {
  return (
    <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden shrink-0 flex items-center justify-center">
      <User className="w-6 h-6 text-on-surface-variant mt-1" />
    </div>
  );
}

// ==================== 核心: Block 路由器 ====================
// 根据 blockType 路由渲染，新增 COMPONENT 组件只需在 ComponentRouter 里加一个 case

function BlockRouter({ block, navigate }: { block: any; navigate: ReturnType<typeof useNavigate> }) {
  switch (block.blockType) {
    case 'status':
      return <StatusBlockUI data={block} />;
    case 'text':
      return <TextBlockUI data={block} />;
    case 'component':
      return <ComponentRouter data={block} navigate={navigate} />;
    case 'error':
      return <ErrorBlockUI data={block} />;
    default:
      return null;
  }
}

// ==================== STATUS 块 ====================

function StatusBlockUI({ data }: { data: StatusBlock }) {
  return (
    <div className="rounded-2xl rounded-tl-sm overflow-hidden border border-purple-200/60 bg-gradient-to-br from-purple-50/80 to-indigo-50/60 px-4 py-3">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-purple-500 animate-pulse" />
        <span className="text-[13px] font-semibold text-purple-700">{data.message}</span>
        <div className="flex items-center gap-1 ml-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse [animation-delay:150ms]" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

// ==================== TEXT 块 ====================

function TextBlockUI({ data }: { data: TextBlock }) {
  return (
    <div className="bg-white border border-surface-variant rounded-2xl rounded-tl-sm p-4 shadow-[0_2px_10px_rgba(0,78,159,0.02)]">
      <p className="text-[15px] leading-relaxed text-on-surface whitespace-pre-wrap">
        {data.content}
        {data.isStreaming && <span className="inline-block w-1.5 h-5 bg-primary ml-0.5 animate-pulse rounded" />}
      </p>
    </div>
  );
}

// ==================== ERROR 块 ====================

function ErrorBlockUI({ data }: { data: ErrorBlock }) {
  return (
    <div className="rounded-2xl rounded-tl-sm border border-red-200 bg-red-50/80 px-4 py-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <span className="text-[13px] font-semibold text-red-700">{data.message}</span>
        <span className="text-[11px] text-red-400 ml-auto">#{data.code}</span>
      </div>
    </div>
  );
}

// ==================== 生成式 UI 组件路由 ====================
// 这里是多态扩展点！后端推什么 componentType，前端就渲染对应组件。
// 新增业务卡片只需在这里加一个 case + 一个组件，核心引擎代码零修改。

function ComponentRouter({ data, navigate }: { data: UIComponentBlock; navigate: ReturnType<typeof useNavigate> }) {
  switch (data.componentType) {
    case 'DepartmentCard':
      return <DepartmentCard props={data.props} actions={data.actions} navigate={navigate} />;
    case 'ActionButtons':
      return <ActionButtonsCard props={data.props} navigate={navigate} />;
    case 'SourcesPanel':
      return <SourcesPanelCard props={data.props} />;
    default:
      // 未知组件类型 — 开发期提示
      return (
        <div className="border border-dashed border-gray-300 rounded-xl p-3 text-[12px] text-gray-400">
          未知组件: {data.componentType}
        </div>
      );
  }
}

// ==================== DepartmentCard 组件 ====================

function DepartmentCard({ props, actions, navigate }: { props: any; actions?: any; navigate: any }) {
  const departments = props.departments || [];
  return (
    <div className="flex flex-wrap gap-2">
      {departments.map((dept: any, i: number) => (
        <button key={i}
          onClick={() => {
            const target = actions?.onSelect?.target || '/search';
            navigate(`${target}?department=${encodeURIComponent(dept.name)}`);
          }}
          className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-xl px-3.5 py-2.5 transition-all active:scale-[0.97] group">
          <Stethoscope className="w-4 h-4 text-blue-500" />
          <div className="text-left">
            <div className="text-[13px] font-semibold text-blue-700">{dept.name}</div>
            {dept.reason && <div className="text-[11px] text-blue-500/80">{dept.reason}</div>}
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-blue-300 group-hover:text-blue-500 ml-1" />
        </button>
      ))}
    </div>
  );
}

// ==================== ActionButtons 组件 ====================

function ActionButtonsCard({ props, navigate }: { props: any; navigate: any }) {
  const buttons = props.buttons || [];
  const getIcon = (icon: string) => {
    switch (icon) {
      case 'calendar': return <Calendar className="w-4 h-4" />;
      case 'map-pin': return <MapPin className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      default: return <ArrowRight className="w-4 h-4" />;
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((btn: any, i: number) => (
        <button key={i}
          onClick={() => navigate('/search')}
          className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 rounded-xl px-3.5 py-2.5 transition-all active:scale-[0.97]">
          <div className="text-emerald-500">{getIcon(btn.icon)}</div>
          <span className="text-[13px] font-semibold text-emerald-700">{btn.label}</span>
        </button>
      ))}
    </div>
  );
}

// ==================== SourcesPanel 组件 ====================

function SourcesPanelCard({ props }: { props: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sources = props.sources || [];
  if (sources.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 overflow-hidden">
      <button onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3.5 py-2.5 w-full text-left hover:bg-amber-50 transition-colors">
        <BookOpen className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[12px] font-semibold text-amber-700">参考来源 ({sources.length})</span>
        <div className="flex-1" />
        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-amber-400" /> : <ChevronRight className="w-3.5 h-3.5 text-amber-400" />}
      </button>
      <div className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: isExpanded ? `${sources.length * 72 + 16}px` : '0px', opacity: isExpanded ? 1 : 0 }}>
        <div className="px-3.5 pb-3 space-y-2">
          {sources.map((src: any, i: number) => (
            <div key={i} className="bg-white/60 rounded-lg p-2.5 border border-amber-100">
              <div className="text-[12px] font-semibold text-amber-800">{src.title}</div>
              <div className="text-[11px] text-amber-600/80 mt-0.5 leading-relaxed">{src.snippet}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
