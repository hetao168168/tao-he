import React, { useState } from 'react';
import {
  Student,
  WrongQuestion,
  Question,
  GeneratedPaper,
  PaperSettings,
  PRIMARY_GRADES,
  JUNIOR_GRADES,
  SENIOR_GRADES,
  ALL_GRADES,
} from '../types';
import { Printer, Download, Save, Check, RefreshCw, FileText, ArrowLeft, Settings2 } from 'lucide-react';

interface PaperGeneratorViewProps {
  students: Student[];
  wrongQuestions: WrongQuestion[];
  questions: Question[];
  initialStudentId?: string;
  onSavePaper: (paper: Omit<GeneratedPaper, 'id' | 'createdAt' | 'totalScore'>) => void;
  savedPapers: GeneratedPaper[];
  onDeleteSavedPaper: (id: string) => void;
}

export const PaperGeneratorView: React.FC<PaperGeneratorViewProps> = ({
  students,
  wrongQuestions,
  questions,
  initialStudentId,
  onSavePaper,
  savedPapers,
  onDeleteSavedPaper,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || students[0]?.id || ''
  );
  const [selectedMode, setSelectedMode] = useState<'wrong' | 'bank'>('wrong');
  const [bankGradeFilter, setBankGradeFilter] = useState<string>('all');
  const [onlyOpen, setOnlyOpen] = useState(true); // 只选未掌握错题

  // 选中的试题 ID 集合
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // 试卷配置
  const currentStudent = students.find(s => s.id === selectedStudentId);
  const [settings, setSettings] = useState<PaperSettings>({
    title: currentStudent ? `${currentStudent.name}·错题强化专练重做卷` : '期中阶段诊断练习卷',
    subtitle: '攻坚高频易错考点 · 查漏补缺针对性突破',
    header: '注意事项：请将答案规范书写，答题完毕请仔细检查核验。',
    footer: '菁优网智能教学工作台 · 错题针对性巩固提升',
    perScore: 20,
    showAnswer: true,
    studentName: currentStudent?.name || '',
    className: currentStudent?.className || '',
    duration: 45,
    examDate: new Date().toISOString().slice(0, 10),
  });

  const [activeTab, setActiveTab] = useState<'config' | 'preview' | 'history'>('config');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // 候选试题池
  const candidateWrongQuestions = wrongQuestions.filter(w => {
    const matchStu = !selectedStudentId || w.studentId === selectedStudentId;
    const matchOpen = !onlyOpen || !w.mastered;
    return matchStu && matchOpen;
  });

  // 更新学生时自动同步试卷标题
  const handleStudentChange = (stuId: string) => {
    setSelectedStudentId(stuId);
    const stu = students.find(s => s.id === stuId);
    if (stu) {
      setSettings(prev => ({
        ...prev,
        title: `${stu.name}·错题强化专练重做卷`,
        studentName: stu.name,
        className: stu.className,
      }));
    }
  };

  // 题库自选模式候选（按小学至高中年级过滤）
  const candidateBankQuestions = questions.filter(q => {
    if (bankGradeFilter === 'all') return true;
    return q.grade === bankGradeFilter || q.grade.includes(bankGradeFilter);
  });

  // 提取最终入卷试题
  const finalItems = (
    selectedMode === 'wrong'
      ? candidateWrongQuestions
          .filter(w => selectedItemIds.size === 0 || selectedItemIds.has(w.id))
          .map(w => w.snap)
      : candidateBankQuestions
          .filter(q => selectedItemIds.has(q.id))
          .map(q => q)
  );

  const totalScore = (settings.perScore || 10) * finalItems.length;

  // 打印试卷
  const handlePrint = () => {
    window.print();
  };

  // 导出单文件 HTML 试卷
  const handleDownloadHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${settings.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif; line-height: 1.6; margin: 40px auto; max-width: 800px; color: #111; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
    .title { font-size: 22px; font-weight: bold; margin-bottom: 6px; }
    .subtitle { font-size: 14px; color: #555; }
    .meta-bar { display: flex; justify-content: space-between; border: 1px solid #000; padding: 8px 16px; margin: 20px 0; font-size: 14px; }
    .item { margin-bottom: 25px; page-break-inside: avoid; }
    .stem { font-size: 15px; font-weight: 500; margin-bottom: 10px; }
    .options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px; margin-left: 20px; }
    .answer-page { page-break-before: always; margin-top: 50px; border-top: 2px dashed #666; padding-top: 30px; }
    @media print { body { margin: 0; max-width: 100%; } .answer-page { page-break-before: always; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${settings.title}</div>
    <div class="subtitle">${settings.subtitle}</div>
  </div>
  <div class="meta-bar">
    <span>学校：${currentStudent?.school || '________'}</span>
    <span>班级：${settings.className || '________'}</span>
    <span>姓名：${settings.studentName || '________'}</span>
    <span>得分：________ / ${totalScore}分</span>
  </div>
  <div style="font-size: 13px; color: #444; margin-bottom: 20px;">
    ${settings.header}（共 ${finalItems.length} 题，每题 ${settings.perScore} 分，满分 ${totalScore} 分）
  </div>
  <div class="content">
    ${finalItems
      .map(
        (it, idx) => `
      <div class="item">
        <div class="stem"><strong>${idx + 1}.</strong> ${it.stem} (${settings.perScore}分)</div>
        <div class="options">
          ${(it.options || []).map(o => `<div><strong>${o.pos}.</strong> ${o.text}</div>`).join('')}
        </div>
      </div>
    `
      )
      .join('')}
  </div>

  ${
    settings.showAnswer
      ? `
  <div class="answer-page">
    <h2 style="text-align: center; font-size: 18px; margin-bottom: 20px;">【参考答案与试题解析】</h2>
    ${finalItems
      .map(
        (it, idx) => `
      <div style="margin-bottom: 16px; font-size: 13px;">
        <p><strong>第 ${idx + 1} 题【答案】：</strong> <span style="font-weight: bold; color: #059669;">${it.answer}</span></p>
        <p style="color: #4b5563; margin-top: 4px;"><strong>解析：</strong>${it.explanation || '暂无详细文字解析。'}</p>
      </div>
    `
      )
      .join('')}
  </div>
  `
      : ''
  }
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${settings.title || '错题强化练习卷'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 保存到已归档试卷
  const handleSave = () => {
    onSavePaper({
      title: settings.title,
      subtitle: settings.subtitle,
      mode: selectedMode,
      studentId: selectedStudentId || undefined,
      studentName: settings.studentName,
      items: finalItems,
      settings,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 顶栏控制 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-bold text-slate-900">按错题一键组卷与导出</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            根据学生弱项智能提取未掌握错题，自动排版为专业 A4 规格试卷，支持直接打印与 HTML 导出
          </p>
        </div>

        {/* 视图切换按钮 */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'config' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            组卷配置
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'preview' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            A4试卷预览与打印 ({finalItems.length}题)
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'history' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            历史试卷归档 ({savedPapers.length})
          </button>
        </div>
      </div>

      {/* 1. 组卷配置面板 */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
          {/* 左侧：试卷题目源与学生选择 */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>步骤一：选择组卷对象与试题来源</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    指定学生 *
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={e => handleStudentChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                  >
                    {students.some(s => s.isFamilyChild) && (
                      <optgroup label="🏠 我家小孩专属专栏（亲子专练）">
                        {students
                          .filter(s => s.isFamilyChild)
                          .map(s => {
                            const openCount = wrongQuestions.filter(
                              w => w.studentId === s.id && !w.mastered
                            ).length;
                            return (
                              <option key={s.id} value={s.id}>
                                🏠 {s.name} ({s.familyRelation || '我家孩子'} · 待巩固 {openCount} 题)
                              </option>
                            );
                          })}
                      </optgroup>
                    )}
                    <optgroup label="🏫 班级在校学生名单">
                      {students
                        .filter(s => !s.isFamilyChild)
                        .map(s => {
                          const openCount = wrongQuestions.filter(
                            w => w.studentId === s.id && !w.mastered
                          ).length;
                          return (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.className} · 待复练 {openCount} 题)
                            </option>
                          );
                        })}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    组卷模式
                  </label>
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedMode('wrong')}
                      className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                        selectedMode === 'wrong'
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      该生错题本 ({candidateWrongQuestions.length}题)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMode('bank')}
                      className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                        selectedMode === 'bank'
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      题库自选 ({questions.length}题)
                    </button>
                  </div>
                </div>
              </div>

              {/* 待选题目清单 */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs">
                  <span className="font-medium text-slate-700">
                    当前备选题库清单（已选择 {finalItems.length} 道入卷）
                  </span>
                  {selectedMode === 'wrong' ? (
                    <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onlyOpen}
                        onChange={e => setOnlyOpen(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>仅选未掌握题目</span>
                    </label>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500">题库年级:</span>
                      <select
                        value={bankGradeFilter}
                        onChange={e => setBankGradeFilter(e.target.value)}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 font-medium"
                      >
                        <option value="all">全部年级 (小学~高中)</option>
                        <optgroup label="小学阶段 (1~6年级)">
                          {PRIMARY_GRADES.map(g => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="初中阶段 (7~9年级)">
                          {JUNIOR_GRADES.map(g => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="高中阶段 (高一~高三)">
                          {SENIOR_GRADES.map(g => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {(selectedMode === 'wrong' ? candidateWrongQuestions : candidateBankQuestions).map((item, i) => {
                    const id = item.id;
                    const stem = 'snap' in item ? item.snap.stem : item.stem;
                    const source = 'snap' in item ? item.snap.source : item.source;
                    const grade = 'snap' in item ? item.snap.grade : item.grade;
                    const isChecked = selectedItemIds.size === 0 || selectedItemIds.has(id);

                    return (
                      <div
                        key={id}
                        className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 transition-colors ${
                          isChecked ? 'bg-blue-50/40 border-blue-200' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            const next = new Set(selectedItemIds);
                            if (selectedItemIds.size === 0) {
                              // 初始化全选
                              (selectedMode === 'wrong' ? candidateWrongQuestions : candidateBankQuestions).forEach(
                                x => next.add(x.id)
                              );
                            }
                            if (e.target.checked) next.add(id);
                            else next.delete(id);
                            setSelectedItemIds(next);
                          }}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-slate-900 font-medium line-clamp-2">
                            {i + 1}. {stem}
                          </p>
                          <div className="mt-1 text-slate-400 flex items-center gap-2">
                            <span className="font-medium text-slate-600">{grade}</span>
                            <span>·</span>
                            <span>{source}</span>
                            {'errorReason' in item && (
                              <>
                                <span>·</span>
                                <span className="text-amber-600">错因：{item.errorReason}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：试卷卷头与排版设置 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 h-fit">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-blue-600" />
              <span>步骤二：试卷排版与考务参数</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                试卷大标题 *
              </label>
              <input
                type="text"
                value={settings.title}
                onChange={e => setSettings({ ...settings, title: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                副标题说明
              </label>
              <input
                type="text"
                value={settings.subtitle}
                onChange={e => setSettings({ ...settings, subtitle: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  每题分值 (分)
                </label>
                <input
                  type="number"
                  value={settings.perScore}
                  onChange={e => setSettings({ ...settings, perScore: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  建议答题时长
                </label>
                <input
                  type="number"
                  value={settings.duration}
                  onChange={e => setSettings({ ...settings, duration: Number(e.target.value) || 0 })}
                  placeholder="分钟"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                考生须知与卷头提示
              </label>
              <textarea
                rows={2}
                value={settings.header}
                onChange={e => setSettings({ ...settings, header: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-700 font-medium">附带答案与详细解析页</span>
              <input
                type="checkbox"
                checked={settings.showAnswer}
                onChange={e => setSettings({ ...settings, showAnswer: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <button
                onClick={() => setActiveTab('preview')}
                disabled={finalItems.length === 0}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>进入试卷排版预览 ({finalItems.length}题 · 满分{totalScore}分)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 试卷预览与打印排版面板 */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          {/* 顶部操作条（打印时不显示） */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs no-print">
            <button
              onClick={() => setActiveTab('config')}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回修改配置</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>已存入历史归档</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>保存试卷归档</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadHtml}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>导出 HTML 试卷</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>无损原生打印 (Ctrl+P)</span>
              </button>
            </div>
          </div>

          {/* A4 试卷打印画布主体 */}
          <div className="bg-white max-w-4xl mx-auto p-8 sm:p-12 border border-slate-300 rounded-xl shadow-lg print:shadow-none print:border-none print:p-0 print:max-w-none">
            {/* 试卷头部 */}
            <div className="text-center pb-6 border-b-2 border-slate-900">
              <div className="text-xs text-slate-500 mb-1 tracking-widest uppercase">
                绝密★启用前
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {settings.title}
              </h1>
              {settings.subtitle && (
                <p className="text-sm text-slate-600 mt-1">{settings.subtitle}</p>
              )}
            </div>

            {/* 考务密封线区 */}
            <div className="my-5 border border-slate-900 p-2.5 text-xs flex flex-wrap items-center justify-between gap-4 font-mono">
              <span>学校：{currentStudent?.school || '________________'}</span>
              <span>班级：{settings.className || '____________'}</span>
              <span>姓名：{settings.studentName || '____________'}</span>
              <span>考试时间：{settings.duration || 45}分钟</span>
              <span className="font-bold text-slate-900">
                总分：________ / {totalScore}分
              </span>
            </div>

            {/* 考生须知 */}
            <div className="text-xs text-slate-600 mb-6 bg-slate-50 p-2.5 rounded border border-slate-200/80 leading-relaxed print:bg-white print:border-slate-400">
              <span className="font-bold">考生须知：</span>
              <span>{settings.header}（本试卷共 {finalItems.length} 题，每题 {settings.perScore} 分，满分 {totalScore} 分）</span>
            </div>

            {/* 试题列表区 */}
            <div className="space-y-6">
              <div className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1">
                一、单项选择题（共 {finalItems.length} 小题，每小题 {settings.perScore} 分，共 {totalScore} 分）
              </div>

              {finalItems.map((item, idx) => (
                <div key={idx} className="avoid-break space-y-2.5 text-slate-900">
                  <div className="text-sm leading-relaxed">
                    <span className="font-bold mr-1">{idx + 1}.</span>
                    <span>{item.stem}</span>
                    <span className="text-xs text-slate-500 ml-2 font-mono">
                      （本题 {settings.perScore} 分）
                    </span>
                  </div>

                  {item.options && item.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs ml-4">
                      {item.options.map(opt => (
                        <div key={opt.pos} className="flex items-start gap-1.5">
                          <span className="font-bold">{opt.pos}.</span>
                          <span>{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 试卷页脚 */}
            <div className="mt-12 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
              {settings.footer} · 第 1 页（共 {settings.showAnswer ? 2 : 1} 页）
            </div>

            {/* 答案与解析附页 */}
            {settings.showAnswer && (
              <div className="page-break-before mt-12 pt-8 border-t-2 border-dashed border-slate-300">
                <div className="text-center pb-4 mb-6 border-b border-slate-200">
                  <h2 className="text-lg font-bold text-slate-900">
                    【参考答案与详细解析】
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    《{settings.title}》标准答案及评分参考
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  {finalItems.map((item, idx) => (
                    <div key={idx} className="avoid-break p-3 rounded-lg bg-slate-50 print:bg-white border border-slate-200">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-bold text-slate-900">第 {idx + 1} 题</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-bold text-emerald-700">
                          参考答案：{item.answer}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">考查考点：{item.kp?.join(' / ') || '综合'}</span>
                      </div>
                      {item.explanation && (
                        <p className="text-slate-600 leading-relaxed">
                          <span className="font-semibold text-slate-700">解析思路：</span>
                          {item.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. 历史试卷归档列表 */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 no-print">
          <h3 className="text-sm font-semibold text-slate-900">历史已生成试卷归档</h3>
          {savedPapers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              暂无已保存的试卷记录
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {savedPapers.map(p => (
                <div key={p.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{p.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>对象：{p.studentName || '通用'}</span>
                      <span>·</span>
                      <span>题量：{p.items.length} 题</span>
                      <span>·</span>
                      <span>满分：{p.totalScore} 分</span>
                      <span>·</span>
                      <span>创建时间：{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSettings(p.settings);
                        setActiveTab('preview');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      重新预览与打印
                    </button>
                    <button
                      onClick={() => onDeleteSavedPaper(p.id)}
                      className="text-xs text-slate-400 hover:text-rose-600 p-1.5 transition-colors"
                      title="删除记录"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
