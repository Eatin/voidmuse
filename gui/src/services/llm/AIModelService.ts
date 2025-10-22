import { generateText, embed, embedMany, LanguageModelUsage } from 'ai';
import { ModelFactory } from './ModelFactory';
import { ModelItem } from '@/types/models';
import { EditCodeContext, TokenUsage } from './types';
import { TokenUsageService, TokenUsageType } from '@/services';
import { base64Decode } from '@/utils/Base64Utils';
import { errorReportingService } from '@/services/ErrorReportingService';
import PromptService, { 
  EditCodePromptParams, 
  CodeCompletePromptParams, 
  OptimizeCodebasePromptParams 
} from '@/services/PromptService';


export class AIModelService {
    private static instance: AIModelService;
    
    private constructor() {
    }
    
    public static getInstance(): AIModelService {
        if (!AIModelService.instance) {
            AIModelService.instance = new AIModelService();
        }
        return AIModelService.instance;
    }
    
    private saveTokenUsage(usage: any, usageType: TokenUsageType, modelConfig: ModelItem, providerMetadata?: any): void {
        if (usage) {
            const tokenUsage: TokenUsage = {
                promptTokens: usage.inputTokens || usage.prompt_tokens || 0,
                completionTokens: usage.outputTokens || usage.completion_tokens || 0,
                totalTokens: usage.totalTokens || 0,
                // openrouter 会返回cost数据, 在这个meta里面才能拿到
                cost: providerMetadata?.openrouter?.usage?.cost || 0,
            };
    
            TokenUsageService.getInstance().saveTokenUsage(tokenUsage, usageType, modelConfig);
        }
    }
    
    public async getEmbeddings(input: string | string[], modelConfig: ModelItem, requestId?: string): Promise<number[][]> {
        const embeddingModel = ModelFactory.createEmbeddingModel(modelConfig);
        
        try {
            let result;
            let usage;
            
            if (Array.isArray(input)) {
                const response = await embedMany({
                    model: embeddingModel,
                    values: input
                });
                result = response.embeddings;
                usage = response.usage;
            } else {
                const response = await embed({
                    model: embeddingModel,
                    value: input
                });
                result = [response.embedding];
                usage = response.usage;
            }
            
            this.saveTokenUsage({ inputTokens: usage.tokens, outputTokens: 0, totalTokens: usage.tokens }, 'embedding', modelConfig);
            console.log(`getEmbeddings  requestId:[${requestId}] input:`, Array.isArray(input) ? input.map(str => str.slice(0, 30)) : input.slice(0, 30), ', result:', result.map(arr => arr.slice(0, 3)));
            if (!result || result.length === 0) {
                console.error(`getEmbeddings result empty requestId: [${requestId}]:`, result);
                return [];
            }
            return result;
        } catch (error) {
            const additionalInfo = `Provider: ${modelConfig.provider || 'unknown'}\nURL: ${modelConfig.baseUrl || 'default'}\nRequestId: ${requestId || 'N/A'}`;
            errorReportingService.reportErrorWithException('AI Embedding Failed', error, 'error', 'AIModelService', additionalInfo);
            throw error;
        }
    }
    
    /**
     * Edit code
     * @param codeToEdit Code to be edited
     * @param prefix Prefix context
     * @param suffix Suffix context
     * @param userInput User input
     * @param language Programming language
     * @param contexts Context information
     * @param modelConfig Model configuration
     * @returns Edited code
     */
    public async editCode(
        codeToEdit: string,
        prefix: string,
        suffix: string,
        userInput: string,
        language: string,
        contexts: EditCodeContext[],
        modelConfig: ModelItem
    ): Promise<string> {
        const model = ModelFactory.createModel(modelConfig);
        
        let fileContext = '';
        let fileNames = '';
        let knowledgeContext = '';
        
        if (contexts && contexts.length > 0) {
            for (const context of contexts) {
                if (context.type === 'file') {
                    // Base64 decode file content
                    const decodedString = base64Decode(context.context);
                    fileContext += decodedString + '\n';
                    fileNames += context.name + ',';
                } else if (context.type === 'knowledge') {
                    knowledgeContext += context.context + '\n';
                }
            }
        }
        
        const promptParams: EditCodePromptParams = {
            codeToEdit,
            prefix,
            suffix,
            userInput,
            language,
            fileNames,
            fileContext
        };
        
        const prompt = PromptService.getEditCodePrompt(promptParams);
        
        try {
            const { text, usage, providerMetadata } = await generateText({
                model,
                prompt
            });
            
            this.saveTokenUsage(usage, 'editCode', modelConfig, providerMetadata);
            return text;
        } catch (error) {
            const additionalInfo = `Provider: ${modelConfig.provider || 'unknown'}\nURL: ${modelConfig.baseUrl || 'default'}`;
            errorReportingService.reportErrorWithException('AI Code Edit Failed', error, 'error', 'AIModelService', additionalInfo);
            throw error;
        }
    }
    
    /**
     * Code completion
     * @param prefix Prefix context
     * @param suffix Suffix context
     * @param language Programming language
     * @param contexts Context information
     * @param modelConfig Model configuration
     * @returns Completed code
     */
    public async codeComplete(
        prefix: string,
        suffix: string,
        language: string,
        contexts: EditCodeContext[],
        modelConfig: ModelItem
    ): Promise<string> {
        const model = ModelFactory.createModel(modelConfig);
        
        let fileContext = '';
        let fileNames = '';
        
        if (contexts && contexts.length > 0) {
            for (const context of contexts) {
                if (context.type === 'file') {
                    // Base64 decode file content
                    const decodedString = base64Decode(context.context);
                    fileContext += decodedString + '\n';
                    fileNames += context.name + ',';
                }
            }
        }
        
        const promptParams: CodeCompletePromptParams = {
            prefix,
            suffix,
            language,
            fileNames,
            fileContext
        };
        
        const prompt = PromptService.getCodeCompletePrompt(promptParams);
        
        try {
            const { text, usage, providerMetadata } = await generateText({
                model,
                prompt
            });
            
            this.saveTokenUsage(usage, 'codeComplete', modelConfig, providerMetadata);

            return text;
        } catch (error) {
            const additionalInfo = `Provider: ${modelConfig.provider || 'unknown'}\nURL: ${modelConfig.baseUrl || 'default'}`;
            errorReportingService.reportErrorWithException('AI Code Complete Failed', error, 'error', 'AIModelService', additionalInfo);
            throw error;
        }
    }
    
    /**
     * Optimize codebase prompt
     * @param userInput User input
     * @param modelConfig Model configuration
     * @returns Optimization suggestions
     */
    public async optimizeCodebasePrompt(userInput: string, modelConfig: ModelItem): Promise<string> {
        const model = ModelFactory.createModel(modelConfig);
        
        const promptParams: OptimizeCodebasePromptParams = {
            userInput
        };
        
        const prompt = PromptService.getOptimizeCodebasePrompt(promptParams);
        
        try {
            const { text, usage, providerMetadata } = await generateText({
                model,
                prompt
            });
            
            this.saveTokenUsage(usage, 'Chat', modelConfig, providerMetadata);

            return text;
        } catch (error) {
            const additionalInfo = `Provider: ${modelConfig.provider || 'unknown'}\nURL: ${modelConfig.baseUrl || 'default'}`;
            errorReportingService.reportErrorWithException('AI Codebase Optimize Failed', error, 'error', 'AIModelService', additionalInfo);
            throw error;
        }
    }
}

export const aiModelService = AIModelService.getInstance();
