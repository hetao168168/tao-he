import React from 'react';
import { AuthState } from '../types';
import { QrCode, LogOut, CheckCircle2, BookOpen, Bot, Sparkles, Settings } from 'lucide-react';

export type NavTab = 'dashboard' | 'students' | 'wrong' | 'jyeoo' | 'paper';

interface TopBarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  auth: AuthState;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenDoubaoAssistant?: () => void;
  onOpenDoubaoConfig?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onTabChange,
  auth,
  onOpenLogin,
  onLogout,
  onOpenDoubaoAssistant,
  onOpenDoubaoConfig,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            菁优网智能教学工作台
          </span>
        </div>

        {/* Zone 2: 4-5 Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
              currentTab === 'dashboard'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            概览看板
          </button>
          <button
            onClick={() => onTabChange('students')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
              currentTab === 'students'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            学生档案
          </button>
          <button
            onClick={() => onTabChange('wrong')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
              currentTab === 'wrong'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            错题攻坚
          </button>
          <button
            onClick={() => onTabChange('jyeoo')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
              currentTab === 'jyeoo'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            菁优选题
          </button>
          <button
            onClick={() => onTabChange('paper')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
              currentTab === 'paper'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            智能组卷
          </button>
        </nav>

        {/* Zone 3: 豆包大模型免费版状态 & Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* 豆包 AI 状态胶囊 */}
          <div className="flex items-center bg-slate-100 hover:bg-slate-200/80 p-0.5 rounded-lg border border-slate-200 transition-colors">
            <button
              onClick={onOpenDoubaoAssistant}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:text-blue-700 transition-colors"
              title="打开豆包 AI 教学助教（支持启发式讲题、智能命题、教案灵感）"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Bot className="w-3.5 h-3.5 text-blue-600" />
              <span>豆包 AI 免费版</span>
            </button>
            {onOpenDoubaoConfig && (
              <button
                onClick={onOpenDoubaoConfig}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-white/80 transition-colors"
                title="豆包大模型接入配置"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {auth.isLoggedIn && auth.user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-slate-800">{auth.user.name}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500 hidden sm:inline">{auth.user.school}</span>
                {auth.isDemo && (
                  <span className="text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono">
                    演示模式
                  </span>
                )}
              </div>
              <button
                onClick={onLogout}
                title="退出当前登录"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>微信扫码登录</span>
            </button>
          )}
        </div>
      </div>

      {/* 移动端导航下栏 */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 py-2 px-2 text-xs font-medium text-slate-600 bg-slate-50/50">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`py-1 px-2 rounded ${currentTab === 'dashboard' ? 'text-blue-600 font-semibold' : ''}`}
        >
          看板
        </button>
        <button
          onClick={() => onTabChange('students')}
          className={`py-1 px-2 rounded ${currentTab === 'students' ? 'text-blue-600 font-semibold' : ''}`}
        >
          学生
        </button>
        <button
          onClick={() => onTabChange('wrong')}
          className={`py-1 px-2 rounded ${currentTab === 'wrong' ? 'text-blue-600 font-semibold' : ''}`}
        >
          错题
        </button>
        <button
          onClick={() => onTabChange('jyeoo')}
          className={`py-1 px-2 rounded ${currentTab === 'jyeoo' ? 'text-blue-600 font-semibold' : ''}`}
        >
          选题
        </button>
        <button
          onClick={() => onTabChange('paper')}
          className={`py-1 px-2 rounded ${currentTab === 'paper' ? 'text-blue-600 font-semibold' : ''}`}
        >
          组卷
        </button>
      </div>
    </header>
  );
};
