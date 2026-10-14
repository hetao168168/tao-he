import React, { useState } from 'react';
import { Student, WrongQuestion, SUBJECT_MAP } from '../types';
import { Download, Printer, Copy, Check, X, FileText, Calendar, Sparkles, BookOpen, Bot, RefreshCw } from 'lucide-react';
import { generateWeeklyCommentWithDoubao } from '../services/doubaoService';

interface StudentWeeklyReportModalProps {
  isOpen?: boolean;
  student: Student;
  allWrongQuestions: WrongQuestion[];
  onClose: () => void;
}

export const StudentWeeklyReportModal: React.FC<StudentWeeklyReportModalProps> = ({
  isOpen = true,
  student,
  allWrongQuestions,
  onClose,
}) => {
  if (!isOpen) return null;
  const [copied, setCopied] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'all'>('week');
  const [isDoubaoGenerating, setIsDoubaoGenerating] = useState(false);

  // 计算本周日期范围（过去7天或本周一至今）
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  // 筛选该学生的错题
  const studentWrongs = allWrongQuestions.filter(w => w.studentId === student.id);
  const weekWrongs = studentWrongs.filter(w => {
    if (timeRange === 'all') return true;
    return w.date >= sevenDaysAgoStr;
  });

  // 如果本周无新增，则回退并提示展示近期错题，避免家长收到空报告
  const displayItems = weekWrongs.length > 0 ? weekWrongs : studentWrongs;
  const isFallbackAll = weekWrongs.length === 0 && studentWrongs.length > 0;

  // 统计指标
  const totalCount = displayItems.length;
  const unmasteredCount = displayItems.filter(w => !w.mastered).length;
  const masteredCount = totalCount - unmasteredCount;

  // 错因归因
  const reasonSummary: Record<string, number> = {};
  displayItems.forEach(w => {
    reasonSummary[w.errorReason] = (reasonSummary[w.errorReason] || 0) + 1;
  });
  const mainReason = Object.entries(reasonSummary).sort((a, b) => b[1] - a[1])[0]?.[0] || '综合概念理解';

  // 默认周报寄语
  const [teacherMessage, setTeacherMessage] = useState(
    `尊敬的家长：您好！这是【${student.name}】同学本周在校错题学情反馈。本周主要在【${mainReason}】方面出现失分，建议周末重点结合下方名师解析帮助孩子梳理思路，巩固核心考点。`
  );

  // 豆包 AI 生成个性化学情周报评语
  const handleGenerateDoubaoComment = async () => {
    setIsDoubaoGenerating(true);
    try {
      const kps = Array.from(new Set(displayItems.flatMap(w => w.tags || w.snap.kp || []))).slice(0, 3);
      const comment = await generateWeeklyCommentWithDoubao({
        studentName: student.name,
        grade: student.grade,
        totalWrong: totalCount,
        openWrong: unmasteredCount,
        masteredWrong: masteredCount,
        mainReason,
        topWeakKp: kps,
      });
      setTeacherMessage(comment);
    } finally {
      setIsDoubaoGenerating(false);
    }
  };

  // 唤起打印转 PDF
  const handlePrintPdf = () => {
    window.print();
  };

  // 导出单文件 HTML 格式周报
  const handleDownloadHtml = () => {
    const reportHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${student.name} - 本周错题学情反馈周报</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif; line-height: 1.6; margin: 30px auto; max-width: 800px; color: #1e293b; }
    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
    .title { font-size: 22px; font-weight: bold; color: #0f172a; margin-bottom: 6px; }
    .subtitle { font-size: 13px; color: #64748b; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; font-size: 13px; }
    .stats-bar { display: flex; justify-content: space-between; border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-top: 10px; font-weight: 500; }
    .teacher-note { background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #1e40af; margin-bottom: 24px; }
    .item-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 20px; page-break-inside: avoid; }
    .item-head { display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-bottom: 8px; }
    .stem { font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
    .options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; margin-bottom: 12px; }
    .opt-box { padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
    .analysis { background: #f1f5f9; padding: 12px 14px; border-radius: 6px; font-size: 12px; margin-top: 10px; }
    .answer-tag { font-weight: bold; color: #059669; }
    .wrong-tag { font-weight: bold; color: #e11d48; text-decoration: line-through; }
    @media print { body { margin: 15mm; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">【${student.name}】错题学情诊断与复练周报</div>
    <div class="subtitle">${student.school || '教学教研示范校'} · 菁优网智能教学工作台</div>
  </div>

  <div class="info-card">
    <div><strong>学生姓名：</strong>${student.name} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>班级：</strong>${student.className} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>年级：</strong>${student.grade}</div>
    <div class="stats-bar">
      <span>本周记录错题：<strong>${totalCount}</strong> 道</span>
      <span>待巩固重练：<strong style="color: #d97706;">${unmasteredCount}</strong> 道</span>
      <span>已掌握攻克：<strong style="color: #059669;">${masteredCount}</strong> 道</span>
      <span>主要弱项：<strong style="color: #2563eb;">${mainReason}</strong></span>
    </div>
  </div>

  <div class="teacher-note">
    <strong>辅导老师寄语：</strong>${teacherMessage}
  </div>

  <h3 style="font-size: 15px; margin-bottom: 14px; color: #0f172a;">本周错题详细诊断与权威解析清单</h3>

  ${displayItems
    .map(
      (w, i) => `
    <div class="item-card">
      <div class="item-head">
        <span>第 ${i + 1} 题 · ${SUBJECT_MAP[w.subject as keyof typeof SUBJECT_MAP] || w.subject} · ${w.snap.source || '校内统测'}</span>
        <span>错因定位：<strong>${w.errorReason}</strong></span>
      </div>
      <div class="stem">${i + 1}. ${w.snap.stem}</div>
      <div class="options">
        ${(w.snap.options || []).map(o => `<div class="opt-box"><strong>${o.pos}.</strong> ${o.text}</div>`).join('')}
      </div>
      <div class="analysis">
        <div style="margin-bottom: 6px;">
          <span>学生答卷选择：<span class="wrong-tag">${w.myAnswer}</span></span> &nbsp;&nbsp;|&nbsp;&nbsp;
          <span>标准答案：<span class="answer-tag">${w.snap.answer}</span></span>
        </div>
        ${w.note ? `<div style="color: #92400e; margin-bottom: 6px;"><strong>教师点评：</strong>${w.note}</div>` : ''}
        <div style="color: #475569;"><strong>试题权威解析思路：</strong>${w.snap.explanation || '详见教材相应知识点讲解。'}</div>
      </div>
    </div>
  `
    )
    .join('')}

  <div style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 30px;">
    菁优网智能教学工作台 · 辅导老师定制生成 · 家校协同共促进步
  </div>
</body>
</html>`;

    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${student.name}_本周错题学情周报_${now.toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 复制文本摘要供微信发给家长
  const handleCopySummary = () => {
    const text = `【${student.name}同学本周错题学情周报】
年级班级：${student.grade} ${student.className}
本周新增错题：${totalCount} 道（待复练：${unmasteredCount} 道，已攻坚：${masteredCount} 道）
主要易错归因：${mainReason}
老师寄语：${teacherMessage}
详细试题解析与题目请查看导出的 PDF/HTML 周报附件。`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl my-6 flex flex-col max-h-[90vh] overflow-hidden">
        {/* 顶部操作工具栏 (打印时不展示) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 no-print shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                【{student.name}】错题学情周报生成器
              </h3>
              <p className="text-xs text-slate-500">
                整理本周新增错题及权威解析，一键导出 PDF 供发送家长反馈学情
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 范围选择 */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setTimeRange('week')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  timeRange === 'week' ? 'bg-blue-600 text-white font-medium' : 'text-slate-600'
                }`}
              >
                近7天新增 ({weekWrongs.length})
              </button>
              <button
                onClick={() => setTimeRange('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  timeRange === 'all' ? 'bg-blue-600 text-white font-medium' : 'text-slate-600'
                }`}
              >
                全部错题 ({studentWrongs.length})
              </button>
            </div>

            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制微信摘要' : '复制摘要'}</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载家长版 HTML</span>
            </button>

            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>导出 / 打印 PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 周报主体预览画布（支持直接 Ctrl+P 或点击导出 PDF） */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 bg-white text-slate-800">
          {/* 回退提示 */}
          {isFallbackAll && timeRange === 'week' && (
            <div className="no-print p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
              <span>该生本周记录为空，已自动为您整合该生近期录入的全部错题以生成周报。</span>
            </div>
          )}

          {/* 报告头部 */}
          <div className="text-center pb-5 border-b-2 border-blue-600">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              【{student.name}】错题学情反馈与复练周报
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {student.school || '教学教研示范校'} · 菁优网智能教学辅导系统 · 针对性提升方案
            </p>
          </div>

          {/* 学情卡片 (Zero-Pill: Clean unboxed metadata) */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <span>学生：{student.name}</span>
                <span>·</span>
                <span>班级：{student.className}</span>
                <span>·</span>
                <span>年级：{student.grade}</span>
                <span>·</span>
                <span>学校：{student.school}</span>
              </div>
              <div className="text-slate-500 font-mono">
                生成日期：{now.toISOString().slice(0, 10)}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">本周记录错题</span>
                <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
                  {totalCount} 道
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">待巩固强化</span>
                <span className="text-base font-bold text-amber-600 font-mono tabular-nums">
                  {unmasteredCount} 道
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">已掌握攻克</span>
                <span className="text-base font-bold text-emerald-600 font-mono tabular-nums">
                  {masteredCount} 道
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">高频错因归类</span>
                <span className="text-base font-bold text-blue-700">
                  {mainReason}
                </span>
              </div>
            </div>
          </div>

          {/* 辅导老师个性化寄语（可编辑，支持豆包 AI 一键智能提分生成） */}
          <div className="bg-blue-50/70 border-l-4 border-blue-600 p-4 rounded-r-xl space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-blue-900 font-semibold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                辅导老师学情诊断与家长协同建议
              </span>
              <div className="flex items-center gap-2 no-print">
                <button
                  type="button"
                  onClick={handleGenerateDoubaoComment}
                  disabled={isDoubaoGenerating}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition-colors shadow-xs disabled:opacity-50"
                  title="由豆包大模型结合本周错题数量、薄弱点与错因自动撰写温暖专业的评语"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>{isDoubaoGenerating ? '豆包生成中...' : '🤖 豆包AI智能生成评语'}</span>
                </button>
                <span className="text-[11px] text-blue-500 font-normal">（可自由编辑）</span>
              </div>
            </div>
            <textarea
              rows={3}
              value={teacherMessage}
              onChange={e => setTeacherMessage(e.target.value)}
              className="w-full text-xs text-blue-950 bg-white/90 border border-blue-200 rounded-lg p-2.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500 leading-relaxed"
            />
          </div>

          {/* 错题与解析清单 */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                本周重点错题归纳与名师权威解析（共 {displayItems.length} 题）
              </h3>
              <span className="text-xs text-slate-400">建议周末由家长引导学生复练重做</span>
            </div>

            {displayItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                该生暂无错题记录
              </div>
            ) : (
              displayItems.map((item, idx) => {
                const subjectName =
                  SUBJECT_MAP[item.subject as keyof typeof SUBJECT_MAP] || item.subject;
                return (
                  <div
                    key={item.id}
                    className="border border-slate-200 rounded-xl p-5 space-y-3 avoid-break shadow-2xs"
                  >
                    {/* 题头 */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">第 {idx + 1} 题</span>
                        <span>·</span>
                        <span className="text-blue-700 font-medium">{subjectName}</span>
                        <span>·</span>
                        <span>{item.snap.source || '模考真题'}</span>
                        <span>·</span>
                        <span className="text-amber-700 font-medium">错因：{item.errorReason}</span>
                      </div>
                      <span className="font-mono">{item.date}</span>
                    </div>

                    {/* 题干 */}
                    <div className="text-sm font-medium text-slate-900 leading-relaxed">
                      {idx + 1}. {item.snap.stem}
                    </div>

                    {/* 选项 */}
                    {item.snap.options && item.snap.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {item.snap.options.map(o => (
                          <div
                            key={o.pos}
                            className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2"
                          >
                            <span className="font-bold text-slate-700">{o.pos}.</span>
                            <span className="text-slate-800">{o.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 学生做题情况 vs 标准答案 */}
                    <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-200/80 text-xs space-y-2">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-slate-500 mr-1.5">学生作答：</span>
                          <span className="font-bold text-rose-600 line-through">
                            {item.myAnswer}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 mr-1.5">标准答案：</span>
                          <span className="font-bold text-emerald-700">
                            {item.snap.answer}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 mr-1.5">考点：</span>
                          <span className="text-slate-700">
                            {item.snap.kp?.join(' / ') || '基础概念'}
                          </span>
                        </div>
                      </div>

                      {/* 教师评语 */}
                      {item.note && (
                        <div className="text-amber-900 pt-1 border-t border-slate-200/60">
                          <span className="font-semibold">教师评语与点拨：</span>
                          {item.note}
                        </div>
                      )}

                      {/* 试题详细解析 */}
                      {item.snap.explanation && (
                        <div className="text-slate-700 pt-1 border-t border-slate-200/60 leading-relaxed">
                          <span className="font-semibold text-slate-900">权威解题思路与解析：</span>
                          {item.snap.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 页脚签名栏 */}
          <div className="pt-8 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
            <span>菁优网智能教学工作台 · 家校沟通学情反馈</span>
            <span>家长签字反馈：____________________</span>
          </div>
        </div>
      </div>
    </div>
  );
};
