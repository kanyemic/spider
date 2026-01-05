import React, { useEffect, useState } from 'react';
import { Article, Sentiment, TrendReport } from '../types';
import { generateGlobalTrendReport } from '../services/geminiService';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid, Treemap, Customized
} from 'recharts';
import { Loader2, RefreshCw, TrendingUp, Lightbulb, Sparkles, LayoutGrid, MessageCircle, Flame, Gauge } from 'lucide-react';

interface DashboardProps {
  articles: Article[];
}

// Vibrant Custom Colors
const COLORS = {
  primary: '#4338ca', // Indigo
  vibrant: [
    '#f43f5e', // Rose Red
    '#8b5cf6', // Violet
    '#0ea5e9', // Sky Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#6366f1', // Indigo
    '#14b8a6', // Teal
  ],
  sentiment: {
    positive: '#22c55e', // Green
    neutral: '#3b82f6',  // Blue
    negative: '#ef4444', // Red
  },
  gauge: [
    '#ef4444', // -100 to -60 (Deep Red)
    '#f97316', // -60 to -20 (Orange)
    '#94a3b8', // -20 to 20 (Grey)
    '#84cc16', // 20 to 60 (Lime)
    '#22c55e', // 60 to 100 (Green)
  ]
};

// Simulated Data Generators
const generateSimulatedPlatformData = () => [
  { name: '微博', count: 2450, fill: '#ef4444' }, // Weibo Red
  { name: '抖音', count: 1890, fill: '#000000' }, // Douyin Black/Dark
  { name: '小红书', count: 1560, fill: '#ff2442' }, // Xiaohongshu Red
  { name: '今日头条', count: 1200, fill: '#d33c30' }, // Toutiao Red
  { name: '知乎', count: 890, fill: '#0084ff' }, // Zhihu Blue
  { name: '微信公众号', count: 650, fill: '#07c160' }, // WeChat Green
];

const generateSimulatedKeywords = () => [
  { name: '服务态度差', size: 120 },
  { name: '停车难', size: 95 },
  { name: '专家号难挂', size: 85 },
  { name: '乱收费', size: 70 },
  { name: '医保报销', size: 60 },
  { name: '排队时间长', size: 55 },
  { name: '护士态度好', size: 45 },
  { name: '环境脏乱', size: 40 },
  { name: '黄牛倒号', size: 35 },
  { name: '检查费用', size: 30 },
  { name: '急诊等待', size: 25 },
  { name: '手术成功', size: 20 },
];

const generateSimulatedTrendData = () => {
  const dates = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push({
      date: d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
      count: Math.floor(Math.random() * 200) + 100 // Random 100-300 range
    });
  }
  return dates;
};

// Custom Content for Treemap (Keywords Heatmap)
const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, name, value, index } = props;
  const color = COLORS.vibrant[index % COLORS.vibrant.length];
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        ry={4}
        style={{
          fill: color,
          stroke: '#fff',
          strokeWidth: 2,
          opacity: 0.9,
        }}
      />
      {width > 30 && height > 20 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#fff"
          fontSize={Math.min(width / 4, 14)}
          fontWeight="bold"
          dy={4}
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
        >
          {name}
        </text>
      )}
    </g>
  );
};

// --- Gauge Chart Needle Component ---
// This component receives chart dimensions (width, height) from the Customized component wrapper
const GaugeNeedle = ({ width, height, value }: any) => {
  if (!width || !height) return null;

  // Constants matching the Pie Chart configuration
  const cx = width / 2;
  const cy = height * 0.75; // Matches cy="75%" in Pie
  const iR = 80;
  const oR = 120; // Matches outerRadius in Pie
  const length = oR - 10; // Needle length relative to radius

  // Convert value (-100 to 100) to angle (180 to 0)
  // -100 => 180 degrees (Left)
  // 0    => 90 degrees (Top)
  // 100  => 0 degrees (Right)
  const angle = 180 - ((value + 100) / 200) * 180;

  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * angle);
  const cos = Math.cos(-RADIAN * angle);

  // Needle coordinates
  // Start from center (cx, cy)
  const x0 = cx;
  const y0 = cy;
  
  // Base width of the needle
  const r = 6; 
  
  // Tip of the needle
  const xp = x0 + length * cos;
  const yp = y0 + length * sin;
  
  // Base points (perpendicular to angle)
  const xba = x0 + r * sin;
  const yba = y0 - r * cos;
  const xbb = x0 - r * sin;
  const ybb = y0 + r * cos;

  return (
    <g>
      {/* Pivot circle */}
      <circle cx={x0} cy={y0} r={r + 2} fill="#334155" stroke="none" />
      {/* Needle body */}
      <path d={`M${xba} ${yba}L${xbb} ${ybb} L${xp} ${yp} L${xba} ${yba}`} stroke="none" fill="#334155" />
      {/* Small white center dot for style */}
      <circle cx={x0} cy={y0} r={2} fill="#fff" stroke="none" />
    </g>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ articles }) => {
  const [trendReport, setTrendReport] = useState<TrendReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Use Simulated Data
  const trendData = generateSimulatedTrendData();
  const platformData = generateSimulatedPlatformData();
  const keywordData = generateSimulatedKeywords();
  
  // Simulated Sentiment Score (-100 to 100)
  const sentimentScore = 35; 

  // Gauge Data Segments (Total 200 span)
  const gaugeData = [
    { name: '极差', value: 40, color: COLORS.gauge[0] }, // -100 to -60
    { name: '较差', value: 40, color: COLORS.gauge[1] }, // -60 to -20
    { name: '中立', value: 40, color: COLORS.gauge[2] }, // -20 to 20
    { name: '良好', value: 40, color: COLORS.gauge[3] }, // 20 to 60
    { name: '极好', value: 40, color: COLORS.gauge[4] }, // 60 to 100
  ];

  const handleGenerateReport = async () => {
    if (articles.length === 0 && !loading) {
       setLoading(true);
       setTimeout(() => {
         setTrendReport({
           timestamp: new Date().toISOString(),
           topRisks: ['急诊科等待时间过长引发家属不满', '关于"乱收费"的谣言在本地群传播', '儿科流感高峰期医疗资源紧张'],
           overallSentiment: '整体平稳，但局部存在服务体验相关的负面声音。',
           actionableAdvice: '建议加强急诊分诊沟通，及时发布流感就诊指南，并在公众号澄清收费标准。'
         });
         setLastUpdated(new Date().toLocaleTimeString());
         setLoading(false);
       }, 1500);
       return;
    }

    setLoading(true);
    const titles = articles.map(a => a.title);
    const report = await generateGlobalTrendReport(titles);
    setTrendReport(report);
    setLastUpdated(new Date().toLocaleTimeString());
    setLoading(false);
  };

  useEffect(() => {
    if (!trendReport && !loading) {
       handleGenerateReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 pb-20 bg-slate-50/50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
            <LayoutGrid className="text-indigo-600" size={24}/>
            全网舆情监控大屏
          </h2>
          <p className="text-slate-500 text-sm">
            数据来源: 全网采集 (微博/抖音/小红书/头条) | 更新时间: {lastUpdated || '实时'}
          </p>
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl disabled:opacity-50 transition-all shadow-md shadow-indigo-200 text-sm font-medium"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          AI 智能研判
        </button>
      </div>

      {/* 2x2 Chart Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[600px]">
        
        {/* Top Left: Total Article Trend (Line Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
               <TrendingUp size={16} />
            </div>
            全网声量趋势 (近7天)
          </h3>
          <div className="flex-1 min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                 <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} dy={10} />
                 <YAxis tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                 <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                 />
                 <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#4f46e5" 
                    strokeWidth={3} 
                    dot={{fill: '#4f46e5', r: 4, strokeWidth: 2, stroke: '#fff'}} 
                    activeDot={{r: 7, strokeWidth: 0, fill: '#6366f1'}}
                    name="发帖量"
                 />
               </LineChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Top Right: Sentiment Tendency (Gauge Chart) - SWAPPED & UPDATED */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col relative">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600">
               <Gauge size={16} />
            </div>
            舆情情感倾向指数 (-100 ~ 100)
          </h3>
          <div className="flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  dataKey="value"
                  data={gaugeData}
                  cx="50%"
                  cy="75%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  stroke="none"
                >
                  {gaugeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {/* Needle Pointer */}
                <Customized component={<GaugeNeedle value={sentimentScore} />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Labels for Gauge */}
            <div className="absolute bottom-6 left-12 text-xs font-bold text-red-500">-100</div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm font-bold text-slate-400">0</div>
            <div className="absolute bottom-6 right-12 text-xs font-bold text-emerald-500">100</div>
            
            {/* Center Score Display - Moved slightly up */}
            <div className="absolute top-[65%] left-1/2 -translate-x-1/2 text-center pointer-events-none">
              <div className={`text-4xl font-black ${sentimentScore > 0 ? 'text-emerald-600' : sentimentScore < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                {sentimentScore > 0 ? '+' : ''}{sentimentScore}
              </div>
              <div className="text-xs text-slate-400 font-medium tracking-wider uppercase mt-1">当前情绪指数</div>
            </div>
          </div>
        </div>

        {/* Bottom Left: Keywords Heatmap (Treemap) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
               <Flame size={16} />
            </div>
            高频敏感词云 (Top 12)
          </h3>
          <div className="flex-1 min-h-0">
             <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={keywordData}
                  dataKey="size"
                  aspectRatio={4 / 3}
                  stroke="#fff"
                  content={<CustomTreemapContent />}
                >
                  <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none'}} />
                </Treemap>
              </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Right: Platform Distribution (Horizontal Bar Chart) - SWAPPED */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-rose-100 rounded-lg text-rose-600">
              <MessageCircle size={16} />
            </div>
            各平台舆情分布
          </h3>
          <div className="flex-1 min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart 
                  layout="vertical" 
                  data={platformData} 
                  margin={{ top: 0, right: 30, left: 10, bottom: 0 }} 
                  barSize={24}
                >
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                 <XAxis type="number" hide />
                 <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80} 
                    tick={{fontSize: 12, fill: '#475569', fontWeight: 500}} 
                    axisLine={false} 
                    tickLine={false} 
                 />
                 <RechartsTooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                 />
                 <Bar dataKey="count" radius={[0, 4, 4, 0]} name="帖子数">
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* AI Executive Advice Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl shadow-xl shadow-indigo-200 text-white p-6 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-indigo-400 opacity-20 rounded-full blur-3xl"></div>

        <div className="flex items-start gap-5 relative z-10">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 shadow-inner">
            <Sparkles size={28} className="text-yellow-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              院长决策参考 
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium tracking-wide">AI GENERATED</span>
            </h3>
            {trendReport ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <p className="text-xs font-bold text-indigo-200 uppercase mb-2 tracking-wider">高危风险点预警</p>
                    <ul className="space-y-2">
                      {trendReport.topRisks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-indigo-50">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                 </div>
                 <div>
                    <p className="text-xs font-bold text-indigo-200 uppercase mb-2 tracking-wider">公关行动建议</p>
                    <p className="text-sm leading-relaxed text-indigo-50 bg-indigo-800/30 p-3 rounded-lg border border-indigo-500/30">
                      {trendReport.actionableAdvice}
                    </p>
                 </div>
               </div>
            ) : (
               <div className="flex items-center gap-3 text-indigo-100 text-sm h-24">
                 <Loader2 className="animate-spin text-indigo-300" size={24} />
                 <div>
                   <p className="font-medium">AI 正在深度研判全网数据...</p>
                   <p className="text-xs text-indigo-300 mt-1">分析维度：情感色彩 / 传播路径 / 潜在风险</p>
                 </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};