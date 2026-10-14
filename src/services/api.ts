/**
 * 客户端 API 与本地持久化服务
 * 支持与后端轻量级接口通信，并在离线或快速开发时具备完整的原子本地缓存。
 */
import { Student, Question, WrongQuestion, GeneratedPaper, AuthState, QRState, SubjectKey } from '../types';
import { INITIAL_STUDENTS, INITIAL_QUESTIONS, INITIAL_WRONG_QUESTIONS, INITIAL_PAPERS } from '../mockData';
import { generateAutoTags } from './tagEngine';

const STORAGE_KEYS = {
  STUDENTS: 'jyeoo_students_v2',
  QUESTIONS: 'jyeoo_questions_v2',
  WRONG: 'jyeoo_wrong_v2',
  PAPERS: 'jyeoo_papers_v2',
  AUTH: 'jyeoo_auth_v2',
};

// 本地持久化工具
function getLocal<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    if (!val) return fallback;
    return JSON.parse(val) as T;
  } catch (e) {
    return fallback;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Local storage write failed:', e);
  }
}

// 初始化演示数据（覆盖小学一年级至高三年级全学段贯通数据与自家孩子亲子专档）
export function initSeedData() {
  const currentStudents = getLocal<Student[]>(STORAGE_KEYS.STUDENTS, []);
  const hasFamily = currentStudents.some(s => s.isFamilyChild);

  if (!currentStudents.length || currentStudents.length < 10) {
    setLocal(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  } else if (!hasFamily) {
    // 兼容升级：将初始自家孩子档案合并置顶到现有学生列表中
    const familyChildren = INITIAL_STUDENTS.filter(s => s.isFamilyChild);
    setLocal(STORAGE_KEYS.STUDENTS, [...familyChildren, ...currentStudents]);
  }

  const currentQuestions = getLocal<Question[]>(STORAGE_KEYS.QUESTIONS, []);
  if (!currentQuestions.length || currentQuestions.length < 10) {
    setLocal(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
  }

  const currentWrongs = getLocal<WrongQuestion[]>(STORAGE_KEYS.WRONG, []);
  const hasFamilyWrongs = currentWrongs.some(w => w.studentId.startsWith('stu-my-'));

  if (!currentWrongs.length || currentWrongs.length < 10) {
    setLocal(STORAGE_KEYS.WRONG, INITIAL_WRONG_QUESTIONS);
  } else if (!hasFamilyWrongs) {
    // 补充自家小孩的专属错题
    const familyWrongs = INITIAL_WRONG_QUESTIONS.filter(w => w.studentId.startsWith('stu-my-'));
    setLocal(STORAGE_KEYS.WRONG, [...familyWrongs, ...currentWrongs]);
  }

  const currentPapers = getLocal<GeneratedPaper[]>(STORAGE_KEYS.PAPERS, []);
  if (!currentPapers.length) {
    setLocal(STORAGE_KEYS.PAPERS, INITIAL_PAPERS);
  }
}

// ---------------- 1. 扫码认证 API ----------------

export async function requestFastQRCode(): Promise<{ ok: boolean; ticket?: string; qrUrl?: string; appkey?: string; error?: string }> {
  try {
    const resp = await fetch('/api/jyeoo/qr/fast-start', { method: 'POST' });
    if (resp.ok) {
      const data = await resp.json();
      return data;
    }
  } catch (err) {
    console.warn('API /api/jyeoo/qr/fast-start error, using fast direct fallback:', err);
  }

  // 极速离线/网络受限兜底：生成即时可用微信体验码
  const mockTicket = `ais_jyeoo_${Date.now()}`;
  return {
    ok: true,
    ticket: mockTicket,
    qrUrl: `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${mockTicket}`,
    appkey: 'demo_key',
  };
}

export async function pollQRCodeStatus(
  ticket: string,
  appkey?: string
): Promise<{ ok: boolean; S: number; message?: string; rawMessage?: string; isScanned?: boolean; user?: any; loggedIn?: boolean }> {
  try {
    const resp = await fetch('/api/jyeoo/qr/poll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket, appkey }),
    });
    if (resp.ok) {
      const data = await resp.json();
      return {
        ok: Boolean(data.ok),
        S: Number(data.S),
        message: data.message || data.Message || '',
        rawMessage: data.rawMessage || '',
        isScanned: Boolean(data.isScanned),
        loggedIn: Boolean(data.loggedIn || data.S === 2),
        user: data.user,
      };
    }
  } catch (err) {
    // 忽略瞬态网络抖动
  }

  return { ok: true, S: 1, message: '请在手机微信上确认' };
}

export async function simulateScanSuccess(ticket?: string): Promise<{ ok: boolean; user: any }> {
  try {
    const resp = await fetch('/api/jyeoo/qr/simulate-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket }),
    });
    if (resp.ok) {
      const data = await resp.json();
      return { ok: true, user: data.user };
    }
  } catch (err) {}

  return {
    ok: true,
    user: {
      name: '菁优微信用户（测试老师）',
      role: '学科骨干教师',
      school: '北京实验中学',
      avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
    },
  };
}

export async function confirmQRLoginManually(ticket?: string): Promise<{ ok: boolean; user: any }> {
  try {
    const resp = await fetch('/api/jyeoo/qr/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket }),
    });
    if (resp.ok) {
      const data = await resp.json();
      return { ok: true, user: data.user };
    }
  } catch (err) {}

  return {
    ok: true,
    user: { name: '菁优认证教师', role: '认证学科教师', school: '教学教研示范校' },
  };
}

export function getStoredAuth(): AuthState {
  return getLocal<AuthState>(STORAGE_KEYS.AUTH, {
    isLoggedIn: false,
    isDemo: false,
    user: null,
  });
}

export function setStoredAuth(auth: AuthState): void {
  setLocal(STORAGE_KEYS.AUTH, auth);
}

// 快速模拟演示身份登录（供教师测试与免机体验）
export function loginAsDemoTeacher(): AuthState {
  const auth: AuthState = {
    isLoggedIn: true,
    isDemo: true,
    user: {
      name: '王老师',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      role: '初中数学教研组长 / 菁优金牌名师',
      school: '北京实验中学',
      vipExpiry: '2027-12-31',
    },
  };
  setStoredAuth(auth);
  return auth;
}

export function logoutUser(): void {
  try {
    fetch('/api/jyeoo/logout', { method: 'POST' }).catch(() => {});
  } catch (e) {}
  setStoredAuth({ isLoggedIn: false, isDemo: false, user: null });
}

// ---------------- 2. 学生管理 ----------------

export function getStudents(): Student[] {
  const students = getLocal<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  const wrongs = getWrongQuestions();

  return students.map(s => {
    const sWrongs = wrongs.filter(w => w.studentId === s.id);
    return {
      ...s,
      wrongTotal: sWrongs.length,
      wrongOpen: sWrongs.filter(w => !w.mastered).length,
    };
  });
}

export function addStudent(studentData: Omit<Student, 'id' | 'createdAt'>): Student {
  const students = getLocal<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  const newStudent: Student = {
    ...studentData,
    id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
    wrongTotal: 0,
    wrongOpen: 0,
  };
  const updated = [newStudent, ...students];
  setLocal(STORAGE_KEYS.STUDENTS, updated);
  
  // 同步通知后端
  fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newStudent),
  }).catch(() => {});

  return newStudent;
}

export function updateStudent(id: string, updates: Partial<Student>): Student | null {
  const students = getLocal<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  const idx = students.findIndex(s => s.id === id);
  if (idx === -1) return null;
  students[idx] = { ...students[idx], ...updates };
  setLocal(STORAGE_KEYS.STUDENTS, students);

  fetch(`/api/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  }).catch(() => {});

  return students[idx];
}

export function deleteStudent(id: string): void {
  const students = getLocal<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  setLocal(STORAGE_KEYS.STUDENTS, students.filter(s => s.id !== id));
  
  fetch(`/api/students/${id}`, { method: 'DELETE' }).catch(() => {});
}

// ---------------- 3. 题库检索与管理 ----------------

export function getQuestions(): Question[] {
  return getLocal<Question[]>(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
}

export function addQuestion(qData: Omit<Question, 'id' | 'addedAt'>): Question {
  const list = getQuestions();
  const newQ: Question = {
    ...qData,
    id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    addedAt: new Date().toISOString(),
  };
  setLocal(STORAGE_KEYS.QUESTIONS, [newQ, ...list]);
  
  fetch('/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newQ),
  }).catch(() => {});

  return newQ;
}

export function deleteQuestion(id: string): void {
  const list = getQuestions();
  setLocal(STORAGE_KEYS.QUESTIONS, list.filter(q => q.id !== id));
  fetch(`/api/questions/${id}`, { method: 'DELETE' }).catch(() => {});
}

// ---------------- 4. 错题管理（快照机制） ----------------

export function getWrongQuestions(): WrongQuestion[] {
  return getLocal<WrongQuestion[]>(STORAGE_KEYS.WRONG, INITIAL_WRONG_QUESTIONS);
}

export function addWrongQuestion(data: {
  studentId: string;
  studentName: string;
  questionId?: string;
  snap: Question['stem'] extends string ? any : never;
  myAnswer: string;
  errorReason: any;
  note?: string;
  subject: string;
  grade: string;
  tags?: string[];
}): WrongQuestion {
  const wrongs = getWrongQuestions();
  const autoTags = data.tags && data.tags.length > 0
    ? data.tags
    : generateAutoTags({
        subject: data.subject,
        grade: data.grade,
        stem: data.snap?.stem || '',
        options: data.snap?.options || [],
        answer: data.snap?.answer || '',
        difficulty: data.snap?.difficulty || 2,
        kp: data.snap?.kp || [],
        errorReason: data.errorReason,
      });

  const newWrong: WrongQuestion = {
    id: `wr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    studentId: data.studentId,
    studentName: data.studentName,
    questionId: data.questionId,
    snap: { ...data.snap, tags: autoTags }, // 独立深拷贝快照
    myAnswer: data.myAnswer,
    errorReason: data.errorReason,
    note: data.note || '',
    date: new Date().toISOString().slice(0, 10),
    subject: data.subject,
    grade: data.grade,
    tags: autoTags,
    mastered: false,
  };
  
  const updated = [newWrong, ...wrongs];
  setLocal(STORAGE_KEYS.WRONG, updated);

  fetch('/api/wrong', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newWrong),
  }).catch(() => {});

  return newWrong;
}

export function toggleWrongMastered(id: string): WrongQuestion | null {
  const wrongs = getWrongQuestions();
  const idx = wrongs.findIndex(w => w.id === id);
  if (idx === -1) return null;
  const isNowMastered = !wrongs[idx].mastered;
  wrongs[idx].mastered = isNowMastered;
  wrongs[idx].masteredAt = isNowMastered ? new Date().toISOString() : undefined;
  
  setLocal(STORAGE_KEYS.WRONG, wrongs);
  
  fetch(`/api/wrong/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mastered: isNowMastered }),
  }).catch(() => {});

  return wrongs[idx];
}

export function deleteWrongQuestion(id: string): void {
  const wrongs = getWrongQuestions();
  setLocal(STORAGE_KEYS.WRONG, wrongs.filter(w => w.id !== id));
  fetch(`/api/wrong/${id}`, { method: 'DELETE' }).catch(() => {});
}

// ---------------- 5. 试卷生成与导出 ----------------

export function getPapers(): GeneratedPaper[] {
  return getLocal<GeneratedPaper[]>(STORAGE_KEYS.PAPERS, INITIAL_PAPERS);
}

export function createPaper(paperData: Omit<GeneratedPaper, 'id' | 'createdAt' | 'totalScore'>): GeneratedPaper {
  const list = getPapers();
  const totalScore = (paperData.settings.perScore || 10) * (paperData.items.length || 0);
  const newPaper: GeneratedPaper = {
    ...paperData,
    id: `paper_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
    totalScore,
  };

  const updated = [newPaper, ...list];
  setLocal(STORAGE_KEYS.PAPERS, updated);

  fetch('/api/papers/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newPaper),
  }).catch(() => {});

  return newPaper;
}

export function deletePaper(id: string): void {
  const list = getPapers();
  setLocal(STORAGE_KEYS.PAPERS, list.filter(p => p.id !== id));
}
