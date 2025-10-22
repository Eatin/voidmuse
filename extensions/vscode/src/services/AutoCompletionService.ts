import * as vscode from 'vscode';
import { v4 as uuidv4 } from "uuid";
import { Base64 } from 'js-base64';
import {VoidmuseWebViewProvider} from '../extension';
import { CancellationToken } from 'vscode';

export interface CodeContext{
    type:string;
    name:string;
    context:string
}


class AutoCompletionService {

    private debounceTimeout: NodeJS.Timeout | undefined = undefined;
    private debouncing = false;
    private lastUUID: string | undefined = undefined;
    pendingCompletions = new Map<string, (items: vscode.InlineCompletionItem[]) => void>();
    requestPositions = new Map<string, vscode.Position>();

    private static instance: AutoCompletionService;
  
    public static getInstance() {
        if (!AutoCompletionService.instance) {
            AutoCompletionService.instance = new AutoCompletionService();
        }

        return AutoCompletionService.instance;
    }

    private constructor() {
    }

    public async getCodeCompletion(WebviewViewProvider:VoidmuseWebViewProvider,token: CancellationToken,position: vscode.Position){
        const requestId = uuidv4();
        let code = {type: this.getFileExtension(), name: this.getFileName(),context: this.getFileContent()};

        var message = {
            'methodName': 'codeCompletion',
            'arg': {
                'requestId':requestId,
                'prefix':Base64.encode(this.getPrefix()),
                'suffix':Base64.encode(this.getSuffix()),
                'language': this.getFileExtension(),
                //'contexts':[code]
            }
        };
        
        // 创建Promise并存储resolve函数
        const completionPromise = new Promise<vscode.InlineCompletionItem[]>((resolve, reject) => {
            // 存储解析函数
            this.pendingCompletions.set(requestId, resolve);
            this.requestPositions.set(requestId, position);
            
            // 超时处理（5秒）
            const timeout = setTimeout(() => {
                this.pendingCompletions.delete(requestId);
                resolve([]); // 返回空结果
            }, 60000);
            
        });

        WebviewViewProvider.postMessageToWebview({
            command: 'callJavaScript',
            message: JSON.stringify(message)
        });

        return completionPromise;
    }

    public isCompleteRequests(requestId: string){
        const resolve = this.pendingCompletions.get(requestId);
        if (resolve) {
            return true;
        }
        return false;
    }

    // 处理WebView返回的补全结果
    public handleCompletionResponse(requestId: string,data: string) {
        
        const resolve = this.pendingCompletions.get(requestId);
        if (!resolve){
            return;
        }
        //处理返回中的```
        const lines = data.split("\n");
        let result = "";
        for(let index in lines){
            if(!lines[index].includes("```")){
                result+=lines[index]+"\n";
            }
        }
        
        // 转换为VS Code补全项
        const items: vscode.InlineCompletionItem[] = [];
        const completionItem = new vscode.InlineCompletionItem('');
        completionItem.insertText = result;
        var position = this.requestPositions.get(requestId);
        if(!position){
            position = new vscode.Position(0,0);
        }

        completionItem.range = new vscode.Range(position, position);
        items.push(completionItem);

        resolve(items); // 解析Promise
        this.pendingCompletions.delete(requestId);
    }

    private getPrefix() {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const position = editor.selection.active; // 获取当前光标位置
            const textBeforeCursor = editor.document.getText(new vscode.Range(new vscode.Position(0, 0), position)); // 获取光标之前的内容
            return textBeforeCursor;
        }
        return '';
    }

    private getSuffix() {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const position = editor.selection.active; // 获取当前光标位置
            const textAfterCursor = editor.document.getText(new vscode.Range(position, editor.document.positionAt(editor.document.getText().length))); // 获取光标之后的全部内容
            return textAfterCursor;
        }
        return '';
    }

    private getFileContent(){
        const editor = vscode.window.activeTextEditor;
        if (editor) {          
            return editor.document.getText;
        }
    }


    private getFileName(){
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            let fileName = editor.document.fileName;
            return fileName;
        }
    }

    private getFileExtension(){
        const fileName = this.getFileName();
        if(fileName){
            return fileName.substring(fileName.lastIndexOf('.'));
        }
        
    }

    async delayAndShouldDebounce(debounceDelay: number): Promise<boolean> {
        const uuid = uuidv4();
        this.lastUUID = uuid;

        if (this.debouncing) {
            this.debounceTimeout?.refresh();
            const lastUUID = await new Promise((resolve) =>
                setTimeout(() => {
                    resolve(this.lastUUID);
                }, debounceDelay),
            );
            if (uuid !== lastUUID) {
                return true;
            }
        } else {
            this.debouncing = true;
            this.debounceTimeout = setTimeout(async () => {
                this.debouncing = false;
            }, debounceDelay);
        }

        return false;
    }

}


export default AutoCompletionService.getInstance();