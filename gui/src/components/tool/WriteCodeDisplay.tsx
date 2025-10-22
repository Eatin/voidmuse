import React, { useMemo } from 'react';
import CollapsePanel from '@/components/display/CollapsePanel';
import IconWithVerticalLine from '@/components/display/IconWithVerticalLine';
import { Tag, Typography, Space, Card } from 'antd';
import { CodeOutlined, LoadingOutlined,EditOutlined,FileTextOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { MessageStatus } from '@ant-design/x/es/use-x-chat';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, base16AteliersulphurpoolLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/contexts/ThemeContext';
import './WriteCodeDisplay.scss';

const { Text } = Typography;

export interface WriteCodeDisplayProps {
    fileName: string;
    filePath: string;
    updatedCode: string;
    status: MessageStatus;
    args?: any;
    result?: any;
}

const WriteCodeDisplay: React.FC<WriteCodeDisplayProps> = ({
    fileName,
    filePath,
    updatedCode,
    status,
    args,
    result
}) => {
    const { t } = useTranslation('components');
    const { currentTheme } = useTheme();
    
    const getLanguageFromFileName = (fileName: string): string => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        const languageMap: { [key: string]: string } = {
            'js': 'javascript',
            'jsx': 'jsx',
            'ts': 'typescript',
            'tsx': 'tsx',
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'cs': 'csharp',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'swift': 'swift',
            'kt': 'kotlin',
            'scala': 'scala',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'sass': 'sass',
            'less': 'less',
            'json': 'json',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'md': 'markdown',
            'sql': 'sql',
            'sh': 'bash',
            'bash': 'bash',
            'zsh': 'bash',
            'ps1': 'powershell',
            'dockerfile': 'dockerfile'
        };
        return languageMap[extension || ''] || 'text';
    };

    return (
        <CollapsePanel 
            title={`${t('tool.writeCode.title')}: ${fileName}`}
            defaultOpen={status === 'loading'}
            icon={status === 'loading' ? <LoadingOutlined spin /> : <EditOutlined />}
        >
            <IconWithVerticalLine
                icon={<EditOutlined />}
                tooltipTitle="Code"
            >
                <div style={{marginLeft: 8, fontSize: 16}}>
                    Write Content
                </div>
                {updatedCode ? (
                    <SyntaxHighlighter
                        language={getLanguageFromFileName(fileName)}
                        style={currentTheme === 'light' ? base16AteliersulphurpoolLight : vscDarkPlus}
                        customStyle={{
                            margin: 0,
                            padding: '12px',
                            fontSize: '13px',
                            backgroundColor: currentTheme === 'light' ? '#f1f3f5' : '#2a2c35',
                            border: 'none',
                            borderRadius: '6px',
                            maxHeight: '400px',
                            overflow: 'auto'
                        }}
                        wrapLongLines={true}
                        wrapLines={true}
                    >
                        {updatedCode}
                    </SyntaxHighlighter>
                ) : (
                    <div style={{ 
                        margin: 0, 
                        padding: '12px', 
                        backgroundColor: currentTheme === 'light' ? '#f1f3f5' : '#2a2c35',
                        borderRadius: '6px',
                        fontSize: '13px'
                    }}>
                        No Code Content
                    </div>
                )}
            </IconWithVerticalLine>
        </CollapsePanel>
    );
};

export default WriteCodeDisplay;