import React, { useState, useEffect } from 'react';
import { WrongQuestion, Question, QuestionOption, SUBJECT_MAP } from '../types';
import {
  diagnoseWrongQuestion,
  generateVariantQuestion,
  DoubaoDiagnosisResult,
  DoubaoVariantQuestion,
} from '../services/doubaoService';
import {
  Sparkles,
  Bot,
  X,
  RefreshCw,
  CheckCircle,
  Copy,
  PlusCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  BookOpen,
  Share2,
} from 'lucide-react';

interface DoubaoDiagnoseModalProps {
  wrongQuestion: WrongQuestion;
  isOpen: boolean;
  onClose: () => void;
  onImportToBank?: (q: Omit<Question, 'id' | 'addedAt'>) => void;
  onAssignToStudent?: (studentId: string, q: Question) => void;
}

export const DoubaoDiagnoseModal: React.FC<DoubaoDiagnoseModalProps> = ({
  wrongQuestion,
  isOpen,
  onClose,
  onImportToBank,
  onAssignToStudent,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'diagnose' | 'variant'>('diagnose');
  
  // 诊断状态
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DoubaoDiagnosisResult | null>(null);

  // 变式题状态
  const [isGeneratingVariant, setIsGeneratingVariant] = useState(false);
  const [variant, setVariant] = useState<DoubaoVariantQuestion | null>(null);
  const [copiedVariant, setCopiedVariant] = useState(false);
  const [addedToBank, setAddedToBank] = useState(false);

  const subjectLabel =
    SUBJECT_MAP[wrongQuestion.subject as keyof typeof SUBJECT_MAP] || wrongQuestion.subject;

  // 初始自动运行诊断
  useEffect(() => {
    runDiagnosis();
  }, [wrongQuestion.id]);

  const runDiagnosis = async () => {
    setIsDiagnosing(true);
    try {
      const res = await diagnoseWrongQuestion({
        subject: subjectLabel,
        grade: wrongQuestion.grade,
        stem: wrongQuestion.snap.stem,
        options: wrongQuestion.snap.options,
        answer: wrongQuestion.snap.answer,
        myAnswer: wrongQuestion.myAnswer,
        errorReason: wrongQuestion.errorReason,
        studentName: wrongQuestion.studentName,
      });
      setDiagnosis(res);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const runGenerateVariant = async () => {
    setIsGeneratingVariant(true);
    setAddedToBank(false);
    try {
      const res = await generateVariantQuestion({
        subject: subjectLabel,
        grade: wrongQuestion.grade,
        stem: wrongQuestion.snap.stem,
        options: wrongQuestion.snap.options,
        answer: wrongQuestion.snap.answer,
        explanation: wrongQuestion.snap.explanation,
        kp: wrongQuestion.tags || wrongQuestion.snap.kp,
        difficulty: wrongQuestion.snap.difficulty,
      });
      setVariant(res);
    } finally {
      setIsGeneratingVariant(false);
    }
  };

  // 切换到变式题 Tab 时，若无内容自动触发一次生成
  const handleTabChange = (tab: 'diagnose' | 'variant') => {
    setActiveTab(tab);
    if (tab === 'variant' && !variant && !isGeneratingVariant) {
      runGenerateVariant();
    }
  };

  // 复制变式题
  const handleCopyVariant = () => {
    if (!variant) return;
    const optText = variant.options.map(o => `${o.pos}. ${o.text}`).join('\n');
    const fullText = `【变式训练题·${subjectLabel}】\n${variant.stem}\n${optText}\n\n【正确答案】${variant.answer}\n【名师解析】\n${variant.explanation}`;
    navigator.clipboard.writeText(fullText);
    setCopiedVariant(true);
    setTimeout(() => setCopiedVariant(false), 2000);
  };

  // 一键将变式题添加到公共题库
  const handleAddVariantToBank = () => {
    if (!variant || !onImportToBank) return;
    onImportToBank({
      subject: wrongQuestion.subject,
      grade: wrongQuestion.grade,
      stem: variant.stem,
      options: variant.options,
      answer: variant.answer,
      explanation: variant.explanation,
      difficulty: variant.difficulty,
      source: variant.source,
      kp: variant.kp,
      tags: ['豆包AI变式题', ...(variant.kp || [])],
      origin: 'custom',
    });
    setAddedToBank(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* 顶栏 */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-lg shadow-inner">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">豆包大模型 · AI 智能错题攻克引擎</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-400 text-emerald-950">
                  免费版已就绪
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                针对【{wrongQuestion.studentName}】的错题进行多维度认知卡点溯源与同构变式题拓练
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 标签切换栏 */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 shrink-0 text-sm">
          <button
            onClick={() => handleTabChange('diagnose')}
            className={`py-3 px-4 font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'diagnose'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>豆包 AI 深度错因诊断</span>
          </button>

          <button
            onClick={() => handleTabChange('variant')}
            className={`py-3 px-4 font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'variant'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>举一反三·变式题生成</span>
            {variant && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            )}
          </button>
        </div>

        {/* 内容滚轮区 */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800">
          {/* 原题信息紧凑卡片 */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/60 text-slate-500">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{subjectLabel}</span>
                <span>·</span>
                <span>{wrongQuestion.grade}</span>
                <span>·</span>
                <span>学生：<strong className="text-slate-900">{wrongQuestion.studentName}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-rose-600 font-medium">学生错选：{wrongQuestion.myAnswer}</span>
                <span>/</span>
                <span className="text-emerald-700 font-semibold">标答：{wrongQuestion.snap.answer}</span>
                <span>·</span>
                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[11px] font-medium">
                  {wrongQuestion.errorReason}
                </span>
              </div>
            </div>
            <p className="mt-2 text-slate-800 font-medium leading-relaxed">
              {wrongQuestion.snap.stem}
            </p>
          </div>

          {/* TAB 1: 豆包 AI 深度诊断 */}
          {activeTab === 'diagnose' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Bot className="w-4 h-4 text-blue-600" />
                  <span>豆包 K12 特级教师诊断分析报告</span>
                </div>
                <button
                  onClick={runDiagnosis}
                  disabled={isDiagnosing}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
                  <span>重新诊断</span>
                </button>
              </div>

              {isDiagnosing ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
                  <p className="text-xs">豆包大模型正在推演学生思维盲区与考点本质，请稍候...</p>
                </div>
              ) : diagnosis ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. 考点本质与命题意图 */}
                  <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-200/60 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span>① 考点本质与设问陷阱</span>
                    </div>
                    <p className="text-xs text-blue-950 leading-relaxed font-normal">
                      {diagnosis.kpAnalysis}
                    </p>
                  </div>

                  {/* 2. 学生思维卡点溯源 */}
                  <div className="bg-rose-50/50 rounded-xl p-4 border border-rose-200/60 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>② 为何错选【{wrongQuestion.myAnswer}】· 认知卡点</span>
                    </div>
                    <p className="text-xs text-rose-950 leading-relaxed font-normal">
                      {diagnosis.studentMisconception}
                    </p>
                  </div>

                  {/* 3. 避坑口诀与思维心法 */}
                  <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-200/60 space-y-1.5 md:col-span-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <Lightbulb className="w-4 h-4 text-amber-600" />
                      <span>③ 豆包名师避坑口诀</span>
                    </div>
                    <div className="p-3 bg-white/80 rounded-lg border border-amber-200 text-sm font-semibold text-amber-900 flex items-center gap-2">
                      <span className="text-amber-500 text-base">“</span>
                      <span className="flex-1">{diagnosis.mnemonicTip}</span>
                      <span className="text-amber-500 text-base">”</span>
                    </div>
                  </div>

                  {/* 4. 针对性提分建议 */}
                  <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-200/60 space-y-1.5 md:col-span-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>④ 针对性复习提分行动清单</span>
                    </div>
                    <p className="text-xs text-emerald-950 leading-relaxed font-normal">
                      {diagnosis.actionPlan}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* 底部引导切换到变式题 */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  诊断完毕，建议立即使用豆包生成同类同构变式题进行限时通关训练
                </span>
                <button
                  onClick={() => handleTabChange('variant')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-xs transition-colors"
                >
                  <span>生成举一反三变式题</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: 举一反三变式题 */}
          {activeTab === 'variant' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>豆包 AI 同考点同构变式题（巩固母题思维模型）</span>
                </div>
                <button
                  onClick={runGenerateVariant}
                  disabled={isGeneratingVariant}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingVariant ? 'animate-spin' : ''}`} />
                  <span>重新生成变式</span>
                </button>
              </div>

              {isGeneratingVariant ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <RefreshCw className="w-7 h-7 text-amber-500 animate-spin" />
                  <p className="text-xs">豆包大模型正在构建同构变式情境与标准答案解析...</p>
                </div>
              ) : variant ? (
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                  {/* 变式题干 */}
                  <div className="text-sm font-medium text-slate-900 leading-relaxed">
                    <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-bold mr-2">
                      变式训练
                    </span>
                    {variant.stem}
                  </div>

                  {/* 选项网格 */}
                  {variant.options && variant.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      {variant.options.map(opt => {
                        const isCorrect = opt.pos === variant.answer;
                        return (
                          <div
                            key={opt.pos}
                            className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                              isCorrect
                                ? 'bg-emerald-50 text-emerald-950 border-emerald-300 font-medium'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            <span className="font-bold">{opt.pos}.</span>
                            <span className="flex-1">{opt.text}</span>
                            {isCorrect && (
                              <span className="text-[11px] text-emerald-700 font-bold shrink-0">
                                (标准答案)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 解析与考点 */}
                  <div className="p-3.5 bg-white rounded-lg border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-500 pb-1.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">权威分步解析</span>
                        <span>·</span>
                        <span className="text-emerald-700 font-bold">参考答案: {variant.answer}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{variant.source}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                      {variant.explanation}
                    </p>
                  </div>

                  {/* 操作栏：加入题库 / 复制 / 指派给学生 */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAddVariantToBank}
                        disabled={addedToBank}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          addedToBank
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                        }`}
                      >
                        {addedToBank ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>已导入题库</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>一键导入教师题库</span>
                          </>
                        )}
                      </button>

                      {onAssignToStudent && (
                        <button
                          onClick={() => {
                            onAssignToStudent(wrongQuestion.studentId, {
                              id: `var_${Date.now()}`,
                              subject: wrongQuestion.subject,
                              grade: wrongQuestion.grade,
                              stem: variant.stem,
                              options: variant.options,
                              answer: variant.answer,
                              explanation: variant.explanation,
                              difficulty: variant.difficulty,
                              source: variant.source,
                              kp: variant.kp,
                              origin: 'custom',
                              addedAt: new Date().toISOString(),
                            });
                            alert(`已成功将变式题指派给【${wrongQuestion.studentName}】错题专练！`);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>直接指派给该生巩固</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={handleCopyVariant}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-slate-200 transition-colors"
                    >
                      {copiedVariant ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">已复制题干与解析</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>复制题目文本</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* 底栏 */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>豆包大模型已根据 K12 新课标大纲进行自适应智能微调</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium transition-colors"
          >
            完成并关闭
          </button>
        </div>
      </div>
    </div>
  );
};
