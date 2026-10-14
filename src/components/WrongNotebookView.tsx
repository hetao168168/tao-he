import React, { useState, useMemo } from 'react';
import {
  WrongQuestion,
  Student,
  Question,
  ErrorReason,
  SUBJECT_MAP,
  SubjectKey,
  PRIMARY_GRADES,
  JUNIOR_GRADES,
  SENIOR_GRADES,
  ALL_GRADES,
  getGradeStage,
} from '../types';
import {
  Plus,
  CheckCircle,
  AlertCircle,
  Trash2,
  Filter,
  Check,
  X,
  FileText,
  Search,
  Sparkles,
  Tag,
  RotateCcw,
  SlidersHorizontal,
  GraduationCap,
} from 'lucide-react';
import { generateAutoTags, extractUniqueTagsWithCounts } from '../services/tagEngine';
import { DoubaoDiagnoseModal } from './DoubaoDiagnoseModal';
import { Bot, Lightbulb as DoubaoLightbulb } from 'lucide-react';

interface WrongNotebookViewProps {
  wrongQuestions: WrongQuestion[];
  students: Student[];
  questions: Question[];
  selectedStudentId?: string;
  onToggleMastered: (id: string) => void;
  onDeleteWrong: (id: string) => void;
  onAddWrong: (data: {
    studentId: string;
    studentName: string;
    questionId?: string;
    snap: any;
    myAnswer: string;
    errorReason: ErrorReason;
    note?: string;
    subject: string;
    grade: string;
    tags?: string[];
  }) => void;
  onNavigateToPaper: (studentId?: string) => void;
  onImportToBank?: (q: Omit<Question, 'id' | 'addedAt'>) => void;
  onAssignToStudent?: (studentId: string, q: Question) => void;
}

export const WrongNotebookView: React.FC<WrongNotebookViewProps> = ({
  wrongQuestions,
  students,
  questions,
  selectedStudentId,
  onToggleMastered,
  onDeleteWrong,
  onAddWrong,
  onNavigateToPaper,
  onImportToBank,
  onAssignToStudent,
}) => {
  // 豆包 AI 诊断与变式模态框状态
  const [doubaoTargetWrong, setDoubaoTargetWrong] = useState<WrongQuestion | null>(null);
  // 多维检索状态
  const [studentFilter, setStudentFilter] = useState<string>(selectedStudentId || 'all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'basic' | 'medium' | 'hard'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [masteredFilter, setMasteredFilter] = useState<'all' | 'open' | 'done'>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 录入表单状态
  const [formMode, setFormMode] = useState<'bank' | 'custom'>('bank');
  const [formStudentId, setFormStudentId] = useState<string>(students[0]?.id || '');
  const [formSelectedQId, setFormSelectedQId] = useState<string>(questions[0]?.id || '');
  const [formMyAnswer, setFormMyAnswer] = useState('B');
  const [formErrorReason, setFormErrorReason] = useState<ErrorReason>('概念混淆');
  const [formNote, setFormNote] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // 自定义录入字段
  const [customStem, setCustomStem] = useState('');
  const [customOptions, setCustomOptions] = useState([
    { pos: 'A', text: '' },
    { pos: 'B', text: '' },
    { pos: 'C', text: '' },
    { pos: 'D', text: '' },
  ]);
  const [customAnswer, setCustomAnswer] = useState('C');
  const [customSubject, setCustomSubject] = useState('math');
  const [customGrade, setCustomGrade] = useState('九年级');
  const [customDifficulty, setCustomDifficulty] = useState<number>(3);

  // 提取题库中所有可用标签及频次
  const availableTags = useMemo(() => {
    return extractUniqueTagsWithCounts(wrongQuestions);
  }, [wrongQuestions]);

  // 多维复合筛选逻辑
  const filtered = useMemo(() => {
    return wrongQuestions.filter(w => {
      // 1. 学生筛选（支持：全部 / 仅看我家小孩 / 仅看班级学生 / 指定单人）
      if (studentFilter === 'family_all') {
        const isFam = students.find(s => s.id === w.studentId)?.isFamilyChild || (w.studentName && w.studentName.includes('我家'));
        if (!isFam) return false;
      } else if (studentFilter === 'school_all') {
        const isFam = students.find(s => s.id === w.studentId)?.isFamilyChild || (w.studentName && w.studentName.includes('我家'));
        if (isFam) return false;
      } else if (studentFilter !== 'all' && w.studentId !== studentFilter) {
        return false;
      }

      // 2. 年级与学段筛选
      if (gradeFilter !== 'all') {
        const itemGrade = w.grade || w.snap.grade || '';
        const stage = getGradeStage(itemGrade);
        if (gradeFilter === 'primary' && stage !== 'primary') return false;
        if (gradeFilter === 'junior' && stage !== 'junior') return false;
        if (gradeFilter === 'senior' && stage !== 'senior') return false;
        if (
          !['primary', 'junior', 'senior'].includes(gradeFilter) &&
          itemGrade !== gradeFilter &&
          !itemGrade.includes(gradeFilter)
        ) {
          return false;
        }
      }

      // 3. 学科筛选
      if (subjectFilter !== 'all' && w.subject !== subjectFilter) return false;

      // 4. 难度筛选
      const diff = Number(w.snap.difficulty) || 2;
      if (difficultyFilter === 'basic' && diff > 2) return false;
      if (difficultyFilter === 'medium' && diff !== 3) return false;
      if (difficultyFilter === 'hard' && diff < 4) return false;

      // 5. 掌握状态
      if (masteredFilter === 'open' && w.mastered) return false;
      if (masteredFilter === 'done' && !w.mastered) return false;

      // 6. 智能标签筛选
      const itemTags = w.tags || w.snap.tags || w.snap.kp || [];
      if (selectedTag !== 'all' && !itemTags.includes(selectedTag)) return false;

      // 7. 综合文本模糊搜索
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchStem = w.snap.stem.toLowerCase().includes(kw);
        const matchStudent = (w.studentName || '').toLowerCase().includes(kw);
        const matchKp = (w.snap.kp || []).some(k => k.toLowerCase().includes(kw));
        const matchTags = itemTags.some(t => t.toLowerCase().includes(kw));
        const matchReason = w.errorReason.toLowerCase().includes(kw);
        const matchSource = (w.snap.source || '').toLowerCase().includes(kw);

        if (!matchStem && !matchStudent && !matchKp && !matchTags && !matchReason && !matchSource) {
          return false;
        }
      }

      return true;
    });
  }, [
    wrongQuestions,
    studentFilter,
    gradeFilter,
    subjectFilter,
    difficultyFilter,
    selectedTag,
    masteredFilter,
    searchKeyword,
  ]);

  // 检查是否有任何筛选处于激活状态
  const isAnyFilterActive =
    studentFilter !== 'all' ||
    subjectFilter !== 'all' ||
    difficultyFilter !== 'all' ||
    selectedTag !== 'all' ||
    masteredFilter !== 'all' ||
    searchKeyword.trim() !== '';

  const handleResetFilters = () => {
    setStudentFilter('all');
    setSubjectFilter('all');
    setDifficultyFilter('all');
    setSelectedTag('all');
    setMasteredFilter('all');
    setSearchKeyword('');
  };

  // 打开录入弹窗并预计算自动标签
  const handleOpenAddModal = () => {
    if (students.length > 0) setFormStudentId(students[0].id);
    if (questions.length > 0) {
      setFormSelectedQId(questions[0].id);
      recalculateAutoTagsForBank(questions[0]);
    }
    setIsAddModalOpen(true);
  };

  const recalculateAutoTagsForBank = (q: Question) => {
    const tags = generateAutoTags({
      subject: q.subject,
      grade: q.grade,
      stem: q.stem,
      options: q.options,
      answer: q.answer,
      difficulty: q.difficulty,
      kp: q.kp,
      errorReason: formErrorReason,
    });
    setCustomTags(tags);
  };

  const handleBankQuestionChange = (qId: string) => {
    setFormSelectedQId(qId);
    const q = questions.find(x => x.id === qId);
    if (q) recalculateAutoTagsForBank(q);
  };

  // 手动录入时一键分析生成标签
  const handleGenerateTagsForCustom = () => {
    if (!customStem.trim()) return;
    const tags = generateAutoTags({
      subject: customSubject,
      grade: customGrade,
      stem: customStem,
      options: customOptions.filter(o => o.text.trim()),
      answer: customAnswer,
      difficulty: customDifficulty,
      kp: [],
      errorReason: formErrorReason,
    });
    setCustomTags(tags);
  };

  const handleAddCustomTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (!newTagInput.trim()) return;
    if (!customTags.includes(newTagInput.trim())) {
      setCustomTags([...customTags, newTagInput.trim()]);
    }
    setNewTagInput('');
  };

  const handleRemoveCustomTag = (t: string) => {
    setCustomTags(customTags.filter(item => item !== t));
  };

  const handleSubmitWrong = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === formStudentId);
    if (!student) return;

    if (formMode === 'bank') {
      const q = questions.find(x => x.id === formSelectedQId);
      if (!q) return;

      onAddWrong({
        studentId: student.id,
        studentName: student.name,
        questionId: q.id,
        snap: {
          subject: q.subject,
          grade: q.grade,
          stem: q.stem,
          options: q.options,
          answer: q.answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          source: q.source,
          kp: q.kp,
          tags: customTags,
          hasImage: q.hasImage,
        },
        myAnswer: formMyAnswer,
        errorReason: formErrorReason,
        note: formNote.trim(),
        subject: q.subject,
        grade: q.grade,
        tags: customTags,
      });
    } else {
      if (!customStem.trim()) return;
      onAddWrong({
        studentId: student.id,
        studentName: student.name,
        snap: {
          subject: customSubject,
          grade: customGrade,
          stem: customStem.trim(),
          options: customOptions.filter(o => o.text.trim()),
          answer: customAnswer,
          explanation: '',
          difficulty: customDifficulty,
          source: '教师手动录入错题',
          kp: ['综合练习'],
          tags: customTags,
          hasImage: false,
        },
        myAnswer: formMyAnswer,
        errorReason: formErrorReason,
        note: formNote.trim(),
        subject: customSubject,
        grade: customGrade,
        tags: customTags,
      });
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 顶部标题与出卷入口 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">错题攻坚本</h2>
            <span className="flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
              <Sparkles className="w-3 h-3 text-blue-600" />
              自动标签与多维检索已开启
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            入库自动提取学科考点、思维模型与难度标签，支持按知识点、难度、学科多维联动检索
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onNavigateToPaper(studentFilter !== 'all' ? studentFilter : undefined)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>按筛选结果组卷</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>录入新错题</span>
          </button>
        </div>
      </div>

      {/* 多维检索工作区 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3.5">
        {/* 第一行：搜索框 + 学生 + 年级学段 + 掌握状态 */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* 实时关键字搜索 */}
          <div className="sm:col-span-4 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              placeholder="快速检索题干、学生、知识点或错因..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* 学生筛选 */}
          {/* 学生筛选（独立区分我家小孩与班级学生） */}
          <div className="sm:col-span-3 flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 shrink-0">档案：</span>
            <select
              value={studentFilter}
              onChange={e => setStudentFilter(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="all">全部档案错题 ({wrongQuestions.length})</option>
              <option value="family_all">
                🏠 仅看我家小孩错题 ({wrongQuestions.filter(w => students.find(s => s.id === w.studentId)?.isFamilyChild || (w.studentName && w.studentName.includes('我家'))).length})
              </option>
              <option value="school_all">
                🏫 仅看班级学生错题 ({wrongQuestions.filter(w => !(students.find(s => s.id === w.studentId)?.isFamilyChild || (w.studentName && w.studentName.includes('我家')))).length})
              </option>

              {students.some(s => s.isFamilyChild) && (
                <optgroup label="🏠 我家孩子专栏（单独专区）">
                  {students
                    .filter(s => s.isFamilyChild)
                    .map(s => {
                      const count = wrongQuestions.filter(w => w.studentId === s.id).length;
                      return (
                        <option key={s.id} value={s.id}>
                          🏠 {s.name} ({s.familyRelation || '我家孩子'} · {count}题)
                        </option>
                      );
                    })}
                </optgroup>
              )}

              <optgroup label="🏫 班级在校学生名单">
                {students
                  .filter(s => !s.isFamilyChild)
                  .map(s => {
                    const count = wrongQuestions.filter(w => w.studentId === s.id).length;
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.className} · {count}题)
                      </option>
                    );
                  })}
              </optgroup>
            </select>
          </div>

          {/* 年级学段筛选 */}
          <div className="sm:col-span-3 flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 shrink-0">年级：</span>
            <select
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="all">全部学段与年级</option>
              <optgroup label="学段大类">
                <option value="primary">小学阶段 (一年级~六年级)</option>
                <option value="junior">初中阶段 (初一~初三)</option>
                <option value="senior">高中阶段 (高一~高三)</option>
              </optgroup>
              <optgroup label="细分年级">
                {ALL_GRADES.map(g => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 掌握状态 */}
          <div className="sm:col-span-2 flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setMasteredFilter('all')}
              className={`flex-1 py-1 px-1 rounded-md font-medium transition-colors text-center ${
                masteredFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setMasteredFilter('open')}
              className={`flex-1 py-1 px-1 rounded-md font-medium transition-colors text-center ${
                masteredFilter === 'open' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              待攻坚
            </button>
            <button
              onClick={() => setMasteredFilter('done')}
              className={`flex-1 py-1 px-1 rounded-md font-medium transition-colors text-center ${
                masteredFilter === 'done' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              已攻克
            </button>
          </div>
        </div>

        {/* 第二行：学科分段 + 难度分级 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* 学科多选 */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-slate-400 mr-1 shrink-0">学科:</span>
            <button
              onClick={() => setSubjectFilter('all')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                subjectFilter === 'all'
                  ? 'bg-slate-900 text-white font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              全部学科
            </button>
            {Object.entries(SUBJECT_MAP).map(([key, name]) => (
              <button
                key={key}
                onClick={() => setSubjectFilter(key)}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                  subjectFilter === key
                    ? 'bg-slate-900 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* 难度分段 */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-slate-400 mr-1">难度:</span>
            <button
              onClick={() => setDifficultyFilter('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                difficultyFilter === 'all' ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              全部难度
            </button>
            <button
              onClick={() => setDifficultyFilter('basic')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                difficultyFilter === 'basic' ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              基础 (1-2星)
            </button>
            <button
              onClick={() => setDifficultyFilter('medium')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                difficultyFilter === 'medium' ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              中档 (3星)
            </button>
            <button
              onClick={() => setDifficultyFilter('hard')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                difficultyFilter === 'hard' ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              压轴拔高 (4-5星)
            </button>
          </div>
        </div>

        {/* 第三行：考点与智能标签快捷选择带 */}
        {availableTags.length > 0 && (
          <div className="pt-2.5 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 shrink-0 flex items-center gap-1 mr-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>知识点标签:</span>
            </span>
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2 py-0.5 rounded whitespace-nowrap text-[11px] transition-colors ${
                selectedTag === 'all'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              全部标签
            </button>
            {availableTags.map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? 'all' : tag)}
                className={`px-2 py-0.5 rounded whitespace-nowrap text-[11px] transition-colors flex items-center gap-1 ${
                  selectedTag === tag
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <span>#{tag}</span>
                <span className="text-[10px] opacity-75 font-mono">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* 筛选结果状态条 */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            共找到 <strong className="text-blue-600 font-mono tabular-nums">{filtered.length}</strong> 道匹配错题
            {selectedTag !== 'all' && (
              <span className="ml-2 text-slate-600">
                （当前标签：<span className="font-semibold text-blue-700">#{selectedTag}</span>）
              </span>
            )}
          </div>
          {isAnyFilterActive && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>重置所有筛选</span>
            </button>
          )}
        </div>
      </div>

      {/* 错题列表卡片 */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
            未找到符合多维检索条件的错题，您可以尝试调整学科、难度或重置筛选
          </div>
        ) : (
          filtered.map((item, index) => {
            const subjectLabel =
              SUBJECT_MAP[item.subject as keyof typeof SUBJECT_MAP] || item.subject || '其他学科';
            const itemTags = item.tags || item.snap.tags || item.snap.kp || [];
            const difficultyStars = Number(item.snap.difficulty) || 2;
            const targetStudent = students.find(s => s.id === item.studentId);
            const isFamily = Boolean(targetStudent?.isFamilyChild || (item.studentName && item.studentName.includes('我家')));

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border p-5 shadow-xs transition-colors ${
                  item.mastered
                    ? 'border-emerald-200/80 bg-emerald-50/10'
                    : isFamily
                    ? 'border-rose-200/80 bg-rose-50/5'
                    : 'border-slate-200'
                }`}
              >
                {/* 顶栏元数据 (Zero-Pill: Clean unboxed text) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs text-slate-500">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{item.studentName}</span>
                      {isFamily && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          🏠 {targetStudent?.familyRelation || '我家小孩'}
                        </span>
                      )}
                    </div>
                    <span>·</span>
                    <span className="font-medium text-blue-700">{subjectLabel}</span>
                    <span>·</span>
                    <span>{item.grade}</span>
                    <span>·</span>
                    <span className="text-amber-700">难度：{'★'.repeat(difficultyStars)}</span>
                    <span>·</span>
                    <span>{item.date}</span>
                    <span>·</span>
                    <span className="text-amber-800 font-medium">错因：{item.errorReason}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleMastered(item.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                        item.mastered
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                    >
                      {item.mastered ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>已攻克（点击重新攻坚）</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>标记为已攻克</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('确定从错题本中移除该题吗？')) {
                          onDeleteWrong(item.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="删除错题记录"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 自动生成的智能标签展示行 (点击可即时定位同类标签) */}
                {itemTags.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-500" />
                      自动考点标签：
                    </span>
                    {itemTags.map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedTag(t)}
                        title={`点击筛选考点 #${t}`}
                        className="text-slate-700 hover:text-blue-600 hover:underline font-medium cursor-pointer"
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                )}

                {/* 题干内容 */}
                <div className="py-3 text-sm text-slate-900 leading-relaxed font-normal">
                  <span className="font-bold mr-1.5">{index + 1}.</span>
                  {item.snap.stem}
                </div>

                {/* 选项网格 */}
                {item.snap.options && item.snap.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2 text-xs">
                    {item.snap.options.map(opt => {
                      const isCorrect = opt.pos === item.snap.answer;
                      const isStudentAnswer = opt.pos === item.myAnswer;
                      let badgeStyle = 'bg-slate-50 text-slate-700 border-slate-200';

                      if (isCorrect) {
                        badgeStyle = 'bg-emerald-50 text-emerald-900 border-emerald-300 font-medium';
                      } else if (isStudentAnswer) {
                        badgeStyle = 'bg-rose-50 text-rose-800 border-rose-300 line-through';
                      }

                      return (
                        <div
                          key={opt.pos}
                          className={`p-2.5 rounded-lg border flex items-start gap-2 ${badgeStyle}`}
                        >
                          <span className="font-bold">{opt.pos}.</span>
                          <span className="flex-1">{opt.text}</span>
                          {isCorrect && (
                            <span className="text-[11px] text-emerald-700 font-bold shrink-0">
                              (标准答案)
                            </span>
                          )}
                          {isStudentAnswer && !isCorrect && (
                            <span className="text-[11px] text-rose-600 font-bold shrink-0">
                              (学生所选)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 错因点评与心得 */}
                {item.note && (
                  <div className="mt-3 p-3 bg-amber-50/60 rounded-lg border border-amber-200/50 text-xs text-amber-900">
                    <span className="font-semibold mr-1">教师辅导评语：</span>
                    {item.note}
                  </div>
                )}

                {/* 豆包 AI 专属智能攻坚工具条 */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px]">
                      🤖
                    </span>
                    <span className="font-semibold text-slate-700">豆包大模型免费版：</span>
                    <span className="text-slate-400">支持秒级错因剖析与同考点同构命题</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDoubaoTargetWrong(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>豆包 AI 深度诊断</span>
                    </button>

                    <button
                      onClick={() => setDoubaoTargetWrong(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80 text-xs font-semibold shadow-xs transition-colors"
                    >
                      <DoubaoLightbulb className="w-3.5 h-3.5 text-amber-600" />
                      <span>举一反三·变式题</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 录入错题模态框（含自动标签生成与编辑） */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl my-8 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">录入学生错题</h3>
                <span className="text-[11px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
                  支持自动生成智能标签
                </span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitWrong} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    指定学生 *
                  </label>
                  <select
                    value={formStudentId}
                    onChange={e => setFormStudentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                  >
                    {students.some(s => s.isFamilyChild) && (
                      <optgroup label="🏠 我家小孩（亲子专栏）">
                        {students
                          .filter(s => s.isFamilyChild)
                          .map(s => (
                            <option key={s.id} value={s.id}>
                              🏠 {s.name} ({s.familyRelation || '我家孩子'} · {s.grade})
                            </option>
                          ))}
                      </optgroup>
                    )}
                    <optgroup label="🏫 班级在校学生名单">
                      {students
                        .filter(s => !s.isFamilyChild)
                        .map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.className})
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    错题来源模式
                  </label>
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setFormMode('bank');
                        if (questions.length > 0) recalculateAutoTagsForBank(questions[0]);
                      }}
                      className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                        formMode === 'bank' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      从本地题库选择
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormMode('custom')}
                      className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                        formMode === 'custom' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      纯手输录入
                    </button>
                  </div>
                </div>
              </div>

              {formMode === 'bank' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    选择题库试题 *
                  </label>
                  <select
                    value={formSelectedQId}
                    onChange={e => handleBankQuestionChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    {questions.map(q => (
                      <option key={q.id} value={q.id}>
                        [{SUBJECT_MAP[q.subject as keyof typeof SUBJECT_MAP] || q.subject}] {q.stem.slice(0, 45)}...
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-700">
                        题干描述 *
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateTagsForCustom}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>自动分析并生成标签</span>
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      required
                      value={customStem}
                      onChange={e => setCustomStem(e.target.value)}
                      onBlur={handleGenerateTagsForCustom}
                      placeholder="输入完整题目要求与情境..."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {customOptions.map((opt, i) => (
                      <div key={opt.pos}>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          选项 {opt.pos}
                        </label>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={e => {
                            const next = [...customOptions];
                            next[i].text = e.target.value;
                            setCustomOptions(next);
                          }}
                          placeholder={`选项 ${opt.pos} 内容`}
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        正确答案
                      </label>
                      <select
                        value={customAnswer}
                        onChange={e => setCustomAnswer(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        学科
                      </label>
                      <select
                        value={customSubject}
                        onChange={e => setCustomSubject(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                      >
                        {Object.entries(SUBJECT_MAP).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        难度
                      </label>
                      <select
                        value={customDifficulty}
                        onChange={e => setCustomDifficulty(Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                      >
                        <option value={1}>1星 基础</option>
                        <option value={2}>2星 容易</option>
                        <option value={3}>3星 中档</option>
                        <option value={4}>4星 偏难</option>
                        <option value={5}>5星 压轴</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        所属年级
                      </label>
                      <select
                        value={customGrade}
                        onChange={e => setCustomGrade(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg font-medium"
                      >
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
                  </div>
                </div>
              )}

              {/* 智能生成的多维标签编辑栏 */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    已自动提取的多维标签（入库后用于多维快速检索）
                  </span>
                  <button
                    type="button"
                    onClick={
                      formMode === 'bank'
                        ? () => {
                            const q = questions.find(x => x.id === formSelectedQId);
                            if (q) recalculateAutoTagsForBank(q);
                          }
                        : handleGenerateTagsForCustom
                    }
                    className="text-[11px] text-blue-600 hover:text-blue-700"
                  >
                    重新生成
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {customTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-xs text-slate-800"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomTag(tag)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={e => setNewTagInput(e.target.value)}
                      onKeyDown={handleAddCustomTag}
                      placeholder="+ 自定义标签回车"
                      className="px-2 py-0.5 text-xs bg-white border border-slate-200 rounded w-28 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    学生错选答案
                  </label>
                  <select
                    value={formMyAnswer}
                    onChange={e => setFormMyAnswer(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    错因归类 *
                  </label>
                  <select
                    value={formErrorReason}
                    onChange={e => setFormErrorReason(e.target.value as ErrorReason)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="概念混淆">概念混淆</option>
                    <option value="审题不清">审题不清</option>
                    <option value="计算失误">计算失误</option>
                    <option value="综合应用薄弱">综合应用薄弱</option>
                    <option value="公式记忆错误">公式记忆错误</option>
                    <option value="解题步骤不规范">解题步骤不规范</option>
                    <option value="其他原因">其他原因</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  教师辅导点评与错因心得
                </label>
                <textarea
                  rows={2}
                  value={formNote}
                  onChange={e => setFormNote(e.target.value)}
                  placeholder="记录该题考查要点、学生易错陷阱及解题关键突破口..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
                >
                  保存错题入库
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 豆包 AI 错题深度诊断与变式题模态框 */}
      {doubaoTargetWrong && (
        <DoubaoDiagnoseModal
          wrongQuestion={doubaoTargetWrong}
          isOpen={Boolean(doubaoTargetWrong)}
          onClose={() => setDoubaoTargetWrong(null)}
          onImportToBank={onImportToBank}
          onAssignToStudent={onAssignToStudent}
        />
      )}
    </div>
  );
};
