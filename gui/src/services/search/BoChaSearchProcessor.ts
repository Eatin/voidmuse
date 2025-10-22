import {SearchProcessor, OnlineSearchResult} from './SearchProcessor';
import parse from 'html-react-parser';
import { errorReportingService } from '../ErrorReportingService';
import { extractWebContent, WebContentParams } from './WebContentExtractor';

interface WebSearchParams {
    query: string;
    exclude?: string;
}

interface WebPage {
    id: string;
    name: string;
    url: string;
    displayUrl: string;
    snippet: string;
    siteName: string;
    siteIcon: string;
    datePublished: string;
    dateLastCrawled: string;
    cachedPageUrl: string | null;
    language: string | null;
    isFamilyFriendly: boolean | null;
    isNavigational: boolean | null;
}

interface WebPages {
    webSearchUrl: string;
    totalEstimatedMatches: number;
    value: WebPage[];
    someResultsRemoved: boolean;
}

interface Image {
    webSearchUrl: string | null;
    name: string | null;
    thumbnailUrl: string;
    datePublished: string | null;
    contentUrl: string;
    hostPageUrl: string;
    contentSize: string | null;
    encodingFormat: string | null;
    hostPageDisplayUrl: string;
    width: number;
    height: number;
    thumbnail: any | null;
}

interface Images {
    id: string | null;
    readLink: string | null;
    webSearchUrl: string | null;
    value: Image[];
    isFamilyFriendly: boolean | null;
}

interface SearchData {
    _type: string;
    queryContext: {
        originalQuery: string;
    };
    webPages: WebPages;
    images: Images;
    videos: any | null;
}

interface WebSearchResponse {
    code: number;
    log_id: string;
    msg: string | null;
    data: SearchData;
}

interface RerankDocument {
    text: string;
}

interface RerankResult {
    index: number;
    document: RerankDocument;
    relevance_score: number;
}

interface RerankData {
    model: string;
    results: RerankResult[];
}

interface RerankResponse {
    code: number;
    log_id: string;
    msg: string | null;
    data: RerankData;
}

export const webSearch = async (
    params: WebSearchParams,
    apiKey: string
): Promise<WebSearchResponse> => {
    try {
        const response = await fetch('https://api.bochaai.com/v1/web-search', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: params.query,
                count: 50,
                exclude: params.exclude || 'csdn.net'
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        errorReportingService.reportErrorWithException('Bocha Web Search Failed', error, 'error', 'BoChaSearchProcessor');
        
        throw error;
    }
};

export const rerankSearch = async (
    query: string,
    documents: string[],
    apiKey: string,
    topN: number = 5
): Promise<RerankResponse> => {
    try {
        const response = await fetch('https://api.bochaai.com/v1/rerank', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gte-rerank',
                query: query,
                top_n: topN,
                return_documents: true,
                documents: documents
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        errorReportingService.reportErrorWithException('Bocha Rerank Search Failed', error, 'error', 'BoChaSearchProcessor');
        
        throw error;
    }
};

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

// Use unified web content extraction tool
export { extractWebContent } from './WebContentExtractor';

export class BoChaSearchProcessor implements SearchProcessor {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async onlineSearch(content: string): Promise<OnlineSearchResult> {
        console.log(`BoChaSearchProcessor content : ${content}`);

        try {
            const searchResult = await webSearch({
                query: content,
            }, this.apiKey);

            if (searchResult.code !== 200 || !searchResult.data?.webPages?.value) {
                return {
                    query: content,
                    success: false,
                    msg: searchResult.msg || 'Web search failed or returned no results',
                    results: []
                };
            }

            const webPages = searchResult.data.webPages.value;

            const contentPromises = webPages.map(page => {
                const fetchPromise = extractWebContent({
                    url: page.displayUrl,
                });
                
                const timeoutPromise = new Promise<WebContentResponse>((_, reject) => {
                    setTimeout(() => {
                        reject(new Error('Request timeout'));
                    }, 30000); 
                });
                
                return Promise.race([fetchPromise, timeoutPromise]).catch(error => {
                    
                    if (error.message === 'Request timeout') {
                        errorReportingService.reportTimeoutError(
                            `Bocha web content extraction: ${page.displayUrl}`,
                            30000,
                            'BoChaSearchProcessor'
                        );
                    } else {
                        errorReportingService.reportErrorWithException('Bocha Web Content Extraction Error', error, 'warning', 'BoChaSearchProcessor');
                    }
                    
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    return {
                        code: 408,
                        msg: errorMessage,
                        data: {
                            url: page.displayUrl,
                            description: '',
                            title: null,
                            favicon: '',
                            truncated: false
                        }
                    };
                });
            });

            const contentResults = await Promise.all(contentPromises);
            
            const validResults = contentResults.filter(result => result.code !== 408);
            
            console.log(`contentResults : ${JSON.stringify(validResults)}`);

            // 3. Collect valid page content
            const validContents: string[] = [];
            const contentMap: Record<string, {
                url: string;
                title: string | null;
                favicon: string;
                description: string;
            }> = {};

            contentResults.forEach(result => {
                if (result.code === 200 && result.data.description) {
                    validContents.push(result.data.description);
                    contentMap[result.data.description] = {
                        url: result.data.url,
                        title: result.data.title,
                        favicon: result.data.favicon,
                        description: result.data.description
                    };
                }
            });

            if (validContents.length === 0) {
                return {
                    query: content,
                    success: false,
                    msg: 'No valid content extracted from search results',
                    results: []
                };
            }

            // 4. Call rerankSearch for reordering
            const rerankResult = await rerankSearch(
                content,
                validContents,
                this.apiKey
            );

            if (rerankResult.code !== 200 || !rerankResult.data?.results) {
                return {
                    query: content,
                    success: false,
                    msg: rerankResult.msg || 'Rerank search failed or returned no results',
                    results: []
                };
            }

            // 5. Filter results
            const filteredResults = rerankResult.data.results
                .filter(result => {
                    // Filter results where document text matches extractWebContent description
                    return result.document && contentMap[result.document.text];
                })
                .map((result, index) => {
                    const content = contentMap[result.document.text];
                    return {
                        index: index + 1,
                        url: content.url,
                        title: content.title,
                        description: content.description,
                        favicon: content.favicon,
                        relevance_score: result.relevance_score
                    };
                });

            const result: OnlineSearchResult = {
                query: content,
                success: true,
                results: filteredResults
            };
            console.log(`BoChaSearchProcessor onlineSearch return: ${JSON.stringify(result)}`);
            return result;
        } catch (error) {
            errorReportingService.reportErrorWithException('Bocha Online Search Failed', error, 'error', 'BoChaSearchProcessor');
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            return {
                query: content,
                success: false,
                msg: errorMessage,
                results: []
            };
        }
    }
}