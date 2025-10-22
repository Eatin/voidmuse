export interface ContextItem {
    type: 'file' | 'codebase' | 'search' | 'fileEdit';
    name: string;
    value: string;
    selected?: string;
    line?: string;
}