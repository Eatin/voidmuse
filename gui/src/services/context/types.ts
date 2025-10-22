import { ChatMessageDetail } from '@/types/messages';

export interface ProcessResult {
  // Processed prompt content
  promptContent: string;
  // Messages to be displayed in UI
  assistantMessages: ChatMessageDetail[];
}

export interface ProcessorConfig {
  type: string;
  create: () => any; 
}