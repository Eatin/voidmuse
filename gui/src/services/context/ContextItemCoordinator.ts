import { ContextItem } from '@/types/context';
import { ContextItemProcessor } from './ContextItemProcessor';
import { ProcessContext } from './ProcessContext';
import { CodebaseProcessor, FileProcessor } from './processors';
import { ProcessorConfig } from './types';

/**
 * Context Item Coordinator
 * Manages and coordinates all context processors
 */
export class ContextItemCoordinator {
  private processors: ContextItemProcessor[] = [];
  
  constructor(customProcessors: ProcessorConfig[] = []) {
    this.registerDefaultProcessors();
    
    this.registerCustomProcessors(customProcessors);
  }
  
  private registerDefaultProcessors(): void {
    this.processors.push(new FileProcessor());
    this.processors.push(new CodebaseProcessor());
  }
  
  private registerCustomProcessors(configs: ProcessorConfig[]): void {
    for (const config of configs) {
      this.processors.push(config.create());
    }
  }
  
  async processContextItems(text: string, contextItems: ContextItem[]): Promise<ProcessContext> {
    const context = new ProcessContext(text, contextItems);
    
    for (const item of contextItems) {
      const processor = this.findProcessor(item);
      if (processor) {
        await processor.process(item, context);
      } else {
        console.warn(`Processor not found: type ${item.type}, name ${item.name}`);
      }
    }
    
    return context;
  }
  
  private findProcessor(contextItem: ContextItem): ContextItemProcessor | undefined {
    return this.processors.find(processor => processor.canProcess(contextItem));
  }
}