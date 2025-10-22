// Provide a unified routing method, with method names in parameters for dispatch calls
import { base64Decode, base64DecodeArray } from '@/utils/Base64Utils';
import { aiModelService } from '@/services/llm/AIModelService';
import vscodeMgr from './vscodeMgr';
import { ModelItem } from '@/types/models';
import { storageService } from '@/storage/index'
import { isVscodePlatform } from '@/utils/PlatformUtils';
import { McpService } from '../services/McpService';
import mitt from 'mitt';
import React from 'react';

// Create event bus
const emitter = mitt();

// Export event bus for use by other modules
export { emitter };

interface ParsedMessage {
    methodName: string;
    arg: any;
}

interface CodeCompletionArg {
    requestId: string;
    prefix: string;
    suffix: string;
    language: string;
    modelConfig: ModelItem; 
    contexts: any;
}

interface AddToChatArg {
    prefix: string;
    selected: string;
    suffix: string;
    startLineNumber: number;
    endLineNumber: number;
    fileName: string;
    filePath: string;
}

interface EditCodeArg {
    requestId: string;
    codeToEdit: string;
    prefix: string;
    suffix: string;
    userInput: string;
    language: string;
    contexts: any;
}

interface EditCodeInChatArg {
    requestId: string;
    selected: string;
    language: string;
    startLineNumber: number;
    endLineNumber: number;
    fileName: string;
    filePath: string;
}

interface OptimizeCodebasePromptArg {
    requestId: string;
    userInput: string;
}

interface GetEmbeddingsArg {
    requestId: string;
    input: string[];
}

interface SetThemeArg {
    requestId: string;
    theme: string;
}

interface RegisterMcpserverArg {
    config: string;
}

// Route to corresponding method based on methodName
const callJavaScript = async (message: string): Promise<void> => {
    try {
        console.log('callJavascript', message);
        // message is json string data, convert to corresponding object
        const parsedMessage: ParsedMessage = JSON.parse(message); // Convert json string to object
        // console.log('routeRequest methodName:', parsedMessage.methodName, 'data:', parsedMessage.arg); // Print methodName and data parameters
        switch (parsedMessage.methodName) {
            // More routes can be added here
            case 'addToChat':
                addToChat(parsedMessage.arg);
                break;
            case 'editCode':
                editCode(parsedMessage.arg);
                break;
            case 'editCodeInChat':
                editCodeInChat(parsedMessage.arg);
                break;
            case 'codeCompletion':
                codeCompletion(parsedMessage.arg);
                break;
            case 'optimizeCodebasePrompt':
                optimizeCodebasePrompt(parsedMessage.arg);
                break;
            case 'getEmbeddings':
                getEmbeddings(parsedMessage.arg);
                break;
            case 'setTheme':
                setTheme(parsedMessage.arg);
                break;
            case 'registerMcpserver':
                registerMcpserver(parsedMessage.arg);
                break;
            default:
                throw new Error(`Undefined methodName: ${parsedMessage.methodName}`); // Handle undefined methodName
        }
    } catch (error) {
        console.error('callJavaScript error occurred:', error); // Catch and print error information
    }
};

const editCode = async (arg: EditCodeArg): Promise<void> => {
    try {
        const requestId = arg.requestId;
        const codeToEdit = base64Decode(arg.codeToEdit);
        const prefix = base64Decode(arg.prefix);
        const suffix = base64Decode(arg.suffix);
        const userInput = arg.userInput;
        const language = arg.language;
        const contexts = arg.contexts;

        const modelConfig = await storageService.getSelectedModelConfig();
        
        const editedCode = await aiModelService.editCode(codeToEdit, prefix, suffix, userInput, language, contexts, modelConfig);
        handleJsCallback(requestId, editedCode);
    } catch (error) {
        console.error('editCode error:', arg, error);
    }
}

const editCodeInChat = async (arg: EditCodeInChatArg): Promise<void> => {
    try {
        const requestId = arg.requestId;
        const selected = base64Decode(arg.selected);
        const start = arg.startLineNumber;
        const end = arg.endLineNumber;
        const fileName = arg.fileName;
        const filePath = arg.filePath;


        // Construct message data to send to chat
        const editCodeData = {
            selected,
            start,
            end,
            fileName,
            filePath
        };

        emitter.emit('editCodeInChat', editCodeData);

        console.log('editCodeInChat - send emitter success:', editCodeData);
    } catch (error) {
        console.error('editCodeInChat error:', arg, error);
    }
}

const codeCompletion = async (arg: CodeCompletionArg): Promise<void> => {
    try {
        const requestId = arg.requestId;
        const prefix = base64Decode(arg.prefix);
        const suffix = base64Decode(arg.suffix);
        const language = arg.language;
        const contexts = arg.contexts;

        const modelConfig = await storageService.getSelectedModelConfig();
        const codeCompletion = await aiModelService.codeComplete(prefix, suffix, language, contexts, modelConfig);
        handleJsCallback(requestId, codeCompletion);
    } catch (error) {
        console.error('codeCompletion error:', arg, error);
    }
}

const addToChat = (arg: AddToChatArg): void => {
    try {
        // Use base64Decode function to decode
        const decodedArg = {
            prefix: base64Decode(arg.prefix),
            selected: base64Decode(arg.selected),
            suffix: base64Decode(arg.suffix),
            startLineNumber: arg.startLineNumber,
            endLineNumber: arg.endLineNumber,
            fileName: arg.fileName,
            filePath: arg.filePath
        };

        const chatData = {
            selected: decodedArg.selected,
            start: decodedArg.startLineNumber,
            end: decodedArg.endLineNumber,
            fileName: decodedArg.fileName,
            filePath: decodedArg.filePath
        };

        // Use mitt to emit message
        emitter.emit('addToChat', chatData);

        console.log('addToChat - message sent:', chatData);
    } catch (error) {
        console.error('addToChat error:', arg, error);
    }
}

const optimizeCodebasePrompt = async (arg: OptimizeCodebasePromptArg): Promise<void> => {
    try {
        const requestId = arg.requestId;
        const userInput = arg.userInput;
        const modelConfig = await storageService.getSelectedModelConfig();
        const result = await aiModelService.optimizeCodebasePrompt(userInput, modelConfig);
        handleJsCallback(requestId, result);
    } catch (error) {
        console.error('optimizeCodebasePrompt error:', arg, error);
    }
}

const getEmbeddings = async (arg: GetEmbeddingsArg): Promise<void> => {
    try {
        const modelConfig = await storageService.getSelectedEmbeddingModelConfig();
        const result = await aiModelService.getEmbeddings(base64DecodeArray(arg.input), modelConfig, arg.requestId);
        handleJsCallback(arg.requestId, result);
        emitter.emit('getEmbeddings', {});
    } catch (error) {
        console.error('getEmbeddings error:', arg, error);
    }
}

const setTheme = async (arg: SetThemeArg): Promise<void> => {
    try {
        const requestId = arg.requestId;
        const theme = arg.theme;

        // Notify React components to update theme through event bus
        emitter.emit('themeChange', theme);
    } catch (error) {
        console.error('setTheme error:', arg, error);
    }
}

const registerMcpserver = async (arg: RegisterMcpserverArg): Promise<void> => {
    try {
        const configStr = base64Decode(arg.config);
        const config = JSON.parse(configStr);
        const name = Object.keys(config.mcpServers)[0]; 
        var url = ""
        var command = ""
        let args:string[] = []
        let headers:Record<string,string> = {}
        if (config.mcpServers && config.mcpServers[name]) {
            console.log("Server Name:", name);
            if(config.mcpServers[name].url){
                url = config.mcpServers[name].url
                console.log("Server URL:", url);
                if(config.mcpServers[name].headers){
                    headers = config.mcpServers[name].headers
                }
            }else if(config.mcpServers[name].command){
                command = config.mcpServers[name].command
                args = config.mcpServers[name].args
            }               
        }
        const newMcp = {
            key: Date.now().toString(),
            name: name,
            url: url,
            command: command,
            args: args,
            headers: headers,
            config: configStr,
            connected:false,
            enabled: true,
            tools: []
        };

        console.log(`Added MCP object: ${JSON.stringify(newMcp)}`)
        await McpService.addMcp(newMcp);

    } catch (error) {
        console.error('Added MCP error:', arg, error);
    }
}

// Callback to native: Native calling js cannot get results in real time, can only get through callback
const handleJsCallback = (requestId: string, data: any): void => {
    // Only trigger callback when requestId is not empty
    if (requestId) {
        const param = JSON.stringify({
            'methodName': "handleJsCallback",
            'arg': { 'requestId': requestId, 'data': data } // 将数据传入
        });
        console.log('handleJsCallback, param', param.substring(0, 150));
        // Check if window.callJava method exists, call only if it exists
        if (typeof window.callJava === 'function') {
            window.callJava({
                request: param,
                onSuccess: function (response: any) {
                    // console.log('handleJsCallback callback success:', response);
                },
                onFailure: function (error_code: any, error_message: any) {
                    // console.error('handleJsCallback callback failed:', error_code, error_message);
                }
            });
        }
        else if (isVscodePlatform()) {
            //vscode handling
            vscodeMgr.sendMessage(param,
                function onSuccess(response: any) {
                    console.log('vscode code callback success');
                },
                function onFailure(error_code: any, error_message: any) {
                    console.error('vscode method call error:', error_code, error_message);
                }
            );
        }
        else {
            console.error('handleJsCallback error: not found platform');
        }
    }
}

// Register callJavaScript method to global
window.callJavaScript = callJavaScript;