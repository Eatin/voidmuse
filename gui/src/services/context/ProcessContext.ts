import { ContextItem } from '../../types/context';
import { ChatMessageDetail } from '../../types/messages';
import { PromptService } from '../PromptService';

/**
 * Process Context
 * Used to store and accumulate processing results during processing
 */
export class ProcessContext {
  // Original user input text
  private userText: string;
  // Processed user prompt
  private userPrompt: string;
  // Content to be displayed in assistant messages
  private assistantMessages: ChatMessageDetail[] = [];
  // Context items list
  private contextItems: ContextItem[];
  // File contents
  private fileContents: string[] = [];
  // User selected content
  private userSelected: string = '';
  
  constructor(text: string, contextItems: ContextItem[]) {
    this.userText = text;
    this.userPrompt = text;
    this.contextItems = contextItems;
  }
  
  getUserText(): string {
    return this.userText;
  }
  
  getUserPrompt(): string {
    return this.userPrompt;
  }

  getUserSelected(): string {
    return this.userSelected;
  }

  addFileContent(content: string): void {
    this.fileContents.push(content);
  }
  getFileContents(): string[] {
    return this.fileContents;
  }

  setUserPrompt(prompt: string): void {
    this.userPrompt = prompt;
  }

  addUserSelected(content: string): void {
    this.userSelected += content;
  }
  
  addAssistantMessage(message: ChatMessageDetail): void {
    this.assistantMessages.push(message);
  }
  
  getAssistantMessages(): ChatMessageDetail[] {
    return this.assistantMessages;
  }
  
  getContextItems(): ContextItem[] {
    return this.contextItems;
  }
  
  buildResult() {
    const promptContent = PromptService.getUserPrompt({
      fileContents: this.fileContents,
      userQuery: this.userText,
      userSelected: this.userSelected
    });
    
    return {
      promptContent,
      assistantMessages: this.assistantMessages
    };
  }
}