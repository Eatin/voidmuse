export interface TokenUsageDetail {
  id: string;
  datetime: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  projectName: string;
  type: 'Chat' | 'embedding' | 'editCode' | 'codeComplete';
  baseUrl: string;
}

export interface TokenUsageSummary {
  id: string;
  date: string;
  modelList: string[];
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  details: TokenUsageDetail[];
}