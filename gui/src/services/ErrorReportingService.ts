import { ErrorLog } from '@/types/error';
import { extractErrorMessage } from '@/utils/ErrorUtils';
import { StorageService } from '@/storage/StorageService';

/**
 * Error reporting service
 * Responsible for collecting and managing error information in the application
 */
export class ErrorReportingService {
  private static instance: ErrorReportingService;
  private errors: ErrorLog[] = [];
  private listeners: ((errors: ErrorLog[]) => void)[] = [];
  private storageService: StorageService;
  private isInitialized: boolean = false;

  private constructor() {
    this.storageService = StorageService.getInstance();
    this.initializeFromStorage();
  }

  public static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  private async initializeFromStorage(): Promise<void> {
    try {
      const storedErrors = await this.storageService.getErrorLogs();
      this.errors = storedErrors || [];
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize error logs from storage:', error);
      this.errors = [];
      this.isInitialized = true;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeFromStorage();
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      await this.storageService.setErrorLogs(this.errors);
    } catch (error) {
      console.error('Failed to save error logs to storage:', error);
    }
  }

  /**
   * Report error (simplified version, automatically handles error message formatting)
   * @param title Error title
   * @param error Error object
   * @param level Error level
   * @param source Error source
   * @param additionalInfo Additional information
   */
  public async reportErrorWithException(title: string, error: unknown, level: ErrorLog['level'] = 'error', source: string = 'Unknown', additionalInfo?: string): Promise<void> {
    const errorMessage = extractErrorMessage(error);
    const additionalInfoText = additionalInfo ? `Additional Info:\n${additionalInfo}\n\n` : '';
    const formattedMessage = `${additionalInfoText}${errorMessage}${error instanceof Error && error.stack ? '\n\nStack trace:\n' + error.stack : ''}`;
    
    await this.reportError({
      title,
      message: formattedMessage,
      level,
      source
    });
  }

  /**
   * Report error
   * @param error Error information
   */
  public async reportError(error: Omit<ErrorLog, 'id' | 'timestamp' | 'status'>): Promise<void> {
    await this.ensureInitialized();
    
    const errorLog: ErrorLog = {
      id: this.generateId(),
      timestamp: Date.now(),
      status: 'new',
      ...error
    };

    this.errors.unshift(errorLog); // Add new error to the beginning
    
    // Limit error count to avoid memory leaks
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(0, 50);
    }

    await this.saveToStorage();

    // Notify listeners
    this.notifyListeners();

    console.error(`[ErrorCenter] ${error.level.toUpperCase()}: ${error.title}`, {
      message: error.message,
      source: error.source
    });
  }

  public async getErrors(): Promise<ErrorLog[]> {
    await this.ensureInitialized();
    return [...this.errors];
  }

  public async clearErrors(): Promise<void> {
    await this.ensureInitialized();
    this.errors = [];
    await this.saveToStorage();
    this.notifyListeners();
  }

  public async markAllAsRead(): Promise<void> {
    await this.ensureInitialized();
    this.errors = this.errors.map(error => ({ ...error, status: 'read' }));
    await this.saveToStorage();
    this.notifyListeners();
  }

  public async markAsRead(errorId: string): Promise<void> {
    await this.ensureInitialized();
    const errorIndex = this.errors.findIndex(error => error.id === errorId);
    if (errorIndex !== -1) {
      this.errors[errorIndex] = { ...this.errors[errorIndex], status: 'read' };
      await this.saveToStorage();
      this.notifyListeners();
    }
  }

  public addListener(listener: (errors: ErrorLog[]) => void): void {
    this.listeners.push(listener);
  }

  public removeListener(listener: (errors: ErrorLog[]) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener([...this.errors]);
      } catch (error) {
        console.error('Error in error reporting listener:', error);
      }
    });
  }

  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async reportNetworkError(url: string, error: Error, source: string = 'Network'): Promise<void> {
    await this.reportError({
      title: 'Network Request Failed',
      message: `request ${url} failed: ${error.message}\n\nerror detail:\n${error.stack || error.toString()}`,
      level: 'error',
      source
    });
  }

  public async reportTimeoutError(operation: string, timeout: number, source: string): Promise<void> {
    await this.reportError({
      title: 'Operation Timeout',
      message: `Operation "${operation}" timed out after ${timeout}ms`,
      level: 'warning',
      source
    });
  }


  public async hasNewErrors(): Promise<boolean> {
    await this.ensureInitialized();
    const lastReadTimestamp = await this.storageService.getLastReadErrorTimestamp();
    return this.errors.some(error => error.timestamp > lastReadTimestamp);
  }

  public async getNewErrors(): Promise<ErrorLog[]> {
    await this.ensureInitialized();
    const lastReadTimestamp = await this.storageService.getLastReadErrorTimestamp();
    return this.errors.filter(error => error.timestamp > lastReadTimestamp);
  }

  public async updateLastReadTimestamp(timestamp?: number): Promise<void> {
    const actualTimestamp = timestamp || Date.now();
    await this.storageService.setLastReadErrorTimestamp(actualTimestamp);
  }

  public async getLastReadTimestamp(): Promise<number> {
    return await this.storageService.getLastReadErrorTimestamp();
  }

  public async markAllAsNotified(): Promise<void> {
    await this.ensureInitialized();
    if (this.errors.length > 0) {
      const latestErrorTimestamp = Math.max(...this.errors.map(error => error.timestamp));
      await this.updateLastReadTimestamp(latestErrorTimestamp);
    }
  }
}

export const errorReportingService = ErrorReportingService.getInstance();