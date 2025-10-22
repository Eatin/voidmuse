import { tool } from 'ai';
import { z } from 'zod';
import { IDEService } from '../../api/IDEService';

/**
 * Write code tool for AI SDK
 */
export const writeCodeTool = tool({
  description: 'Process code editing requests and return the filename and updated code content. The returned code should be in plain text format, without markdown code block markers, containing only the selected and modified code portions.',
  inputSchema: z.object({
    fileName: z.string().describe('The filename to be updated'),
    filePath: z.string().describe('The complete file path to be updated'),
    updatedCode: z.string().describe('The updated code snippet, containing only the selected and modified portions, in plain text format without markdown markers like ```, preserving original indentation and spacing'),
    startLine: z.number().describe('The start line number of the original code to be modified'),
    endLine: z.number().describe('The end line number of the original code to be modified')
  }),
  execute: async ({ fileName, filePath, updatedCode, startLine, endLine }) => {
    try {
      const ideService = IDEService.getInstance();
      await ideService.writeFile({
        filePath,
        content: updatedCode,
        startLine,
        endLine,
        showDiff: true
      });
      
      return {
        success: true,
        fileName,
        filePath,
        message: `has been updated: ${fileName}`,
        codeLength: updatedCode.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName,
        filePath
      };
    }
  }
});

export type WriteCodeResult = {
  success: boolean;
  fileName: string;
  filePath: string;
  message?: string;
  codeLength?: number;
  error?: string;
  startLine?: number;
  endLine?: number;
};