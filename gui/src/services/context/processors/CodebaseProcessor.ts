import { ContextItem } from '@/types/context';
import { ChatMessageDetail } from '@/types/messages';
import { ContextItemProcessor } from '../ContextItemProcessor';
import { ProcessContext } from '../ProcessContext';
import { IDEService } from '@/api/IDEService';
import { errorReportingService } from '@/services/ErrorReportingService';

/**
 * Codebase Search Processor
 * Processes @codebase context, executes codebase search and adds results
 */
export class CodebaseProcessor implements ContextItemProcessor {
  canProcess(contextItem: ContextItem): boolean {
    return contextItem.type === 'codebase';
  }
  
  async process(contextItem: ContextItem, context: ProcessContext): Promise<void> {
    // Get search query
    const query = context.getUserText().replace(/@codebase/g, '');
    console.log('codebase query', query);
    
    try {
      // Execute codebase search
      const ideService = IDEService.getInstance();
      const results = await ideService.buildWithCodebaseContext({
        prompt: query
      });
      
      // Add codebase search results to prompt
      if (results.length > 0) {
        results.forEach((file, index) => {
          context.addFileContent(`\n\n\`\`\`path=: ${file.path}\n${file.content}\n\`\`\`\n`);
        });
        
        const message: ChatMessageDetail = {
          type: 'codebase',
          content: results,
          status: 'success'
        };
        
        context.addAssistantMessage(message);
      } else {
        // Success but no results found
        const message: ChatMessageDetail = {
          type: 'codebase',
          content: [],
          status: 'success'
        };
        
        context.addAssistantMessage(message);
      }
    } catch (error) {
      // Record error to error reporting service
      await errorReportingService.reportErrorWithException(
        'Codebase Context Query Failed',
        error,
        'error',
        'CodebaseProcessor',
        `Query: ${query}`
      );
      
      console.error(`Failed to process codebase search: ${error}`);
      
      // Create error message for UI display
      const errorMessage: ChatMessageDetail = {
        type: 'codebase',
        content: [],
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
      
      context.addAssistantMessage(errorMessage);
    }
  }

}