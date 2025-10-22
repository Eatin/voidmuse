import React, { useMemo, useState, useEffect } from 'react';
import { Alert, Button, Card, Empty, Flex, Input, List, Modal, Segmented, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { ErrorFilter, ErrorLog } from '@/types/error';
import { useTranslation } from 'react-i18next';
import { errorReportingService } from '@/services/ErrorReportingService';
import { useErrorNotification } from '@/contexts/ErrorNotificationContext';

const { Title, Text, Paragraph } = Typography;



function LevelTag({ level }: { level: ErrorLog['level'] }) {
  const levelMap = {
    error: { color: '#ff4d4f', text: 'ERROR' },
    warning: { color: '#faad14', text: 'WARNING' },
    info: { color: '#1890ff', text: 'INFO' },
  };
  const config = levelMap[level];
  return (
    <Tag 
      color={config.color} 
      style={{ 
        fontWeight: 'bold', 
        fontSize: '11px',
        padding: '2px 6px',
        borderRadius: '4px'
      }}
    >
      {config.text}
    </Tag>
  );
}



export default function ErrorCenter() {
  const { t } = useTranslation('components');
  const { markAllAsNotified } = useErrorNotification();
  const [keyword, setKeyword] = useState('');
  const [level, setLevel] = useState<ErrorFilter['level']>('all');

  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const [errors, setErrors] = useState<ErrorLog[]>([]);

  useEffect(() => {
    const initializeErrors = async () => {
      const errors = await errorReportingService.getErrors();
      setErrors(errors);
      
      // Mark all errors as notified when user opens error center
      // This way notification popups won't be shown anymore
      await markAllAsNotified();
    };
    initializeErrors();

    // Add listener
    const handleErrorsChange = (newErrors: ErrorLog[]) => {
      setErrors(newErrors);
    };
    
    errorReportingService.addListener(handleErrorsChange);

    // Clean up listener
    return () => {
      errorReportingService.removeListener(handleErrorsChange);
    };
  }, [markAllAsNotified]);

  const filteredErrors = useMemo(() => {
    return errors.filter((e) => {
      if (level && level !== 'all' && e.level !== level) return false;
      if (keyword && !(`${e.title} ${e.message} ${e.source}`.toLowerCase().includes(keyword.toLowerCase()))) return false;
      return true;
    });
  }, [errors, level, keyword]);

  const markAllRead = () => {
    errorReportingService.markAllAsRead();
  };

  const clearAll = () => {
    errorReportingService.clearErrors();
  };

  const showErrorDetail = (error: ErrorLog) => {
    setSelectedError(error);
    setDetailModalVisible(true);
    // Automatically mark as read when clicking to view details
    if (error.status === 'new') {
      errorReportingService.markAsRead(error.id);
    }
  };

  return (
    <Card
      title={t('setting.settingList.errorCenter')}
      extra={
        <Space>
          <Button onClick={markAllRead}>{t('errors.markAllRead')}</Button>
          <Button danger onClick={clearAll}>{t('errors.clearAll')}</Button>
        </Space>
      }
      style={{ height: '100%', overflow: 'auto' }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Flex gap={8} wrap>
          <Segmented
            value={level}
            onChange={(val) => setLevel(val as any)}
            options={[
              { label: t('errors.level.all'), value: 'all' },
              { label: t('errors.level.error'), value: 'error' },
              { label: t('errors.level.warning'), value: 'warning' },
              { label: t('errors.level.info'), value: 'info' },
            ]}
          />

          <Input.Search
            allowClear
            placeholder={t('errors.searchPlaceholder')}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ maxWidth: 320 }}
          />
        </Flex>

        {filteredErrors.length === 0 ? (
          <Empty description={t('errors.empty')} />
        ) : (
          <List
              dataSource={filteredErrors}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  style={{ 
                    borderBottom: '1px solid #f0f0f0',
                    padding: '12px 0',
                    margin: 0
                  }}
                >
                  <div style={{ width: '100%' }}>
                    <Flex justify="space-between" align="flex-start" style={{ marginBottom: 8 }}>
                      <Space align="center">
                        <LevelTag level={item.level} />
                        <Text strong style={{ fontSize: 14 }}>{item.title}</Text>
                        {item.status === 'new' && (
                          <Tag color="red" style={{ fontSize: 10 }}>{t('errors.newTag')}</Tag>
                        )}
                      </Space>
                      <Space align="center">
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(item.timestamp).format('MM-DD HH:mm')}
                        </Text>
                        <Tag color="default" style={{ fontSize: 11 }}>{item.source}</Tag>
                      </Space>
                    </Flex>
                    <div style={{ marginLeft: 0 }}>
                      <Paragraph 
                        style={{ 
                          marginBottom: 6, 
                          cursor: 'pointer', 
                          color: '#666',
                          fontSize: 13,
                          lineHeight: 1.4
                        }} 
                        ellipsis={{ rows: 2 }}
                        onClick={() => showErrorDetail(item)}
                      >
                        {item.message}
                      </Paragraph>
                      <Button 
                        type="link" 
                        size="small" 
                        onClick={() => showErrorDetail(item)} 
                        style={{ 
                          padding: 0, 
                          height: 'auto', 
                          fontSize: 12,
                          color: '#1890ff'
                        }}
                      >
                        {t('errors.viewDetail')}
                      </Button>
                    </div>
                  </div>
                </List.Item>
              )}
            />
        )}

      </Space>

      <Modal
        title={t('errors.detail')}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
        styles={{
          content: {
            padding: '20px',
            backgroundColor: 'var(--error-center-modal-contentBg)',
          },
          header: {
            backgroundColor: 'var(--error-center-modal-headerBg)',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '16px',
          },
        }}
      >
        {selectedError && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '16px', 
                fontWeight: 600,
                color: 'var(--error-center-modal-title-color)'
              }}>
                {selectedError.title}
              </h4>
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                fontSize: '13px', 
                color: 'var(--error-center-modal-label-color)'
              }}>
                <span>{new Date(selectedError.timestamp).toLocaleString()}</span>
                <span>{selectedError.source}</span>
              </div>
            </div>
            
            <div style={{ 
              backgroundColor: 'var(--error-center-modal-code-background)', 
              padding: '14px', 
              borderRadius: '6px',
              fontSize: '13px',
              lineHeight: '1.5',
              fontFamily: 'var(--font-mono)',
              color: 'var(--error-center-modal-code-color)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '350px',
              overflowY: 'auto',
              border: '1px solid var(--border-color)'
            }}>
              {selectedError.message}
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}