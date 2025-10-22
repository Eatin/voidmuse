import { tool } from 'ai';
import { z } from 'zod';
import { searchService } from '@/services/search/SearchService';

/**
 * Web search tool for AI SDK
 */
export const webSearchTool = tool({
  description: 'Search the web for information based on keywords to obtain the latest relevant materials and data',
  inputSchema: z.object({
    keyword: z.string().describe('Search keyword should be specific and relevant. Please automatically determine based on the nature of the search content: use English keywords for international content like technical documentation, international news, academic materials; use Chinese keywords for Chinese information, localized content, Chinese community discussions. Choose the language that will yield the most accurate search results.'),
    searchIntent: z.string().describe('Search intent explanation, describe why you need to search for this keyword')
  }),
  execute: async ({ keyword, searchIntent }) => {
    try {
      const result = await searchService.onlineSearch(keyword);
      
      if (result.success) {
        return {
          success: true,
          keyword,
          searchIntent,
          results: result.results.map(item => ({
            title: item.title || '',
            url: item.url,
            snippet: item.description,
            favicon: item.favicon || '',
          }))
        };
      } else {
        return {
          success: false,
          error: result.msg || 'Search failed',
          keyword,
          searchIntent
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        keyword,
        searchIntent
      };
    }
  }
});

export type WebSearchResult = {
  success: boolean;
  keyword: string;
  searchIntent: string;
  results?: Array<{
    title: string;
    url: string;
    snippet: string;
    favicon: string;
  }>;
  error?: string;
};