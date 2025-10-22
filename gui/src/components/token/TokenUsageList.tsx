import React from 'react';
import { List, Tag, Space, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { TokenUsageSummary } from './types';

const { Text, Title } = Typography;

interface TokenUsageListProps {
  data: TokenUsageSummary[];
  loading?: boolean;
  showHeader?: boolean;
  title?: string;
}

const TokenUsageList: React.FC<TokenUsageListProps> = ({
  data,
  loading = false,
  showHeader = true,
  title
}) => {
  const { t } = useTranslation('components');
  const formatTokens = (tokens: number) => `${(tokens / 1000).toFixed(1)}k`;

  const formatCost = (cost: number) => `$${cost.toFixed(6)}`;

  const renderItem = (item: TokenUsageSummary) => {
    return (
      <List.Item>
        <List.Item.Meta
          title={
            <div>
              <div style={{ marginBottom: 4 }}>
                <Text>{dayjs(item.date).format('YYYY-MM-DD')}</Text>
              </div>
              <Space wrap size="small">
                {item.modelList.map((model, index) => (
                  <Tag key={index} >{model}</Tag>
                ))}
              </Space>
            </div>
          }
          description={
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              <Space  size="small">
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {t('token.tokenUsageList.total')}:{formatTokens(item.totalTokens)}
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {t('token.tokenUsageList.input')}:{formatTokens(item.totalInputTokens)}
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {t('token.tokenUsageList.output')}:{formatTokens(item.totalOutputTokens)}
                </Text>
                <Text strong style={{ fontSize: '12px' }}>
                  {formatCost(item.totalCost)}
                </Text>
              </Space>
              {item.details && item.details.length > 0 && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {item.details.length} {t('token.tokenUsageList.conversations')}
                </Text>
              )}
            </Space>
          }
        />
      </List.Item>
    );
  };

  return (
    <div>
      {showHeader && (
        <Title level={4} style={{ marginBottom: 16, fontSize: '16px' }}>
          {title || t('token.tokenUsageList.defaultTitle')}
        </Title>
      )}
      <List
        loading={loading}
        dataSource={data}
        renderItem={renderItem}
        size="small"
        pagination={{
          pageSize: 5,
          showSizeChanger: false,
          showQuickJumper: false,
          simple: true
        }}
      />
    </div>
  );
};

export default TokenUsageList;