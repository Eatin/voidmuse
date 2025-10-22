import {IDEInterface} from '../IDEInterface';
import {
  CodebaseContextParams,
  CodebaseContextResponse,
  CodebaseExistsResponse,
  CodeToApplyParams,
  CodeToCreateFileParams,
  CodeToInsertParams,
  WriteFileParams,
  FileContentParams,
  FileListResponse,
  FindFileParams,
  JumpToFileParams,
  OpenUrlParams,
  ProjectInfoResponse,
  ExecuteCommandParams,
  ExecuteScriptParams,
  GetScriptStatusParams,
  StopScriptParams,
  ExecuteCommandResponse,
  ExecuteScriptResponse,
  ScriptStatusResponse,
  CallMcpParams,
  McpConnectionTestResult
} from '../../types/ide';

/**
 * Web platform IDE interface implementation
 */
export class WebIDE implements IDEInterface {
  
  testMcpConnection(name: string): McpConnectionTestResult | PromiseLike<McpConnectionTestResult> {
    return Promise.resolve({ success: false, message: 'Not implemented in web IDE' });
  }
  callMcpTool(params: CallMcpParams): string | PromiseLike<string> {
    return Promise.resolve("");
  }
  getMcpTools(): Record<string, any> | PromiseLike<Record<string, any>> {
    return Promise.resolve([]);
   }
  /**
   * Get file list
   * @param params Find file parameters
   * @returns Array of file list information
   */
  async getFileList(params: FindFileParams): Promise<FileListResponse> {
    console.log('Web platform: calling getFileList, params:', params);
    return Promise.resolve([]);
  }

  /**
   * Get file content
   * @param params File path parameters
   * @returns File content string
   */
  async getFileContent(params: FileContentParams): Promise<string> {
    console.log('Web platform: calling getFileContent, params:', params);
    return Promise.resolve("");
  }

  /**
   * Jump to specified file location
   * @param params Jump parameters, including path and optional field name
   */
  async jumpToFile(params: JumpToFileParams): Promise<void> {
    console.log('Web platform: calling jumpToFile, params:', params);
    return Promise.resolve();
  }

  /**
   * Open URL in browser
   * @param params Parameters containing URL
   */
  async openUrl(params: OpenUrlParams): Promise<void> {
    console.log('Web platform: calling openUrl, params:', params);
    window.open(params.url, '_blank');
    return Promise.resolve();
  }

  /**
   * Build response using codebase context
   * @param params Prompt information parameters
   * @returns Array of related file information
   */
  async buildWithCodebaseContext(params: CodebaseContextParams): Promise<CodebaseContextResponse> {
    console.log('Web platform: calling buildWithCodebaseContext, params:', params);
    return Promise.resolve([]);
  }

  /**
   * Check if codebase index exists
   * @returns Boolean value indicating whether the index exists
   */
  async isCodebaseIndexExists(): Promise<CodebaseExistsResponse> {
    console.log('Web platform: calling isCodebaseIndexExists');
    return Promise.resolve(false);
  }

  /**
   * Get currently selected file list
   * @returns Array of selected file information
   */
  async getSelectedFiles(): Promise<FileListResponse> {
    console.log('Web platform: calling getSelectedFiles');
    return Promise.resolve([]);
  }

  /**
   * Apply code changes
   * @param params Contains code content to apply
   */
  async codeToApply(params: CodeToApplyParams): Promise<void> {
    console.log('Web platform: calling codeToApply, params:', params);
    return Promise.resolve();
  }

  /**
   * Create new file
   * @param params Contains file content to create
   */
  async codeToCreateFile(params: CodeToCreateFileParams): Promise<void> {
    console.log('Web platform: calling codeToCreateFile, params:', params);
    return Promise.resolve();
  }

  /**
   * Insert code
   * @param params Contains code content to insert
   */
  async codeToInsert(params: CodeToInsertParams): Promise<void> {
    console.log('Web platform: calling codeToInsert, params:', params);
    return Promise.resolve();
  }

  /**
   * Write file
   * @param params Write file parameters
   */
  async writeFile(params: WriteFileParams): Promise<void> {
    console.log('Web platform: calling writeFile, params:', {
      filePath: params.filePath,
      contentLength: params.content.length,
      startLine: params.startLine,
      endLine: params.endLine,
      showDiff: params.showDiff
    });
    console.log('Web platform: writeFile content preview:', params.content.substring(0, 200) + '...');
    return Promise.resolve();
  }

  async getProjectConfig(): Promise<ProjectInfoResponse> {
    return Promise.resolve({projectName: 'default'});
  }

  async closeWindow(): Promise<void> {
    console.log('Web platform: calling closeWindow');
    return Promise.resolve();
  }
  
  async getCodebaseIndexingProgress(): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve("0");
    });
  }

  /**
   * Get URL content
   * @param url URL address
   * @returns HTML content string
   */
  async getUrlContent(url: string): Promise<string> {
    console.log('Web platform: calling getUrlContent, params:', url);
    try {
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      return data.contents;
    } catch (error) {
      console.error('Web platform: getUrlContent failed:', error);
      return '';
    }
  }

  /**
   * Execute command
   * @param params Command parameters
   * @returns Command execution result
   */
  async executeCommand(params: ExecuteCommandParams): Promise<ExecuteCommandResponse> {
    console.log('Web platform: calling executeCommand, params:', params);
    return Promise.resolve('');
  }

  /**
   * Execute script
   * @param params Script parameters
   * @returns Request ID for tracking script execution
   */
  async executeScript(params: ExecuteScriptParams): Promise<ExecuteScriptResponse> {
    console.log('Web platform: calling executeScript, params:', params);
    return Promise.resolve(params.requestId);
  }

  /**
   * Get script execution status
   * @param params Parameters containing requestId
   * @returns Script status and output
   */
  async getScriptStatus(params: GetScriptStatusParams): Promise<ScriptStatusResponse> {
    console.log('Web platform: calling getScriptStatus, params:', params);
    return Promise.resolve({ status: 0, output: '' });
  }

  /**
   * Stop script execution
   * @param params Parameters containing requestId
   * @returns Script status after stopping
   */
  async stopScript(params: StopScriptParams): Promise<ScriptStatusResponse> {
    console.log('Web platform: calling stopScript, params:', params);
    return Promise.resolve({ status: 0, output: 'Script stopped (web platform)' });
  }
  
}