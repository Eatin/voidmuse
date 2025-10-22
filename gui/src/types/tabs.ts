import { ReactNode } from 'react';

export interface TabItem {
  key: string;
  title: string;
  closable: boolean;
  component: ReactNode;
}

export enum TabType {
  CHAT = 'chat',
  MCP = 'mcp',
  MODEL = 'model',
  TOKEN = 'token',
  SEARCH = 'search',
  OLLAMA = 'ollama',
  ERROR_CENTER = 'error_center',
}