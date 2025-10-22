import { SearchProcessor, OnlineSearchResult } from './SearchProcessor';
import { BoChaSearchProcessor } from './BoChaSearchProcessor';
import { GoogleSearchProcessor } from './GoogleSearchProcessor';
import { storageService } from '../../storage/index';
import { SearchConfigItem } from '../../types/search';

/**
 * Search Service - Provides convenient API access to search functionality
 */
export class SearchService {
  private static instance: SearchService;
  private currentProcessor: SearchProcessor | null = null;

  private constructor() {
  }

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  private async getCurrentProcessor(): Promise<SearchProcessor> {
    const selectedKey = await storageService.getSelectedSearchConfigKey();
    if (!selectedKey) {
      throw new Error('No search configuration selected');
    }

    const searchConfigs = await storageService.getSearchConfigs();
    const currentConfig = searchConfigs.find(config => String(config.key) === String(selectedKey));
    
    if (!currentConfig) {
      throw new Error(`Cannot find search configuration matching selectedKey ${selectedKey}`);
    }

    if (!currentConfig.enabled) {
      throw new Error('Currently selected search configuration is disabled');
    }

    return this.createProcessor(currentConfig);
  }

  private createProcessor(config: SearchConfigItem): SearchProcessor {
    switch (config.provider) {
      case 'bocha':
        const bochaConfig = config.config ? JSON.parse(config.config) : {};
        const { apiKey } = bochaConfig;
        if (!apiKey) {
          throw new Error('BoCha search configuration missing required parameter: apiKey');
        }
        return new BoChaSearchProcessor(apiKey);
      case 'google':
        const googleConfig = config.config ? JSON.parse(config.config) : {};
        const { apiKey: googleApiKey, cx } = googleConfig;
        if (!googleApiKey || !cx) {
          throw new Error('Google search configuration missing required parameters: apiKey and cx');
        }
        return new GoogleSearchProcessor(googleApiKey, cx);
      default:
        throw new Error(`Unsupported search provider: ${config.provider}`);
    }
  }

  async onlineSearch(content: string): Promise<OnlineSearchResult> {
    try {
      const processor = await this.getCurrentProcessor();
      return await processor.onlineSearch(content);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        query: content,
        success: false,
        msg: `Search service configuration error: ${errorMessage}`,
        results: []
      };
    }
  }

  isSearchSuccessful(result: OnlineSearchResult): boolean {
    return result.success && result.results.length > 0;
  }

  async getCurrentSearchConfig(): Promise<SearchConfigItem | null> {
    try {
      const selectedKey = await storageService.getSelectedSearchConfigKey();
      if (!selectedKey) {
        return null;
      }

      const searchConfigs = await storageService.getSearchConfigs();
      return searchConfigs.find(config => config.key === selectedKey) || null;
    } catch (error) {
      console.error('Failed to get current search configuration:', error);
      return null;
    }
  }

  async switchSearchConfig(configKey: string): Promise<void> {
    await storageService.setSelectedSearchConfigKey(configKey);
    this.currentProcessor = null;
  }

  validateSearchConfig(config: SearchConfigItem): boolean {
    if (!config.enabled) {
      return false;
    }

    switch (config.provider) {
      case 'bocha':
        try {
          const bochaConfig = config.config ? JSON.parse(config.config) : {};
          return !!bochaConfig.apiKey;
        } catch {
          return false;
        }
      case 'google':
        try {
          const googleConfig = config.config ? JSON.parse(config.config) : {};
          return !!(googleConfig.apiKey && googleConfig.searchEngineId);
        } catch {
          return false;
        }
      default:
        return false;
    }
  }
}

export const searchService = SearchService.getInstance();