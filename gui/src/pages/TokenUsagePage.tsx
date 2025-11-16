import React, { useState, useEffect, useMemo } from 'react';
import { Space, Typography, Divider, Button, Select } from 'antd';
import { useMessage } from '@/utils/MessageUtils';
import { useTranslation } from 'react-i18next';
import { TokenUsageList, TokenUsageCard } from '@/components/token/index';
import type { TokenUsageSummary, TokenUsageDetail } from '@/components/token/types';
import { StorageService } from '@/storage/StorageService';

const { Title, Paragraph } = Typography;

const TokenUsagePage: React.FC = () => {
  const { t } = useTranslation('pages');
  const message = useMessage();
  const [data, setData] = useState<TokenUsageSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [allTokenUsageRecords, setAllTokenUsageRecords] = useState<TokenUsageDetail[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('Chat');
  const [selectedBaseUrl, setSelectedBaseUrl] = useState<string>('all');

  const convertToSummaryData = (details: TokenUsageDetail[]): TokenUsageSummary[] => {
    // Group by date
    const groupedByDate = details.reduce((acc, detail) => {
      const dateObj = new Date(detail.datetime);
      const date = dateObj.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(detail);
      return acc;
    }, {} as Record<string, TokenUsageDetail[]>);
    
    return Object.entries(groupedByDate).map(([date, details]) => {
      const totalInputTokens = details.reduce((sum, d) => sum + d.inputTokens, 0);
      const totalOutputTokens = details.reduce((sum, d) => sum + d.outputTokens, 0);
      const totalCost = details.reduce((sum, d) => sum + d.cost, 0);
      const modelList = [...new Set(details.map(d => d.model))];
      
      return {
        id: date,
        date,
        modelList,
        totalInputTokens,
        totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
        totalCost,
        details
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const loadData = async (projectFilter?: string, typeFilter?: string, baseUrlFilter?: string) => {
    setLoading(true);
    try {
      const storageService = StorageService.getInstance();
      const tokenUsageRecords = await storageService.getTokenUsageRecords();
      // Save complete original data
      setAllTokenUsageRecords(tokenUsageRecords);

      let filteredRecords = tokenUsageRecords;
      
      if (projectFilter && projectFilter !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.projectName === projectFilter);
      }
      
      if (typeFilter && typeFilter !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.type === typeFilter);
      }
      
      if (baseUrlFilter && baseUrlFilter !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.baseUrl === baseUrlFilter);
      }
      
      const summaryData = convertToSummaryData(filteredRecords);
      setData(summaryData);
    } catch (error) {
      console.error('Failed to load token usage records:', error);
      message.error(t('tokenUsage.loadError'));
    } finally {
      setLoading(false);
    }
  };

  // Extract project name list from data
  const projectOptions = useMemo(() => {
    const projects = new Set<string>();
    allTokenUsageRecords.forEach(record => {
      projects.add(record.projectName);
    });
    return Array.from(projects).map(project => ({
      label: project,
      value: project
    }));
  }, [allTokenUsageRecords]);

  // Extract baseUrl list from data
  const baseUrlOptions = useMemo(() => {
    const baseUrls = new Set<string>();
    allTokenUsageRecords.forEach(record => {
      if (record.baseUrl) {
        baseUrls.add(record.baseUrl);
      }
    });
    return Array.from(baseUrls).map(baseUrl => {
      // Remove https:// and http:// prefix
      const displayLabel = baseUrl.replace(/^https?:\/\//, '');
      return {
        label: displayLabel,
        value: baseUrl
      };
    });
  }, [allTokenUsageRecords]);

  const handleProjectChange = (value: string) => {
    setSelectedProject(value);
    loadData(value, selectedType, selectedBaseUrl);
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    loadData(selectedProject, value, selectedBaseUrl);
  };

  const handleBaseUrlChange = (value: string) => {
    setSelectedBaseUrl(value);
    loadData(selectedProject, selectedType, value);
  };

  const handleRefresh = () => {
    loadData(selectedProject, selectedType, selectedBaseUrl);
  };

  useEffect(() => {
    loadData(selectedProject, selectedType, selectedBaseUrl);
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      {/* Page title */}
      <Title level={2}>{t('tokenUsage.title')}</Title>
      <Paragraph type="secondary">
        {t('tokenUsage.description')}
      </Paragraph>
      
      {/* Filters and action buttons */}
      <Space style={{ marginBottom: '16px' }}>
        <Select
          value={selectedProject}
          onChange={handleProjectChange}
          style={{ width: 150 }}
          options={[
            { label: t('tokenUsage.filters.allProjects'), value: 'all' },
            ...projectOptions
          ]}
        />
        <Select
          value={selectedType}
          onChange={handleTypeChange}
          style={{ width: 100 }}
          options={[
            { label: t('tokenUsage.filters.allTypes'), value: 'all' },
            { label: 'Chat', value: 'Chat' },
            { label: 'Embedding', value: 'embedding' },
            { label: t('tokenUsage.filters.codeEdit'), value: 'editCode' },
            { label: t('tokenUsage.filters.codeComplete'), value: 'codeComplete' }
          ]}
        />
        <Select
          value={selectedBaseUrl}
          onChange={handleBaseUrlChange}
          style={{ width: 100 }}
          options={[
            { label: t('tokenUsage.filters.allBaseUrls'), value: 'all' },
            ...baseUrlOptions
          ]}
        />
        <Button onClick={handleRefresh} loading={loading}>
          {t('tokenUsage.refresh')}
        </Button>
      </Space>

      {/* Statistics card */}
      <Title level={3}>{t('tokenUsage.statisticsOverview')}</Title>
      <TokenUsageCard 
        data={data} 
        loading={loading}
      />
      
      <Divider />
      
      {/* Detailed list */}
      <TokenUsageList
        data={data}
        loading={loading}
        title={t('tokenUsage.dailyUsageRecords') as string}
      />
    </div>
  );
};

export default TokenUsagePage;