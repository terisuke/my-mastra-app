import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { SUPPORTED_PLATFORMS, type SupportedPlatform } from '../constants';

class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolError';
  }
}

export interface Article {
  title: string;
  url: string;
}

export const fetchUserArticles = createTool({
  id: 'fetch-user-articles',
  description: 'Fetch recent articles for a user from Qiita, Zenn or note',
  inputSchema: z.object({
    platform: z.enum([...SUPPORTED_PLATFORMS] as [SupportedPlatform, ...SupportedPlatform[]]).describe('Target platform'),
    username: z.string().describe('Username or ID on the platform'),
  }),
  outputSchema: z.object({
    articles: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
      }),
    ),
  }),
  execute: async ({ context }) => {
    try {
      const { platform, username } = context;

      if (!SUPPORTED_PLATFORMS.includes(platform as SupportedPlatform)) {
        throw new ToolError('Unsupported platform');
      }

      if (!username || !username.trim()) {
        throw new ToolError('Username is required');
      }

      let articles: Article[] = [];
      switch (platform) {
        case 'qiita':
          articles = await fetchQiitaArticles(username);
          break;
        case 'zenn':
          articles = await fetchZennArticles(username);
          break;
        case 'note':
          articles = await fetchNoteArticles(username);
          break;
      }

      if (!Array.isArray(articles)) {
        throw new ToolError('Invalid articles data');
      }

      return { articles };
    } catch (err) {
      throw new ToolError(`fetchUserArticles failed: ${(err as Error).message}`);
    }
  },
});

interface QiitaItem { title: string; url: string }

const fetchQiitaArticles = async (user: string): Promise<Article[]> => {
  try {
    const url = `https://qiita.com/api/v2/users/${encodeURIComponent(user)}/items?page=1&per_page=5`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Qiita API returned ${res.status}`);
    }
    const data = (await res.json()) as QiitaItem[];
    return data.map((item) => ({ title: item.title, url: item.url }));
  } catch (err) {
    throw new Error(`Failed to fetch from Qiita: ${(err as Error).message}`);
  }
};

interface ZennArticle { title: string; path: string }
interface ZennResponse { articles?: ZennArticle[]; items?: ZennArticle[] }

const fetchZennArticles = async (user: string): Promise<Article[]> => {
  try {
    const url = `https://zenn.dev/api/articles?username=${encodeURIComponent(user)}&order=latest`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Zenn API returned ${res.status}`);
    }
    const data = (await res.json()) as ZennResponse;
    const articles = data.articles || data.items || [];
    return articles.slice(0, 5).map((item) => ({ title: item.title, url: `https://zenn.dev${item.path}` }));
  } catch (err) {
    throw new Error(`Failed to fetch from Zenn: ${(err as Error).message}`);
  }
};

interface NoteItem { name: string; key?: string; id?: string }
interface NoteResponse { data?: NoteItem[]; notes?: NoteItem[] }

const fetchNoteArticles = async (user: string): Promise<Article[]> => {
  try {
    const url = `https://note.com/api/v3/notes?username=${encodeURIComponent(user)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`note API returned ${res.status}`);
    }
    const data = (await res.json()) as NoteResponse;
    const notes = data.data || data.notes || [];
    return notes
      .slice(0, 5)
      .flatMap((n) => {
        const slug = n.key || n.id;
        if (!slug) return [];
        return [{ title: n.name, url: `https://note.com/${user}/n/${slug}` }];
      });
  } catch (err) {
    throw new Error(`Failed to fetch from note: ${(err as Error).message}`);
  }
};
