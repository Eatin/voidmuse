import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TabItem, TabType } from '../types/tabs';
import ChatPage from '../pages/ChatPage';

interface TabContextProps {
  tabs: TabItem[];
  activeKey: string;
  
  addTab: (key: string, title: string, content: ReactNode) => void;
  removeTab: (targetKey: React.MouseEvent | React.KeyboardEvent | string, action: 'add' | 'remove') => void;
  setActiveKey: (key: string) => void;
  closeCurrentTab: () => void;
}

const TabContext = createContext<TabContextProps | undefined>(undefined);

export const TabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Tab state management
  const [activeKey, setActiveKey] = useState<string>(TabType.CHAT);
  const [tabs, setTabs] = useState<TabItem[]>([
    { 
      key: TabType.CHAT, 
      title: 'VoidMuse', 
      closable: false, 
      component: <ChatPage /> 
    }
  ]);

  const addTab = (key: string, title: string, component: ReactNode) => {
    // Avoid adding duplicate tabs
    if (!tabs.find(tab => tab.key === key)) {
      setTabs([...tabs, { key, title, closable: true, component }]);
    }
    setActiveKey(key);
  };

  const removeTab = (targetKey: React.MouseEvent | React.KeyboardEvent | string, action: 'add' | 'remove') => {
    if (action === 'remove' && typeof targetKey === 'string') {
      const newTabs = tabs.filter(tab => tab.key !== targetKey);
      setTabs(newTabs);
      
      // If closing the current tab, switch to the first tab
      if (activeKey === targetKey) {
        setActiveKey(newTabs[0].key);
      }
    }
  };

  const closeCurrentTab = () => {
    const currentTab = tabs.find(tab => tab.key === activeKey);
    if (currentTab?.closable) {
      removeTab(activeKey, 'remove');
    }
  };

  const value = {
    tabs,
    activeKey,
    addTab,
    removeTab,
    setActiveKey,
    closeCurrentTab
  };

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
};

export const useTabContext = () => {
    const { t } = useTranslation('errors');
    const context = useContext(TabContext);
    if (context === undefined) {
        throw new Error(t('context.tab.contextError'));
    }
    return context;
};