import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { ModelItem } from '@/types/models';

export class ModelFactory {
    static createEmbeddingModel(modelConfig: ModelItem) {
        const { provider, apiKey, baseUrl, modelId } = modelConfig;
        
        if (!provider) {
            throw new Error('Model provider not configured');
        }

        const baseConfig = {
            apiKey: apiKey || '',
            baseURL: (baseUrl || ''),
        };

        // Default to OpenAI compatible interface: embedding currently uses openai interface format
        return createOpenAI(baseConfig).embedding(modelId || 'text-embedding-3-small');
    }
    
    static createModel(modelConfig: ModelItem) {
        const { provider, apiKey, baseUrl, modelId } = modelConfig;
        
        if (!provider) {
            throw new Error('Model provider not configured');
        }

        const baseConfig = {
            apiKey: apiKey || '',
            baseURL: (baseUrl || ''),
            compatibility: 'strict' as const, // Enable strict mode to support streamOptions
        };

        // Create corresponding model instance based on provider, different providers have different calling methods
        switch (provider.toLowerCase()) {
            case 'openai':
                return createOpenAI(baseConfig)(modelId || '');
            // deepseek: Use this method to parse deepseek reasoning tags and return token usage during streaming response
            case 'deepseek':
            case 'qianfan':    
            case 'aliyun':
            case 'volcengine':
                const deepseekProvider = createOpenAICompatible({
                    name: 'deepseek',
                    baseURL: baseConfig.baseURL,
                    apiKey: baseConfig.apiKey,
                    includeUsage: true,
                });
                return deepseekProvider(modelId || '');
            case 'anthropic':
                return createAnthropic(baseConfig)(modelId || '');
            case 'openrouter':
                return createOpenRouter(baseConfig)(modelId || '', {
                    usage: {
                        include: true, // Enable usage accounting to get cost data
                    },
                });
            default:
                // Default to OpenAI compatible interface
                return createOpenAI(baseConfig)(modelId || '');
        }
    }

}