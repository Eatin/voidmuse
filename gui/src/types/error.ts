export interface ErrorLog {
  id: string;
  title: string;
  message: string;
  stack?: string;
  timestamp: number;
  level: 'error' | 'warning' | 'info';
  source: string;
  status: 'new' | 'read';
}

export interface ErrorFilter {
  level?: 'error' | 'warning' | 'info' | 'all';
  status?: 'new' | 'read' | 'all';
  timeRange?: {
    start: number;
    end: number;
  };
  source?: string;
}