// Pricing configuration interface
export interface ModelPricing {
    inputCostPerMillion: number;  // Cost per million input tokens (USD)
    outputCostPerMillion: number; // Cost per million output tokens (USD)
}

// Tiered pricing configuration interface
export interface TieredPricing {
    inputTiers: Array<{
        threshold: number; // Token threshold
        costPerMillion: number; // Cost per million tokens (USD)
    }>;
    outputTiers: Array<{
        threshold: number; // Token threshold
        costPerMillion: number; // Cost per million tokens (USD)
    }>;
}

export interface ModelItem {
    key: string;
    name: string;
    provider?: string;
    enabled?: boolean;
    modelId?: string;
    apiKey?: string;
    baseUrl?: string;
    isCustomModel?: boolean;
    pricing?: ModelPricing | TieredPricing;
}

export interface ProviderOption {
    label: string;
    value: string;
}

export interface ModelOption {
    label: string;
    value: string;
}