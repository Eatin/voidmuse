import type { MessageStatus } from '@ant-design/x/es/use-x-chat';
import { ContextItem } from './context';
import { TokenUsage, TimingInfo } from '@/services/llm/types';
import { ToolCallPart, ToolResultPart } from 'ai';
import { FileInfo } from '@/types/ide';


export interface ChatMessageDetail {
  content: string | ToolCallPart[] | ToolResultPart[] | FileInfo[];
  // Plain text content
  plainText?: string;
  status?: MessageStatus;
  type: 'normal' | 'reasoning' | 'codebase' | 'assistant' | 'tool_result' | 'tool_call';
  createdAt?: number;
  contextItems?: ContextItem[];
  error?: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status: MessageStatus;
  messages: ChatMessageDetail[];
  modelId?: string;
  timing?: TimingInfo;
  tokenUsage?: TokenUsage;
  createdAt?: number;
  updatedAt?: number;
}

// Chat details (complete conversation): Used to store conversation history
export interface ChatHistory {
  id: string;
  messages: ChatMessage[];
  title?: string;
  firstQuestion?: string;
  mode?: 'ask' | 'agent';
  createdAt: number;
  updatedAt: number;
}

// Chat summary (for list display)
export interface ChatHistorySummary {
  id: string;
  title: string;
  firstQuestion: string;
  mode?: 'ask' | 'agent';
  createdAt: number;
  updatedAt: number;
}