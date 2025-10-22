import React from 'react';
import { List, Modal, Button, ConfigProvider } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './LanguageSelector.scss';
import { useLanguage, LanguageType } from '@/contexts/LanguageContext';

const LanguageSelector: React.FC = () => {
  const { currentLanguage, setLanguage, languages } = useLanguage();
  const { t } = useTranslation('components');
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  
  const handleLanguageChange = (language: LanguageType) => {
    if (language === currentLanguage) {
      return;
    }
    
    setLanguage(language);
    
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
    window.location.reload();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <div className="language-selector-container">
      <List
        className="language-selector"
        dataSource={languages}
        renderItem={(item) => (
          <List.Item
            className={`language-item ${currentLanguage === item.code ? 'active' : ''}`}
            onClick={() => handleLanguageChange(item.code)}
          >
            <div className="language-content">
              <span className="language-label">{item.name}</span>
              {currentLanguage === item.code && (
                <CheckOutlined className="language-check" />
              )}
            </div>
          </List.Item>
        )}
      />
      
      <ConfigProvider
        theme={{
          components: {
            Modal: {
              contentBg: 'var(--modal-contentBg)',
            },
          },
        }}
      >
        <Modal
          open={isModalVisible}
          onCancel={handleCancel}
          width={350}
          footer={[
            <ConfigProvider
              key="cancel"
              theme={{
                components: {
                  Button: {
                    defaultBg: 'var(--modal-cancelButton-background-color)',
                    defaultHoverBg: 'var(--modal-cancelButton-hover-color)',
                    defaultColor: 'var(--modal-cancelButton-color)',
                    defaultHoverColor: 'var(--modal-cancelButton-color)',
                    defaultHoverBorderColor: '',
                    defaultActiveBorderColor: '',
                    defaultBorderColor: '',
                  },
                },
              }}
            >
              <Button onClick={handleCancel}>
                {t('languageSelector.refreshLater')}
              </Button>
            </ConfigProvider>,
            <ConfigProvider
              key="ok"
              theme={{
                components: {
                  Button: {
                    defaultBg: 'var(--modal-okButton-background-color)',
                    defaultHoverBg: 'var(--modal-okButton-hover-color)',
                    defaultColor: 'var(--modal-okButton-color)',
                    defaultHoverColor: 'var(--modal-okButton-color)',
                    defaultHoverBorderColor: '',
                    defaultActiveBorderColor: '',
                    defaultBorderColor: '',
                  },
                },
              }}
            >
              <Button onClick={handleOk}>
                {t('languageSelector.refreshNow')}
              </Button>
            </ConfigProvider>,
          ]}
        >
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{fontSize: '14px', fontWeight: 600, marginTop: 8}}>{t('languageSelector.switchSuccess')}</div>
          </div>
          <div style={{marginTop: 16, textAlign: 'center'}}>
            <p>{t('languageSelector.switchMessage')}</p>
          </div>
        </Modal>
      </ConfigProvider>
    </div>
  );
};

export default LanguageSelector;