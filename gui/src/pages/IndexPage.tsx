import React, { useState, useEffect } from 'react';
import { Layout, Tabs } from 'antd';
import { XProvider } from '@ant-design/x';
import ActionButtons from '../components/topBar/ActionButtons';
import { TabType } from '../types/tabs';
import './IndexPage.scss';
import { useTabContext } from '../contexts/TabContext';
import AnalyticsService from '../services/AnalyticsService';

const IndexPage: React.FC = () => {
    const { tabs, activeKey, setActiveKey, removeTab, closeCurrentTab } = useTabContext();

    // Initialize analytics service
    useEffect(() => {
        const analyticsService = AnalyticsService.getInstance();
        analyticsService.init();
        
        // Page view tracking
        analyticsService.trackPageView({
            page_title: 'AI Chat - Main Page',
            page_path: '/'
        });

        // Page leave tracking
        const handleBeforeUnload = () => {
            analyticsService.trackPageLeave();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                analyticsService.trackPageLeave();
            } else if (document.visibilityState === 'visible') {
                // Restart timing when page becomes visible again
                analyticsService.trackPageView({
                    page_title: 'AI Chat - Main Page',
                    page_path: '/'
                });
            }
        };

        // Listen for page unload and visibility changes
        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            // Report stay time when component unmounts
            analyticsService.trackPageLeave();
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const renderTabContent = (component: React.ReactNode) => {
        return (
            <Layout className="tab-content-layout" style={{ height: 'calc(100vh - 40px)' }}>
                {component}
            </Layout>
        );
    };

    return (
        <div className="index-container">
            <XProvider>
                <Tabs
                    className="index-tabs"
                    activeKey={activeKey}
                    onChange={setActiveKey}
                    onEdit={removeTab}
                    type="editable-card"
                    hideAdd
                    tabBarExtraContent={
                        <ActionButtons
                            isChatTab={activeKey === TabType.CHAT}
                        />
                    }
                    items={tabs.map(tab => ({
                        key: tab.key,
                        label: tab.title,
                        closable: tab.closable,
                        children: renderTabContent(tab.component)
                    }))}
                />
            </XProvider>
        </div>
    );
};


export default IndexPage;
