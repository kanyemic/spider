import React from 'react';
import { Article, Sentiment } from '../types';
import { ExternalLink, Sparkles, Loader2, Tag, AlertTriangle, ShieldCheck, Info, Activity } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  onAnalyze: (article: Article) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onAnalyze }) => {
  const getSentimentStyle = (sentiment?: Sentiment) => {
    switch (sentiment) {
      case Sentiment.Positive: return { color: 'text-emerald-600', bg: 'bg-white', border: 'border-emerald-100', icon: ShieldCheck, badgeBg: 'bg-emerald-50' };
      case Sentiment.Negative: return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, badgeBg: 'bg-white' };
      default: return { color: 'text-slate-600', bg: 'bg-white', border: 'border-slate-200', icon: Info, badgeBg: 'bg-slate-50' };
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-700 bg-red-100 border-red-200';
    if (score >= 50) return 'text-orange-700 bg-orange-100 border-orange-200';
    return 'text-emerald-700 bg-emerald-100 border-emerald-200';
  };

  const sentimentStyle = getSentimentStyle(article.analysis?.sentiment);
  const Icon = sentimentStyle.icon;

  return (
    <div className={`p-5 rounded-xl border transition-all duration-200 hover:shadow-md ${sentimentStyle.bg} ${sentimentStyle.border}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">{article.sourceName}</span>
          <span>{new Date(article.pubDate).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</span>
        </div>
        
        {article.analysis && (
          <div className={`px-2 py-1 rounded text-xs font-bold border flex items-center gap-1 ${getRiskColor(article.analysis.riskScore)}`}>
            <Activity size={12} />
            风险指数: {article.analysis.riskScore}
          </div>
        )}
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">
        <a href={article.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors flex items-center gap-2">
          {article.title}
          <ExternalLink size={14} className="opacity-0 group-hover:opacity-100" />
        </a>
      </h3>

      <div className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3">
        {article.analysis?.summary || article.content}
      </div>

      {article.analysis ? (
        <div className={`p-3 rounded-lg ${sentimentStyle.badgeBg} border ${sentimentStyle.border}`}>
          <div className="flex flex-wrap gap-2 mb-2">
            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border bg-white ${sentimentStyle.color} ${sentimentStyle.border}`}>
              <Icon size={12} />
              {article.analysis.sentiment === Sentiment.Positive ? '正面/中立' : 
               article.analysis.sentiment === Sentiment.Negative ? '负面舆情' : '中性'}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-slate-600 px-2 py-1 rounded-full bg-white border border-slate-200">
              <Tag size={12} />
              {article.analysis.category}
            </span>
            {article.analysis.keywords.slice(0, 3).map((keyword, i) => (
              <span key={i} className="text-xs text-slate-500 px-2 py-1 rounded-full bg-slate-100">
                #{keyword}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-500 border-t border-slate-200/50 pt-2 mt-2">
            <span className="font-semibold text-slate-700">建议: </span>
            {article.analysis.keyTakeaway}
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between mt-4">
           <button 
            onClick={() => onAnalyze(article)}
            disabled={article.isAnalyzing}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg"
          >
            {article.isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                正在智能分析...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                AI 舆情研判
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};