import React from 'react';
import { Student, WrongQuestion, Question, GeneratedPaper, SUBJECT_MAP } from '../types';
import { Users, FileQuestion, CheckCircle2, AlertTriangle, FileText, ArrowRight, Zap, Target, Bot, Sparkles, Lightbulb, Settings, Home, Heart } from 'lucide-react';

interface DashboardViewProps {
  students: Student[];
  wrongQuestions: WrongQuestion[];
  questions: Question[];
  papers: GeneratedPaper[];
  onNavigate: (tab: 'students' | 'wrong' | 'jyeoo' | 'paper', filterStudentId?: string) => void;
  onOpenLogin: () => void;
  isLoggedIn: boolean;
  onOpenDoubaoAssistant?: () => void;
  onOpenDoubaoConfig?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  wrongQuestions,
  questions,
  papers,
  onNavigate,
  onOpenLogin,
  isLoggedIn,
  onOpenDoubaoAssistant,
  onOpenDoubaoConfig,
}) => {
  const totalWrong = wrongQuestions.length;
  const unmasteredWrong = wrongQuestions.filter(w => !w.mastered).length;
  const masteredWrong = totalWrong - unmasteredWrong;
  const masterRate = totalWrong > 0 ? Math.round((masteredWrong / totalWrong) * 100) : 100;

  // 我家小孩专属数据
  const familyKids = students.filter(s => s.isFamilyChild);
  const familyWrongs = wrongQuestions.filter(w => familyKids.some(k => k.id === w.studentId));
  const familyOpenWrongs = familyWrongs.filter(w => !w.mastered);

  // 学科统计
  const subjectCounts: Record<string, { total: number; unmastered: number }> = {};
  wrongQuestions.forEach(w => {
    const sName = SUBJECT_MAP[w.subject as keyof typeof SUBJECT_MAP] || w.subject || '其他学科';
    if (!subjectCounts[sName]) subjectCounts[sName] = { total: 0, unmastered: 0 };
    subjectCounts[sName].total++;
    if (!w.mastered) subjectCounts[sName].unmastered++;
  });

  // 错因归因统计
  const reasonCounts: Record<string, number> = {};
  wrongQuestions.forEach(w => {
    reasonCounts[w.errorReason] = (reasonCounts[w.errorReason] || 0) + 1;
  });

  // 待重点关注学生（未掌握错题最多）
  const topNeedAttention = [...students]
    .map(s => {
      const sWrongs = wrongQuestions.filter(w => w.studentId === s.id && !w.mastered);
      return { ...s, openCount: sWrongs.length };
    })
    .sort((a, b) => b.openCount - a.openCount)
    .slice(0, 4);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 顶部状态提示横幅 */}
      {!isLoggedIn && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <h2 className="text-base font-semibold">登录提速提示：底层接口已升级为毫秒级响应</h2>
            </div>
            <p className="text-xs text-blue-200">
              采用轻量级微信扫码直通协议，彻底解决旧版 Playwright 浏览器冷启动耗时过长问题。
            </p>
          </div>
          <button
            onClick={onOpenLogin}
            className="px-4 py-2 bg-white text-blue-900 hover:bg-blue-50 text-xs font-semibold rounded-lg shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            立即极速扫码
          </button>
        </div>
      )}

      {/* 核心指标 4 格 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">学生档案人数</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {students.length}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            涵盖小学一年级至高三年级
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">待攻坚错题</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono tabular-nums">
            {unmasteredWrong}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            累计归档 {totalWrong} 道错题
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">错题攻克掌握率</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
            {masterRate}%
          </div>
          <div className="mt-2 text-xs text-slate-400">
            已掌握 {masteredWrong} 道试题
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">已组卷训练份数</span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {papers.length}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            支持一键精准 A4 打印与导出
          </div>
        </div>
      </div>

      {/* 豆包 AI 大模型免费版教学赋能卡片 */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-blue-800/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-base">
                🤖
              </span>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                豆包大模型免费版 · K12 智能教学引擎已就绪
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-400 text-emerald-950">
                毫秒级直连
              </span>
            </div>
            <p className="text-xs text-blue-200 leading-relaxed">
              为每位老师提供零门槛、开箱即用的 AI 教学新质生产力：支持错题认知卡点深度溯源、一键举一反三生成同构变式题、启发式分步讲题及个性化学情诊断。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenDoubaoAssistant}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Bot className="w-4 h-4" />
              <span>呼出豆包教学助教</span>
            </button>
            <button
              onClick={() => onNavigate('wrong')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-colors border border-white/15"
            >
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>体验举一反三变式</span>
            </button>
            {onOpenDoubaoConfig && (
              <button
                onClick={onOpenDoubaoConfig}
                className="p-2 text-blue-200 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                title="火山引擎方舟 API 配置"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 我家孩子专属学情成长专栏卡片 */}
      {familyKids.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50 via-pink-50/50 to-amber-50/40 rounded-2xl p-5 border border-rose-200/90 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-rose-200/60">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-sm font-bold">
                🏡
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>我家孩子专属档案与错题看板</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                    亲子专区 · 已与班级学生隔离
                  </span>
                </h3>
              </div>
            </div>
            <button
              onClick={() => onNavigate('students')}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>进入我家孩子专栏</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {familyKids.map(kid => {
              const kidWrongs = wrongQuestions.filter(w => w.studentId === kid.id);
              const kidOpen = kidWrongs.filter(w => !w.mastered).length;
              const kidMastered = kidWrongs.length - kidOpen;

              return (
                <div
                  key={kid.id}
                  className="bg-white/90 rounded-xl p-3.5 border border-rose-200/70 shadow-2xs flex flex-col justify-between space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">{kid.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                          {kid.familyRelation || '我家孩子'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {kid.school} · {kid.grade}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                      待巩固 {kidOpen} 题
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-mono">
                      已攻克 {kidMastered} / 总计 {kidWrongs.length} 题
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate('wrong', kid.id)}
                        className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                      >
                        看错题
                      </button>
                      <button
                        onClick={() => onNavigate('paper', kid.id)}
                        className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                      >
                        组卷复练
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 快捷操作栏 */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <span className="text-xs font-semibold text-slate-500 px-2">常用工作入口：</span>
        <button
          onClick={() => onNavigate('wrong')}
          className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <span>错题本 · AI 诊断</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
        </button>
        <button
          onClick={() => onNavigate('paper')}
          className="px-3 py-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
        >
          按错题一键组卷
        </button>
        <button
          onClick={() => onNavigate('jyeoo')}
          className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
        >
          菁优网题库选题
        </button>
        <button
          onClick={() => onNavigate('students')}
          className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
        >
          学生档案 · 智能周报
        </button>
      </div>

      {/* 中间网格：学科错题分布 + 错因归因分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 学科分布 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">各学科错题攻克分布</h3>
            <span className="text-xs text-slate-400">未掌握 / 总计</span>
          </div>

          <div className="space-y-3.5">
            {Object.keys(subjectCounts).length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">暂无错题数据</div>
            ) : (
              Object.entries(subjectCounts).map(([subject, counts]) => {
                const percent = Math.round(((counts.total - counts.unmastered) / counts.total) * 100);
                return (
                  <div key={subject} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{subject}</span>
                      <span className="text-slate-500 font-mono tabular-nums">
                        待复练 {counts.unmastered} 题 · 掌握率 {percent}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                      <div
                        className="bg-amber-400 h-full transition-all duration-500"
                        style={{ width: `${100 - percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 错因分类 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">薄弱根因归因分析</h3>
            <span className="text-xs text-slate-400">针对性补强参考</span>
          </div>

          <div className="space-y-3">
            {Object.keys(reasonCounts).length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">暂无错题分析数据</div>
            ) : (
              Object.entries(reasonCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([reason, count]) => {
                  const ratio = Math.round((count / totalWrong) * 100);
                  return (
                    <div key={reason} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50">
                      <span className="font-medium text-slate-800">{reason}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-mono tabular-nums">{count} 次出现</span>
                        <span className="w-12 text-right font-mono text-slate-700 font-medium">{ratio}%</span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* 待重点辅导学生清单 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">待重点关注学生清单</h3>
            <p className="text-xs text-slate-500 mt-0.5">未掌握错题较多的学生，建议定期按错题组卷复练</p>
          </div>
          <button
            onClick={() => onNavigate('students')}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <span>全部学生档案</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topNeedAttention.map(student => (
            <div
              key={student.id}
              className="p-4 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 text-sm">{student.name}</span>
                  <span className="text-xs text-slate-500">{student.grade} · {student.className}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                  <span>待攻坚错题：</span>
                  <span className="font-mono font-semibold text-amber-600 tabular-nums">
                    {student.openCount} 题
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="truncate max-w-[180px] text-slate-400">{student.note || '暂无评语'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('paper', student.id)}
                  className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-100/70 hover:bg-blue-100 rounded-md transition-colors whitespace-nowrap"
                >
                  针对性出卷
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
