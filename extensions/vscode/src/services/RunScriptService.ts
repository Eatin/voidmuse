const vscode = require('vscode');
const { exec, spawn } = require('child_process');
const path = require('path');
import * as child_process from 'child_process';
import * as os from 'os';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

interface ScriptTask {
  status: number; // 0: complete, 1: running, 2: fail
  output: string;
  process?: child_process.ChildProcessWithoutNullStreams;
  startTime: Date;
  tempFile?: string; // tmp file url
}

class RunScriptService{
   
    private static instance: RunScriptService;
    private scriptTasks: Map<string, ScriptTask> = new Map();

    private constructor() {
    }
    
    public static getInstance(): RunScriptService {
        if (!RunScriptService.instance) {
            RunScriptService.instance = new RunScriptService();
            
        }
        return RunScriptService.instance;
    }

    // 执行命令并获取输出（适合短时间命令）
    //methodName=executeCommand，参数是command
    //具体就是要执行的命令，返回执行结果
    public async executeCommand(command: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            exec(command, (error: { message: any; }, stdout: any, stderr: any) => {
                if (error) {
                    const errorMessage = `exec error message: ${error.message}`;
                    vscode.window.showErrorMessage(errorMessage);
                    reject(errorMessage);
                    return;
                }
                
                if (stderr) {
                    const errorMessage = `script error: ${stderr}`;
                    vscode.window.showErrorMessage(errorMessage);
                    reject(errorMessage);
                    return;
                }
                
                
                vscode.window.showInformationMessage(`${stdout}`);
                resolve(stdout);
            });
        });
    }

    public executeScript(requestId: string,script: string): string {
        console.info(script);

        this.scriptTasks.set(requestId, {
        status: 1, // executing
        output: '',
        startTime: new Date()
        });

        this.executeScriptAsync(requestId, script).catch(error => {
            const task = this.scriptTasks.get(requestId);
            if (task) {
                task.status = 2; // fail
                task.output += `\nexecute fail: ${error.message}`;
            }
        });

        return requestId;
    }

    private async executeScriptAsync(requestId: string, script: string): Promise<void> {
        const task = this.scriptTasks.get(requestId);
        if (!task) {
            throw new Error(`cant find requestId: ${requestId}`);
        }

        try {
            // create temp file 
            const tempFile = await this.createTempScriptFile(script);
            task.tempFile = tempFile;
            
            // ensure execute command
            const isWindows = os.platform() === 'win32';
            const command = isWindows ? 'cmd.exe' : 'sh';
            const args = isWindows ? ['/c', tempFile] : [tempFile];
            
            // use spawn run script
            const childProcess = child_process.spawn(command, args, {
                cwd: os.homedir(),
                env: process.env
            });
            
            task.process = childProcess;

            // collect stdout
            task.process.stdout.on('data', (data:any) => {
                if (task) {
                    task.output += data.toString();
                }
            });

            // collect stderr
            task.process.stderr.on('data', (data:any) => {
                if (task) {
                    task.output += data.toString();
                }
            });

            // process end
            task.process.on('close', (code:any) => {
                if (task) {
                task.status = 0;
                
                // clean temp file
                if (task.tempFile) {
                    fs.unlink(task.tempFile, (err) => {
                    if (err) {
                        console.error(`delete temp file fail: ${err.message}`);
                    }
                    });
                }
                }
            });

            // process error
            task.process.on('error', (error:any) => {
                if (task) {
                task.status = 2; // fail
                task.output += `\nprocess error: ${error.message}`;
                }
            });

        } catch (error) {
            task.status = 2; // fail
            task.output += `\ninit error: ${error}`;
            throw error;
        }
    }

    private async createTempScriptFile(script: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const isWindows = os.platform() === 'win32';
            const ext = isWindows ? '.bat' : '.sh';
            const tempDir = os.tmpdir();
            const tempFile = path.join(tempDir, `script_${Date.now()}${ext}`);

            let scriptContent = script;
            if (!isWindows && !script.startsWith('#!')) {
                scriptContent = '#!/bin/bash\n' + script;
            }
            
            fs.writeFile(tempFile, scriptContent, { mode: 0o755 }, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(tempFile);
                }
            });
        });
    }

    public getScriptStatus(requestId: string): string  {
        const task = this.scriptTasks.get(requestId);
        
        if (!task) {
            var resp =  {
                status: 2,
                output: `cant find requestId:${requestId}`
            };
            return JSON.stringify(resp);
        }
        
        resp =  {
            status: task.status,
            output: task.output
        };
        return JSON.stringify(resp);
    }

    public cleanupOldTasks(maxAgeMinutes: number = 60): void {
        const now = new Date();
        for (const [requestId, task] of this.scriptTasks.entries()) {
            const ageMs = now.getTime() - task.startTime.getTime();
            if (ageMs > maxAgeMinutes * 60 * 1000) {
                if (task.process && !task.process.killed) {
                    task.process.kill();
                }
                if (task.tempFile) {
                    fs.unlink(task.tempFile, () => {});
                }
                this.scriptTasks.delete(requestId);
            }
        }
    }

    stopScript(requestId: any): string {
        const task = this.scriptTasks.get(requestId);
        if (!task) {
            throw new Error(`cant find request: ${requestId}`);
        }
        if (!task.process) {
            throw new Error(`cant find thread requestId: ${requestId}`);
        }
        //send SIGTERM info
        task.process.kill('SIGTERM');
        
        setTimeout(() => {
            if (task.process && task.process.killed === false) {
                console.log('进程未响应SIGTERM，发送SIGKILL');
                task.process.kill('SIGKILL');
            }
        }, 3000);
        
        var resp =  {
            status: task.status,
            output: task.output
        };
        return JSON.stringify(resp);
    }

}

export default RunScriptService.getInstance();