import * as vscode from 'vscode';
import { PluginConfig } from '../PluginConfig';
import { DiffLine, VerticalDiffHandler, VerticalDiffHandlerOptions,VerticalDiffCodeLens } from '../edit/diff/vertical/handler';
import { v4 as uuidv4 } from "uuid";
import { streamDiff } from '../edit/streamDiff';
import { Base64 } from 'js-base64';
import {VoidmuseWebViewProvider} from '../extension';
import { DiffStateManager } from '../edit/DiffStateManager';
import { DiffButtonCodeLensProvider,DiffAllButtonCodeLensProvider } from '../edit/DiffButtonCodeLensProvider';

class InlineEditService {

    private handler!: VerticalDiffHandler;
    private diffStateManager = new DiffStateManager();
    private codeLensProvider: DiffButtonCodeLensProvider;
    private codeLensAllProvider: DiffAllButtonCodeLensProvider;
    private codeLensDisposable!: vscode.Disposable;
    private codeLensAllDisposable!: vscode.Disposable;
    fileUriToCodeLens: Map<string, VerticalDiffCodeLens[]> = new Map();
    pendingEdits = new Map<string, (value: string | PromiseLike<string>) => void>();
    public refreshCodeLens: () => void = () => {};

    constructor() {
        this.codeLensProvider = new DiffButtonCodeLensProvider(this.diffStateManager);
        this.codeLensAllProvider = new DiffAllButtonCodeLensProvider(this.diffStateManager);
        // 注册 CodeLens 提供器
        this.codeLensDisposable = vscode.languages.registerCodeLensProvider(
            { scheme: 'file' },
            this.codeLensProvider
        );

        this.codeLensAllDisposable = vscode.languages.registerCodeLensProvider(
            { scheme: 'file' },
            this.codeLensAllProvider
        );
    }

    public async getCodeEdit(webviewViewProvider:VoidmuseWebViewProvider, prompt:string){
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const requestId = uuidv4();
            const selection = editor.selection;
            const document = editor.document;
            
            const prefixText = document.getText(new vscode.Range(new vscode.Position(0, 0), selection.start));
            const codeToEdit = document.getText(selection);
            const suffixText = document.getText(new vscode.Range(selection.end, document.positionAt(document.getText().length)));
            const userInput = prompt;
            const language = document.fileName.split('/').pop();
            const contexts = "";

            var message = {
                'methodName': 'editCode',
                'arg': {
                    'requestId':requestId,
                    'prefix':Base64.encode(prefixText),
                    'codeToEdit': Base64.encode(codeToEdit),
                    'suffix':Base64.encode(suffixText),
                    'userInput': userInput,
                    'language': language,
                    'contexts': contexts
                }
            };

            const editPromise = new Promise<string>((resolve, reject) => {
                        // 存储解析函数
                        this.pendingEdits.set(requestId, resolve);
                        
                        // 超时处理（5秒）
                        const timeout = setTimeout(() => {
                            this.pendingEdits.delete(requestId);
                            resolve(""); // 返回空结果
                        }, 60000);
                        
                    });
            

            webviewViewProvider.postMessageToWebview({
                command: 'callJavaScript',
                message: JSON.stringify(message)
            });

            
        }

        
    }

    public isEditRequests(requestId: string){
        const resolve = this.pendingEdits.get(requestId);
        if (resolve) {
            return true;
        }
        return false;
    }

    async handleEditResponse(requestId:string, respdata: string) {
        try {
            if(requestId !== ""){
                const resolve = this.pendingEdits.get(requestId);
                if (!resolve){
                    return;
                }
                resolve("");
            }
            
            const editor = vscode.window.activeTextEditor;
            if (!editor){
                return;
            }
            
            // 设置当前活动文件
            this.diffStateManager.setActiveFileUri(editor.document.uri);
            
            const selectedText = this.getSelectedText();
            const startLine = editor.selection.start.line;
            const endLine = editor.selection.end.line;
            
            if (respdata) {
                console.log(`response data: ${respdata}`);
                //处理返回中的```
                const lines = respdata.split("\n");
                let result = "";
                for(let index in lines){
                    if(!lines[index].includes("```")){
                        result+=lines[index]+"\n";
                    }
                }

                const oldLines = selectedText.split('\n');
                const newLineStream = result.split('\n');
                newLineStream.push('\n');

                this.diffStateManager.setAllBlock(editor.document.uri.toString(),
                        {
                            startLine:startLine,
                            endLine:endLine,
                            numRed:0,
                            numGreen:0,
                            accepted: false,
                            rejected: false
                        }
                    );

                this.handler = new VerticalDiffHandler(
                    startLine,
                    endLine + 1,
                    editor,
                    this.fileUriToCodeLens,
                    (fileUri, accept) => {
                        if (accept) {
                            this.acceptAll();
                        } else {
                            this.rejectAll();
                        }
                        this.diffStateManager.clearForFile(fileUri);

                    },
                    this.refreshCodeLens,
                    {
                        onStatusUpdate: (status, numDiffs, fileContent) => {
                            console.log(`status: ${status}, numDiffs: ${numDiffs}`);
                        }
                    }
                );

                await this.handler.run(streamDiff(oldLines, newLineStream));
                let codeLens = this.fileUriToCodeLens.get(editor.document.uri.toString()) || [];
                for (let i = 0; i < codeLens.length; i++) {
                    const block = codeLens[i];
                    // 记录 diff 块状态
                    this.diffStateManager.addDiffBlock(
                        block.start,
                        block.numRed,
                        block.numGreen,
                    );
                }
                
                 
                this.codeLensProvider.refresh();
            }
        } catch (err) {
            console.error(`getEditorResult : ${err}`);
        }
        
    }

    async acceptPartially(fileUrl: string, index: number) {
        const blocks = this.fileUriToCodeLens.get(fileUrl);
        const block = blocks?.[index];
        if (!blocks || !block) {
        return;
        }

        this.handler.acceptRejectBlock(true,block.start,block.numGreen,block.numRed);
        this.diffStateManager.acceptDiffBlock(index);
        this.codeLensProvider.refresh();
        //await this.applySingleDiffBlock(startLine);
    }

    async rejectPartially(fileUrl: string, index: number) {
        const blocks = this.fileUriToCodeLens.get(fileUrl);
        const block = blocks?.[index];
        if (!blocks || !block) {
        return;
        }

        this.handler.acceptRejectBlock(false,block.start,block.numGreen,block.numRed);

        this.diffStateManager.rejectDiffBlock(index);
        this.codeLensProvider.refresh();
        //await this.revertSingleDiffBlock(startLine);
    }

    async codeToCreateFile(content: string) {
        const newDocument = await vscode.workspace.openTextDocument({
            content: content,
        });
        await vscode.window.showTextDocument(newDocument);
    }

    codeToInsert(content: string) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, content);
            });
        }
    }

    async acceptAll() {
        await this.handler.clear(true);
        const editor = vscode.window.activeTextEditor;
        if (!editor){
            return; 
        }       
        this.diffStateManager.clearForFile(editor.document.uri.toString());
    }

    async rejectAll() {
        await this.handler.clear(false);
        const editor = vscode.window.activeTextEditor;
        if (!editor){
            return;      
        } 
        this.diffStateManager.clearForFile(editor.document.uri.toString());
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

    private getSelectedText() {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            const document = editor.document;
            const selectedText = document.getText(selection);
            return selectedText;
        }
        return '';
    }

    private getFileExtension() {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const filePath = editor.document.fileName;
            const extension = filePath.split('.').pop();
            return extension;
        }
        return '';
    }

}

export default new InlineEditService();