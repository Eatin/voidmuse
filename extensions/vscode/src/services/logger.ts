import * as winston from 'winston';
import * as path from 'path';
import * as vscode from 'vscode';
import TransportStream from 'winston-transport';
import * as util from 'util';

export class VSCodeOutputTransport extends TransportStream {
  private outputChannel: vscode.OutputChannel;

  constructor(opts?: TransportStream.TransportStreamOptions) {
    super(opts);
    this.outputChannel = vscode.window.createOutputChannel('My Extension');
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      const { timestamp, level, message, loggerName } = info;
      this.outputChannel.appendLine(`[${timestamp}] [${level.toUpperCase()}] [${loggerName}] ${message}`);
    });
    callback();
  }

  close() {
    this.outputChannel.dispose();
  }
}

export class VSCodeDebugTransport extends TransportStream {
  constructor(opts?: TransportStream.TransportStreamOptions) {
    super(opts);
  }

  log(info: any, callback: () => void) {
    const { timestamp, level, message, loggerName } = info;
    console.log(`[${timestamp}] [${level.toUpperCase()}] [${loggerName}] ${message}`);
    callback();
  }
}

export function createLogger(name: string) {
  return winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.splat(),
      winston.format((info, opts) => {
        info.loggerName = name; // Add loggerName to the info object
        return info;
      })(),
      winston.format.printf((info) => {
        const { timestamp, level, message, [Symbol.for('splat')]: splatArgs, loggerName } = info;
        let formattedMessage = message;

        if (Array.isArray(splatArgs) && splatArgs.length > 0) {
          // Handle %s with util.format, serialize objects
          formattedMessage = util.format(message, ...splatArgs.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
          ));
        }

        return `[${timestamp}] [${level.toUpperCase()}] [${loggerName}] ${formattedMessage}`;
      })
    ),
    transports: [
      new VSCodeOutputTransport(),
      new VSCodeDebugTransport(),
      new winston.transports.File({
        filename: path.join(__dirname, '..', 'logs', 'extension.log'),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
      })
    ]
  });
}