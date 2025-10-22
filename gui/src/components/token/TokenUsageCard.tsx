import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import type { TokenUsageSummary } from './types';

interface TokenUsageCardProps {
  data: TokenUsageSummary[];
  loading?: boolean;
  className?: string;
}

interface TokenStats {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
}

const TokenUsageCard: React.FC<TokenUsageCardProps> = ({
  data,
  loading = false,
  className
}) => {
  const { t } = useTranslation('components');
  const calculateStats = (): TokenStats => {
    const stats = data.reduce(
      (acc, item) => {
        acc.totalInputTokens += item.totalInputTokens;
        acc.totalOutputTokens += item.totalOutputTokens;
        acc.totalTokens += item.totalTokens;
        acc.totalCost += item.totalCost;
        
        return acc;
      },
      {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        totalCost: 0,
      }
    );
    
    return stats;
  };

  const stats = calculateStats();
  
  const formatTokens = (tokens: number) => `${(tokens / 1000).toFixed(1)}k`;

  const formatCost = (cost: number) => `$${cost.toFixed(6)}`;

  return (
    <div className={className}>
      <Row gutter={[8, 8]}>
        <Col xs={12} sm={12}>
          <Card loading={loading} size="small" style={{ height: '100%' }}>
            <Statistic
              title={t('token.tokenUsageCard.totalTokens')}
              value={stats.totalTokens}
              formatter={(value) => formatTokens(Number(value))}
            />
          </Card>
        </Col>
        
        <Col xs={12} sm={12}>
          <Card loading={loading} size="small" style={{ height: '100%' }}>
            <Statistic
              title={t('token.tokenUsageCard.input')}
              value={stats.totalInputTokens}
              formatter={(value) => formatTokens(Number(value))}
            />
          </Card>
        </Col>
        
        <Col xs={12} sm={12}>
          <Card loading={loading} size="small" style={{ height: '100%' }}>
            <Statistic
              title={t('token.tokenUsageCard.output')}
              value={stats.totalOutputTokens}
              formatter={(value) => formatTokens(Number(value))}
            />
          </Card>
        </Col>
        
        <Col xs={12} sm={12}>
          <Card loading={loading} size="small" style={{ height: '100%' }}>
            <Statistic
              title={t('token.tokenUsageCard.totalCost')}
              value={stats.totalCost}
              formatter={(value) => formatCost(Number(value))}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TokenUsageCard;