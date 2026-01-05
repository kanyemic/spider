export interface FeedSource {
  id: string;
  name: string;
  url: string;
  category: string;
}

export enum Sentiment {
  Positive = 'Positive',
  Neutral = 'Neutral',
  Negative = 'Negative',
}

export interface AIAnalysis {
  summary: string;
  sentiment: Sentiment;
  keywords: string[];
  riskScore: number; // 0-100, formerly trendScore
  category: string; // e.g., "Service Quality", "Medical Dispute", "Cost"
  keyTakeaway: string;
}

export interface Article {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  content: string; // or snippet
  sourceId: string;
  sourceName: string; // This acts as "Platform"
  analysis?: AIAnalysis;
  isAnalyzing?: boolean;
}

export interface TrendReport {
  timestamp: string;
  topRisks: string[]; // Major risks identified
  overallSentiment: string;
  actionableAdvice: string; // Advice for hospital PR
}