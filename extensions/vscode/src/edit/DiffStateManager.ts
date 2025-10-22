import * as vscode from 'vscode';

interface DiffBlock {
    startLine: number;
    endLine: number;
    numRed: number;
    numGreen: number;
    accepted: boolean;
    rejected: boolean;
}

export class DiffStateManager {
    private diffBlocks: Map<string, DiffBlock[]> = new Map(); // fileUri -> diff blocks
    private activeFileUri: vscode.Uri | null = null;
    private allBlock : Map<string, DiffBlock> = new Map(); ;

    setActiveFileUri(uri: vscode.Uri) {
        this.activeFileUri = uri;
    }

    setAllBlock(fileUrl:string,block:DiffBlock){
        this.allBlock.set(fileUrl,block);
    }

    getAllBlock(fileUrl:string){
        return this.allBlock.get(fileUrl);
    }

    addDiffBlock(startLine: number, numRed: number,numGreen: number) {
        if (!this.activeFileUri){
            return;
        }
        
        const uriString = this.activeFileUri.toString();
        if (!this.diffBlocks.has(uriString)) {
            this.diffBlocks.set(uriString, []);
        }
        const endLine = startLine + numRed + numGreen;
        const blocks = this.diffBlocks.get(uriString)!;
        blocks.push({
            startLine,
            endLine,
            numRed,
            numGreen,
            accepted: false,
            rejected: false
        });
    }

    getDiffBlocksForActiveFile(fileUrl : string): DiffBlock[] {
        return this.diffBlocks.get(fileUrl) || [];
    }

    refreshBlock(index:number){
        if (!this.activeFileUri){
            return;
        }
        const uriString = this.activeFileUri.toString();
        const blocks = this.diffBlocks.get(uriString);
        if (blocks) {
            const block = blocks[index];
            for (let i = 0; i < blocks.length; i++) {
                if(i > index){
                    const b = blocks[i];
                    if(block.accepted){
                        b.startLine = b.startLine-block.numRed;
                    }
                    if(block.rejected){
                        b.startLine = b.startLine-block.numGreen;
                    }                    
                }

            }
        }
        blocks?.splice(index,1);
        
    }


    acceptDiffBlock(index: number) {
        if (!this.activeFileUri){
            return;
        }
        
        const uriString = this.activeFileUri.toString();
        const blocks = this.diffBlocks.get(uriString);
        if (blocks) {
            const block = blocks[index];
            if (block) {
                block.accepted = true;
                block.rejected = false;
                this.refreshBlock(index);
            }
        }
    }

    rejectDiffBlock(index: number) {
        if (!this.activeFileUri){
            return;
        }
        const uriString = this.activeFileUri.toString();
        const blocks = this.diffBlocks.get(uriString);
        if (blocks) {
            const block = blocks[index];
            if (block) {
                block.rejected = true;
                block.accepted = false;
                this.refreshBlock(index);
            }
        }
    }

    clearForFile(uri?: string) {
        uri = uri ? uri:"";
        this.diffBlocks.delete(uri);
        this.allBlock.delete(uri);
    }
}