import { Article, FeedSource } from '../types';
import { CORS_PROXY } from '../constants';

export const fetchFeed = async (source: FeedSource): Promise<Article[]> => {
  try {
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(source.url)}`);
    const data = await response.json();
    
    if (!data.contents) {
      throw new Error('No content received from proxy');
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data.contents, "text/xml");
    
    const items = xmlDoc.querySelectorAll("item");
    const articles: Article[] = [];

    items.forEach((item, index) => {
      // Limit to 10 latest items per feed to avoid overwhelming the UI/AI
      if (index >= 10) return;

      const title = item.querySelector("title")?.textContent || "No Title";
      const link = item.querySelector("link")?.textContent || "#";
      const pubDate = item.querySelector("pubDate")?.textContent || new Date().toISOString();
      const description = item.querySelector("description")?.textContent || "";
      const contentEncoded = item.getElementsByTagNameNS("*", "encoded")[0]?.textContent;
      
      // Use full content if available, otherwise description
      const content = (contentEncoded || description).replace(/<[^>]*>?/gm, '').substring(0, 500) + "...";

      articles.push({
        id: `${source.id}-${index}-${Date.now()}`,
        title,
        link,
        pubDate,
        content,
        sourceId: source.id,
        sourceName: source.name,
      });
    });

    return articles;
  } catch (error) {
    console.error(`Error fetching feed ${source.name}:`, error);
    return [];
  }
};
