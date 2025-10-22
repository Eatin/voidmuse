import { ChatMessage } from '@/types/messages';
import { ToolResultPart, CoreSystemMessage, CoreUserMessage, CoreAssistantMessage, CoreToolMessage, ToolCallPart } from 'ai';

/**
 * Message Converter
 * Responsible for converting between internal message format and API message format
 */
export class MessageConverter {
    private static instance: MessageConverter;

    private constructor() {
    }

    public static getInstance(): MessageConverter {
        if (!MessageConverter.instance) {
            MessageConverter.instance = new MessageConverter();
        }
        return MessageConverter.instance;
    }

    /**
     * Convert internal message format to API request format
     * @param messages Internal messages
     * @param modelName Model name, used to replace placeholders in system messages
     * @returns API messages
     */
    convertToApiFormat(messages: ChatMessage[], prompt: string): Array<CoreSystemMessage | CoreUserMessage | CoreAssistantMessage | CoreToolMessage> {

        const apiMessages: Array<CoreSystemMessage | CoreUserMessage | CoreAssistantMessage | CoreToolMessage> = [];

        for (const message of messages) {
            if (message.role === 'user') {
                // Add user message directly
                apiMessages.push({
                    role: 'user',
                    content: message.content
                });
            } else if (message.role === 'assistant') {
                // Process assistant message
                this.processAssistantMessage(message, apiMessages);
            }
        }
        // Add latest user message
        apiMessages.push({
            role: 'user',
            content: prompt
        });
        return apiMessages;
    }

    /**
     * Process assistant message
     * @param message Assistant message
     * @param apiMessages API message array for adding results
     */
    private processAssistantMessage(message: ChatMessage, apiMessages: Array<CoreSystemMessage | CoreUserMessage | CoreAssistantMessage | CoreToolMessage>): void {

        // Process sub-message list
        if (message.messages && message.messages.length > 0) {

            for (const subMessage of message.messages) {
                if (subMessage.type === 'tool_call') {
                    // Add tool call
                    apiMessages.push({
                        role: 'assistant',
                        content: subMessage.content as ToolCallPart[]
                    });
                } 
                else if (subMessage.type === 'tool_result') {
                    // Add tool response
                    apiMessages.push({
                        role: 'tool',
                        content: subMessage.content as ToolResultPart[]
                    });
                } 
                else if (subMessage.type === 'normal') {
                    // Add final response content
                    apiMessages.push({
                        role: 'assistant',
                        content: subMessage.content as string
                    });
                }
            }
        }
    }
}