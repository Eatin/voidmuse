import {OnlineSearchResult, SearchProcessor} from "@/services/search/SearchProcessor";
import { errorReportingService } from '../ErrorReportingService';
import { extractWebContent } from './WebContentExtractor';

interface WebContentResponse {
    code: number;
    msg: string | null;
    data: {
        title: string | null;
        description: string;
        url: string;
        favicon: string;
        truncated: boolean;
    };
}

export class GoogleSearchProcessor implements SearchProcessor {
    private apiKey: string;
    private searchEngineId: string;
    private baseUrl = 'https://customsearch.googleapis.com/customsearch/v1';

    constructor(apiKey: string, searchEngineId: string) {
        this.apiKey = apiKey;
        this.searchEngineId = searchEngineId;
    }

    async onlineSearch(content: string): Promise<OnlineSearchResult> {
        const startTime = Date.now();
        
        try {
            const params = new URLSearchParams({
                key: this.apiKey,
                cx: this.searchEngineId,
                q: content,
                num: '5',
                siteSearch: 'csdn.net',
                siteSearchFilter: 'e'
            });

            const response = await fetch(`${this.baseUrl}?${params}`);

            if (!response.ok) {
                let errorMessage = `Google Search API error: ${response.status} ${response.statusText}`;
                
                if (response.status === 401) {
                    errorMessage = 'Invalid API key or authentication failed';
                } else if (response.status === 429) {
                    errorMessage = 'API rate limit exceeded';
                } else if (response.status === 403) {
                    errorMessage = 'API quota exceeded or access forbidden';
                } else {
                    try {
                        const responseText = await response.text();
                        errorMessage = `Google Search API error: ${response.status} ${responseText || response.statusText}`;
                    } catch {
                    }
                }
                
                errorReportingService.reportNetworkError(
                    `${this.baseUrl}?${params}`,
                    new Error(errorMessage),
                    'GoogleSearchProcessor'
                );
                
                return {
                    query: content,
                    success: false,
                    msg: errorMessage,
                    results: []
                };
            }

            const data = await response.json();

            const items = data.items || [];

            const contentPromises = items.map((item: any) => {
                const fetchPromise = extractWebContent({url: item.link});

                const timeoutPromise = new Promise<WebContentResponse>((_, reject) => {
                    setTimeout(() => {
                        reject(new Error('Request timeout'));
                    }, 30000);
                });

                return Promise.race([fetchPromise, timeoutPromise]).catch(error => {
                    
                    if (error.message === 'Request timeout') {
                        errorReportingService.reportTimeoutError(
                            `Web content extraction: ${item.link}`,
                            30000,
                            'GoogleSearchProcessor'
                        );
                    } else {
                        errorReportingService.reportErrorWithException('Web Content Extraction Error', error, 'warning', 'GoogleSearchProcessor');
                    }
                    
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    return {
                        code: 408,
                        msg: errorMessage,
                        data: {
                            url: item.link,
                            description: item.snippet || '',
                            title: item.title || null,
                            favicon: this.getFaviconUrl(item.link),
                            truncated: false
                        }
                    };
                });
            });

            const contentResults = await Promise.all(contentPromises);

            const results = contentResults.map((contentResult, index) => {
                const originalItem = items[index];

                const description = contentResult.code === 200 && contentResult.data.description
                    ? contentResult.data.description
                    : originalItem.snippet || '';

                const title = contentResult.code === 200 && contentResult.data.title
                    ? contentResult.data.title
                    : originalItem.title || null;

                const favicon = contentResult.code === 200 && contentResult.data.favicon
                    ? contentResult.data.favicon
                    : this.getFaviconUrl(originalItem.link);

                return {
                    index: index + 1,
                    url: originalItem.link,
                    title: title,
                    description: description,
                    favicon: favicon,
                    relevance_score: 0
                };
            });

            return {
                query: content,
                success: true,
                results
            };
        } catch (error) {
            errorReportingService.reportErrorWithException('Google Search Failed', error, 'error', 'GoogleSearchProcessor');
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            return {
                query: content,
                success: false,
                msg: errorMessage,
                results: []
            };
        }
    }

    private getFaviconUrl(url: string): string {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}`;
        } catch (error) {
            return '';
        }
    }
}