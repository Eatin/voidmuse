
export interface CallMcpParams {
  serviceName: string;
  toolName: string;
  params: Record<string, any>;
}

export interface FileInfo {
  name: string;
  path: string;
  content: string;
  startLine?: number;
  endLine?: number;
}

export interface FindFileParams {
  fileName: string;
}

export interface FileContentParams {
  path: string;
}

export interface JumpToFileParams {
  path: string;
  fieldName?: string;
  startLine?: number;
  endLine?: number;
}

export interface OpenUrlParams {
  url: string;
}

export interface CodebaseContextParams {
  prompt: string;
  optimizePrompt?: string
}

export interface CodeToApplyParams {
  content: string;
}

export interface CodeToCreateFileParams {
  content: string;
}

export interface CodeToInsertParams {
  content: string;
}

export interface WriteFileParams {
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
  showDiff?: boolean;
}

export interface ProjectInfoResponse {
  projectName?: string;
  projectPath?: string;
  systemVersion?: string;
  theme?: string;
  language?: string;
}


export interface McpConnectionTestResult {
  success: boolean;
  toolCount?: number;
  error?: string;
  tools?: {
    name: string;
    description: string | undefined;
  }[];
}

export interface ExecuteCommandParams {
  command: string;
}

export interface ExecuteScriptParams {
  script: string;
  requestId: string;
}

export interface GetScriptStatusParams {
  requestId: string;
}

export interface StopScriptParams {
  requestId: string;
}

export interface ScriptStatusResponse {
  status: number; // 0: completed, 1: running, 2: failed
  output: string;
}

export type FileListResponse = FileInfo[];
export type CodebaseContextResponse = FileInfo[];
export type CodebaseExistsResponse = boolean;
export type ExecuteCommandResponse = string;
export type ExecuteScriptResponse = string; // returns requestId