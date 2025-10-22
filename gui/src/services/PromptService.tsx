import Handlebars from 'handlebars';
import chatUserPrompt from '@/config/prompts/chatUserPrompt.txt?raw';
import chatSystemPrompt from '@/config/prompts/chatSystemPrompt.txt?raw';
import { ProjectInfoResponse } from '@/types/ide';
import editCompletionPrompt from '@/config/prompts/editCompletionPrompt.txt?raw';
import codeCompletionPrompt from '@/config/prompts/codeCompletion.txt?raw';
import codebaseOptimizePrompt from '@/config/prompts/codebaseOptimizePrompt.txt?raw';

export interface UserPromptParams {
  fileContents: string[];
  userQuery: string;
  userSelected: string;
}

export interface SystemPromptParams {
  modelName: string;
  projectInfo?: ProjectInfoResponse | null;
  tools?: Record<string, any>;
}

export interface EditCodePromptParams {
  codeToEdit: string;
  prefix: string;
  suffix: string;
  userInput: string;
  language: string;
  fileNames: string;
  fileContext: string;
}

export interface CodeCompletePromptParams {
  prefix: string;
  suffix: string;
  language: string;
  fileNames: string;
  fileContext: string;
}

export interface OptimizeCodebasePromptParams {
  userInput: string;
}

export class PromptService {
  static getUserPrompt(params: UserPromptParams): string {
    const template = Handlebars.compile(chatUserPrompt);
    return template({
      fileContents: params.fileContents.join('\n'),
      userQuery: params.userQuery,
      userSelected: params.userSelected
    });
  }

  static getSystemPrompt(params: SystemPromptParams): string {
    const template = Handlebars.compile(chatSystemPrompt);
    const projectInfo = params.projectInfo || {};
    const tools = params.tools || {};
    const hasTools = Object.keys(tools).length > 0;
    const hasWebSearchTool = 'webSearch' in tools;
    const hasWriteCodeTool = 'writeCode' in tools;
    
    return template({
      modelName: params.modelName,
      systemVersion: projectInfo.systemVersion || 'Unknown',
      projectPath: projectInfo.projectPath || '',
      currentDate: new Date().toLocaleDateString(),
      hasTools: hasTools,
      hasWebSearchTool: hasWebSearchTool,
      hasWriteCodeTool: hasWriteCodeTool
    });
  }

  static getEditCodePrompt(params: EditCodePromptParams): string {
    const template = Handlebars.compile(editCompletionPrompt);
    return template(params);
  }

  static getCodeCompletePrompt(params: CodeCompletePromptParams): string {
    const template = Handlebars.compile(codeCompletionPrompt);
    return template(params);
  }

  static getOptimizeCodebasePrompt(params: OptimizeCodebasePromptParams): string {
    const template = Handlebars.compile(codebaseOptimizePrompt);
    return template(params);
  }
}

export default PromptService;