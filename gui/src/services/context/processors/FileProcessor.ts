import { ContextItem } from '@/types/context';
import { ContextItemProcessor } from '../ContextItemProcessor';
import { ProcessContext } from '../ProcessContext';
import { IDEService } from '@/api/IDEService';

/**
 * File Processor
 * Processes @file reference context, retrieves file content and adds to prompt
 */
export class FileProcessor implements ContextItemProcessor {
  canProcess(contextItem: ContextItem): boolean {
    return contextItem.type === 'file' || contextItem.type === 'fileEdit';
  }
  
  async process(contextItem: ContextItem, context: ProcessContext): Promise<void> {
    try {
      // Get file name and path
      const filePath = contextItem.value;
      const selected = contextItem.selected;
      const line = contextItem.line || '';
      
      // Get file content
      const ideService = IDEService.getInstance();
      const fileContent = await ideService.getFileContent({ path: filePath });
      
      // Add file content
      context.addFileContent(`\n\n\`\`\`path=: ${filePath}\n${fileContent}\n\`\`\`\n`);
      // Add selected content
      context.addUserSelected('this is the change line number:' + line + ', this is user selected code : ```code\n' + selected + '\n```');
    } catch (error) {
      console.error(`Failed to process file: ${error}`);
    }
  }
  
}