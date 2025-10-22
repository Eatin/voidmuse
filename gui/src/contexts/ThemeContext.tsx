import React, { createContext, useState, useEffect, useContext } from 'react';
import { theme } from 'antd';
import type { ThemeConfig as AntdThemeConfig } from 'antd/es/config-provider/context';
import themeConfigs from '@/config/ant-global-components-config.json';
import globalTokenConfig from '@/config/ant-global-token-config.json';
import { storageService } from '../storage';
import { useProjectContext } from './ProjectContext';
import { emitter } from '@/api/ForIDEApi';

export type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  currentTheme: ThemeType;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  themeConfig: AntdThemeConfig;
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: 'light',
  toggleTheme: () => { },
  setTheme: () => { },
  themeConfig: {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get theme settings from storage service
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('light');
  const { projectInfo } = useProjectContext();

  const themeConfig: AntdThemeConfig = {
    // 使用对应主题的算法
    algorithm: currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    // 从配置文件中加载组件配置
    components: themeConfigs.themes[currentTheme].components,
    // 全局token
    token: globalTokenConfig.themes[currentTheme].token,
  };

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedThemeConfig = await storageService.getThemeConfig();

        // If IDE theme information is available, use it first
        if (projectInfo?.theme) {
          console.log('Got project theme', projectInfo?.theme);
          setCurrentTheme((projectInfo?.theme as ThemeType));
        } else {
          console.log('Got saved theme', projectInfo?.theme);
          setCurrentTheme(savedThemeConfig?.mode as ThemeType || 'light');
        }
      } catch (error) {
        console.error('Failed to load theme config:', error);
        // Use default theme when error occurs
        setCurrentTheme('light');
      }
    };

    loadTheme();
  }, [projectInfo]);

  // Listen for theme change events from ForIDEApi
  useEffect(() => {
    const handleThemeChange = (newTheme: any) => {
      setTheme(newTheme);
    };

    emitter.on('themeChange', handleThemeChange);

    return () => {
      emitter.off('themeChange', handleThemeChange);
    };
  }, []);

  const toggleTheme = async () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(newTheme);

    try {
      await storageService.setThemeConfig({
        mode: newTheme
      });
    } catch (error) {
      console.error('Failed to save theme config:', error);
    }
  };

  const setTheme = async (newTheme: ThemeType) => {
    setCurrentTheme(newTheme);

    try {
      await storageService.setThemeConfig({
        mode: newTheme
      });
    } catch (error) {
      console.error('Failed to save theme config:', error);
    }
  };

  // Update document body class name when theme changes to apply CSS variables
  useEffect(() => {
    document.body.className = currentTheme === 'dark' ? 'dark-theme' : 'light-theme';
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      toggleTheme,
      setTheme,
      themeConfig
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;