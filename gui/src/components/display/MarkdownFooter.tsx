import React, { useState } from 'react';
import { Button, Space, Divider, Typography, Tooltip } from 'antd';
import { SyncOutlined, CopyOutlined, CheckOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './MarkdownFooter.scss';
import { copyToClipboard } from '@/utils/PlatformUtils';
import { TimingInfo, TokenUsage } from '@/services/llm/types';
import { useLanguage } from '@/contexts/LanguageContext';

const { Text } = Typography;

interface MarkdownFooterProps {
  messageContext: any;
  timingInfo?: TimingInfo;
  tokenUsage?: TokenUsage;
  onRetry?: () => void;
}

const MarkdownFooter: React.FC<MarkdownFooterProps> = ({ messageContext, timingInfo, tokenUsage, onRetry }) => {
  const { t } = useTranslation('components');
  const { currentLanguage } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(messageContext || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500); 
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const formatTiming = (ms?: number) => {
    if (ms === undefined) return '-';
    return `${ms}ms`;
  };

  const formatTokens = (count?: number) => {
    if (count === undefined) return '-';
    return count.toLocaleString();
  };

  const formatCost = (cost?: number) => {
    if (cost === undefined) return '-';
    return `$${cost.toFixed(6)}`;
  };

  return (
    <Space split={<Divider type="vertical" />}>
      <Space size="small">
        <Button
          onClick={handleCopy}
          className={`markdown-footer-button ${copied ? 'copied' : ''}`}
          size="small"
          icon={copied ? <CheckOutlined /> : <CopyOutlined />}
        />
        <Button 
          className="markdown-footer-button" 
          size="small" 
          icon={<SyncOutlined />}
          onClick={handleRetry} 
        />
      </Space>
      
      <Space size="small">
        <Tooltip title={t('display.markdownFooter.totalTokens')}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {t('display.markdownFooter.tokens')}: {formatTokens(tokenUsage?.totalTokens)}
          </Text>
        </Tooltip>
        <Tooltip title={t('display.markdownFooter.inputTokens')}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <ArrowUpOutlined /> {formatTokens(tokenUsage?.promptTokens)}
          </Text>
        </Tooltip>
        <Tooltip title={t('display.markdownFooter.outputTokens')}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <ArrowDownOutlined /> {formatTokens(tokenUsage?.completionTokens)}
          </Text>
        </Tooltip>
        <Tooltip title={t('display.markdownFooter.conversationCost')}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            $ {formatCost(tokenUsage?.cost)}
          </Text>
        </Tooltip>
      </Space>  
      
      <Space size="small">  
        {timingInfo?.firstTokenLatency && (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {t('display.markdownFooter.firstTokenLatency')}: {formatTiming(timingInfo.firstTokenLatency)}
          </Text>
        )}
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {t('display.markdownFooter.totalLatency')}: {formatTiming(timingInfo?.totalLatency)}
        </Text>
      </Space>
    </Space>
  );
};

export default MarkdownFooter;