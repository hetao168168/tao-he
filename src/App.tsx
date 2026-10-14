/**
 * 菁优网智能教学与错题工作台
 * 专为中小学教师打造的高效错题管理、秒级扫码登录与试卷生成系统
 */
import React, { useState, useEffect } from 'react';
import { NavTab, TopBar } from './components/TopBar';
import { QRLoginModal } from './components/QRLoginModal';
import { DashboardView } from './components/DashboardView';
import { StudentsView } from './components/StudentsView';
import { WrongNotebookView } from './components/WrongNotebookView';
import { JyeooSearchView } from './components/JyeooSearchView';
import { PaperGeneratorView } from './components/PaperGeneratorView';
import { DoubaoAssistantModal } from './components/DoubaoAssistantModal';
import { DoubaoConfigModal } from './components/DoubaoConfigModal';
import {
  initSeedData,
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  getWrongQuestions,
  addWrongQuestion,
  toggleWrongMastered,
  deleteWrongQuestion,
  getQuestions,
  addQuestion,
  getPapers,
  createPaper,
  deletePaper,
  getStoredAuth,
  logoutUser,
} from './services/api';
import { Student, WrongQuestion, Question, GeneratedPaper, AuthState, ErrorReason } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [auth, setAuth] = useState<AuthState>(getStoredAuth());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 豆包大模型免费版助教与配置弹窗状态
  const [isDoubaoAssistantOpen, setIsDoubaoAssistantOpen] = useState(false);
  const [isDoubaoConfigOpen, setIsDoubaoConfigOpen] = useState(false);

  // 数据集状态
  const [students, setStudents] = useState<Student[]>([]);
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [papers, setPapers] = useState<GeneratedPaper[]>([]);

  // 跨视图过滤联动
  const [focusStudentId, setFocusStudentId] = useState<string | undefined>(undefined);

  // 初始化加载数据
  const refreshData = () => {
    initSeedData();
    setStudents(getStudents());
    setWrongQuestions(getWrongQuestions());
    setQuestions(getQuestions());
    setPapers(getPapers());
    setAuth(getStoredAuth());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // 退出登录
  const handleLogout = () => {
    logoutUser();
    setAuth({ isLoggedIn: false, isDemo: false, user: null });
  };

  // 登录成功
  const handleLoginSuccess = (newAuth: AuthState) => {
    setAuth(newAuth);
    refreshData();
  };

  // 导航并传递目标学生过滤
  const handleNavigate = (tab: NavTab, studentId?: string) => {
    setFocusStudentId(studentId);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. 学生操作
  const handleAddStudent = (data: Omit<Student, 'id' | 'createdAt'>) => {
    addStudent(data);
    setStudents(getStudents());
  };

  const handleUpdateStudent = (id: string, updates: Partial<Student>) => {
    updateStudent(id, updates);
    setStudents(getStudents());
  };

  const handleDeleteStudent = (id: string) => {
    deleteStudent(id);
    setStudents(getStudents());
  };

  // 2. 错题本操作
  const handleToggleWrongMastered = (id: string) => {
    toggleWrongMastered(id);
    setWrongQuestions(getWrongQuestions());
    setStudents(getStudents());
  };

  const handleDeleteWrong = (id: string) => {
    deleteWrongQuestion(id);
    setWrongQuestions(getWrongQuestions());
    setStudents(getStudents());
  };

  const handleAddWrong = (data: {
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
  }) => {
    addWrongQuestion(data);
    setWrongQuestions(getWrongQuestions());
    setStudents(getStudents());
  };

  // 3. 题库操作
  const handleImportToBank = (qData: Omit<Question, 'id' | 'addedAt'>) => {
    addQuestion(qData);
    setQuestions(getQuestions());
  };

  const handleAssignToStudentWrong = (studentId: string, q: Question) => {
    const stu = students.find(s => s.id === studentId);
    if (!stu) return;

    addWrongQuestion({
      studentId: stu.id,
      studentName: stu.name,
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
        hasImage: q.hasImage,
      },
      myAnswer: 'B',
      errorReason: '审题不清',
      note: '从菁优网真题直接指派给学生作为巩固专练题目',
      subject: q.subject,
      grade: q.grade,
    });

    setWrongQuestions(getWrongQuestions());
    setStudents(getStudents());
    handleNavigate('wrong', stu.id);
  };

  // 4. 试卷操作
  const handleSavePaper = (paperData: Omit<GeneratedPaper, 'id' | 'createdAt' | 'totalScore'>) => {
    createPaper(paperData);
    setPapers(getPapers());
  };

  const handleDeleteSavedPaper = (id: string) => {
    deletePaper(id);
    setPapers(getPapers());
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* 顶部导航 */}
      <TopBar
        currentTab={currentTab}
        onTabChange={tab => {
          setFocusStudentId(undefined);
          setCurrentTab(tab);
        }}
        auth={auth}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenDoubaoAssistant={() => setIsDoubaoAssistantOpen(true)}
        onOpenDoubaoConfig={() => setIsDoubaoConfigOpen(true)}
      />

      {/* 主视图区域 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            students={students}
            wrongQuestions={wrongQuestions}
            questions={questions}
            papers={papers}
            onNavigate={(tab, stuId) => handleNavigate(tab, stuId)}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            isLoggedIn={auth.isLoggedIn}
            onOpenDoubaoAssistant={() => setIsDoubaoAssistantOpen(true)}
            onOpenDoubaoConfig={() => setIsDoubaoConfigOpen(true)}
          />
        )}

        {currentTab === 'students' && (
          <StudentsView
            students={students}
            wrongQuestions={wrongQuestions}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onNavigateToWrong={stuId => handleNavigate('wrong', stuId)}
            onNavigateToPaper={stuId => handleNavigate('paper', stuId)}
          />
        )}

        {currentTab === 'wrong' && (
          <WrongNotebookView
            wrongQuestions={wrongQuestions}
            students={students}
            questions={questions}
            selectedStudentId={focusStudentId}
            onToggleMastered={handleToggleWrongMastered}
            onDeleteWrong={handleDeleteWrong}
            onAddWrong={handleAddWrong}
            onNavigateToPaper={stuId => handleNavigate('paper', stuId)}
            onImportToBank={handleImportToBank}
            onAssignToStudent={handleAssignToStudentWrong}
          />
        )}

        {currentTab === 'jyeoo' && (
          <JyeooSearchView
            questions={questions}
            students={students}
            onImportToBank={handleImportToBank}
            onAssignToStudentWrong={handleAssignToStudentWrong}
          />
        )}

        {currentTab === 'paper' && (
          <PaperGeneratorView
            students={students}
            wrongQuestions={wrongQuestions}
            questions={questions}
            initialStudentId={focusStudentId}
            onSavePaper={handleSavePaper}
            savedPapers={papers}
            onDeleteSavedPaper={handleDeleteSavedPaper}
          />
        )}
      </main>

      {/* 页面底部 */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>菁优网智能教学与错题管理工作台 · 深度接入豆包大模型免费版</span>
          <span className="text-slate-400">
            秒级微信扫码直通 · 豆包 AI 认知卡点诊断 · 同构变式出题 · 本地数据持久化
          </span>
        </div>
      </footer>

      {/* 豆包 AI 专属常驻悬浮助教入口（可随时呼出） */}
      <div className="fixed bottom-6 right-6 z-40 no-print flex flex-col items-end gap-2">
        <button
          onClick={() => setIsDoubaoAssistantOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer font-medium text-xs"
          title="点击呼出豆包 AI 教学助教（支持启发式讲题、智能命题、教案灵感）"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-base">🤖</span>
          <span>豆包 AI 助教</span>
          <span className="hidden group-hover:inline-block bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
            免费版
          </span>
        </button>
      </div>

      {/* 极速扫码登录弹窗 */}
      <QRLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 豆包 AI 教学助教对话弹窗 */}
      <DoubaoAssistantModal
        isOpen={isDoubaoAssistantOpen}
        onClose={() => setIsDoubaoAssistantOpen(false)}
        onImportToBank={handleImportToBank}
        onOpenConfig={() => setIsDoubaoConfigOpen(true)}
      />

      {/* 豆包大模型接入配置弹窗 */}
      <DoubaoConfigModal
        isOpen={isDoubaoConfigOpen}
        onClose={() => setIsDoubaoConfigOpen(false)}
        onConfigChanged={() => {}}
      />
    </div>
  );
}
