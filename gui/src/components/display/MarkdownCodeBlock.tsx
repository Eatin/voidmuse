import React, { useState, useRef, useMemo, useEffect } from 'react';
import { CopyOutlined, CheckOutlined, ImportOutlined, FileAddOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, base16AteliersulphurpoolLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTranslation } from 'react-i18next';
import './MarkdownCodeBlock.scss';
import { copyToClipboard } from '@/utils/PlatformUtils';
import FileIcon from '../icon/FileIcon';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { IDEService } from '@/api/IDEService';

interface MarkdownCodeBlockProps {
  children: React.ReactNode;
  className?: string;
  inline?: boolean;
  fileName?: string;
}

const MarkdownCodeBlock: React.FC<MarkdownCodeBlockProps> = ({ children, className }) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation('components');
  const { currentLanguage } = useLanguage();
  const [copyStatus, setCopyStatus] = useState<'copy' | 'copied'>('copy');
  const [expanded, setExpanded] = useState(true);
  const codeBlockRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const MIN_LINES_TO_COLLAPSE = 10; // Minimum lines to collapse

    // Calculate number of code lines
    const lineCount = useMemo(() => {
        if (children && typeof children === 'string') {
            return children.split('\n').length;
        }
        return 0;
    }, [children]);

  // Copy code to clipboard
  const handleCopyClick = async () => {
    if (children && typeof children === 'string') {
      const success = await copyToClipboard(children);
      if (success) {
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('copy'), 2000);
      }
    }
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleCreateFileClick = async () => {
    if (children && typeof children === 'string') {
      IDEService.getInstance().codeToCreateFile({ content: children });
    }
  };

  const handleInsertClick = async () => {
    if (children && typeof children === 'string') {
      IDEService.getInstance().codeToInsert({ content: children });
    }
  };

  // Extract language type, full path and file name
  const extractCodeInfo = () => {
    if (!className) return { language: '', path: '', fileName: '' };

    const codeBlockInfo = className.replace('language-', '');

    // Check if file path information is included
    if (codeBlockInfo.includes(':')) {
      // Only split the first colon
      const colonIndex = codeBlockInfo.indexOf(':');
      const lang = codeBlockInfo.substring(0, colonIndex);
      const path = codeBlockInfo.substring(colonIndex + 1);

      // Extract file name (handle both Windows and Unix path separators)
      const lastSlashIndex = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
      const fileName = lastSlashIndex !== -1 ? path.substring(lastSlashIndex + 1) : path;

      return { language: lang, path, fileName };
    }

    return { language: codeBlockInfo, path: '', fileName: '' };
  };

  const { language, path, fileName } = extractCodeInfo();

  const displayName = fileName || path || language;

  const handlePathClick = () => {
    // Here you can trigger other methods, such as opening files
    console.log('File path clicked:', path);
    // For example: openFile(path);
  };

  const codeBlockStyle = useMemo(() => ({
    margin: 0,
    backgroundColor: currentTheme === 'light' ? '#f1f3f5' : '#2a2c35',
    border: 'none',
    padding: '5px 14px',
  }), [currentTheme]);

  // Handle code blocks
  if (language) {
    const shouldCollapse = lineCount > MIN_LINES_TO_COLLAPSE;
    // const shouldCollapse = lineCount > MIN_LINES_TO_COLLAPSE && !loading;

    return (
      <div
        className={`markdown-code-block`}
        ref={codeBlockRef}
      >
        {/* Code block header */}
        <div className={`code-block-header`} ref={headerRef}>
          <Tooltip title={path} placement="top">
            <div className="code-block-title" onClick={handlePathClick}>
              <FileIcon fileName={displayName} />
              <span className="file-name">{displayName}</span>
            </div>
          </Tooltip>
          <div className="code-block-actions">
            <Tooltip title={t('display.markdownCodeBlock.copy')} placement="bottom">
              <Button onClick={handleCopyClick} size="small" className="action-button">
                {copyStatus === 'copy' ? <CopyOutlined /> : <CheckOutlined />}
              </Button>
            </Tooltip>

            <Tooltip title={t('display.markdownCodeBlock.insertToCursor')} placement="bottom">
              <Button onClick={handleInsertClick} size="small" className="action-button">
                <ImportOutlined />
              </Button>
            </Tooltip>

            <Tooltip title={t('display.markdownCodeBlock.createNewFile')} placement="bottom">
              <Button onClick={handleCreateFileClick} size="small" className="action-button">
                <FileAddOutlined />
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* Code content area */}
        <div
          className={`code-container ${expanded ? 'expanded' : ''} ${!shouldCollapse ? 'no-collapse' : ''}`}
        >
          <SyntaxHighlighter
            language={language}
            style={currentTheme === 'light' ? base16AteliersulphurpoolLight : vscDarkPlus}
            PreTag="div"
            customStyle={codeBlockStyle}
            showLineNumbers={true}
            lineNumberStyle={{ minWidth: '3em', opacity: 0.5 }}
          >
            {/* Only render the code that needs to be displayed */}
            {expanded ? 
              (children as string) : 
              (children as string).split('\n').slice(0, MIN_LINES_TO_COLLAPSE).join('\n')}
          </SyntaxHighlighter>

          {/* Expand/collapse button */}
          {shouldCollapse && !expanded && (
            <div className="gradient-overlay">
              <Button
                type="primary"
                ghost
                onClick={toggleExpand}
                size="small"
                className="expand-collapse-button code-expand-button"
              >
                {t('display.markdownCodeBlock.expandCode', { count: lineCount - MIN_LINES_TO_COLLAPSE })}
              </Button>
            </div>
          )}

          {shouldCollapse && expanded && (
            <div className="gradient-overlay">
              <Button
                type="primary"
                ghost
                onClick={toggleExpand}
                size="small"
                className="expand-collapse-button code-collapse-button"
              >
                {t('display.markdownCodeBlock.collapseCode')}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Handle code blocks without language
  return <code className="inline-code">{children}</code>;
};

export default React.memo(MarkdownCodeBlock);
