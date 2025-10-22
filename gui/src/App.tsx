import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ErrorNotificationProvider } from './contexts/ErrorNotificationContext';
import './i18n';
import { ModelProvider } from './contexts/ModelContext';
import { EmbeddingModelProvider } from './contexts/EmbeddingModelContext';
import { McpProvider, useMcpContext } from './contexts/McpContext';
import { ChatProvider } from './contexts/ChatContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { TabProvider } from './contexts/TabContext';
import './style/global/global-styles.scss';
import './api/ForIDEApi';
import IndexPage from './pages/IndexPage';
import McpService from './services/McpService';

const IndexApp = () => {
    const { themeConfig } = useTheme();
    const mcpContext = useMcpContext();

    useEffect(() => {
        if (mcpContext && typeof mcpContext.addMcp === 'function') {
            console.log('Setting up addMcp method...');
            McpService.setAddMcp(mcpContext.addMcp);
            console.log('Initialization status:', McpService.isInitialized());
        } else {
            console.error('mcpContext or addMcp is not available:', mcpContext);
        }
    }, [mcpContext]);

    return (
        <ConfigProvider theme={themeConfig}>
            <Router>
                <Routes>
                    <Route path="/" element={<IndexPage />} />
                    <Route path="*" element={<div>Page not found (404)</div>} />
                </Routes>
            </Router>
        </ConfigProvider>
    );
};

const App = () => {
    return (
        <ProjectProvider>
            <LanguageProvider>
                <ThemeProvider>
                    <ModelProvider>
                        <EmbeddingModelProvider>
                            <McpProvider>
                                <ChatProvider>
                                    <NavigationProvider>
                                        <TabProvider>
                                            <ErrorNotificationProvider>
                                                <IndexApp />
                                            </ErrorNotificationProvider>
                                        </TabProvider>
                                    </NavigationProvider>
                                </ChatProvider>
                            </McpProvider>
                        </EmbeddingModelProvider>
                    </ModelProvider>
                </ThemeProvider>
            </LanguageProvider>
        </ProjectProvider>
    );
};

export default App;

