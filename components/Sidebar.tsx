import React, { useState } from 'react';
import { FeedSource } from '../types';
import { Plus, Trash2, Rss, LayoutDashboard, Activity } from 'lucide-react';

interface SidebarProps {
  feeds: FeedSource[];
  onAddFeed: (url: string, name: string) => void;
  onRemoveFeed: (id: string) => void;
  activeView: 'feeds' | 'dashboard';
  onChangeView: (view: 'feeds' | 'dashboard') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ feeds, onAddFeed, onRemoveFeed, activeView, onChangeView }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrl && newName) {
      onAddFeed(newUrl, newName);
      setNewUrl('');
      setNewName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full text-slate-600 shadow-sm z-50">
      <div className="p-5 border-b border-slate-200 bg-slate-50">
        <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Activity className="text-teal-600" />
          医院舆情监控
        </h1>
        <div className="flex items-center gap-2 mt-2">
           <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
           <p className="text-xs text-slate-500 font-medium">系统运行正常</p>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        <button
          onClick={() => onChangeView('dashboard')}
          className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center gap-3 text-sm font-medium ${
            activeView === 'dashboard' ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'hover:bg-slate-50 text-slate-600 border border-transparent'
          }`}
        >
          <LayoutDashboard size={18} />
          舆情仪表盘
        </button>
        <button
          onClick={() => onChangeView('feeds')}
          className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center gap-3 text-sm font-medium ${
            activeView === 'feeds' ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'hover:bg-slate-50 text-slate-600 border border-transparent'
          }`}
        >
          <Rss size={18} />
          实时监测列表
        </button>
      </nav>

      <div className="p-4 border-t border-slate-200 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">监测源管理</h2>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="p-1 hover:bg-teal-50 text-teal-600 rounded transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleSubmit} className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 shadow-inner">
            <input
              type="text"
              placeholder="来源名称 (如: 微博)"
              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              type="url"
              placeholder="RSS 地址"
              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />
            <button type="submit" className="w-full bg-teal-600 text-white text-xs py-1.5 rounded hover:bg-teal-700 font-medium shadow-sm">
              添加监测源
            </button>
          </form>
        )}

        <ul className="space-y-1">
          {feeds.map(feed => (
            <li key={feed.id} className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 text-sm transition-colors cursor-default border border-transparent hover:border-slate-100">
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-slate-700 font-medium">{feed.name}</span>
                <span className="text-[10px] text-slate-400 truncate">{feed.category}</span>
              </div>
              <button 
                onClick={() => onRemoveFeed(feed.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="p-4 border-t border-slate-200 text-[10px] text-slate-400 bg-slate-50">
        智能舆情分析系统 v2.0
        <br/>
        Powered by Gemini AI
      </div>
    </div>
  );
};