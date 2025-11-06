import React, { createContext, useState, useContext, ReactNode, useEffect, useRef, useCallback } from 'react';
import { message } from 'antd';
import { storageService } from '@/storage';
import { useXAgent, useXChat } from '@ant-design/x';
import type { MessageInfo } from '@ant-design/x/es/use-x-chat';
import { ChatMessage, ChatMessageDetail } from '@/types/messages';
import { ContextItem } from '@/types/context';
import { ModelItem } from '@/types/models';
import { debounce } from 'lodash';
import { ContextItemCoordinator } from '@/services/context';
import { useProjectContext } from './ProjectContext';
import { PromptService } from '@/services/PromptService';
import { ProjectInfoResponse } from '@/types/ide';
import { TimingInfo, TokenUsage } from '@/services/llm/types';
import { streamText, tool, stepCountIs } from 'ai';
import { MessageConverter } from '@/services/llm/MessageConverter';
import { ModelFactory } from '@/services/llm/ModelFactory';
import { webSearchTool, writeCodeTool } from '@/services/tool';
import { TokenUsageService, McpService } from '@/services';
import { errorReportingService } from '@/services/ErrorReportingService';
import { useMcpContext } from './McpContext';
import { useTranslation } from 'react-i18next';
import { extractErrorMessage } from '@/utils/ErrorUtils';


interface ChatContextType {
    currentChatId: string | null;
    setCurrentChatId: (id: string | null) => void;
    createNewSession: () => void;
    loadChatSession: (chatId: string) => Promise<void>;
    messages: MessageInfo<ChatMessage>[];
    loading: boolean;
    sendMessage: (htmlText: string, plainText: string, contextItems?: ContextItem[], messageHistory?: MessageInfo<ChatMessage>[]) => void;
    retryMessage: (messageIndex: number) => void;
    cancelRequest: () => void;
    mode: 'ask' | 'agent';
    setMode: (mode: 'ask' | 'agent') => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);


interface ResponseResult {
    timingInfo: TimingInfo;
    tokenUsage: TokenUsage;
    finalMessages: ChatMessageDetail[];
}

interface InputData {
    role: string;
    content: string;
    messages: ChatMessageDetail[];
    _historyMsgList?: MessageInfo<ChatMessage>[];
}

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { t } = useTranslation('errors');
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'ask' | 'agent'>('ask');
    const modeRef = useRef<'ask' | 'agent'>('ask');
    const modelRef = useRef<ModelItem | null>(null);
    const contextItemCoordinator = useRef<ContextItemCoordinator>(new ContextItemCoordinator());
    const abortController = useRef<AbortController | null>(null);
    const { projectInfo } = useProjectContext();
    const { mcps } = useMcpContext();
    const projectInfoRef = useRef<ProjectInfoResponse | null>(null);

    useEffect(() => {
        projectInfoRef.current = projectInfo;
    }, [projectInfo]);

    const updateOrAddMessage = (
        messages: ChatMessageDetail[],
        type: 'normal' | 'reasoning' | 'assistant',
        content: string,
        status: 'loading' | 'success' = 'loading'
    ): ChatMessageDetail[] => {
        const updatedMessages = [...messages];
        // Get the last message: if the last message matches the input type, append to the last message
        const lastMsg = updatedMessages[updatedMessages.length - 1];
        const msgIndex = lastMsg?.type === type ? updatedMessages.length - 1 : -1;

        if (msgIndex >= 0) {
            // Update existing message
            updatedMessages[msgIndex] = {
                ...updatedMessages[msgIndex],
                content: content,
                status: status
            };
        } else {
            // Add new message
            updatedMessages.push({
                content: content,
                status: status,
                type: type
            });
        }

        return updatedMessages;
    };

    const getToolsFromContextItems = async (contextItems?: ContextItem[]) => {
        const tools: Record<string, any> = {};

        // Check if contextItems contains search type
        const hasSearchContext = contextItems?.some(item => item.type === 'search');

        if (hasSearchContext) {
            tools.webSearch = webSearchTool;
        }

        // Agent mode logic:
        // 1. Current contextItems contains fileEdit type OR
        // 2. Current conversation is already in agent mode
        const hasFileEditContext = contextItems?.some(item => item.type === 'fileEdit');
        const currentMode = modeRef.current;
        const shouldEnableWriteCode = hasFileEditContext || currentMode === 'agent';
        console.log(`current mode: ${currentMode}, has file edit context: ${hasFileEditContext}, should enable write code: ${shouldEnableWriteCode}`);
        
        if (shouldEnableWriteCode) {
            tools.writeCode = writeCodeTool;
            
            // If fileEdit type is detected and current mode is not agent, activate agent mode
            if (hasFileEditContext && currentMode !== 'agent') {
                setMode('agent');
                modeRef.current = 'agent';
            }
        }

        // Use McpService to get MCP tools
        //const mcpTools = await McpService.getToolsFromConfigs(mcps, true);
        // Get MCP tools through IDE
        // const mcpTools = await McpService.getToolsFromIde();
        // Object.assign(tools, mcpTools);

        console.log(tools)
        return tools;
    };

    useEffect(() => {
        modeRef.current = mode;
        console.log('mode changed to:', mode);
    }, [mode]);

    const callStreamAPI = async (historyList: any[], promptContent: string, 
        onUpdate: (data: any) => void, onSuccess: (data: any) => void, 
        selectedModel: ModelItem, contextItems?: ContextItem[]) => {

        const model = ModelFactory.createModel(selectedModel);            

        const startTime = Date.now();

        const tools = await getToolsFromContextItems(contextItems);

        const result = streamText({
            model: model,
            messages: MessageConverter.getInstance().convertToApiFormat(historyList.map(msg => msg.message), promptContent),
            system: PromptService.getSystemPrompt({
                modelName: modelRef.current?.name || '',
                projectInfo: projectInfo,
                tools: tools
            }),
            tools: tools,
            stopWhen: stepCountIs(5),
            abortSignal: abortController.current?.signal,
            onError: (error) => {
                handleApiError(error, onUpdate, onSuccess, selectedModel);
            }
        });

        return { result, startTime };
    };

    const processStreamData = async (apiResult: any, assistantMessages: ChatMessageDetail[], onUpdate: (data: any) => void): Promise<ResponseResult> => {
        const { result, startTime } = apiResult;
        let firstTokenTime: number | undefined;
        let hasReceivedFirstToken = false;
        let finalText = '';
        let reasoning = '';

        let finalMessages = [...assistantMessages];

        for await (const part of result.fullStream) {
            if (!hasReceivedFirstToken) {
                firstTokenTime = Date.now() - startTime;
                hasReceivedFirstToken = true;
            }

            if (part.type === 'text-delta') {
                finalText += part.text;
                finalMessages = updateOrAddMessage(finalMessages, 'normal', finalText);
                onUpdate({ role: 'assistant', content: finalText, messages: finalMessages, status: 'loading' });
            } else if (part.type === 'reasoning-delta') {
                reasoning += part.text;
                finalMessages = updateOrAddMessage(finalMessages, 'reasoning', reasoning);
                onUpdate({ role: 'assistant', content: reasoning, messages: finalMessages, status: 'loading' });
            } else if (part.type === 'tool-call') {
                const toolCallMessage: ChatMessageDetail = {
                    type: 'tool_call',
                    content: [{
                        type: 'tool-call',
                        toolCallId: part.toolCallId,
                        toolName: part.toolName,
                        input: part.input
                    }],
                    status: 'loading'
                };
                finalMessages.push(toolCallMessage);

                // Update UI to show tool call
                onUpdate({ role: 'assistant', content: `tool call: ${part.toolName}`, messages: finalMessages, status: 'loading' });

                console.log('tool call', part, finalMessages);

            } else if (part.type === 'tool-result') {
                const toolResultMessage: ChatMessageDetail = {
                    type: 'tool_result',
                    content: [{
                        type: 'tool-result',
                        toolCallId: part.toolCallId,
                        toolName: part.toolName,
                        output: part.output
                    }],
                    status: 'success'
                };
                finalMessages.push(toolResultMessage);

                // Update UI to show tool result
                onUpdate({ role: 'assistant', content: `tool call completed: ${part.toolName}`, messages: finalMessages, status: 'loading' });
                console.log('tool call completed', part, finalMessages);
            }
        }

        // Calculate total latency and build timing information
        const totalLatency = Date.now() - startTime;
        const timingInfo: TimingInfo = {
            firstTokenLatency: firstTokenTime,
            totalLatency: totalLatency
        };

        const selectedModel = await storageService.getSelectedModelConfig();
        let usage = await result.usage;
        const providerMetadata = await result.providerMetadata;
        const baseTokenUsage = {
            promptTokens: usage.inputTokens || usage.prompt_tokens || 0,
            completionTokens: usage.outputTokens || usage.completion_tokens || 0,
            totalTokens: usage?.totalTokens || 0
        };
        
        let tokenUsage = {
            ...baseTokenUsage,
            // OpenRouter can directly get data from interface response
            cost: providerMetadata?.openrouter?.usage?.cost || TokenUsageService.getInstance().calculateCost(baseTokenUsage, selectedModel)
        };
        
        if (selectedModel && usage) {
            TokenUsageService.getInstance().saveTokenUsage(tokenUsage, 'Chat', selectedModel);
        }

        return {
            timingInfo,
            tokenUsage,
            finalMessages
        };
    };

    const updateFinalSuccessData = (responseResult: ResponseResult, onUpdate: (data: any) => void, onSuccess: (data: any) => void) => {
        const { timingInfo, tokenUsage } = responseResult;
        // Iterate through finalMessages data, set all status to success
        const finalMessages = responseResult.finalMessages.map(message => ({
            ...message,
            status: message.status === 'error' ? 'error' : 'success'
        }));

        // Update final data: onUpdate cannot be removed or final data won't update, calling onSuccess alone has no effect, reason not yet investigated
        onUpdate({ role: 'assistant', content: '', messages: finalMessages, status: 'success', timing: timingInfo, tokenUsage: tokenUsage });
        onSuccess([{ role: 'assistant', content: '', messages: finalMessages, status: 'success', timing: timingInfo, tokenUsage: tokenUsage }]);
    };

    const prepareContextItem = async (message: InputData) => {
        const { content, messages: msgDetails = [], _historyMsgList = [] } = message;
        // Extract contextItems
        const contextItems = msgDetails.length > 0 && msgDetails[0].contextItems
            ? msgDetails[0].contextItems
            : [];
        console.log('prepareContextItem', content, contextItems);

        // Process context
        const context = await contextItemCoordinator.current.processContextItems(content, contextItems);
        const processResult = context.buildResult();

        return { processResult, historyList: _historyMsgList, contextItems };
    };

    const handleApiError = (error: any, onUpdate: (data: any) => void, onSuccess: (data: any) => void, modelConfig?: any) => {
        // Build model information
        const additionalInfo = modelConfig 
            ? `Provider: ${modelConfig.provider || 'unknown'}\nURL: ${modelConfig.baseUrl || 'default'}`
            : 'No model configured';
        
        errorReportingService.reportErrorWithException('Chat Request Failed', error, 'error', 'ChatContext', additionalInfo);
        const errorMsg = extractErrorMessage(error);
        setLoading(false);
        const errorContent = `request fail: ${errorMsg}`;
        onUpdate({ role: 'assistant', content: errorContent, messages: [{ type: 'normal', content: errorContent }], status: 'success' });
        onSuccess([{ role: 'assistant', content: errorContent, messages: [{ type: 'normal', content: errorContent }], status: 'success' }]);
    };

    const debounceSave = useCallback(
        debounce(async (msgs) => {
            if (!msgs || msgs.length === 0) return;
            try {
                const savedChatId = await storageService.setChat(
                    projectInfoRef.current?.projectName || 'default',
                    msgs,
                    currentChatId || undefined,
                    mode
                );

                if (!currentChatId) {
                    setCurrentChatId(savedChatId);
                }
                console.log(`currentChatId: ${currentChatId} , chat history saved: ${savedChatId}`);
            } catch (error) {
                console.error('save chat history fail:', error);

            }
        }, 1000),
        [currentChatId, projectInfoRef.current?.projectName, setCurrentChatId, mode]
    );

    const updateLastUserMessage = (msgs: MessageInfo<ChatMessage>[], promptContent: string): MessageInfo<ChatMessage>[] => {
        // Find the last user message in the latest message list
        const lastUserMessageIndex = msgs.findLastIndex(item =>
            item.message.role === 'user'
        );

        if (lastUserMessageIndex !== -1) {
            const userMessageInfo = msgs[lastUserMessageIndex];

            // Create updated message object
            const updatedMessage = {
                role: userMessageInfo.message.role,
                messages: userMessageInfo.message.messages,
                status: userMessageInfo.message.status,
                content: promptContent  // Update content with processed complete prompt
            };

            // Update the last user message in message list
            return msgs.map(item =>
                item.id === userMessageInfo.id
                    ? { ...item, message: updatedMessage }
                    : item
            );
        }

        // If no user message found, return original message list
        return msgs;
    };

    // Retry message
    const retryMessage = (messageIndex: number) => {
        // 1. First get user message data
        let userMessageContent = '';
        let userMessageHtml = '';
        let userContextItems: ContextItem[] = [];
        let userMessageIndex = -1;

        // Find the most recent user message before current assistant message
        for (let i = messageIndex - 1; i >= 0; i--) {
            if (messages[i].message.role === 'user') {
                userMessageContent = messages[i].message.messages[0].plainText || messages[i].message.content;
                userMessageHtml = messages[i].message.messages[0].content || messages[i].message.content;
                userContextItems = messages[i].message.messages[0].contextItems || [];
                userMessageIndex = i;
                break;
            }
        }

        if (userMessageIndex === -1) {
            // If no corresponding user message found, return directly
            return;
        }

        // 2. Keep all messages before user message
        const newMessages = messages.slice(0, userMessageIndex);

        // 3. Set message state
        setMessages(newMessages);

        // 4. Use setTimeout to ensure state update before sending message
        setTimeout(() => {
            sendMessageWithHistory(userMessageHtml, userMessageContent, userContextItems, newMessages);
        }, 0);
    };

    const createNewSession = () => {
        setCurrentChatId(null);
        setMessages([]);
        setMode('ask');  // Reset to ask mode
    };

    const loadChatSession = async (chatId: string) => {
        try {
            const result = await storageService.getChat(projectInfoRef.current?.projectName || 'default', chatId);
            // console.log('loadChatSession result:', result);
            if (result && result.messages) {
                setCurrentChatId(chatId);
                setMessages(result.messages as unknown as MessageInfo<ChatMessage>[]);
                
                // Restore chat mode state
                const chatDetail = await storageService.getChatDetail(
                    projectInfoRef.current?.projectName || 'default', 
                    chatId
                );
                setMode(chatDetail?.mode || 'ask');
            }
        } catch (error) {
            console.error('loadChatSession fail:', error);
        }
    };

    // Setup XAgent
    const [agent] = useXAgent<any, { message: InputData }, ChatMessage>({
        request: async ({ message: reqMessage }, { onSuccess, onUpdate, onStream }) => {
            // Create AbortController for cancellation: create a new one for each request
            if (onStream) {
                onStream(new AbortController());
            }
            let selectedModel: ModelItem | null = null;
            try {
                selectedModel = await storageService.getSelectedModelConfig();
            } catch (error) {
                const errorMsg = t('context.model.noModelConfigured');
                message.error(errorMsg);
                handleApiError(error, onUpdate, onSuccess);
                return;
            }
            
            try {
                // 0. First add an assistant message: can have loading state, but currently auto-scroll only works when second-to-last message is visible
                onUpdate({ role: 'assistant', content: '', messages: [], status: 'loading' });
                // 1. Prepare context content
                const { processResult, historyList, contextItems } = await prepareContextItem(reqMessage);


                // 2. Update last user message
                setMessages(msgs => updateLastUserMessage(msgs, processResult.promptContent));

                // 3. If there are assistant messages that need to be displayed first
                if (processResult.assistantMessages.length > 0) {
                    onUpdate({ role: 'assistant', content: '', messages: processResult.assistantMessages, status: 'loading' });
                }

                // 4. Call API
                const apiResult = await callStreamAPI(historyList, processResult.promptContent, onUpdate, onSuccess, selectedModel, contextItems);

                // 5. Consume stream data for real-time updates
                const responseResult = await processStreamData(apiResult, processResult.assistantMessages, onUpdate);

                // 6. Final success data update
                updateFinalSuccessData(responseResult, onUpdate, onSuccess);
                setLoading(false);
            } catch (error) {
                if ((error as Error).name === 'AbortError') {
                    return;
                }
                handleApiError(error, onUpdate, onSuccess, selectedModel);
            }
        },
    });

    const { messages, onRequest, setMessages } = useXChat({
        agent,
        resolveAbortController: (controller) => {
            abortController.current = controller;
        },
        requestFallback: (_, { error }) => {
            return {
                role: 'assistant',
                content: 'Request failed, please retry',
                messages: [{
                    content: 'Request failed, please retry',
                    status: 'success',
                    type: 'normal'
                }]
            };
        }
    });

    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
            setLoading(false);
            console.log('receive cancelRequest');
        }
    };

    const sendMessage = (htmlText: string, plainText: string, contextItems: ContextItem[] = []) => {
        sendMessageWithHistory(htmlText, plainText, contextItems, messages);
    };

    // Message sending handler method
    const sendMessageWithHistory = (htmlText: string, plainText: string, contextItems: ContextItem[] = [], messageHistory: MessageInfo<ChatMessage>[] = []) => {
        // If there's currently a message being output, cancel current message output first
        cancelRequest();
        // Send logic: delayed execution, let cancel send complete first
        setTimeout(() => {
            setLoading(true);
            onRequest({
                role: 'user',
                content: plainText,
                messages: [
                    {
                        content: htmlText,
                        plainText: plainText,
                        status: 'success',
                        type: 'normal',
                        contextItems: contextItems
                    }
                ],
                _historyMsgList: messageHistory
            });
        }, 0);
    };

    // Save message history
    useEffect(() => {
        if (messages && messages.length > 0) {
            debounceSave(messages);
        }
    }, [messages, debounceSave]);

    return (
        <ChatContext.Provider
            value={{
                currentChatId,
                setCurrentChatId,
                createNewSession,
                loadChatSession,
                messages,
                loading,
                sendMessage,
                retryMessage,
                cancelRequest,
                mode,
                setMode
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChatContext = () => {
    const { t } = useTranslation('errors');
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error(t('context.chat.contextError'));
    }
    return context;
};