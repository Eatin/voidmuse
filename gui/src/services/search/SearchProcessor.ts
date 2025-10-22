export interface OnlineSearchResult {
    query: string;
    success: boolean; 
    msg?: string; 
    results: Array<{
        index: number,
        url: string;
        title: string | null;
        description: string;
        favicon: string;
        relevance_score: number;
    }>;
}

export interface SearchProcessor {

    onlineSearch(content: string): Promise<OnlineSearchResult>;

}