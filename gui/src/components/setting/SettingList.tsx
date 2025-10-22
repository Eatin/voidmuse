import React, { useState } from 'react';
import { List, Popover } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './SettingList.scss';
import ThemeSelector from './ThemeSelector';
import LanguageSelector from './LanguageSelector';
import { useTheme, ThemeType } from '@/contexts/ThemeContext';
import { useLanguage, LanguageType } from '@/contexts/LanguageContext';
import { useTabContext } from '@/contexts/TabContext';
import { TabType } from '@/types/tabs';
import ModelManagement from '../modelManagement/ModelManagement';
import McpManagement from '../mcpManagement/McpManagement';
import SearchManagement from "@/components/searchManagement/SearchManagement";
import TokenUsagePage from '@/pages/TokenUsagePage';
import OllamaPage from '@/pages/OllamaPage';

export interface SettingItem {
  key: string;
  label: React.ReactNode;
  onClick?: () => void;
}

const SettingList: React.FC = () => {
  const { currentTheme, setTheme } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation('components');
  const [themePopoverVisible, setThemePopoverVisible] = useState(false);
  const [languagePopoverVisible, setLanguagePopoverVisible] = useState(false);
  const { addTab } = useTabContext();

  const getThemeName = (theme: ThemeType) => {
    return theme === 'light' ? t('setting.themeSelector.light') : t('setting.themeSelector.dark');
  };

  const getLanguageName = (language: LanguageType) => {
    return language === 'zh-CN' ? t('setting.settingList.chinese') : t('setting.settingList.english');
  };

  const handleSettingClick = (key: string) => {
    if (key === 'mcp') {
      addTab(TabType.MCP, t('setting.settingList.mcp'), <McpManagement />);
    }
    if (key === 'model') {
      addTab(TabType.MODEL, t('setting.settingList.modelManagement'), <ModelManagement />);
    }
    if (key === 'token') {
      addTab(TabType.TOKEN, t('setting.settingList.tokenBill'), <TokenUsagePage />);
    }
    if (key === 'search') {
      addTab(TabType.SEARCH, t('setting.settingList.search'), <SearchManagement />);
    }
    if (key === 'ollama') {
      addTab(TabType.OLLAMA, t('setting.settingList.ollama'), <OllamaPage />);
    }
  };

  const settingItems: SettingItem[] = [
    {
      key: 'theme',
      label: (
        <Popover
          placement="leftTop"
          content={
            <ThemeSelector />
          }
          trigger="hover"
          open={themePopoverVisible}
          onOpenChange={setThemePopoverVisible}
          arrow={false}
          align={{
            offset: [-20, -14],
          }}
          styles={{ body: { padding: 0 } }}
        >
          <div className="setting-theme-item">
            <span className="theme-label">{t('setting.settingList.theme')}</span>
            <div className="theme-value-container">
              <span className="theme-value">{getThemeName(currentTheme)}</span>
              <RightOutlined className="theme-arrow" />
            </div>
          </div>
        </Popover>
      ),
      onClick: () => handleSettingClick('theme')
    },
    {
      key: 'language',
      label: (
        <Popover
          placement="leftTop"
          content={
            <LanguageSelector />
          }
          trigger="hover"
          open={languagePopoverVisible}
          onOpenChange={setLanguagePopoverVisible}
          arrow={false}
          align={{
            offset: [-20, -14],
          }}
          styles={{ body: { padding: 0 } }}
        >
          <div className="setting-theme-item">
            <span className="theme-label">{t('setting.settingList.language')}</span>
            <div className="theme-value-container">
              <span className="theme-value">{getLanguageName(currentLanguage)}</span>
              <RightOutlined className="theme-arrow" />
            </div>
          </div>
        </Popover>
      ),
      onClick: () => handleSettingClick('language')
    },
    {
      key: 'mcp',
      label: t('setting.settingList.mcp'),
      onClick: () => handleSettingClick('mcp')
    },
    {
      key: 'model',
      label: t('setting.settingList.model'),
      onClick: () => handleSettingClick('model')
    },
    {
      key: 'token',
      label: t('setting.settingList.tokenBill'),
      onClick: () => handleSettingClick('token')
    },
    {
      key: 'search',
      label: t('setting.settingList.search'),
      onClick: () => handleSettingClick('search')
    },
    {
      key: 'ollama',
      label: t('setting.settingList.ollama'),
      onClick: () => handleSettingClick('ollama')
    }
  ];

  return (
    <List
      className="setting-list"
      dataSource={settingItems}
      renderItem={(item) => (
        <List.Item 
          className="setting-item" 
          onClick={item.onClick}
        >
          {item.label}
        </List.Item>
      )}
    />
  );
};

export default SettingList;