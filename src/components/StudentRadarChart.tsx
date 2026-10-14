import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from 'recharts';
import { Student, WrongQuestion } from '../types';
import { TrendingUp, AlertCircle, CheckCircle2, Target, Sparkles, BookOpen } from 'lucide-react';

interface StudentRadarChartProps {
  student: Student;
  allWrongQuestions: WrongQuestion[];
  onNavigateToPaper: (studentId: string) => void;
  onNavigateToWrong: (studentId: string) => void;
}

interface RadarDataPoint {
  subject: string;
  score: number;
  classAvg: number;
  fullMark: number;
  unmasteredCount: number;
}

export const StudentRadarChart: React.FC<StudentRadarChartProps> = ({
  student,
  allWrongQuestions,
  onNavigateToPaper,
  onNavigateToWrong,
}) => {
  // 提取该学生的错题
  const studentWrongs = useMemo(() => {
    return allWrongQuestions.filter(w => w.studentId === student.id);
  }, [allWrongQuestions, student.id]);

  // 计算多维知识体系掌握度数据（根据小学、初中、高中学段自适应维度模型）
  const radarData: RadarDataPoint[] = useMemo(() => {
    const stage = student.grade.includes('高')
      ? 'senior'
      : student.grade.includes('初') || student.grade.includes('七') || student.grade.includes('八') || student.grade.includes('九')
      ? 'junior'
      : 'primary';

    // 动态评价维度模型
    const dimensions = stage === 'primary'
      ? [
          { key: '数与代数四则运算', keywords: ['加法', '减法', '乘法', '除法', '运算', '口算', '算式'], classAvg: 82 },
          { key: '图形周长与几何空间', keywords: ['长方形', '周长', '面积', '圆', '长方体', '表面积', '图形'], classAvg: 78 },
          { key: '运算定律与简便计算', keywords: ['分配律', '简便', '运算律', '拆分', '结合律'], classAvg: 75 },
          { key: '实际问题与建模应用', keywords: ['应用', '飞来', '飞走', '瓷砖', '浓度', '比例'], classAvg: 80 },
          { key: '审题习惯与逆向思维', keywords: ['审题', '概念', '无盖', '漏乘', '混淆'], classAvg: 74 },
          { key: '解题步骤与计算准确', keywords: ['计算', '规范', '口算', '进位', '符号'], classAvg: 85 },
        ]
      : stage === 'senior'
      ? [
          { key: '导数切线与单调性质', keywords: ['导数', '单调', '切线', '极值', '斜率'], classAvg: 72 },
          { key: '集合逻辑与不等式', keywords: ['集合', '交集', '并集', '不等式', '定义域'], classAvg: 84 },
          { key: '电磁感应与力学综合', keywords: ['电磁', '感应', '磁场', '动量', '能量', '功率'], classAvg: 70 },
          { key: '参数分离与恒成立思想', keywords: ['分离', '恒成立', '参数', '取值范围'], classAvg: 68 },
          { key: '代数化简与运算准确度', keywords: ['计算', '化简', '符号', '代入', '失误'], classAvg: 76 },
          { key: '高考压轴与综合建模', keywords: ['综合', '压轴', '推导', '模型', '证明'], classAvg: 65 },
        ]
      : [
          { key: '二次与反比例函数', keywords: ['函数', '二次函数', '反比例', '抛物线', '坐标'], classAvg: 76 },
          { key: '几何证明与空间变换', keywords: ['几何', '三角形', '多边形', '证明', '角', '线段'], classAvg: 78 },
          { key: '动态电路与电学计算', keywords: ['电路', '电阻', '欧姆定律', '电压', '电流'], classAvg: 72 },
          { key: '物质性质与化学实验', keywords: ['化学', '鉴别', '酸碱', '除杂', '溶解', '实验'], classAvg: 80 },
          { key: '审题思维与步骤规范', keywords: ['审题', '规范', '计算', '步骤'], classAvg: 82 },
          { key: '综合应用与模型推理', keywords: ['综合', '探究', '推理', '应用'], classAvg: 70 },
        ];

    return dimensions.map(dim => {
      // 匹配该维度下的错题数
      const matched = studentWrongs.filter(w => {
        const text = `${w.snap.stem} ${w.snap.source || ''} ${(w.tags || []).join(' ')} ${w.errorReason}`;
        return dim.keywords.some(k => text.includes(k));
      });

      const unmastered = matched.filter(w => !w.mastered).length;
      const mastered = matched.filter(w => w.mastered).length;

      // 掌握度算法：基准分 92 分，每道未掌握错题扣减 14 分，每道已攻克错题恢复 8 分
      let score = 92 - unmastered * 14 + mastered * 6;
      if (score > 100) score = 100;
      if (score < 40) score = 42;

      return {
        subject: dim.key,
        score,
        classAvg: dim.classAvg,
        fullMark: 100,
        unmasteredCount: unmastered,
      };
    });
  }, [studentWrongs]);

  // 识别优势与薄弱项
  const strengths = useMemo(() => {
    return radarData.filter(d => d.score >= 82);
  }, [radarData]);

  const weaknesses = useMemo(() => {
    return radarData.filter(d => d.score < 75);
  }, [radarData]);

  // 综合学情健康指数
  const overallIndex = useMemo(() => {
    if (!radarData.length) return 85;
    const sum = radarData.reduce((acc, curr) => acc + curr.score, 0);
    return Math.round(sum / radarData.length);
  }, [radarData]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
      {/* 模块标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              【{student.name}】知识点掌握程度雷达分析
            </h3>
            <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
              {student.grade} · {student.className}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            基于该生历史错题库与攻坚进度动态拟合，客观评测核心学科知识模块强弱项
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto text-xs">
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">学科健康综合指数</span>
            <span className="text-lg font-bold text-blue-600 font-mono tabular-nums">
              {overallIndex} / 100
            </span>
          </div>
        </div>
      </div>

      {/* 主体双栏：左侧雷达图 + 右侧诊断结论 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* 左侧：Recharts 雷达图渲染画布 */}
        <div className="lg:col-span-7 h-72 sm:h-80 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: '#94a3b8', fontSize: 9 }}
              />
              {/* 班级平均线 */}
              <Radar
                name="班级平均参考"
                dataKey="classAvg"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="#cbd5e1"
                fillOpacity={0.15}
              />
              {/* 该生掌握度 */}
              <Radar
                name={`${student.name}掌握度`}
                dataKey="score"
                stroke="#2563eb"
                strokeWidth={2.5}
                fill="#3b82f6"
                fillOpacity={0.4}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as RadarDataPoint;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-xl space-y-1">
                        <div className="font-semibold text-blue-300">{data.subject}</div>
                        <div>
                          该生掌握分：
                          <span className="font-bold text-white font-mono">{data.score} 分</span>
                        </div>
                        <div className="text-slate-400">
                          班级平均分：
                          <span className="font-mono">{data.classAvg} 分</span>
                        </div>
                        {data.unmasteredCount > 0 && (
                          <div className="text-amber-400">
                            待巩固错题：{data.unmasteredCount} 题
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                iconType="circle"
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* 右侧：多维诊断与针对性突破建议 */}
        <div className="lg:col-span-5 space-y-4">
          {/* 优势强项卡 */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>学科竞争优势模块（掌握良好）</span>
            </div>
            {strengths.length > 0 ? (
              <div className="space-y-1 text-xs text-emerald-800">
                {strengths.map(s => (
                  <div key={s.subject} className="flex items-center justify-between">
                    <span>{s.subject}</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {s.score}分 (高出平均 {s.score - s.classAvg > 0 ? `+${s.score - s.classAvg}` : 0})
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-700">各项基础较为平均，需继续深化拔高探究。</p>
            )}
          </div>

          {/* 薄弱短板卡 */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>亟需攻坚短板考点（建议优先突破）</span>
            </div>
            {weaknesses.length > 0 ? (
              <div className="space-y-1.5 text-xs text-amber-900">
                {weaknesses.map(w => (
                  <div key={w.subject} className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{w.subject}</span>
                      {w.unmasteredCount > 0 && (
                        <span className="text-[11px] text-amber-700 ml-1.5">
                          ({w.unmasteredCount}道待攻坚)
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-amber-700">{w.score}分</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-amber-800">该生暂无显著低于均分的严重偏科板块。</p>
            )}
          </div>

          {/* 针对性辅导快捷操作 */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => onNavigateToPaper(student.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Target className="w-3.5 h-3.5" />
              <span>按雷达薄弱考点组卷</span>
            </button>

            <button
              onClick={() => onNavigateToWrong(student.id)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>查看该生错题</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
