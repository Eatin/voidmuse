export interface EditCodeContext{
    type:string;
    name:string;
    context:string
}

export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    completionTokensDetails?: {
        reasoningTokens?: number;
        acceptedPredictionTokens?: number;
        rejectedPredictionTokens?: number;
    };
    cost?: number;
}

export interface TimingInfo {
    firstTokenLatency?: number; // First token latency (ms)
    totalLatency?: number;      // Total latency (ms)
}
