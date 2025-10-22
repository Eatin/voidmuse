export interface SearchResultItem {
    index: number;
    title: string;
    description: string;
    url: string;
    favicon?: string;
}

export interface SearchConfigItem {
    key: string;
    name: string;
    provider: string;
    enabled: boolean;
    config?: string;
}

export interface SearchProviderOption {
    label: string;
    value: string;
}

export interface SearchEngineOption {
    label: string;
    value: string;
}