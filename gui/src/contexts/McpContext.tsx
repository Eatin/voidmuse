import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { McpItem } from '../types/mcps';
import { storageService } from '../storage';
import { McpService } from '../services';
import { useMessage } from '@/utils/MessageUtils';

interface McpContextProps {
    mcps: McpItem[];

    refreshMcps: () => Promise<void>;
    addMcp: (mcp: McpItem) => Promise<void>;
    updateMcp: (model: McpItem) => Promise<void>;
    deleteMcp: (key: string) => Promise<void>;
    toggleMcpEnabled: (key: string, enabled: boolean) => Promise<void>;
}

const McpContext = createContext<McpContextProps | undefined>(undefined);

export const McpProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mcps, setMcps] = useState<McpItem[]>([]);
    const message = useMessage();
    // Get MCP data from storage service
    const refreshMcps = async (): Promise<void> => {
        try {
            const configs = await storageService.getMcpConfigs();
            console.log('Loaded MCP configs:', configs);
            
            // Test enabled MCP connections
            const enabledConfigs = configs.filter(config => config.enabled);
            console.log('Enabled MCP configs to test:', enabledConfigs);
            
            if (enabledConfigs.length > 0) {
                const testResults = await McpService.testMultipleConnections(enabledConfigs);
                console.log('MCP test results:', testResults);
                
                // Update connection status
                configs.forEach(config => {
                    if (config.enabled) {
                        const result = testResults.get(config.key);
                        console.log(`MCP ${config.name} test result:`, result);
                        config.connected = result?.success || false;
                        config.tools = result?.tools;
                        
                        if (!result?.success) {
                            console.warn(`MCP ${config.name} connection failed:`, result?.error || result?.message);
                        }
                    }
                });
            }
            
            setMcps(configs);
        } catch (error) {
            console.error('Failed to load MCP data:', error);
            message.error('Failed to load MCP data');
        }
    };

    const saveMcps = async (updatedmcps: McpItem[]): Promise<void> => {
        try {
            await storageService.setMcpConfigs(updatedmcps);
        } catch (error) {
            console.error('Failed to save MCP data:', error);
            message.error('Failed to save MCP data');
            throw error; // Pass error to let caller know save failed
        }
    };

    const addMcp = async (mcp: McpItem): Promise<void> => {
                          
        const updatedmcps = [...mcps, mcp];
        await saveMcps(updatedmcps);
        const testResult = await McpService.testConnection(mcp);
        mcp.connected = testResult?.success || false;
        if(mcp.connected){
            mcp.tools = testResult.tools;
        }         
        
        setMcps(updatedmcps);
        message.success('MCP added successfully');
    };

    const updateMcp = async (mcp: McpItem): Promise<void> => {
        if(mcp.enabled){
            const testResult = await McpService.testConnection(mcp);
            mcp.connected = testResult?.success || false;
        }
        const updatedmcps = mcps.map(m =>
            m.key === mcp.key ? mcp : m
        );
        await saveMcps(updatedmcps);
        setMcps(updatedmcps);
        message.success('MCP updated successfully');
    };

    const deleteMcp = async (key: string): Promise<void> => {
        const updatedmcps = mcps.filter(m => m.key !== key);
        await saveMcps(updatedmcps);
        setMcps(updatedmcps);
        message.success('MCP deleted successfully');
    };

    const toggleMcpEnabled = async (key: string, enabled: boolean): Promise<void> => {
        const updatedmcps = mcps.map(m =>{
            if (m.key === key) {
                return { 
                    ...m, 
                    enabled,
                    connected: !enabled ? false : m.connected 
            };
        }
        return m;
        });
        await saveMcps(updatedmcps);
        if(enabled){
            const mcp = updatedmcps.find(item => item.key === key);
            if(mcp){
                const testResult = await McpService.testConnection(mcp) ;
                mcp.connected = testResult?.success || false;
                if(mcp.connected){
                    mcp.tools = testResult.tools;
                }            
            }
            
        }
        
        setMcps(updatedmcps);
        message.success(enabled ? 'MCP enabled successfully' : 'MCP disabled successfully');
    };

    // Initial loading of model data and selected model
    useEffect(() => {
        const loadInitialData = async () => {
            await refreshMcps();
        };

        loadInitialData();
    }, []);

    const value = useMemo(() => ({
        mcps,
        refreshMcps,
        addMcp,
        updateMcp,
        deleteMcp,
        toggleMcpEnabled,
    }), [mcps]); 

    return <McpContext.Provider value={value}>{children}</McpContext.Provider>;
};

export const useMcpContext = () => {
    const context = useContext(McpContext);
    if (context === undefined) {
        throw new Error('useMcpContext must be used within McpProvider');
    }
    return context;
};