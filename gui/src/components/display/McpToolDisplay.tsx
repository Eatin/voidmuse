import React, { useState, useMemo } from 'react';
import { ToolOutlined, LoadingOutlined } from '@ant-design/icons';
import CollapsePanel from '@/components/display/CollapsePanel';
import type { MessageStatus } from '@ant-design/x/es/use-x-chat';
import { Card } from 'antd';
import IconWithVerticalLine from '../display/IconWithVerticalLine';

// MCP tool display component props interface
interface McpToolDisplayProps {
    toolName: string;           // Tool name to display in header
    status: MessageStatus;
    args: any;                  // Tool parameters (will be displayed in JSON format)
    result: any;                // Tool result content
}

const McpToolDisplay: React.FC<McpToolDisplayProps> = ({
    toolName,
    status,
    args,
    result
}) => {

    // Safely format parameters as JSON string
    const formattedArgs = useMemo(() => {
        try {
            if (args === null || args === undefined) {
                return 'No parameters';
            }
            return JSON.stringify(args, null, 2);
        } catch (error) {
            console.warn('Failed to stringify args:', error);
            return 'Parameter formatting failed';
        }
    }, [args]);

    const formatResult = useMemo(() => {
        try {
            if (result === null || result === undefined) {
                return 'No response';
            }
            return JSON.stringify(result, null, 2);
        } catch (error) {
            console.warn('Failed to stringify result:', error);
            return 'Response formatting failed';
        }
    }, [result]);

    // Handle tool name fallback
    const displayToolName = toolName || 'Unknown tool';

    return (
        <CollapsePanel
            title={`MCP Tool: ${displayToolName}`}
            defaultOpen={status === 'loading'}
            icon={status === 'loading' ? <LoadingOutlined spin /> : <ToolOutlined />}
        >
            <IconWithVerticalLine
                icon={<ToolOutlined />}
                tooltipTitle="Tool"
            >
                <div style={{marginLeft: 8, fontSize: 16}}>
                    Parameters
                </div>
                <Card style={{ maxHeight: 200, overflow: 'auto', fontSize: 13 }} size='small'>
                    <pre className="mcp-tool-args">{formattedArgs}</pre>
                </Card>
                <div style={{marginLeft: 8, marginTop: 8, fontSize: 16}}>
                    Response
                </div>
                <Card style={{ maxHeight: 200, overflow: 'auto', fontSize: 13}}>
                    <pre className="mcp-tool-result">{formatResult}</pre>
                </Card>
            </IconWithVerticalLine>
        </CollapsePanel>
    );
};

export default McpToolDisplay;