import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis, TrendReport } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");
  return new GoogleGenAI({ apiKey });
};

export const analyzeArticleWithAI = async (title: string, content: string): Promise<AIAnalysis> => {
  const ai = getClient();
  
  const prompt = `
    你是一位专业的医院舆情分析师。请分析以下文章内容，评估其对医院品牌形象、医患关系或医疗服务的潜在影响。
    
    文章标题: ${title}
    文章内容: ${content}
    
    请使用简体中文 (Simplified Chinese) 返回 JSON 格式的分析结果：
    1. summary: 简短的舆情摘要 (50字以内)。
    2. sentiment: 情感倾向 (Positive/Neutral/Negative)。
    3. keywords: 3-5个关键标签 (如：服务态度、医疗费用、医术医德、等待时间、药品短缺等)。
    4. riskScore: 舆情风险指数 (0-100)。0为无风险(或正面)，100为极高危危机。
       - 涉及医疗事故、医闹、乱收费等打高分。
       - 涉及表扬、医学科普打低分。
    5. category: 舆情归类 (如：医疗质量、服务态度、行政管理、费用问题、其他)。
    6. keyTakeaway: 给医院管理层的建议或警示 (一句话)。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            sentiment: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Negative'] },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            riskScore: { type: Type.NUMBER },
            category: { type: Type.STRING },
            keyTakeaway: { type: Type.STRING }
          },
          required: ['summary', 'sentiment', 'keywords', 'riskScore', 'category', 'keyTakeaway']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    return JSON.parse(text) as AIAnalysis;
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return {
      summary: "暂时无法分析舆情内容。",
      sentiment: "Neutral" as any,
      keywords: ["未知"],
      riskScore: 0,
      category: "未分类",
      keyTakeaway: "请人工复核。"
    };
  }
};

export const generateGlobalTrendReport = async (titles: string[]): Promise<TrendReport> => {
  const ai = getClient();
  const inputs = titles.slice(0, 50).join("\n- ");
  
  const prompt = `
    作为医院舆情监控系统，请根据以下近期监测到的标题列表，生成一份简报：
    
    ${inputs}
    
    请使用简体中文 (Simplified Chinese) 返回 JSON：
    1. topRisks: 当前最需要关注的3个潜在风险点或热门负面话题。
    2. overallSentiment: 整体社会舆论对医疗行业的当前情绪描述。
    3. actionableAdvice: 给院长的综合应对建议 (100字以内)。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
            overallSentiment: { type: Type.STRING },
            actionableAdvice: { type: Type.STRING },
          },
          required: ['topRisks', 'overallSentiment', 'actionableAdvice']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    
    return {
      ...JSON.parse(text),
      timestamp: new Date().toISOString()
    } as TrendReport;

  } catch (error) {
    console.error("Trend Report Failed:", error);
    return {
      timestamp: new Date().toISOString(),
      topRisks: ["数据不足"],
      overallSentiment: "未知",
      actionableAdvice: "无法生成报告，请检查网络或数据源。"
    };
  }
};