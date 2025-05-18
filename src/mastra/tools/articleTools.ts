import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const fetchUserArticles = createTool({
  id: 'fetch-user-articles',
  description: 'Fetch recent articles for a user from Qiita, Zenn or note',
  inputSchema: z.object({
    platform: z.enum(['qiita', 'zenn', 'note']).describe('Target platform'),
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
    const { platform, username } = context;

    switch (platform) {
      case 'qiita':
        return { articles: await fetchQiitaArticles(username) };
      case 'zenn':
        return { articles: await fetchZennArticles(username) };
      case 'note':
        return { articles: await fetchNoteArticles(username) };
      default:
        throw new Error('Unsupported platform');
    }
  },
});

const fetchQiitaArticles = async (user: string) => {
  const url = `https://qiita.com/api/v2/users/${encodeURIComponent(user)}/items?page=1&per_page=5`;
  const res = await fetch(url);
  const data = await res.json();
  return (data as any[]).map((item) => ({ title: item.title as string, url: item.url as string }));
};

const fetchZennArticles = async (user: string) => {
  const url = `https://zenn.dev/api/articles?username=${encodeURIComponent(user)}&order=latest`;
  const res = await fetch(url);
  const data = await res.json();
  const articles = (data.articles || data.items || []) as any[];
  return articles.slice(0, 5).map((item) => ({ title: item.title as string, url: `https://zenn.dev${item.path}` }));
};

const fetchNoteArticles = async (user: string) => {
  const url = `https://note.com/api/v3/notes?username=${encodeURIComponent(user)}`;
  const res = await fetch(url);
  const data = await res.json();
  const notes = (data.data || data.notes || []) as any[];
  return notes.slice(0, 5).map((n) => ({ title: n.name as string, url: `https://note.com/${user}/n/${n.key || n.id}` }));
};
