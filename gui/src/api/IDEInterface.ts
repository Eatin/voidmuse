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
 * IDE interface definition
 * Defines core functionality for IDE interaction
 */
export interface IDEInterface {

  testMcpConnection(name: string): McpConnectionTestResult | PromiseLike<McpConnectionTestResult>;
  /**
   * Get MCP service list
   * @returns MCP service list
   */
  getMcpTools(): Record<string, any> | PromiseLike<Record<string, any>>;
  /**
   * Call MCP service
   * @returns Return result
   */
  callMcpTool(params:CallMcpParams): string | PromiseLike<string>;
  /**
   * Get file list
   * @param params Find file parameters
   * @returns File list information array
   */
  getFileList(params: FindFileParams): Promise<FileListResponse>;

  /**
   * Get file content
   * @param params File path parameters
   * @returns File content string
   */
  getFileContent(params: FileContentParams): Promise<string>;

  /**
   * Jump to specified file location
   * @param params Jump parameters, including path and optional field name
   */
  jumpToFile(params: JumpToFileParams): Promise<void>;

  /**
   * Open URL in browser
   * @param params Parameters containing URL
   */
  openUrl(params: OpenUrlParams): Promise<void>;

  /**
   * Build response using codebase context
   * @param params Prompt information parameters
   * @returns Related file information array
   */
  buildWithCodebaseContext(params: CodebaseContextParams): Promise<CodebaseContextResponse>;

  /**
   * Check if codebase index exists
   * @returns Boolean value indicating whether index exists
   */
  isCodebaseIndexExists(): Promise<CodebaseExistsResponse>;

  /**
   * Get currently selected file list
   * @returns Selected file information array
   */
  getSelectedFiles(): Promise<FileListResponse>;

  /**
   * Apply code changes
   * @param params Contains code content to be applied
   */
  codeToApply(params: CodeToApplyParams): Promise<void>;

  /**
   * Create new file
   * @param params Contains file content to be created
   */
  codeToCreateFile(params: CodeToCreateFileParams): Promise<void>;

  /**
   * Insert code
   * @param params Contains code content to be inserted
   */
  codeToInsert(params: CodeToInsertParams): Promise<void>;

  /**
   * Write file
   * @param params Parameters containing file path, content, start line and end line
   */
  writeFile(params: WriteFileParams): Promise<void>;

  /**
   * Get application information
   */
  getProjectConfig(): Promise<ProjectInfoResponse>;

  /**
   * Close window
   */
  closeWindow(): Promise<void>;

  getCodebaseIndexingProgress(): Promise<string>;

  /**
   * Get URL content
   * @param url URL address
   * @returns HTML content string
   */
  getUrlContent(url: string): Promise<string>;

  /**
   * Execute command
   * @param params Command parameters
   * @returns Command execution result
   */
  executeCommand(params: ExecuteCommandParams): Promise<ExecuteCommandResponse>;

  /**
   * Execute script
   * @param params Script parameters including script content and requestId
   * @returns Request ID for tracking script execution
   */
  executeScript(params: ExecuteScriptParams): Promise<ExecuteScriptResponse>;

  /**
   * Get script execution status
   * @param params Parameters containing requestId
   * @returns Script status and output
   */
  getScriptStatus(params: GetScriptStatusParams): Promise<ScriptStatusResponse>;

  /**
   * Stop script execution
   * @param params Parameters containing requestId
   * @returns Script status and output
   */
  stopScript(params: StopScriptParams): Promise<ScriptStatusResponse>;
}