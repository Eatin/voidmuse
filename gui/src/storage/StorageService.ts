import {
  IStorage,
  ThemeConfig,
  LanguageConfig,
  OllamaConfig,
} from "./StorageInterface";
import { ChatMessage, ChatHistorySummary, ChatHistory } from "@/types/messages";
import { StorageFactory } from "./StorageFactory";
import { KeyManager } from "./KeyManager";
import { ModelItem } from "@/types/models";
import { McpItem } from "@/types/mcps";
import { TokenUsageDetail } from "@/components/token/types";
import { SearchConfigItem } from "@/types/search"; 
import { ErrorLog } from "@/types/error"; 

/**
 * Generic Storage Service - Provides convenient API for accessing storage data
 */
export class StorageService {
  private static instance: StorageService;
  private storage: IStorage;
  private keyManager: KeyManager;

  /**
   * Get singleton instance of StorageService
   * @returns StorageService instance
   */
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private constructor() {
    this.storage = StorageFactory.getInstance();
    this.keyManager = new KeyManager();
  }

  // ========== Global configuration related methods ==========

  /**
   * Get model configuration list
   * @returns Model configuration list
   */
  async getModelConfigs(): Promise<ModelItem[]> {
    const result = await this.storage.get(this.keyManager.getGlobalConfigKey('models'));
    return result || [];
  }

  /**
   * Set model configuration list
   * @param configs Model configuration list
   */
  async setModelConfigs(configs: ModelItem[]): Promise<void> {
    await this.storage.set(this.keyManager.getGlobalConfigKey('models'), configs);
  }

  /**
  * Get MCP configuration list
  * @returns MCP configuration list
  */
  async getMcpConfigs(): Promise<McpItem[]> {
    const result = await this.storage.get(this.keyManager.getGlobalConfigKey('mcps'));
    return result || [];
  }

  /**
   * Set MCP configuration list
   * @param configs MCP configuration list
   */
  async setMcpConfigs(configs: McpItem[]): Promise<void> {
    await this.storage.set(this.keyManager.getGlobalConfigKey('mcps'), configs);
  }

  /**
   * Get currently selected model ID
   * @returns Selected model ID
   */
  async getSelectedModelKey(): Promise<string | null> {
    const result = await this.storage.get(this.keyManager.getGlobalConfigKey('selectedModel'));
    return result || null;
  }

  /**
   * Set currently selected model ID
   * @param modelKey Model ID
   */
  async setSelectedModelKey(modelKey: string): Promise<void> {
    await this.storage.set(this.keyManager.getGlobalConfigKey('selectedModel'), modelKey);
  }

  /**
   * Get currently selected model
   * @returns Selected model configuration
   */
  async getSelectedModelConfig(): Promise<ModelItem> {
    const selectedkey = await this.getSelectedModelKey();
    const modelConfigs = await this.getModelConfigs();
    const modelConfig = modelConfigs.find(config => config.key === selectedkey + '');

    if (!modelConfig) {
      throw new Error(`Cannot find modelConfig matching selectedkey ${selectedkey}`);
    }

    return modelConfig;
  }

  /**
   * Get currently selected auto-complete model ID
   * @returns Selected auto-complete model ID
   */
  async getSelectedAutoCompleteModelKey(): Promise<string | null> {
    const result = await this.storage.get(this.keyManager.getGlobalConfigKey('selectedAutoCompleteModel'));
    return result || null;
  }

  /**
   * Set currently selected auto-complete model ID
   * @param modelKey Auto-complete model ID
   */
  async setSelectedAutoCompleteModelKey(modelKey: string): Promise<void> {
    await this.storage.set(this.keyManager.getGlobalConfigKey('selectedAutoCompleteModel'), modelKey);
  }

  /**
   * Get theme configuration
   * @returns Theme configuration
   */
  async getThemeConfig(): Promise<ThemeConfig> {
    const result = await this.storage.get(this.keyManager.getGlobalConfigKey('theme'));
    console.log('getThemeConfig', result);
    return result || { mode: 'light' };
  }

  /**
   * Set theme configuration
   * @param config Theme configuration
   */
  async setThemeConfig(config: ThemeConfig): Promise<void> {
    console.log('setThemeConfig', config);
    await this.storage.set(this.keyManager.getGlobalConfigKey('theme'), config);
  }

  /**
   * Get language configuration
   * @returns Language configuration
   */
  async getLanguageConfig(): Promise<LanguageConfig> {
    const result = await this.storage.get(this.keyManager.getGlobalConfigKey('language'));
    console.log('getLanguageConfig', result);
    return result || { language: 'zh-CN' };
  }

  /**
   * Set language configuration
   * @param config Language configuration
   */
  async setLanguageConfig(config: LanguageConfig): Promise<void> {
    console.log('setLanguageConfig', config);
    await this.storage.set(this.keyManager.getGlobalConfigKey('language'), config);
  }

  /**
   * Get Ollama configuration
   * @returns Ollama configuration
   */
  async getOllamaConfig(): Promise<OllamaConfig | null> {
    const result = await this.storage.get(this.keyManager.getGlobalConfigKey('ollama'));
    return result || null;
  }

  /**
   * Set Ollama configuration
   * @param config Ollama configuration
   */
  async setOllamaConfig(config: OllamaConfig): Promise<void> {
    await this.storage.set(this.keyManager.getGlobalConfigKey('ollama'), config);
  }

  // ========== Project-level configuration related methods ==========

  /**
   * Get chat summary
   * @param projectName Project name
   * @param chatId Chat ID
   * @returns Chat summary information
   */
  async getChatSummary(projectName: string, chatId: string): Promise<ChatHistorySummary | null> {
    return await this.storage.get(this.keyManager.getChatSummaryKey(projectName, chatId));
  }

  /**
   * Set chat summary
   * @param projectName Project name
   * @param chatId Chat ID
   * @param summary Chat summary information
   */
  async setChatSummary(projectName: string, chatId: string, summary: ChatHistorySummary): Promise<void> {
    await this.storage.set(this.keyManager.getChatSummaryKey(projectName, chatId), summary);
  }

  /**
   * Get all chat summary list for a project
   * Actual implementation requires traversing storage or maintaining index
   * @param projectName Project name
   * @returns Chat summary list
   */
  async getAllChatSummaries(projectName: string): Promise<ChatHistorySummary[]> {
    // An index mechanism is needed here to get all chat summaries
    // Simplified implementation, real scenarios need to maintain index
    const chatIndex = await this.storage.get(this.keyManager.getProjectConfigKey(projectName, 'chatIndex')) || [];
    const summaries: ChatHistorySummary[] = [];

    for (const chatId of chatIndex) {
      const summary = await this.getChatSummary(projectName, chatId);
      if (summary) {
        summaries.push(summary);
      }
    }

    // Sort by creation time (newest to oldest)
    summaries.sort((a, b) => b.createdAt - a.createdAt);

    return summaries;
  }

  /**
   * Get chat details
   * @param projectName Project name
   * @param chatId Chat ID
   * @returns Chat details
   */
  async getChatDetail(projectName: string, chatId: string): Promise<ChatHistory | null> {
    return await this.storage.get(this.keyManager.getChatDetailKey(projectName, chatId));
  }

  /**
   * Set chat details
   * @param projectName Project name
   * @param chatId Chat ID
   * @param detail Chat details
   */
  async setChatDetail(projectName: string, chatId: string, detail: ChatHistory): Promise<void> {
    await this.storage.set(this.keyManager.getChatDetailKey(projectName, chatId), detail);
  }

  /**
   * 获取完整的聊天内容，包括消息历史
   * @param projectName 项目名称
   * @param chatId 聊天ID
   * @returns 聊天内容（包含消息和元数据）
   */
  async getChat(projectName: string, chatId: string): Promise<{ messages: any[], id: string } | null> {
    // 获取聊天详情
    const chatDetail = await this.getChatDetail(projectName, chatId);

    if (!chatDetail) {
      return null;
    }

    // 转换消息格式为 MessageInfo 数组
    const messages = chatDetail.messages.map(msg => {
      return {
        id: msg.id,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        message: {
          role: msg.role,
          content: msg.content,
          messages: msg.messages,
          timing: msg.timing,
          tokenUsage: msg.tokenUsage
        }
      };
    });

    return {
      id: chatId,
      messages: messages
    };
  }

  /**
   * Delete chat session
   * @param projectName Project name
   * @param chatId Chat ID
   */
  async deleteChat(projectName: string, chatId: string): Promise<void> {
    // Delete chat summary and details
    if (this.storage.delete) {
      await this.storage.delete(this.keyManager.getChatSummaryKey(projectName, chatId));
      await this.storage.delete(this.keyManager.getChatDetailKey(projectName, chatId));
    } else {
      await this.storage.set(this.keyManager.getChatSummaryKey(projectName, chatId), null);
      await this.storage.set(this.keyManager.getChatDetailKey(projectName, chatId), null);
    }

    // Update index
    let chatIndex = await this.storage.get(this.keyManager.getProjectConfigKey(projectName, 'chatIndex')) || [];
    chatIndex = chatIndex.filter((id: string) => id !== chatId);
    await this.storage.set(this.keyManager.getProjectConfigKey(projectName, 'chatIndex'), chatIndex);
  }

  /**
   * Save chat record
   * @param projectName Project name
   * @param messages Message list
   * @param chatId Chat ID (optional, creates new if not provided)
   * @param mode Chat mode (optional, defaults to 'ask')
   * @returns Created/updated chat ID
   */
  async setChat(projectName: string, messages: any[], chatId?: string, mode?: 'ask' | 'agent'): Promise<string> {
    const now = Date.now();

    // Return directly if no messages
    if (!messages || messages.length === 0) {
      throw new Error('Messages cannot be empty');
    }

    // Extract first user message as title
    const firstUserMsg = messages.find(m => m.message && m.message.role === 'user');
    const firstQuestion = firstUserMsg ? (firstUserMsg.message.messages[0]?.plainText || '') : 'New conversation';

    // Create or get chat ID
    const actualChatId = chatId || `chat_${now}`;

    // Convert message format to ChatMessage[]
    const chatMessages: ChatMessage[] = messages.map(m => {
      return {
        id: m.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        role: m.message.role,
        content: m.message.content || '',
        messages: m.message.messages || [],
        status: m.message.status || 'success',
        createdAt: m.createdAt || now,
        updatedAt: now,
        timing: m.message.timing,
        tokenUsage: m.message.tokenUsage
      };
    });

    // Create/update chat summary
    const chatSummary: ChatHistorySummary = {
      id: actualChatId,
      title: firstQuestion.substring(0, 30) + (firstQuestion.length > 30 ? '...' : ''),
      firstQuestion,
      mode: mode || 'ask',
      createdAt: chatId ? (await this.getChatSummary(projectName, actualChatId))?.createdAt || now : now,
      updatedAt: now
    };

    // Create/update chat details
    const chatDetail: ChatHistory = {
      id: actualChatId,
      messages: chatMessages,
      title: chatSummary.title,
      firstQuestion: firstQuestion,
      mode: mode || 'ask',
      createdAt: chatId ? (await this.getChatDetail(projectName, actualChatId))?.createdAt || now : now,
      updatedAt: now
    };

    // Save chat information
    await this.setChatSummary(projectName, actualChatId, chatSummary);
    await this.setChatDetail(projectName, actualChatId, chatDetail);

    // If new conversation, update index
    if (!chatId) {
      const chatIndex = await this.storage.get(this.keyManager.getProjectConfigKey(projectName, 'chatIndex')) || [];
      chatIndex.push(actualChatId);
      await this.storage.set(this.keyManager.getProjectConfigKey(projectName, 'chatIndex'), chatIndex);
    }

    // Clean up old chat records
    await this.cleanupOldChatRecords(projectName);

    return actualChatId;
  }

  /**
   * Clean up old chat records
   * When total chat records exceed 10, delete data older than 15 days
   * @param projectName Project name
   */
  private async cleanupOldChatRecords(projectName: string): Promise<void> {
    try {
      const chatIndex = await this.storage.get(this.keyManager.getProjectConfigKey(projectName, 'chatIndex')) || [];

      // Don't clean up if chat records don't exceed 10
      if (chatIndex.length <= 10) {
        return;
      }

      const now = Date.now();
      const fifteenDaysAgo = now - (15 * 24 * 60 * 60 * 1000); // Timestamp from 15 days ago
      const chatIdsToDelete: string[] = [];

      // Check creation time of each chat record
      for (const chatId of chatIndex) {
        const chatSummary = await this.getChatSummary(projectName, chatId);
        if (chatSummary && chatSummary.createdAt < fifteenDaysAgo) {
          chatIdsToDelete.push(chatId);
        }
      }

      // Delete old chat records
      for (const chatId of chatIdsToDelete) {
        await this.deleteChat(projectName, chatId);
      }

      if (chatIdsToDelete.length > 0) {
        console.log(`Cleaned up ${chatIdsToDelete.length} chat records older than 15 days`);
      }
    } catch (error) {
      console.error('Error occurred while cleaning up old chat records:', error);
    }
  }

  /**
   * Get embedding model configuration list
   * @returns Embedding model configuration list
   */
  async getEmbeddingModelConfigs(): Promise<ModelItem[]> {
    const result = await this.storage.get(this.keyManager.getGlobalConfigKey('embeddingModels'));
    return result || [];
  }

  /**
   * Set embedding model configuration list
   * @param configs Embedding model configuration list
   */
  async setEmbeddingModelConfigs(configs: ModelItem[]): Promise<void> {
    await this.storage.set(this.keyManager.getGlobalConfigKey('embeddingModels'), configs);
  }

  /**
   * Get currently selected embedding model ID
   * @returns Selected embedding model ID
   */
  async getSelectedEmbeddingModelKey(): Promise<string | null> {
    const result = await this.storage.get(this.keyManager.getGlobalConfigKey('selectedEmbeddingModel'));
    return result || null;
  }

  /**
   * Set currently selected embedding model ID
   * @param modelKey Embedding model ID
   */
  async setSelectedEmbeddingModelKey(modelKey: string): Promise<void> {
    await this.storage.set(this.keyManager.getGlobalConfigKey('selectedEmbeddingModel'), modelKey);
  }

  /**
  * Get selected embedding model configuration
  * @returns Selected embedding model configuration
  */
  async getSelectedEmbeddingModelConfig(): Promise<ModelItem> {
    const selectedkey = await this.getSelectedEmbeddingModelKey();
    const modelConfigs = await this.getEmbeddingModelConfigs();
    const modelConfig = modelConfigs.find(config => config.key === selectedkey + '');

    if (!modelConfig) {
      throw new Error(`Cannot find modelConfig matching selectedkey ${selectedkey}`);
    }

    return modelConfig;
  }

  /**
   * Get embedding model auto-switch status
   * @returns Auto-switch status
   */
  async getIsAutoEmbedding(): Promise<boolean> {
    const result = await this.storage.get(this.keyManager.getGlobalConfigKey('isAutoEmbedding'));
    console.log(`getIsAutoEmbedding : ${result}`);
    return result || false;
  }

  /**
   * Set embedding model auto-switch status
   * @param isAuto Auto-switch status
   */
  async setIsAutoEmbedding(isAuto: boolean): Promise<void> {
    await this.storage.set(this.keyManager.getGlobalConfigKey('isAutoEmbedding'), isAuto);
  }

  /**
   * Get search configuration list
   * @returns Search configuration list
   */
  async getSearchConfigs(): Promise<SearchConfigItem[]> {
    const result = await this.storage.get(this.keyManager.getGlobalConfigKey('searchConfigs'));
    return result || [];
  }

  /**
   * Set search configuration list
   * @param configs Search configuration list
   */
  async setSearchConfigs(configs: SearchConfigItem[]): Promise<void> {
    await this.storage.set(this.keyManager.getGlobalConfigKey('searchConfigs'), configs);
  }

  /**
   * Get currently selected search configuration key
   * @returns Selected search configuration key
   */
  async getSelectedSearchConfigKey(): Promise<string | null> {
    const result = await this.storage.get(this.keyManager.getGlobalConfigKey('selectedSearchConfig'));
    return result || null;
  }

  /**
   * Set currently selected search configuration key
   * @param configKey Search configuration key
   */
  async setSelectedSearchConfigKey(configKey: string): Promise<void> {
    await this.storage.set(this.keyManager.getGlobalConfigKey('selectedSearchConfig'), configKey);
  }

  // ========== Token usage record related methods ==========

  /**
   * Add token usage record
   * @param tokenUsage Token usage details
   */
  async addTokenUsageRecord(tokenUsage: TokenUsageDetail): Promise<void> {
    const existingRecords = await this.getTokenUsageRecords();
    existingRecords.push(tokenUsage);
    await this.storage.set(this.keyManager.getGlobalConfigKey('tokenUsageRecords'), existingRecords);
  }

  /**
   * Get all token usage records
   * @returns Token usage record list
   */
  async getTokenUsageRecords(): Promise<TokenUsageDetail[]> {
    const result = await this.storage.get(this.keyManager.getGlobalConfigKey('tokenUsageRecords'));
    return result || [];
  }

  // ========== Error log related methods ==========

  /**
   * Get error log list
   * @returns Error log list
   */
  async getErrorLogs(): Promise<ErrorLog[]> {
    const result = await this.storage.get(this.keyManager.getGlobalConfigKey('errorLogs'));
    return result || [];
  }

  /**
   * Set error log list
   * @param errorLogs Error log list
   */
  async setErrorLogs(errorLogs: ErrorLog[]): Promise<void> {
    // Ensure only the latest 50 records are saved
    const limitedErrorLogs = errorLogs.slice(0, 50);
    await this.storage.set(this.keyManager.getGlobalConfigKey('errorLogs'), limitedErrorLogs);
  }

  /**
   * Get timestamp of last read error
   * @returns Timestamp of last read error
   */
  async getLastReadErrorTimestamp(): Promise<number> {
    const result = await this.storage.get(this.keyManager.getGlobalConfigKey('lastReadErrorTimestamp'));
    return result || 0;
  }

  /**
   * Set timestamp of last read error
   * @param timestamp Timestamp
   */
  async setLastReadErrorTimestamp(timestamp: number): Promise<void> {
    await this.storage.set(this.keyManager.getGlobalConfigKey('lastReadErrorTimestamp'), timestamp);
  }
}