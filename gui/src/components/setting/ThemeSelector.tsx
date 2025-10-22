import React from 'react';
import { List } from 'antd';
import { CheckOutlined, RightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './ThemeSelector.scss';
import { useTheme, ThemeType } from '../../contexts/ThemeContext';

const ThemeSelector: React.FC= () => {
  const { currentTheme: contextCurrentTheme, setTheme } = useTheme();
  const { t } = useTranslation('components');
  
  const currentTheme = contextCurrentTheme;
  
  const themes: { key: ThemeType; label: string }[] = [
    { key: 'light', label: t('setting.themeSelector.light') },
    { key: 'dark', label: t('setting.themeSelector.dark') },
  ];
  
  const handleThemeChange = (theme: ThemeType) => {
    setTheme(theme);
  };

  const handleMoreThemes = () => {
  };

  return (
    <div className="theme-selector-container">
      <List
        className="theme-selector"
        dataSource={themes}
        renderItem={(item) => (
          <List.Item
            className={`theme-item ${currentTheme === item.key ? 'active' : ''}`}
            onClick={() => handleThemeChange(item.key)}
          >
            <div className="theme-content">
              <span className="theme-label">{item.label}</span>
              {currentTheme === item.key && (
                <CheckOutlined className="theme-check" />
              )}
            </div>
          </List.Item>
        )}
      />
      {/* <div className="more-themes" onClick={handleMoreThemes}>
        <div className="more-themes-content">
          <span className="more-themes-label">{t('setting.themeSelector.moreThemes')}</span>
          <RightOutlined className="more-themes-icon" />
        </div>
      </div> */}
    </div>
  );
};

export default ThemeSelector;