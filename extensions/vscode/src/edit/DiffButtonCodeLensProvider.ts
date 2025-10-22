import * as vscode from 'vscode';
import { DiffStateManager } from './DiffStateManager';

export class DiffButtonCodeLensProvider implements vscode.CodeLensProvider {
    private onDidChangeCodeLensesEmitter = new vscode.EventEmitter<void>();
    readonly onDidChangeCodeLenses = this.onDidChangeCodeLensesEmitter.event;

    constructor(private diffStateManager: DiffStateManager) {}

    refresh() {
        this.onDidChangeCodeLensesEmitter.fire();
    }

    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        const codeLenses: vscode.CodeLens[] = [];
        const fileUrl = document.uri.toString();
        const diffBlocks = this.diffStateManager.getDiffBlocksForActiveFile(fileUrl);
        for (let i = 0; i < diffBlocks.length; i++) {
            let block = diffBlocks[i];
            // 只在未接受/拒绝的块上显示按钮
            if (!block.accepted && !block.rejected) {
                const range = new vscode.Range(
                    block.startLine, 0,
                    block.startLine, 0
                );
                
                codeLenses.push(
                    new vscode.CodeLens(range, {
                        title: "✅Accept",
                        tooltip: "Accept this diff block",
                        command: "voidmuse.acceptPartially",
                        arguments: [fileUrl, i],
                    }),
                    new vscode.CodeLens(range, {
                        title: "❌Reject",
                        tooltip: "Reject this diff block",
                        command: "voidmuse.rejectPartially",
                        arguments: [fileUrl, i],
                    })
                );
            }
        };
        
        return codeLenses;
    }
}

export class DiffAllButtonCodeLensProvider implements vscode.CodeLensProvider {
    private onDidChangeCodeLensesEmitter = new vscode.EventEmitter<void>();
    readonly onDidChangeCodeLenses = this.onDidChangeCodeLensesEmitter.event;

    constructor(private diffStateManager: DiffStateManager) {}

    refresh() {
        this.onDidChangeCodeLensesEmitter.fire();
    }

    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        const codeLenses: vscode.CodeLens[] = [];
        const block = this.diffStateManager.getAllBlock(document.uri.toString()) ;
       
        if(block){
            const range = new vscode.Range(
                block!.startLine, 0,
                block!.startLine, 0
            );
            
            codeLenses.push(
                new vscode.CodeLens(range, {
                    title: "✅AcceptAll",
                    tooltip: "Accept all diff block",
                    command: "voidmuse.acceptAll",
                    arguments: [block!.startLine]
                }),
                new vscode.CodeLens(range, {
                    title: "❌RejectAll",
                    tooltip: "Reject all diff block",
                    command: "voidmuse.rejectAll",
                    arguments: [block!.startLine]
                })
            );
            
            return codeLenses;
        }
        return [];
    }
}