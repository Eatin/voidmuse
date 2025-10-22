import { IDEFactory } from './IDEFactory';
import { IDEInterface } from './IDEInterface';
import { storageService } from '../storage/index'
import { aiModelService } from '../services/llm/AIModelService';
import {
  FindFileParams,
  FileContentParams,
  JumpToFileParams,
  OpenUrlParams,
  CodebaseContextParams,
  CodeToApplyParams,
  CodeToCreateFileParams,
  CodeToInsertParams,
  WriteFileParams,
  ExecuteCommandParams,
  ExecuteScriptParams,
  GetScriptStatusParams,
  StopScriptParams,
  FileListResponse,
  CodebaseContextResponse,
  CodebaseExistsResponse,
  ProjectInfoResponse,
  ExecuteCommandResponse,
  ExecuteScriptResponse,
  ScriptStatusResponse,
  CallMcpParams,
  McpConnectionTestResult
} from '../types/ide';

/**
 * IDE Service - Provides convenient API access to IDE functionality
 */
export class IDEService {
  private static instance: IDEService;
  private ideImpl: IDEInterface;

  /**
   * Constructor
   */
  private constructor() {
    this.ideImpl = IDEFactory.getIDEImplementation();
  }

  /**
   * Get singleton instance
   * @returns IDEService instance
   */
  public static getInstance(): IDEService {
    if (!IDEService.instance) {
      IDEService.instance = new IDEService();
    }
    return IDEService.instance;
  }

  /**
   * Get file list
   * @param params Find file parameters
   * @returns File information array
   */
  async getFileList(params: FindFileParams): Promise<FileListResponse> {
    return this.ideImpl.getFileList(params);
  }

  /**
   * Get file content
   * @param params File path parameters
   * @returns File content string
   */
  async getFileContent(params: FileContentParams): Promise<string> {
    return this.ideImpl.getFileContent(params);
  }

  /**
   * Jump to specified file
   * @param params Jump parameters
   */
  async jumpToFile(params: JumpToFileParams): Promise<void> {
    return this.ideImpl.jumpToFile(params);
  }

  /**
   * Open URL
   * @param params URL parameters
   */
  async openUrl(params: OpenUrlParams): Promise<void> {
    return this.ideImpl.openUrl(params);
  }

  /**
   * Build response using codebase context
   * @param params Prompt parameters
   * @returns Related file information
   */
  async buildWithCodebaseContext(params: CodebaseContextParams): Promise<CodebaseContextResponse> {
    // First optimize prompt
    const modelConfig = await storageService.getSelectedModelConfig();
    const userInput = params.prompt;
   
    const optimizePrompt = await aiModelService.optimizeCodebasePrompt(userInput, modelConfig);
    params.optimizePrompt = optimizePrompt;
    
    // Get initial results from IDE implementation
    const results = await this.ideImpl.buildWithCodebaseContext(params);
    
    // Check each file in results and fetch content if missing
    const processedResults = await Promise.all(
      results.map(async (fileInfo) => {
        // If path exists but content is missing or empty, fetch content
        if (fileInfo.path && (!fileInfo.content || fileInfo.content.trim() === '')) {
          try {
            const content = await this.getFileContent({ path: fileInfo.path });
            return {
              ...fileInfo,
              content: content
            };
          } catch (error) {
            console.warn(`Failed to fetch content for file: ${fileInfo.path}`, error);
            // Return original fileInfo if content fetch fails
            return fileInfo;
          }
        }
        return fileInfo;
      })
    );
    
    return processedResults;
  }

  /**
   * Check if codebase index exists
   * @returns Boolean value indicating whether index exists
   */
  async isCodebaseIndexExists(): Promise<CodebaseExistsResponse> {
    return this.ideImpl.isCodebaseIndexExists();
  }

  /**
   * Get currently selected file list
   * @returns Selected file information array
   */
  async getSelectedFiles(): Promise<FileListResponse> {
    return this.ideImpl.getSelectedFiles();
  }

  /**
   * Apply code changes
   * @param params Apply code parameters
   */
  async codeToApply(params: CodeToApplyParams): Promise<void> {
    return this.ideImpl.codeToApply(params);
  }

  /**
   * Create new file
   * @param params Create file parameters
   */
  async codeToCreateFile(params: CodeToCreateFileParams): Promise<void> {
    return this.ideImpl.codeToCreateFile(params);
  }

  /**
   * Insert code
   * @param params Insert code parameters
   */
  async codeToInsert(params: CodeToInsertParams): Promise<void> {
    return this.ideImpl.codeToInsert(params);
  }

  /**
   * Write file
   * @param params Write file parameters
   */
  async writeFile(params: WriteFileParams): Promise<void> {
    return this.ideImpl.writeFile(params);
  }

  async getProjectConfig(): Promise<ProjectInfoResponse> {
    return this.ideImpl.getProjectConfig();
  }

  async closeWindow(): Promise<void> {
    return this.ideImpl.closeWindow();
  }
  
  async getCodebaseIndexingProgress(): Promise<string> {
    return this.ideImpl.getCodebaseIndexingProgress();
  }

  async getMcpTools(): Promise<Record<string, any>> {
    return this.ideImpl.getMcpTools();
  }

  async callMcpTool(params:CallMcpParams): Promise<string> {
    return this.ideImpl.callMcpTool(params);
  }
  async testMcpConnection(name:string):Promise<McpConnectionTestResult>{
    return this.ideImpl.testMcpConnection(name);
  }

  /**
   * Get URL content
   * @param url URL address
   * @returns HTML content string
   */
  async getUrlContent(url: string): Promise<string> {
    return this.ideImpl.getUrlContent(url);
  }

  /**
   * Execute command
   * @param params Command parameters
   * @returns Command execution result
   */
  async executeCommand(params: ExecuteCommandParams): Promise<ExecuteCommandResponse> {
    return this.ideImpl.executeCommand(params);
  }

  /**
   * Execute script
   * @param params Script parameters
   * @returns Request ID for tracking script execution
   */
  async executeScript(params: ExecuteScriptParams): Promise<ExecuteScriptResponse> {
    return this.ideImpl.executeScript(params);
  }

  /**
   * Get script execution status
   * @param params Parameters containing requestId
   * @returns Script status and output
   */
  async getScriptStatus(params: GetScriptStatusParams): Promise<ScriptStatusResponse> {
    return this.ideImpl.getScriptStatus(params);
  }

  /**
   * Stop script execution
   * @param params Parameters containing requestId
   * @returns Script status and output
   */
  async stopScript(params: StopScriptParams): Promise<ScriptStatusResponse> {
    return this.ideImpl.stopScript(params);
  }
}