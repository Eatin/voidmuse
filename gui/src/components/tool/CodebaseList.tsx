import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Tooltip } from 'antd';
import { FileOutlined } from '@ant-design/icons';
import './CodebaseList.scss';
import IconWithVerticalLine from '@/components/display/IconWithVerticalLine';
import FileIcon from '../icon/FileIcon';
import { MessageStatus } from '@ant-design/x/es/use-x-chat';
import CollapsePanel from '@/components/display/CollapsePanel';
import {IDEService} from '@/api/IDEService';

export interface CodebaseFileItem {
  path: string;
  name: string;
  startLine?: number;
  endLine?: number;
}

export interface CodebaseListProps {
  files: CodebaseFileItem[];
  className?: string;
  // codebase status
  status: MessageStatus;
  // chat message status
  chatStatus: MessageStatus;
  keyword: string;
  errorMessage?: string;
}

const CodebaseList: React.FC<CodebaseListProps> = ({
  files,
  className,
  status,
  chatStatus,
  keyword,
  errorMessage,
}) => {
  const { t } = useTranslation('components');
  const [showAll, setShowAll] = useState(false);
  
  const displayFiles = showAll ? files : files.slice(0, 5);
  const hasMoreFiles = files.length > 5;
  
  const truncateFileName = (fileName: string, maxLength = 16) => {
    return fileName.length > maxLength 
      ? `${fileName.substring(0, maxLength)}...` 
      : fileName;
  };
  
  const handleFileClick = (file: CodebaseFileItem) => {
    IDEService.getInstance().jumpToFile({path: file.path, startLine: file.startLine, endLine: file.endLine});
  };


  // Render content based on status
  const renderContent = () => {
    if (status === 'error') {
      // Error state - show error message
      return (
        <div className="codebase-error">
          <span className="error-text">
            codebase search fail: {errorMessage || t('tool.codebaseList.searchFailed')}
          </span>
        </div>
      );
    }

    if (status === 'success' && files.length === 0) {
      // Success but no files found
      return (
        <div className="codebase-empty">
          <span className="empty-text">
            {t('tool.codebaseList.noResults')}
          </span>
        </div>
      );
    }

    if (status === 'loading') {
      // Loading state
      return (
        <div className="codebase-loading">
          <span className="loading-text">
            {t('tool.codebaseList.searching')}
          </span>
        </div>
      );
    }

    // Success with files - show file list
    return (
      <div className="codebase-files">
        {displayFiles.map((file, index) => (
          <Tooltip
            key={`${file.path}-${index}`}
            title={file.path}
          >
            <Tag
              className="file-tag"
              onClick={() => handleFileClick(file)}
              icon={<FileIcon fileName={file.name} />}
            >
              {truncateFileName(file.name)}
              {file.startLine !== undefined &&
                file.endLine !== undefined &&
                <span className="line-number">{` ${file.startLine}-${file.endLine}`}</span>}
            </Tag>
          </Tooltip>
        ))}

        {hasMoreFiles && !showAll && (
          <Tag className="more-tag" onClick={() => setShowAll(true)}>
            {t('tool.codebaseList.more', { count: files.length - 5 })}
          </Tag>
        )}

        {hasMoreFiles && showAll && (
          <Tag className="collapse-tag" onClick={() => setShowAll(false)}>
            {t('tool.codebaseList.collapse')}
          </Tag>
        )}
      </div>
    );
  };

  return (
    <CollapsePanel title={`${t('tool.codebaseList.searchCode')} ${keyword}`} defaultOpen={chatStatus === 'loading'} >
      <div
        className={`codebase-list-outer-wrapper ${className || ''}`}
      >
        <IconWithVerticalLine
          icon={<FileOutlined />}
          tooltipTitle={t('tool.codebaseList.context')}
        >
          {renderContent()}
        </IconWithVerticalLine>
      </div>
    </CollapsePanel>
  );
};

export default CodebaseList;