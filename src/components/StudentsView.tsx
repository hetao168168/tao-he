import React, { useState } from 'react';
import {
  Student,
  WrongQuestion,
  PRIMARY_GRADES,
  JUNIOR_GRADES,
  SENIOR_GRADES,
  ALL_GRADES,
  getGradeStage,
} from '../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  FileText,
  BookOpen,
  X,
  Check,
  CalendarCheck,
  Activity,
  GraduationCap,
  Home,
  Heart,
  Users,
  Sparkles,
  ArrowRightLeft,
  UserCheck,
} from 'lucide-react';
import { StudentWeeklyReportModal } from './StudentWeeklyReportModal';
import { StudentRadarChart } from './StudentRadarChart';

interface StudentsViewProps {
  students: Student[];
  wrongQuestions: WrongQuestion[];
  onAddStudent: (data: Omit<Student, 'id' | 'createdAt'>) => void;
  onUpdateStudent: (id: string, updates: Partial<Student>) => void;
  onDeleteStudent: (id: string) => void;
  onNavigateToWrong: (studentId: string) => void;
  onNavigateToPaper: (studentId: string) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  wrongQuestions,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onNavigateToWrong,
  onNavigateToPaper,
}) => {
  // 核心分栏状态：'family' (我家孩子专属专栏) | 'school' (班级在校学生) | 'all' (全部)
  const familyCount = students.filter(s => s.isFamilyChild).length;
  const schoolCount = students.filter(s => !s.isFamilyChild).length;

  const [activeTab, setActiveTab] = useState<'family' | 'school' | 'all'>(
    familyCount > 0 ? 'family' : 'school'
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<'all' | 'primary' | 'junior' | 'senior'>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // 雷达图选定学生 (默认优先选中自家小孩，若无则选中第一位学生)
  const defaultRadarId =
    students.find(s => s.isFamilyChild)?.id || students[0]?.id || '';
  const [selectedRadarStudentId, setSelectedRadarStudentId] = useState<string>(defaultRadarId);

  // 周报生成弹窗
  const [reportStudent, setReportStudent] = useState<Student | null>(null);

  // 表单状态 (含自家小孩属性)
  const [formData, setFormData] = useState({
    name: '',
    grade: '初二（八年级）',
    school: '北京实验中学',
    className: '初二(3)班',
    tags: '',
    note: '',
    isFamilyChild: true,
    familyRelation: '我家大宝',
  });

  // 区分两个专栏的数据集合
  const familyStudents = students.filter(s => s.isFamilyChild);
  const schoolStudents = students.filter(s => !s.isFamilyChild);

  // 通用过滤逻辑
  const applyFilter = (list: Student[]) => {
    return list.filter(s => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.familyRelation && s.familyRelation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.note && s.note.toLowerCase().includes(searchTerm.toLowerCase()));

      const stage = getGradeStage(s.grade);
      const matchesStage = selectedStage === 'all' || stage === selectedStage;
      const matchesGrade = selectedGrade === 'all' || s.grade === selectedGrade;

      return matchesSearch && matchesStage && matchesGrade;
    });
  };

  const filteredFamily = applyFilter(familyStudents);
  const filteredSchool = applyFilter(schoolStudents);

  // 当前雷达图学生
  const currentRadarStudent =
    students.find(s => s.id === selectedRadarStudentId) ||
    filteredFamily[0] ||
    filteredSchool[0] ||
    students[0];

  const handleOpenAdd = (isFamily: boolean = activeTab === 'family') => {
    setEditingStudent(null);
    setFormData({
      name: '',
      grade: isFamily ? '初二（八年级）' : '初三（九年级）',
      school: '北京实验中学',
      className: isFamily ? '初二(3)班' : '初三(1)班',
      tags: isFamily ? '亲子专档, 弱项巩固, 重点督促' : '重点冲刺, 数学薄弱',
      note: isFamily ? '家里小孩专属辅导备忘...' : '',
      isFamilyChild: isFamily,
      familyRelation: isFamily ? '我家大宝' : '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      grade: student.grade,
      school: student.school,
      className: student.className,
      tags: student.tags.join(', '),
      note: student.note || '',
      isFamilyChild: Boolean(student.isFamilyChild),
      familyRelation: student.familyRelation || (student.isFamilyChild ? '我家孩子' : ''),
    });
    setIsModalOpen(true);
  };

  // 一键切换学生身份：自家小孩 <-> 班级学生
  const handleToggleFamilyStatus = (student: Student) => {
    const nextIsFamily = !student.isFamilyChild;
    onUpdateStudent(student.id, {
      isFamilyChild: nextIsFamily,
      familyRelation: nextIsFamily ? (student.familyRelation || '我家孩子') : undefined,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const tagsArray = formData.tags
      .split(/[,，]/)
      .map(t => t.trim())
      .filter(Boolean);

    const payload = {
      name: formData.name.trim(),
      grade: formData.grade,
      school: formData.school.trim(),
      className: formData.className.trim(),
      tags: tagsArray,
      note: formData.note.trim(),
      isFamilyChild: formData.isFamilyChild,
      familyRelation: formData.isFamilyChild
        ? (formData.familyRelation.trim() || '我家孩子')
        : undefined,
    };

    if (editingStudent) {
      onUpdateStudent(editingStudent.id, payload);
    } else {
      onAddStudent(payload);
    }

    setIsModalOpen(false);
  };

  // 根据学段获取标签样式
  const getStageBadge = (grade: string) => {
    const stage = getGradeStage(grade);
    if (stage === 'primary') {
      return (
        <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
          小学 · {grade}
        </span>
      );
    }
    if (stage === 'junior') {
      return (
        <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded font-medium">
          初中 · {grade}
        </span>
      );
    }
    return (
      <span className="text-[10px] bg-purple-50 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded font-medium">
        高中 · {grade}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 顶部标题与一级分栏导航 */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">学生与亲子档案管理中心</h2>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md">
                K12 全学段贯通
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              提供“自家小孩独立专栏”与“班级在校学生”完全隔离管理，专属追踪错题攻坚与学情成长。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenAdd(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 fill-white" />
              <span>+ 录入我家小孩</span>
            </button>
            <button
              onClick={() => handleOpenAdd(false)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ 新建在校学生</span>
            </button>
          </div>
        </div>

        {/* 核心分栏切换栏 (Zero-Pill: Clean segmented control) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('family')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'family'
                  ? 'bg-white text-rose-700 shadow-sm border border-rose-100 ring-1 ring-rose-200/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Home className="w-4 h-4 text-rose-600" />
              <span>🏠 我家孩子专栏（亲子专区）</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                activeTab === 'family' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {familyCount} 人
              </span>
            </button>

            <button
              onClick={() => setActiveTab('school')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'school'
                  ? 'bg-white text-blue-700 shadow-sm border border-blue-100 ring-1 ring-blue-200/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Users className="w-4 h-4 text-blue-600" />
              <span>🏫 班级在校学生（教学档案）</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                activeTab === 'school' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {schoolCount} 人
              </span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <span>全部总览</span>
              <span className="text-[11px] opacity-75 font-mono">({students.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-60 px-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="快速搜索姓名、称谓、班级..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 专栏状态横幅说明 */}
      {activeTab === 'family' && (
        <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-950 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-lg font-bold shadow-inner">
              🏡
            </div>
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <span>我家孩子专属专栏（亲子专区）</span>
                <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                  已与班级学生完全隔离
                </span>
              </div>
              <p className="text-slate-600 text-[11px] mt-0.5">
                此专栏专属于您自己的小孩（大宝、二宝等），单独记录校内与课后错题归纳、生成专属成长周报，不会受到班级其他学生数据干扰。
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenAdd(true)}
            className="self-start sm:self-auto px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            + 添加我家小孩档案
          </button>
        </div>
      )}

      {activeTab === 'school' && (
        <div className="bg-blue-50/60 border border-blue-200/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold">
              🏫
            </div>
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <span>班级在校学生档案专栏</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                  教学辅导名单 · 共 {schoolStudents.length} 人
                </span>
              </div>
              <p className="text-slate-600 text-[11px] mt-0.5">
                此处仅展示学校班级教学学生。您自己家小孩的档案已自动隔离至【我家孩子专栏】。
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenAdd(false)}
            className="self-start sm:self-auto px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            + 录入新学生
          </button>
        </div>
      )}

      {/* 核心数据可视化：选定学生的知识点掌握雷达图 */}
      {currentRadarStudent && (
        <StudentRadarChart
          student={currentRadarStudent}
          allWrongQuestions={wrongQuestions}
          onNavigateToPaper={onNavigateToPaper}
          onNavigateToWrong={onNavigateToWrong}
        />
      )}

      {/* 学段与年级细分筛选卡片 (在班级学生专栏或全部专栏下展示) */}
      {activeTab !== 'family' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-semibold text-slate-800 shrink-0">学段阶段：</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => {
                    setSelectedStage('all');
                    setSelectedGrade('all');
                  }}
                  className={`px-3 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                    selectedStage === 'all'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  全部学段
                </button>
                <button
                  onClick={() => {
                    setSelectedStage('primary');
                    setSelectedGrade('all');
                  }}
                  className={`px-3 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                    selectedStage === 'primary'
                      ? 'bg-white text-amber-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  小学阶段
                </button>
                <button
                  onClick={() => {
                    setSelectedStage('junior');
                    setSelectedGrade('all');
                  }}
                  className={`px-3 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                    selectedStage === 'junior'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  初中阶段
                </button>
                <button
                  onClick={() => {
                    setSelectedStage('senior');
                    setSelectedGrade('all');
                  }}
                  className={`px-3 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                    selectedStage === 'senior'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  高中阶段
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5">
            <span className="text-slate-500 shrink-0 font-medium">年级细分：</span>
            <button
              onClick={() => setSelectedGrade('all')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors text-xs cursor-pointer ${
                selectedGrade === 'all'
                  ? 'bg-slate-900 text-white font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              全部
            </button>
            {ALL_GRADES.map(g => {
              const stage = getGradeStage(g);
              if (selectedStage !== 'all' && stage !== selectedStage) return null;

              return (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors text-xs cursor-pointer ${
                    selectedGrade === g
                      ? 'bg-blue-600 text-white font-medium shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 专栏卡片渲染逻辑 */}

      {/* 1. 我家孩子专栏卡片展示 */}
      {(activeTab === 'family' || activeTab === 'all') && (
        <div className="space-y-3">
          {activeTab === 'all' && (
            <div className="flex items-center justify-between pb-1 border-b border-rose-200">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">🏠 我家孩子专栏（亲子专区 · {filteredFamily.length}人）</h3>
              </div>
              <button
                onClick={() => handleOpenAdd(true)}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                + 添加我家小孩
              </button>
            </div>
          )}

          {filteredFamily.length === 0 ? (
            <div className="py-14 text-center bg-white rounded-2xl border border-dashed border-rose-200 p-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-xl">
                🏡
              </div>
              <h4 className="text-sm font-bold text-slate-800">还没有录入自己家小孩的档案</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                点击下方按钮即可为自家大宝、二宝单独建立亲子档案，享受与班级学生隔离的错题攻克与亲子周报。
              </p>
              <button
                onClick={() => handleOpenAdd(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                + 立即录入我家小孩档案
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFamily.map(student => {
                const isRadarSelected = currentRadarStudent?.id === student.id;

                return (
                  <div
                    key={student.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                      isRadarSelected
                        ? 'ring-2 ring-rose-500/80 border-rose-300 bg-rose-50/15'
                        : 'border-rose-200/80 hover:border-rose-300'
                    }`}
                  >
                    <div>
                      {/* 姓名与编辑 */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">{student.name}</h3>
                            <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
                              🏠 {student.familyRelation || '我家孩子'}
                            </span>
                            {isRadarSelected && (
                              <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-medium">
                                当前雷达
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <span>{student.className}</span>
                            <span>·</span>
                            <span className="truncate max-w-[130px]">{student.school}</span>
                            <span>·</span>
                            <span>{student.grade}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                            title="编辑自家小孩档案"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`确定要将【${student.name}】转入班级在校学生名单吗？`)) {
                                handleToggleFamilyStatus(student);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                            title="转为班级在校学生"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`确定删除自家小孩【${student.name}】的档案吗？`)) {
                                onDeleteStudent(student.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title="删除档案"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 亲子标签 */}
                      {student.tags && student.tags.length > 0 && (
                        <div className="mt-3 text-xs text-slate-600 flex flex-wrap items-center gap-1.5">
                          {student.tags.map((tag, idx) => (
                            <React.Fragment key={tag}>
                              <span className="text-rose-700 font-medium">#{tag}</span>
                              {idx < student.tags.length - 1 && <span className="text-slate-300">·</span>}
                            </React.Fragment>
                          ))}
                        </div>
                      )}

                      {/* 亲子辅导心得与备忘 */}
                      {student.note && (
                        <p className="mt-3 text-xs text-slate-700 bg-rose-50/60 border border-rose-100 p-2.5 rounded-xl leading-relaxed">
                          <span className="font-semibold text-rose-800 mr-1">家庭辅导备忘：</span>
                          {student.note}
                        </p>
                      )}

                      {/* 错题统计 */}
                      <div className="mt-4 pt-3 border-t border-rose-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">孩子错题攻坚进度</span>
                        <div className="flex items-center gap-3 font-mono tabular-nums">
                          <span className="text-amber-600 font-semibold">
                            待巩固 {student.wrongOpen || 0}
                          </span>
                          <span className="text-slate-400">/</span>
                          <span className="text-slate-700">
                            总计 {student.wrongTotal || 0} 题
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮组 */}
                    <div className="mt-4 pt-3 border-t border-rose-100 flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setSelectedRadarStudentId(student.id);
                            window.scrollTo({ top: 120, behavior: 'smooth' });
                          }}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            isRadarSelected
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-800'
                          }`}
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>{isRadarSelected ? '正在看雷达' : '看学情雷达'}</span>
                        </button>

                        <button
                          onClick={() => setReportStudent(student)}
                          className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                        >
                          <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>生成亲子周报</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onNavigateToWrong(student.id)}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-rose-600" />
                          <span>孩子错题本</span>
                        </button>

                        <button
                          onClick={() => onNavigateToPaper(student.id)}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>一键组重做卷</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. 班级在校学生专栏卡片展示 */}
      {(activeTab === 'school' || activeTab === 'all') && (
        <div className="space-y-3 pt-2">
          {activeTab === 'all' && (
            <div className="flex items-center justify-between pb-1 border-b border-blue-200 mt-6">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">🏫 班级在校学生（教学名单 · {filteredSchool.length}人）</h3>
              </div>
              <button
                onClick={() => handleOpenAdd(false)}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                + 新建在校学生
              </button>
            </div>
          )}

          {filteredSchool.length === 0 ? (
            <div className="py-14 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
              暂无匹配的班级学生档案，请尝试切换年级或学段
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSchool.map(student => {
                const isRadarSelected = currentRadarStudent?.id === student.id;

                return (
                  <div
                    key={student.id}
                    className={`bg-white rounded-xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                      isRadarSelected
                        ? 'ring-2 ring-blue-500/80 border-blue-300 bg-blue-50/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* 姓名与编辑 */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">{student.name}</h3>
                            {getStageBadge(student.grade)}
                            {isRadarSelected && (
                              <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-medium">
                                当前雷达
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <span>{student.className}</span>
                            <span>·</span>
                            <span className="truncate max-w-[130px]">{student.school}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                            title="编辑学生档案"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`确定要将【${student.name}】设为您家小孩并移入【我家孩子专栏】吗？`)) {
                                handleToggleFamilyStatus(student);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title="设为我家小孩（移入亲子专栏）"
                          >
                            <Heart className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`确定删除学生 ${student.name} 的档案吗？`)) {
                                onDeleteStudent(student.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title="删除档案"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 标签 */}
                      {student.tags && student.tags.length > 0 && (
                        <div className="mt-3 text-xs text-slate-600 flex flex-wrap items-center gap-1.5">
                          {student.tags.map((tag, idx) => (
                            <React.Fragment key={tag}>
                              <span className="text-slate-700 font-medium">#{tag}</span>
                              {idx < student.tags.length - 1 && <span className="text-slate-300">·</span>}
                            </React.Fragment>
                          ))}
                        </div>
                      )}

                      {/* 学情评语 */}
                      {student.note && (
                        <p className="mt-3 text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg">
                          {student.note}
                        </p>
                      )}

                      {/* 错题统计数据 */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">错题攻坚情况</span>
                        <div className="flex items-center gap-3 font-mono tabular-nums">
                          <span className="text-amber-600 font-medium">
                            待复练 {student.wrongOpen || 0}
                          </span>
                          <span className="text-slate-400">/</span>
                          <span className="text-slate-700">
                            总计 {student.wrongTotal || 0} 题
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮组 */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setSelectedRadarStudentId(student.id);
                            window.scrollTo({ top: 120, behavior: 'smooth' });
                          }}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            isRadarSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>{isRadarSelected ? '正在看雷达' : '看学情雷达'}</span>
                        </button>

                        <button
                          onClick={() => setReportStudent(student)}
                          className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                        >
                          <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>生成家长周报</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onNavigateToWrong(student.id)}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                          <span>专属错题本</span>
                        </button>

                        <button
                          onClick={() => onNavigateToPaper(student.id)}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>一键组重做卷</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 家长周报 PDF 预览与生成弹窗 */}
      {reportStudent && (
        <StudentWeeklyReportModal
          isOpen={Boolean(reportStudent)}
          student={reportStudent}
          allWrongQuestions={wrongQuestions}
          onClose={() => setReportStudent(null)}
        />
      )}

      {/* 新建/编辑学生档案弹窗 (支持选择归属于我家孩子或在校学生) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 my-8 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {editingStudent ? '编辑档案信息' : '创建档案信息'}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  formData.isFamilyChild ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {formData.isFamilyChild ? '🏠 我家孩子专属专栏' : '🏫 班级在校学生'}
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* 核心单选：档案归属分类 */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  档案归属分类 *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isFamilyChild: true, familyRelation: formData.familyRelation || '我家大宝' })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formData.isFamilyChild
                        ? 'border-rose-500 bg-rose-50/70 text-rose-950 ring-1 ring-rose-300'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-rose-600" />
                        🏠 我家孩子（亲子专区）
                      </span>
                      {formData.isFamilyChild && (
                        <Check className="w-3.5 h-3.5 text-rose-600 font-bold" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">单独设立亲子专栏，与在校班级学生隔离</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isFamilyChild: false })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      !formData.isFamilyChild
                        ? 'border-blue-500 bg-blue-50/70 text-blue-950 ring-1 ring-blue-300'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        🏫 班级在校学生
                      </span>
                      {!formData.isFamilyChild && (
                        <Check className="w-3.5 h-3.5 text-blue-600 font-bold" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">学校常规教学班级学生档案与测验管理</p>
                  </button>
                </div>
              </div>

              {/* 若选自家孩子，提供专属关系称谓 */}
              {formData.isFamilyChild && (
                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/80 space-y-2">
                  <label className="block text-xs font-semibold text-rose-900">
                    亲子关系称谓（选填 / 可点击快捷填入）
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {['我家大宝', '我家小宝', '儿子', '女儿', '自家小孩'].map(rel => (
                      <button
                        key={rel}
                        type="button"
                        onClick={() => setFormData({ ...formData, familyRelation: rel })}
                        className={`px-2.5 py-1 rounded-md text-[11px] transition-colors cursor-pointer ${
                          formData.familyRelation === rel
                            ? 'bg-rose-600 text-white font-semibold'
                            : 'bg-white text-rose-800 border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {rel}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.familyRelation}
                    onChange={e => setFormData({ ...formData, familyRelation: e.target.value })}
                    placeholder="自定义称谓，如：我家大宝"
                    className="w-full px-3 py-1.5 text-xs border border-rose-200 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {formData.isFamilyChild ? '孩子姓名/小名 *' : '学生姓名 *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder={formData.isFamilyChild ? '如：阳阳 或 晨晨' : '如：张明宇'}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    就读年级 *
                  </label>
                  <select
                    value={formData.grade}
                    onChange={e => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    就读学校
                  </label>
                  <input
                    type="text"
                    value={formData.school}
                    onChange={e => setFormData({ ...formData, school: e.target.value })}
                    placeholder="如：北京实验中学"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    就读班级
                  </label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={e => setFormData({ ...formData, className: e.target.value })}
                    placeholder="如：初二(3)班 或 四年级(2)班"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  个性化学情标签（用逗号分隔）
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  placeholder={
                    formData.isFamilyChild
                      ? '如：亲子专档, 物理浮力, 错题周末二刷'
                      : '如：重点冲刺, 计算失误多, 运算律薄弱'
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {formData.isFamilyChild ? '家长亲子辅导心得与备忘' : '教师学情备注'}
                </label>
                <textarea
                  rows={3}
                  value={formData.note}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                  placeholder={
                    formData.isFamilyChild
                      ? '记录孩子的做题习惯、易急躁跳步点、周末需督促的薄弱学科模块...'
                      : '记录该学生的学科特点、薄弱知识点及提分关注点...'
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-semibold text-white rounded-lg transition-colors shadow-xs cursor-pointer ${
                    formData.isFamilyChild
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {editingStudent ? '保存修改' : '确认创建档案'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
