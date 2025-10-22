import { ChatMessageDetail } from '@/types/messages';
import ReasoningChain from './ReasoningChain';
import Markdown from './Markdown';
import McpToolDisplay from './McpToolDisplay';
import CodebaseList, { CodebaseFileItem } from '@/components/tool/CodebaseList';
import SearchList from '../tool/SearchList';
import WriteCodeDisplay from '../tool/WriteCodeDisplay';
import { SearchResultItem } from '@/types/search';
import React, { useEffect, memo } from 'react';
import { MessageStatus } from '@ant-design/x/es/use-x-chat';

interface AssistantDisplayProps {
    messages: ChatMessageDetail[];
    status: MessageStatus;
}

const AssistantDisplay: React.FC<AssistantDisplayProps> = ({ messages, status }) => {

    // Handle pairing of tool calls and results
    const processMessages = () => {
        const processedItems: React.ReactElement[] = [];
        const toolCallMap = new Map<string, { toolCall: ChatMessageDetail; toolResult?: ChatMessageDetail }>();
        
        // First pass: collect all tool_call and tool_result
        messages.forEach((message, index) => {
            if (message.type === 'tool_call' && Array.isArray(message.content)) {
                const toolCallContent = message.content[0] as any;
                if (toolCallContent?.toolCallId) {
                    toolCallMap.set(toolCallContent.toolCallId, {
                        toolCall: message,
                        toolResult: undefined
                    });
                }
            } else if (message.type === 'tool_result' && Array.isArray(message.content)) {
                const toolResultContent = message.content[0] as any;
                if (toolResultContent?.toolCallId) {
                    const existing = toolCallMap.get(toolResultContent.toolCallId);
                    if (existing) {
                        existing.toolResult = message;
                    }
                }
            }
        });
        
        // Second pass: render components
        const processedToolCallIds = new Set<string>();
        
        messages.forEach((message, index) => {
            const key = `message-${index}`;
            
            switch (message.type) {
                case 'reasoning':
                    processedItems.push(
                        <ReasoningChain
                            key={key}
                            content={typeof message.content === 'string' ? message.content : ''}
                            status={status}
                        />
                    );
                    break;
                    
                case 'normal':
                    processedItems.push(
                        <Markdown
                            key={key}
                            content={typeof message.content === 'string' ? message.content : ''}
                        />
                    );
                    break;
                    
                case 'codebase':
                    // Parse codebase content
                    let files: CodebaseFileItem[] = [];
                    // keyword is not available yet, will be added later
                    let keyword = '';
                    let errorMessage = '';
                    let messageStatus = message.status || status;

                    if (Array.isArray(message.content)) {
                        // Iterate through content data, structure is FileInfo[], convert to files 
                        files = message.content.map((fileInfo: any) => ({
                            path: fileInfo.path,
                            name: fileInfo.name,
                            startLine: fileInfo.startLine,
                            endLine: fileInfo.endLine
                        }));
                    }
                    
                    // Get error message if status is error
                    if (messageStatus === 'error' && message.error) {
                        errorMessage = message.error;
                    }
                    
                    processedItems.push(
                        <CodebaseList
                            key={key}
                            files={files}
                            keyword={keyword}
                            status={messageStatus}
                            chatStatus={status}
                            errorMessage={errorMessage}
                        />
                    );
                    break;
                    
                case 'tool_call':
                    if (Array.isArray(message.content)) {
                        const toolCallContent = message.content[0] as any;
                        const toolCallId = toolCallContent?.toolCallId;
                        
                        if (toolCallId && !processedToolCallIds.has(toolCallId)) {
                            processedToolCallIds.add(toolCallId);
                            const toolData = toolCallMap.get(toolCallId);
                            
                            if (toolCallContent?.toolName === 'webSearch') {
                                // Handle search tool
                                let results: SearchResultItem[] = [];
                                let searchIntent = '';
                                let keyword = toolCallContent?.input?.keyword || '';
                                let searchSuccess = false;
                                let errorMessage = '';
                                
                                if (toolData?.toolResult && Array.isArray(toolData.toolResult.content)) {
                                    const resultContent = toolData.toolResult.content[0] as any;
                                    searchSuccess = resultContent?.output?.success || false;
                                    
                                    if (searchSuccess && resultContent?.output?.results) {
                                        results = resultContent.output.results.map((item: any, idx: number) => ({
                                            index: idx + 1,
                                            title: item.title || '',
                                            url: item.url || '',
                                            description: item.snippet || '',
                                            favicon: item.favicon
                                        }));
                                    } else if (!searchSuccess) {
                                        errorMessage = resultContent?.output?.error || 'Search failed';
                                    }
                                    
                                    searchIntent = resultContent?.output?.searchIntent || '';
                                }
                                
                                processedItems.push(
                                    <SearchList
                                        key={key}
                                        results={searchSuccess ? results : []}
                                        status={toolData?.toolResult?.status || status}
                                        searchIntent={searchIntent}
                                        keyword={keyword}
                                        errorMessage={!searchSuccess ? errorMessage : undefined}
                                    />
                                );
                            } else if (toolCallContent?.toolName === 'writeCode') {
                                // Handle code writing tool
                                let fileName = '';
                                let filePath = '';
                                let updatedCode = '';
                                
                                // Get file information from tool parameters
                                if (toolCallContent?.input) {
                                    fileName = toolCallContent.input.fileName || '';
                                    filePath = toolCallContent.input.filePath || '';
                                    updatedCode = toolCallContent.input.updatedCode || '';
                                }
                                
                                processedItems.push(
                                    <WriteCodeDisplay
                                        key={key}
                                        fileName={fileName}
                                        filePath={filePath}
                                        updatedCode={updatedCode}
                                        status={toolData?.toolResult?.status || status}
                                        args={toolCallContent?.input || {}}
                                        result={toolData?.toolResult || {}}
                                    />
                                );
                            } else {
                                // Handle other MCP tools
                                let resultContent = '';
                                
                                if (toolData?.toolResult && Array.isArray(toolData.toolResult.content)) {
                                    const resultData = toolData.toolResult.content[0] as any;
                                    resultContent = resultData?.output || resultData?.content || '';
                                }
                                
                                processedItems.push(
                                    <McpToolDisplay
                                        key={key}
                                        toolName={toolCallContent?.toolName || 'Unknown tool'}
                                        status={toolData?.toolResult?.status || status}
                                        args={toolCallContent?.input || {}}
                                        result={resultContent}
                                    />
                                );
                            }
                        }
                    }
                    break;
                    
                default:
                    // Other types not handled yet
                    break;
            }
        });
        // console.log('processedItems', processedItems);
        return processedItems;
    };

    return (
        <>
            {processMessages()}
        </>
    );
};

export default AssistantDisplay;