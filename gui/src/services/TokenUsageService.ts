import { TokenUsage } from '@/services/llm/types';
import { TokenUsageDetail } from '@/components/token/types';
import { storageService } from '@/storage/index';
import { IDEService } from '@/api/IDEService';
import { ModelItem, ModelPricing, TieredPricing } from '@/types/models';

export type TokenUsageType = 'Chat' | 'embedding' | 'editCode' | 'codeComplete';

export interface ITokenUsageService {
    saveTokenUsage(
        usage: TokenUsage | undefined,
        type: TokenUsageType,
        modelConfig: ModelItem,
    ): Promise<void>;
}

export class TokenUsageService implements ITokenUsageService {
    private static instance: TokenUsageService;

    public static getInstance(): TokenUsageService {
        if (!TokenUsageService.instance) {
            TokenUsageService.instance = new TokenUsageService();
        }
        return TokenUsageService.instance;
    }

    private constructor() { }

    public async saveTokenUsage(
        usage: TokenUsage | undefined,
        type: TokenUsageType,
        modelConfig: ModelItem
    ): Promise<void> {
        try {
            if (!usage) {
                return;
            }

            const calculatedCost = this.calculateCost(usage, modelConfig);
            const usageWithCost = {
                ...usage,
                cost: calculatedCost
            };

            const projectInfo = await this.getProjectInfo();

            const tokenUsageDetail = await this.createTokenUsageDetail(
                usageWithCost,
                type,
                modelConfig.modelId || '',
                modelConfig.baseUrl || '',
                projectInfo.projectName
            );

            await storageService.addTokenUsageRecord(tokenUsageDetail);
        } catch (error) {
            console.error('Failed to save token usage record:', error);
        }
    }

    public calculateCost(usage: TokenUsage, modelConfig: ModelItem): number {
        // If cost information is already available (e.g., returned by OpenRouter), use it directly
        if (usage.cost !== undefined && usage.cost > 0) {
            return usage.cost;
        }

        if (!modelConfig.pricing) {
            return 0;
        }

        const inputTokens = usage.promptTokens || 0;
        const outputTokens = usage.completionTokens || 0;

        if ('inputCostPerMillion' in modelConfig.pricing) {
            // Basic pricing
            return this.calculateBasicCost(inputTokens, outputTokens, modelConfig.pricing as ModelPricing);
        } else {
            // Tiered pricing
            return this.calculateTieredCost(inputTokens, outputTokens, modelConfig.pricing as TieredPricing);
        }
    }

    private calculateBasicCost(inputTokens: number, outputTokens: number, pricing: ModelPricing): number {
        const inputCost = (inputTokens / 1000000) * pricing.inputCostPerMillion;
        const outputCost = (outputTokens / 1000000) * pricing.outputCostPerMillion;
        return inputCost + outputCost;
    }

    
    private calculateTieredCost(inputTokens: number, outputTokens: number, pricing: TieredPricing): number {
        const inputCost = this.calculateTierCost(inputTokens, pricing.inputTiers);
        const outputCost = this.calculateTierCost(outputTokens, pricing.outputTiers);
        return inputCost + outputCost;
    }

    private calculateTierCost(tokens: number, tiers: Array<{ threshold: number; costPerMillion: number }>): number {
        // Find the applicable tier
        for (const tier of tiers) {
            if (tokens <= tier.threshold) {
                return (tokens / 1000000) * tier.costPerMillion;
            }
        }
        // If no applicable tier is found, use the last tier
        const lastTier = tiers[tiers.length - 1];
        return (tokens / 1000000) * lastTier.costPerMillion;
    }

    
    private async createTokenUsageDetail(
        usage: TokenUsage,
        type: TokenUsageType,
        modelName: string,
        baseUrl: string,
        projectName: string
    ): Promise<TokenUsageDetail> {
        return {
            id: `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            datetime: new Date().toISOString(),
            model: modelName,
            inputTokens: usage.promptTokens,
            outputTokens: usage.completionTokens,
            totalTokens: usage.totalTokens,
            cost: usage.cost ?? 0, 
            projectName: projectName,
            type: type,
            baseUrl: baseUrl
        };
    }

    
    private async getProjectInfo(): Promise<{ projectName: string }> {
        try {
            const projectInfo = await IDEService.getInstance().getProjectConfig();
            return {
                projectName: projectInfo.projectName || 'default'
            };
        } catch (error) {
            console.error('Failed to get project info:', error);
            // Graceful fallback, use default project name
            return {
                projectName: 'default'
            };
        }
    }
}