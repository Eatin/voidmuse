import { IDEService } from '../api/IDEService';
import { ExecuteCommandParams, ExecuteScriptParams, GetScriptStatusParams, ScriptStatusResponse } from '../types/ide';
import Handlebars from 'handlebars';
import ollamaInstallWindowScript from '@/config/scripts/ollama-install-window.txt?raw';
import ollamaInstallMacLinuxScript from '@/config/scripts/ollama-install-mac-linux.txt?raw';

/**
 * Ollama status enumeration
 */
export enum OllamaStatus {
  NOT_INSTALLED = 'not_installed',
  INSTALLED_NOT_RUNNING = 'installed_not_running', 
  RUNNING = 'running'
}

/**
 * Ollama version check response
 */
export interface OllamaVersionResponse {
  status: OllamaStatus;
  output: string;
  version?: string;
}

/**
 * Ollama installation parameters
 */
export interface OllamaInstallParams {
  installPath?: string;
  modelPath?: string;
  embeddingModel?: string;
}

/**
 * Ollama installation response
 */
export interface OllamaInstallResponse {
  requestId: string;
}

/**
 * Ollama service class
 * Provides Ollama version checking, installation and status monitoring functionality
 */
export class OllamaService {
  private static instance: OllamaService;
  private ideService: IDEService;
  private currentRequestId: string | null = null;

  private constructor() {
    this.ideService = IDEService.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): OllamaService {
    if (!OllamaService.instance) {
      OllamaService.instance = new OllamaService();
    }
    return OllamaService.instance;
  }

  /**
   * Get Ollama version information
   * @returns Ollama version and status information
   */
  async getOllamaVersion(): Promise<OllamaVersionResponse> {
    try {
      const params: ExecuteCommandParams = {
        command: 'ollama -v'
      };
      
      const output = await this.ideService.executeCommand(params);
      
      // Parse output to determine status
       const status = this.parseOllamaStatus(output);
       const version = this.extractVersion(output);
       
       return {
         status,
         output,
         version
       };
     } catch (error) {
       // Command execution failed, usually indicates not installed
      return {
        status: OllamaStatus.NOT_INSTALLED,
        output: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * One-click install Ollama
   * @param params Installation parameters
   * @returns Installation request ID
   */
  async installOllama(params: OllamaInstallParams = {}): Promise<OllamaInstallResponse> {
    try {
      // Get system information to determine which script to use
      const projectConfig = await this.ideService.getProjectConfig();
      const isWindows = this.isWindowsSystem(projectConfig.systemVersion);
      
      const scriptContent = isWindows 
        ? ollamaInstallWindowScript
        : ollamaInstallMacLinuxScript;
      
      // Use Handlebars for template replacement
       const template = Handlebars.compile(scriptContent);
       const processedScript = isWindows 
         ? template({
             installPath: params.installPath || '',
             modelPath: params.modelPath || '',
             embeddingModel: params.embeddingModel || 'nomic-embed-text'
           })
         : template({
             embeddingModel: params.embeddingModel || 'nomic-embed-text'
           });
       
       // Generate request ID
       const requestId = this.generateRequestId();
       this.currentRequestId = requestId;
       
       // Execute script
      const scriptParams: ExecuteScriptParams = {
        script: processedScript,
        requestId
      };
      
      await this.ideService.executeScript(scriptParams);
      
      return { requestId };
     } catch (error) {
       throw new Error(`Failed to install Ollama: ${error instanceof Error ? error.message : String(error)}`);
     }
   }

  /**
   * Get installation status and console output
   * @param requestId Installation request ID, if not provided, use current stored ID
   * @returns Script execution status and output
   */
  async getInstallStatus(requestId?: string): Promise<ScriptStatusResponse> {
     try {
       const targetRequestId = requestId || this.currentRequestId;
       
       if (!targetRequestId) {
         throw new Error('No valid request ID found');
       }
       
       const params: GetScriptStatusParams = {
         requestId: targetRequestId
       };
       
       return await this.ideService.getScriptStatus(params);
     } catch (error) {
       throw new Error(`Failed to get installation status: ${error instanceof Error ? error.message : String(error)}`);
     }
   }

  /**
   * Stop Ollama installation
   * @param requestId Installation request ID, if not provided, use current stored ID
   * @returns Script execution status and output
   */
  async stopInstallation(requestId?: string): Promise<ScriptStatusResponse> {
    try {
      const targetRequestId = requestId || this.currentRequestId;
      
      if (!targetRequestId) {
        throw new Error('No valid request ID found');
      }
      
      const params = {
        requestId: targetRequestId
      };
      
      const result = await this.ideService.stopScript(params);
      
      // Clear current request ID after stopping
      this.currentRequestId = null;
      
      return result;
    } catch (error) {
      throw new Error(`Failed to stop installation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse Ollama status
   * @param output Command output
   * @returns Ollama status
   */
  private parseOllamaStatus(output: string): OllamaStatus {
    const lowerOutput = output.toLowerCase();
    // Check if not installed
    if (lowerOutput.includes('command not found') || 
        lowerOutput.includes('不是内部或外部命令') ||
        lowerOutput.includes('not recognized')) {
      return OllamaStatus.NOT_INSTALLED;
    }
    
    // Check if installed but not running
    if (lowerOutput.includes('could not connect to a running ollama instance') ||
        lowerOutput.includes('warning')) {
      return OllamaStatus.INSTALLED_NOT_RUNNING;
    }
    
    // Check if running
    if (lowerOutput.includes('ollama version')) {
      return OllamaStatus.RUNNING;
    }
    
    // Default case
    return OllamaStatus.NOT_INSTALLED;
  }

  /**
   * 从输出中提取版本号
   * @param output 命令输出
   * @returns 版本号
   */
  private extractVersion(output: string): string | undefined {
    // 匹配版本号模式，如 "0.11.10"
    const versionMatch = output.match(/\b\d+\.\d+\.\d+\b/);
    return versionMatch ? versionMatch[0] : undefined;
  }

  /**
   * 判断是否为Windows系统
   * @param systemVersion 系统版本信息
   * @returns 是否为Windows
   */
  private isWindowsSystem(systemVersion?: string): boolean {
    if (!systemVersion) {
      // 如果没有系统版本信息，通过用户代理判断
      return navigator.userAgent.toLowerCase().includes('win');
    }
    
    return systemVersion.toLowerCase().includes('win');
  }

  /**
   * Generate unique request ID
   * @returns Request ID
   */
  private generateRequestId(): string {
    return `ollama_install_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 清除当前请求ID
   */
  public clearCurrentRequestId(): void {
    this.currentRequestId = null;
  }

  /**
   * 获取当前请求ID
   */
  public getCurrentRequestId(): string | null {
    return this.currentRequestId;
  }
}

// 导出单例实例
export const ollamaService = OllamaService.getInstance();