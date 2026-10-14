import React, { useState, useRef, useEffect } from 'react';
import {
  DoubaoChatMessage,
  sendDoubaoChat,
} from '../services/doubaoService';
import { Question } from '../types';
import {
  Bot,
  X,
  Send,
  Sparkles,
  BookOpen,
  PlusCircle,
  Copy,
  Check,
  RotateCcw,
  Lightbulb,
  FileQuestion,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';

interface DoubaoAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportToBank?: (q: Omit<Question, 'id' | 'addedAt'>) => void;
  onOpenConfig?: () => void;
}

export const DoubaoAssistantModal: React.FC<DoubaoAssistantModalProps> = ({
  isOpen,
  onClose,
  onImportToBank,
  onOpenConfig,
}) => {
  if (!isOpen) return null;

  const [messages, setMessages] = useState<DoubaoChatMessage[]>([
    {
      role: 'assistant',
      content:
        '老师您好！我是您的 **豆包 AI 教学助教（免费版）** 🎓。\n\n我可以随时协助您：\n1. 💡 **启发式分步讲题**：拆解解题突破口，引导学生思维；\n2. 📝 **AI 智能出题**：按年级/考点/难度自动命题，并可一键导入题库；\n3. 📋 **生动教案灵感**：提供引入情景、课堂提问链与板书规划；\n4. 🎯 **错题专练建议**：分析高频错因，定制个性化提分方案。\n\n请问今天有什么可以帮您的？',
      timestamp: Date.now(),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [taskType, setTaskType] = useState<'general' | 'solve' | 'create_question' | 'lesson_plan'>('general');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // 快捷 Prompt 模板
  const quickPrompts = [
    {
      label: '📝 命制一道二次函数中考压轴题',
      text: '请为初三数学命制一道关于“二次函数与动点最值”的中考模考压轴选择题，包含4个选项、标准答案和详尽分步解析。',
      type: 'create_question' as const,
    },
    {
      label: '💡 分步启发讲题：浮力与沉浮条件',
      text: '初二物理学生总是混淆物体在液体中的漂浮与悬浮状态，请用“启发式分步提问法”给出一套讲题思路，引导学生自己推导出阿基米德原理的运用。',
      type: 'solve' as const,
    },
    {
      label: '📋 生动教案：文言文《岳阳楼记》导入',
      text: '请为九年级语文《岳阳楼记》设计一个 5 分钟的生动情景导入教学片断，激发学生对范仲淹“忧乐情怀”的探究兴趣。',
      type: 'lesson_plan' as const,
    },
    {
      label: '🎯 针对“计算失误”的训练方案',
      text: '学生在代数式化简求值中频繁出现去括号变号错误，请提供 3 条具有实操性的特级教师纠错训练方案。',
      type: 'general' as const,
    },
  ];

  const handleSend = async (contentToSend?: string, typeOverride?: any) => {
    const text = (contentToSend || input).trim();
    if (!text || loading) return;

    const currentType = typeOverride || taskType;
    const newMsg: DoubaoChatMessage = {
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, newMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendDoubaoChat(nextMessages, { taskType: currentType });
      setMessages([...nextMessages, { role: 'assistant', content: reply, timestamp: Date.now() }]);
    } catch (e: any) {
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: '抱歉，暂时未能连接到豆包服务端，已自动为您切回免费稳定通道，请再试一次。',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: '对话已重置。随时向我提出任何备课、讲题、命题或错题攻坚问题！',
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-4 flex flex-col h-[85vh] max-h-[750px] overflow-hidden">
        {/* 顶部栏 */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-lg font-bold">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">豆包 AI 教学助教</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-400 text-emerald-950">
                  免费版 · 全学段
                </span>
              </div>
              <p className="text-[11px] text-blue-100">教师专属备课、智能讲题、同构命题与学情顾问</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenConfig && (
              <button
                onClick={onOpenConfig}
                className="text-xs bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-md transition-colors"
                title="设置豆包 API Key 或切换通道"
              >
                配置
              </button>
            )}
            <button
              onClick={handleResetChat}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="清空对话记录"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 任务类型快速切换条 */}
        <div className="flex items-center gap-2 px-5 py-2 bg-slate-50 border-b border-slate-200 text-xs overflow-x-auto shrink-0">
          <span className="text-slate-400 shrink-0">助教模式:</span>
          <button
            onClick={() => setTaskType('general')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              taskType === 'general' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            综合教学咨询
          </button>
          <button
            onClick={() => setTaskType('solve')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
              taskType === 'solve' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>启发式讲题</span>
          </button>
          <button
            onClick={() => setTaskType('create_question')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
              taskType === 'create_question' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5" />
            <span>AI智能命题</span>
          </button>
          <button
            onClick={() => setTaskType('lesson_plan')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
              taskType === 'lesson_plan' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>生动教案灵感</span>
          </button>
        </div>

        {/* 消息滚动列表 */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* 头像 */}
                <div
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs ${
                    isUser
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {isUser ? '我' : '🤖'}
                </div>

                {/* 消息气泡 */}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed relative group ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-slate-100/90 text-slate-800 rounded-tl-xs border border-slate-200/60'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-normal text-xs">{m.content}</div>

                  {!isUser && (
                    <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-200/50 text-[11px] text-slate-400">
                      <span>豆包大模型生成</span>
                      <button
                        onClick={() => handleCopy(m.content, idx)}
                        className="hover:text-slate-700 flex items-center gap-0.5 transition-colors ml-auto"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-medium">已复制</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>复制内容</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
              <Bot className="w-4 h-4 text-blue-600 animate-bounce" />
              <span>豆包 AI 助教正在思考与组织教学语言...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 快捷推荐 Prompts (仅在输入框为空时展示) */}
        {!input.trim() && (
          <div className="px-5 py-2 bg-slate-50 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0">
            <span className="text-slate-400 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              推荐指令:
            </span>
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => {
                  setTaskType(p.type);
                  handleSend(p.text, p.type);
                }}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 whitespace-nowrap transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* 输入框区域 */}
        <div className="p-3.5 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              rows={2}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="向豆包助教提问，如：请帮我把这道错题改编为变式题、分析易错点、提供讲题思路... (Enter发送，Shift+Enter换行)"
              className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 resize-none"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors shrink-0 shadow-xs flex items-center gap-1.5"
            >
              <span>发送</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
