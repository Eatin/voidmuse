export type { 
  IStorage,
  ThemeConfig,
} from './StorageInterface';

export type {
  ChatMessage,
  ChatMessageDetail as MessageDetail,
  ChatHistory as ChatDetail,
  ChatHistorySummary as ChatSummary
} from '../types/messages';

import { StorageService } from './StorageService';

export const storageService = StorageService.getInstance();  