import { FeedSource } from './types';

export const CORS_PROXY = 'https://api.allorigins.win/get?url=';

export const DEFAULT_FEEDS: FeedSource[] = [
  {
    id: '1',
    name: '医疗健康快讯',
    url: 'https://www.wired.com/feed/category/science/health/latest/rss', 
    category: '行业新闻'
  },
  {
    id: '2',
    name: '公共卫生动态',
    url: 'https://tools.cdc.gov/api/v2/resources/media/132608.rss',
    category: '政策法规'
  },
  {
    id: '3',
    name: '科技医疗',
    url: 'https://www.theverge.com/rss/science/index.xml',
    category: '医疗科技'
  },
  {
    id: '4',
    name: '社会民生 (模拟)',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml',
    category: '患者论坛'
  }
];

export const COLORS = {
  primary: '#0ea5e9', // Sky blue for medical
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  background: '#f8fafc',
  card: '#ffffff',
};