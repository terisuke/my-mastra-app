import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { fetchUserArticles } from '../tools';

export const articleAssistant = new Agent({
  name: 'Article Assistant',
  instructions: `
      You help users create new articles based on their past posts on Qiita, Zenn and note.
      Ask the user for the platform (qiita, zenn or note) and the user name or id.
      Use the fetchUserArticles tool to retrieve up to 5 recent articles.
      Discuss ideas for a new article referencing their past content.
      When requested, output a markdown draft of the article.
    `,
  model: google('gemini-2.5-flash-preview-04-17'),
  tools: { fetchUserArticles },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db',
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
