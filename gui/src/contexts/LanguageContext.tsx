import React, { createContext, useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { storageService } from '@/storage';
import { useProjectContext } from './ProjectContext';

export type LanguageType = 'zh-CN' | 'en-US';

interface LanguageContextType {
  currentLanguage: LanguageType;
  setLanguage: (language: LanguageType) => void;
  languages: { code: LanguageType; name: string }[];
}

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: 'zh-CN',
  setLanguage: () => {},
  languages: [],
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageType>('zh-CN');
  const { i18n } = useTranslation();
  const { projectInfo } = useProjectContext();

  const languages = [
    { code: 'zh-CN' as LanguageType, name: '中文' },
    { code: 'en-US' as LanguageType, name: 'English' },
  ];

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguageConfig = await storageService.getLanguageConfig();
        
        // If IDE language information is available, use it first
        if (projectInfo?.language) {
          setCurrentLanguage(projectInfo?.language as LanguageType);
          i18n.changeLanguage(projectInfo?.language);
        } else {
          const language = savedLanguageConfig?.language as LanguageType || 'zh-CN';
          setCurrentLanguage(language);
          i18n.changeLanguage(language);
        }
      } catch (error) {
        console.error('loadLanguage fail:', error);
        // Use default language when error occurs
        setCurrentLanguage('zh-CN');
        i18n.changeLanguage('zh-CN');
      }
    };

    loadLanguage();
  }, [projectInfo, i18n]);

  const setLanguage = async (newLanguage: LanguageType) => {
    setCurrentLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);

    try {
      await storageService.setLanguageConfig({
        language: newLanguage
      });
    } catch (error) {
      console.error('loadLanguage fail:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      setLanguage,
      languages
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;