/**
 * 菁优网智能教学工作台数据结构定义
 */

export type SubjectKey = 
  | 'math'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'history'
  | 'geography'
  | 'chinese'
  | 'english'
  | 'politics'
  | 'science';

export const SUBJECT_MAP: Record<SubjectKey, string> = {
  math: '数学',
  physics: '物理',
  chemistry: '化学',
  biology: '生物',
  history: '历史',
  geography: '地理',
  chinese: '语文',
  english: '英语',
  politics: '道德与法治',
  science: '科学',
};

// 完整 K12 贯通年级定义（小学一年级 至 高中三年级）
export const PRIMARY_GRADES = [
  '一年级',
  '二年级',
  '三年级',
  '四年级',
  '五年级',
  '六年级',
] as const;

export const JUNIOR_GRADES = [
  '初一（七年级）',
  '初二（八年级）',
  '初三（九年级）',
] as const;

export const SENIOR_GRADES = [
  '高一',
  '高二',
  '高三',
] as const;

export const ALL_GRADES = [
  ...PRIMARY_GRADES,
  ...JUNIOR_GRADES,
  ...SENIOR_GRADES,
] as const;

export type GradeType = typeof ALL_GRADES[number];

export const GRADE_STAGE_GROUPS = [
  { stage: 'primary', label: '小学阶段', grades: PRIMARY_GRADES },
  { stage: 'junior', label: '初中阶段', grades: JUNIOR_GRADES },
  { stage: 'senior', label: '高中阶段', grades: SENIOR_GRADES },
] as const;

export function getGradeStage(grade: string): 'primary' | 'junior' | 'senior' {
  if (grade.includes('高') || grade.includes('高一') || grade.includes('高二') || grade.includes('高三')) {
    return 'senior';
  }
  if (
    grade.includes('初') ||
    grade.includes('七年级') ||
    grade.includes('八年级') ||
    grade.includes('九年级')
  ) {
    return 'junior';
  }
  return 'primary';
}

export interface QuestionOption {
  pos: string; // 'A', 'B', 'C', 'D'
  text: string;
}

export interface Question {
  id: string;
  subject: SubjectKey | string;
  grade: string; // 一年级~高三
  stem: string;
  options: QuestionOption[];
  answer: string; // e.g. 'C'
  explanation?: string;
  difficulty: number | string; // 1-5 or '中等', '偏难'
  source: string; // e.g. '2026·北京海淀一模'
  kp: string[]; // 知识点
  tags?: string[]; // 自动生成的多维智能标签
  hasImage?: boolean;
  origin: 'jyeoo' | 'custom' | 'demo';
  addedAt: string;
  detailUrl?: string;
}

export type QuestionSnapshot = Omit<Question, 'id' | 'origin' | 'addedAt'>;

export interface Student {
  id: string;
  name: string;
  grade: string;
  school: string;
  className: string;
  tags: string[]; // e.g. ['重点关注', '计算薄弱', '数学单科提分']
  note?: string;
  createdAt: string;
  wrongTotal?: number;
  wrongOpen?: number;
  isFamilyChild?: boolean; // 是否是自家孩子（独立专栏归档）
  familyRelation?: string; // 关系称谓，如 '我家大宝'、'我家二宝'、'儿子'、'女儿' 等
}

export type ErrorReason = 
  | '审题不清'
  | '概念混淆'
  | '计算失误'
  | '综合应用薄弱'
  | '公式记忆错误'
  | '解题步骤不规范'
  | '其他原因';

export interface WrongQuestion {
  id: string;
  studentId: string;
  studentName?: string;
  questionId?: string; // 关联题库原题（可为空）
  snap: QuestionSnapshot; // 独立快照，保证题库修改删除不受影响
  myAnswer: string; // 学生的错误答案
  errorReason: ErrorReason;
  note: string; // 教师评语或错因心得
  date: string; // 录入日期 YYYY-MM-DD
  subject: SubjectKey | string;
  grade: string;
  tags?: string[]; // 自动生成与教师自定义的多维智能标签
  mastered: boolean; // 是否已掌握
  masteredAt?: string;
}

export interface PaperSettings {
  title: string;
  subtitle: string;
  header: string; // 考务说明或班级信息
  footer: string;
  perScore: number; // 每题分值
  showAnswer: boolean; // 是否打印答案与解析页
  studentName?: string;
  className?: string;
  examDate?: string;
  duration?: number; // 考试时长（分钟）
}

export interface GeneratedPaper {
  id: string;
  title: string;
  subtitle: string;
  mode: 'wrong' | 'bank' | 'custom';
  studentId?: string;
  studentName?: string;
  items: QuestionSnapshot[];
  settings: PaperSettings;
  createdAt: string;
  totalScore: number;
}

export interface QRState {
  status: 'idle' | 'loading' | 'waiting' | 'scanned' | 'confirmed' | 'expired' | 'error';
  ticket?: string;
  qrUrl?: string;
  appkey?: string;
  message?: string;
  expireSeconds: number;
}

export interface AuthState {
  isLoggedIn: boolean;
  isDemo: boolean;
  user: {
    name: string;
    avatar: string;
    role: string;
    school: string;
    vipExpiry: string;
  } | null;
}
