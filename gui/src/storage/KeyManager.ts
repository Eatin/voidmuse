import { IKeyManager } from "./StorageInterface";

/**
 * Key Manager Class - Responsible for generating consistent storage key names
 */
export class KeyManager implements IKeyManager {
  /**
   * Get global configuration key name
   * @param configName Configuration name
   * @returns Formatted key name
   */
  getGlobalConfigKey(configName: string): string {
    return `global:${configName}`;
  }
  
  /**
   * Get project configuration key name
   * @param projectName Project name
   * @param configName Configuration name
   * @returns Formatted key name
   */
  getProjectConfigKey(projectName: string, configName: string): string {
    return `project:${projectName}:${configName}`;
  }
  
  /**
   * Get chat summary key name
   * @param projectName Project name
   * @param chatId Chat ID
   * @returns Formatted key name
   */
  getChatSummaryKey(projectName: string, chatId: string): string {
    return `project:${projectName}:chat:summary:${chatId}`;
  }
  
  /**
   * Get chat detail key name
   * @param projectName Project name
   * @param chatId Chat ID
   * @returns Formatted key name
   */
  getChatDetailKey(projectName: string, chatId: string): string {
    return `project:${projectName}:chat:detail:${chatId}`;
  }
}