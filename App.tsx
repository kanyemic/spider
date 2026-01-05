import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ArticleCard } from './components/ArticleCard';
import { Dashboard } from './components/Dashboard';
import { Article, FeedSource } from './types';
import { DEFAULT_FEEDS } from './constants';
import { fetchFeed } from './services/rssService';
import { analyzeArticleWithAI } from './services/geminiService';
import { Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [feeds, setFeeds] = useState<FeedSource[]>(DEFAULT_FEEDS);
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeView, setActiveView] = useState<'feeds' | 'dashboard'>('dashboard');
  const [loadingFeeds, setLoadingFeeds] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load Feeds
  useEffect(() => {
    const loadAllFeeds = async () => {
      setLoadingFeeds(true);
      let allArticles: Article[] = [];
      
      const promises = feeds.map(feed => fetchFeed(feed));
      const results = await Promise.all(promises);
      
      results.forEach(feedArticles => {
        allArticles = [...allArticles, ...feedArticles];
      });

      // Sort by date descending
      allArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

      setArticles(allArticles);
      setLoadingFeeds(false);
    };

    loadAllFeeds();
  }, [feeds]);

  const handleAddFeed = (url: string, name: string) => {
    const newFeed: FeedSource = {
      id: Date.now().toString(),
      name,
      url,
      category: '自定义'
    };
    setFeeds([...feeds, newFeed]);
  };

  const handleRemoveFeed = (id: string) => {
    setFeeds(feeds.filter(f => f.id !== id));
    // Remove articles from this feed
    setArticles(articles.filter(a => a.sourceId !== id));
  };

  const handleAnalyzeArticle = async (article: Article) => {
    // Optimistic update to show loading state
    setArticles(prev => prev.map(a => 
      a.id === article.id ? { ...a, isAnalyzing: true } : a
    ));

    const analysis = await analyzeArticleWithAI(article.title, article.content);

    setArticles(prev => prev.map(a => 
      a.id === article.id ? { ...a, analysis, isAnalyzing: false } : a
    ));
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Mobile Menu Button */}
      <div className="lg:hidden absolute top-4 right-4 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white rounded-lg text-slate-700 shadow-md border border-slate-200"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block shadow-xl lg:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar 
          feeds={feeds}
          onAddFeed={handleAddFeed}
          onRemoveFeed={handleRemoveFeed}
          activeView={activeView}
          onChangeView={(view) => {
            setActiveView(view);
            setIsMobileMenuOpen(false);
          }}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50">
        {/* View Switcher Content */}
        {activeView === 'dashboard' ? (
           <div className="flex-1 overflow-y-auto">
             <Dashboard articles={articles} />
           </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">最新订阅</h2>
                <span className="text-sm text-slate-500 font-medium">
                  {loadingFeeds ? '刷新中...' : `${articles.length} 篇文章`}
                </span>
              </div>
              
              <div className="space-y-4">
                {loadingFeeds && articles.length === 0 ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="h-40 bg-white rounded-xl animate-pulse border border-slate-200 shadow-sm"></div>
                  ))
                ) : (
                  articles.map(article => (
                    <ArticleCard 
                      key={article.id} 
                      article={article} 
                      onAnalyze={handleAnalyzeArticle}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Overlay for mobile sidebar */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default App;