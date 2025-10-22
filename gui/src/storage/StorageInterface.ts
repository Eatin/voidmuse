
/**
 * Storage module type definitions
 */

// Generic storage interface
export interface IStorage {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete?(key: string): Promise<void>;
  clear?(): Promise<void>;
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor?: string;
  // Other theme configuration properties
}

export interface LanguageConfig {
  language: 'zh-CN' | 'en-US';
}

export interface OllamaConfig {
  installPath: string;
  modelPath: string;
}

// Key name generator interface
export interface IKeyManager {
  getGlobalConfigKey(configName: string): string;
  getProjectConfigKey(projectName: string, configName: string): string;
  getChatSummaryKey(projectName: string, chatId: string): string;
  getChatDetailKey(projectName: string, chatId: string): string;
}