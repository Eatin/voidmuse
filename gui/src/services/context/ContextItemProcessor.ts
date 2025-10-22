import { ContextItem } from '@/types/context';
import { ProcessContext } from './ProcessContext';

/**
 * Context Item Processor Interface
 * Responsible for processing different types of context items (files, codebase search, web search, etc.)
 */
export interface ContextItemProcessor {
  canProcess(contextItem: ContextItem): boolean;
  
  process(contextItem: ContextItem, context: ProcessContext): Promise<void>;
}