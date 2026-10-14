import React, { useState } from 'react';
import {
  Question,
  Student,
  SubjectKey,
  SUBJECT_MAP,
  PRIMARY_GRADES,
  JUNIOR_GRADES,
  SENIOR_GRADES,
} from '../types';
import { Search, Plus, Check, BookOpen, ExternalLink, ChevronDown, ChevronUp, UserCheck, Sparkles } from 'lucide-react';

interface JyeooSearchViewProps {
  questions: Question[];
  students: Student[];
  onImportToBank: (q: Omit<Question, 'id' | 'addedAt'>) => void;
  onAssignToStudentWrong: (studentId: string, q: Question) => void;
}

export const JyeooSearchView: React.FC<JyeooSearchViewProps> = ({
  questions,
  students,
  onImportToBank,
  onAssignToStudentWrong,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<SubjectKey>('math');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assigningQ, setAssigningQ] = useState<Question | null>(null);
  const [selectedStudentForAssign, setSelectedStudentForAssign] = useState<string>(students[0]?.id || '');
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  const subjects: SubjectKey[] = [
    'math',
    'physics',
    'chemistry',
    'biology',
    'history',
    'geography',
    'chinese',
    'english',
    'politics',
    'science',
  ];

  const filteredQuestions = questions.filter(q => {
    const matchesSubject = q.subject === selectedSubject;
    const matchesGrade =
      selectedGrade === 'all' ||
      q.grade === selectedGrade ||
      q.grade.includes(selectedGrade) ||
      selectedGrade.includes(q.grade);
    const matchesKeyword =
      !searchKeyword.trim() ||
      q.stem.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      q.source.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      q.kp.some(k => k.toLowerCase().includes(searchKeyword.toLowerCase()));

    return matchesSubject && matchesGrade && matchesKeyword;
  });

  const handleImport = (q: Question) => {
    onImportToBank({
      subject: q.subject,
      grade: q.grade,
      stem: q.stem,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      source: q.source,
      kp: q.kp,
      hasImage: q.hasImage,
      origin: 'jyeoo',
    });
    setImportedIds(prev => new Set(prev).add(q.id));
  };

  const handleConfirmAssign = () => {
    if (!assigningQ || !selectedStudentForAssign) return;
    onAssignToStudentWrong(selectedStudentForAssign, assigningQ);
    setAssigningQ(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 顶栏说明 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">菁优网学科题库与检索</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            精选初高中主流考试真题、各区一二模统考压轴与基础试题，支持一键入库与错题指派
          </p>
        </div>
      </div>

      {/* 学科选择标签栏 (Zero-Pill: clean segmented bar) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs text-xs">
        {subjects.map(s => (
          <button
            key={s}
            onClick={() => setSelectedSubject(s)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium ${
              selectedSubject === s
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {SUBJECT_MAP[s]}
          </button>
        ))}
      </div>

      {/* 搜索与年级筛选 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 shrink-0">学段年级：</span>
          <select
            value={selectedGrade}
            onChange={e => setSelectedGrade(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="all">全部年级 (小学至高三)</option>
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

        <div className="relative flex-1 sm:max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            placeholder="搜索知识点、考题来源（如 海淀模考、反比例函数）..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* 试题列表 */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
            该学科下暂无匹配试题，可尝试切换年级或输入其他关键词检索
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const isExpanded = expandedId === q.id;
            const isImported = importedIds.has(q.id);

            return (
              <div
                key={q.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-5 shadow-xs transition-colors"
              >
                {/* 顶栏元数据（Zero-Pill: Clean unboxed metadata） */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{q.source}</span>
                    <span>·</span>
                    <span>{q.grade}</span>
                    <span>·</span>
                    <span className="text-amber-700">难度：{'★'.repeat(Number(q.difficulty) || 2)}</span>
                    {q.kp && q.kp.length > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-slate-600">考点：{q.kp.join(' / ')}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAssigningQ(q)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>录为学生错题</span>
                    </button>

                    <button
                      onClick={() => handleImport(q)}
                      disabled={isImported}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                        isImported
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      {isImported ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>已在题库</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>入库保存</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 题干内容 */}
                <div className="py-3 text-sm text-slate-900 leading-relaxed font-normal">
                  <span className="font-bold mr-1.5">{idx + 1}.</span>
                  {q.stem}
                </div>

                {/* 选项网格 */}
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2 text-xs">
                    {q.options.map(opt => (
                      <div
                        key={opt.pos}
                        className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-start gap-2"
                      >
                        <span className="font-bold text-slate-700">{opt.pos}.</span>
                        <span className="text-slate-800">{opt.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 解析折叠区 */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <span>{isExpanded ? '收起权威解析与答案' : '查看权威解析与标准答案'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 p-4 bg-slate-50 rounded-lg text-xs space-y-2 border border-slate-200/60 animate-in fade-in duration-150">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">【正确答案】</span>
                        <span className="font-bold text-emerald-700 text-sm font-mono">{q.answer}</span>
                      </div>
                      {q.explanation && (
                        <div>
                          <span className="font-bold text-slate-700 block mb-1">【试题权威解析】</span>
                          <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 指派错题弹窗 */}
      {assigningQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              将试题指派为学生错题
            </h3>
            <p className="text-xs text-slate-500 line-clamp-2">
              题目：{assigningQ.stem}
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                选择指派学生
              </label>
              <select
                value={selectedStudentForAssign}
                onChange={e => setSelectedStudentForAssign(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.className})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setAssigningQ(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAssign}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                确认录入错题本
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
