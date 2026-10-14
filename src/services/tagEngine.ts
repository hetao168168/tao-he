/**
 * 错题智能标签引擎 (Tag Engine)
 * 基于学科、题干关键词、选项考点与错因归类，自动提取与生成多维标签
 */
import { SubjectKey, QuestionOption, WrongQuestion } from '../types';

interface TagSourceInput {
  subject: SubjectKey | string;
  grade?: string;
  stem: string;
  options?: QuestionOption[];
  answer?: string;
  difficulty?: number | string;
  kp?: string[];
  errorReason?: string;
}

// 核心考点语义词典
const SUBJECT_KEYWORD_RULES: Record<string, { pattern: RegExp; tag: string }[]> = {
  math: [
    { pattern: /二次函数|抛物线|y\s*=\s*ax[²2]/i, tag: '二次函数图象与性质' },
    { pattern: /对称轴|顶点坐标|开口向上|开口向下/i, tag: '抛物线对称轴与最值' },
    { pattern: /反比例函数|y\s*=\s*k\/x/i, tag: '反比例函数综合' },
    { pattern: /一次函数|正比例函数|斜率/i, tag: '一次函数模型' },
    { pattern: /多边形|内角和|外角和/i, tag: '多边形内外角性质' },
    { pattern: /直角坐标系|原点对称|中心对称|关于原点/i, tag: '坐标对称与几何变换' },
    { pattern: /勾股定理|直角三角形|斜边/i, tag: '勾股定理与解直角三角形' },
    { pattern: /动点|最值|运动路径/i, tag: '动点与几何极值' },
    { pattern: /圆|圆周角|切线/i, tag: '圆的综合判定' },
    { pattern: /概率|统计|抽样/i, tag: '概率统计与决策' },
  ],
  physics: [
    { pattern: /滑动变阻器|滑片|闭合开关|动态电路/i, tag: '动态电路分析' },
    { pattern: /电压表|电流表|示数比值/i, tag: '电表测量与电路诊断' },
    { pattern: /欧姆定律|电阻|I\s*=\s*U\/R/i, tag: '欧姆定律应用' },
    { pattern: /动能|势能|机械能|重力势能|下落/i, tag: '机械能守恒与转化' },
    { pattern: /浮力|阿基米德|排开液体重力/i, tag: '浮力与沉浮条件' },
    { pattern: /杠杆|平衡条件|力臂/i, tag: '杠杆平衡模型' },
    { pattern: /凸透镜|焦距|实像|虚像/i, tag: '凸透镜成像规律' },
    { pattern: /压强|液体压强|帕斯卡/i, tag: '压强综合计算' },
  ],
  chemistry: [
    { pattern: /鉴别|除杂|分离/i, tag: '物质鉴别与除杂' },
    { pattern: /溶解|吸热|放热|温度变化/i, tag: '溶解吸放热现象' },
    { pattern: /酚酞|石蕊|碱性|变质/i, tag: '酸碱盐与试剂变色' },
    { pattern: /质量守恒|化学方程式/i, tag: '质量守恒与化学方程式' },
    { pattern: /金属活动性|置换反应/i, tag: '金属活动性顺序' },
    { pattern: /氧气|二氧化碳|气体发生装置/i, tag: '常见气体制取与收集' },
  ],
  biology: [
    { pattern: /显微镜|准焦螺旋|物镜|目镜/i, tag: '显微镜构造与规范操作' },
    { pattern: /细胞|洋葱|临时装片/i, tag: '动植物细胞结构' },
    { pattern: /光合作用|呼吸作用|叶绿体/i, tag: '光合与呼吸代谢' },
    { pattern: /遗传|显性|隐性|基因/i, tag: '遗传规律与性状' },
  ],
  history: [
    { pattern: /新航路|哥伦布|麦哲伦|商业联系/i, tag: '新航路开辟与全球联结' },
    { pattern: /工业革命|蒸汽机|瓦特/i, tag: '工业革命与社会转型' },
    { pattern: /辛亥革命|五四运动|抗日战争/i, tag: '中国近现代史专题' },
  ],
};

/**
 * 自动提取与生成错题标签
 */
export function generateAutoTags(input: TagSourceInput): string[] {
  const tags = new Set<string>();

  // 1. 继承原题目已有的精准知识点
  if (input.kp && Array.isArray(input.kp)) {
    input.kp.forEach(k => {
      const clean = k.trim();
      if (clean && clean.length <= 12) tags.add(clean);
    });
  }

  // 2. 学科规则引擎正则分析
  const rules = SUBJECT_KEYWORD_RULES[input.subject] || [];
  const textCorpus = `${input.stem} ${(input.options || []).map(o => o.text).join(' ')}`;

  for (const rule of rules) {
    if (rule.pattern.test(textCorpus)) {
      tags.add(rule.tag);
    }
  }

  // 3. 题型与思维模型维度标签
  if (/图象|坐标|函数/i.test(input.stem)) {
    tags.add('数形结合');
  }
  if (/实验|装置|检验|操作/i.test(input.stem)) {
    tags.add('实验探究');
  }
  if (/电路|变阻器|杠杆|受力/i.test(input.stem)) {
    tags.add('物理模型建构');
  }
  if (/综合|探究|下列说法正确的是/i.test(input.stem)) {
    tags.add('多条件综合推理');
  }

  // 4. 难度分级标签
  const diff = Number(input.difficulty) || 2;
  if (diff >= 4) {
    tags.add('拔高压轴 ★★★★');
  } else if (diff === 3) {
    tags.add('中档精练 ★★★');
  } else {
    tags.add('基础巩固 ★★');
  }

  // 5. 错因维度标签
  if (input.errorReason) {
    tags.add(`易错:${input.errorReason}`);
  }

  return Array.from(tags).slice(0, 5);
}

/**
 * 获取当前错题库中所有出现的独立标签及其频次
 */
export function extractUniqueTagsWithCounts(
  wrongQuestions: WrongQuestion[]
): { tag: string; count: number }[] {
  const map = new Map<string, number>();

  wrongQuestions.forEach(w => {
    const list = w.tags || w.snap.tags || w.snap.kp || [];
    list.forEach(t => {
      const clean = t.trim();
      if (!clean) return;
      map.set(clean, (map.get(clean) || 0) + 1);
    });
  });

  return Array.from(map.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}
