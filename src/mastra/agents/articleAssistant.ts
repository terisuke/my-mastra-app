import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { fetchUserArticles } from '../tools';
import { SUPPORTED_PLATFORMS } from '../constants';
import path from 'path';

export const articleAssistant = new Agent({
  name: 'Article Assistant',
  instructions: `
      You help users create new articles based on their past posts on Qiita, Zenn and note.
      Ask the user for the platform (${SUPPORTED_PLATFORMS.join(', ')}) and the user name or id.
      Validate the platform and user name before calling the tool. If article retrieval fails, reply "記事の取得中にエラーが発生しました".
      Use the fetchUserArticles tool to retrieve up to 5 recent articles.
      Discuss ideas for a new article referencing their past content.
      When requested, output a markdown draft of the article.
    `,
  model: google('gemini-2.5-flash-preview-04-17'),
  tools: { fetchUserArticles },
  memory: new Memory({
    storage: new LibSQLStore({
      url: new URL('../mastra.db', import.meta.url).toString(),
    }),
    options: {
      lastMessages: 10,
      semanticRecall: false,
      threads: {
        generateTitle: false,
      },
    },
  }),
});
