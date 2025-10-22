import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import {Table, Space, Button, Switch, Empty, Badge} from 'antd';
import {DeleteOutlined, EditOutlined,} from '@ant-design/icons';
import {McpItem} from '@/types/mcps';

interface McpTableProps {
    tableData: McpItem[];
    expandedGroups: string[];
    toggleGroup: (groupKey: string) => void;
    handleSwitchChange: (checked: boolean, key: string) => void;
    handleDeleteMcp: (record: McpItem) => void;
    editMcp: (record: McpItem) => void; 
}

const McpTable: React.FC<McpTableProps> = ({
                                                   tableData,
                                                   expandedGroups,
                                                   toggleGroup,
                                                   handleSwitchChange,
                                                   handleDeleteMcp,
                                                   editMcp
                                               }) => {
    const { t } = useTranslation('components');
    const { currentLanguage } = useLanguage();

    const columns = [
        {
            title: t('mcpManagement.table.serviceName'),
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: McpItem) => {         
                return (
                    <div>
                        {text}
                    </div>
                );
            }
        },
        {
            title: t('mcpManagement.table.status'),
            dataIndex: 'connected',
            key: 'connected',
            render: (connected: boolean) => {         
                return (
                    <div>
                        <Badge 
                            status={connected ? 'success' : 'error'}
                            text={connected ? t('mcpManagement.table.connected') : t('mcpManagement.table.disconnected')}
                        />
                    </div>
                );
            }
        },
      
        {
            title: t('mcpManagement.table.actions'),
            key: 'action',
            render: (_: any, record: McpItem) => {
                return (
                    <Space size="middle" onClick={(e) => e.stopPropagation()}>
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                editMcp(record);
                            }}
                        />
                        <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMcp(record);
                            }}
                        />
                        <div onClick={(e) => e.stopPropagation()}>
                            <Switch
                                checked={record.enabled}
                                onChange={(checked) => {
                                    handleSwitchChange(checked, record.key);
                                }}
                                size="small"
                                style={{
                                    backgroundColor: record.enabled ? "rgb(0,170,98)" : "rgb(233,236,240)"
                                }}
                            />
                        </div>
                    </Space>
                );
            },
        },
    ];

    const expandedRowColumns = [
        {
            title: t('mcpManagement.table.methodName'),
            dataIndex: 'name',
            key: 'name',
            width: 150,
        },
        {
            title: t('mcpManagement.table.description'),
            dataIndex: 'description',
            key: 'description',
            render: (text: string) => text || '-',
        },
    ];

    const expandedRowRender = (record: McpItem) => {
        if (!record.tools || record.tools.length === 0) {
            return (
            <div style={{ padding: '16px 24px', textAlign: 'center' }}>
                {t('mcpManagement.table.noTools')}
            </div>
            );
        }
        
        return (
            <Table
            columns={expandedRowColumns}
            dataSource={record.tools}
            pagination={false}
            rowKey="name"
            size="small"
            bordered
            style={{ 
                margin: '10px 0', 
                backgroundColor: 'var(--mcp-management-expanded-table-bg)'
            }}
            />
        );
        
    };


    return (
        <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            rowKey="key"
            key={`table-${expandedGroups.length}`} 
            showHeader={true}
            bordered={false}
            locale={{
                emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('mcpManagement.table.noData')}/>
            }}
            style={{
                // borderTop: '1px solid #f0f0f0',
                // borderBottom: '1px solid #f0f0f0'
            }}
            components={{
                header: {
                    cell: (props: any) => (
                        <th {...props} style={{
                            backgroundColor: 'var(--mcp-management-table-header-th-backgroundColor)',
                            color: 'var(--mcp-management-table-header-th-color)',
                        }}/>
                    )
                },
                body: {
                    row: (props: any) => (
                        <tr {...props} style={{
                            borderBottom: '1px solid #f0f0f0'
                        }}/>
                    ),
                    cell: (props: any) => (
                        <td {...props} style={{
                            border: 'none'
                        }}/>
                    )
                }
            }}
            sticky={{
                offsetHeader: 0
            }}
            expandable={{
                expandedRowRender,
                expandedRowKeys: expandedGroups,
                onExpand: (expanded, record) => toggleGroup(record.key),
                rowExpandable: record => record.connected, 
                expandRowByClick: true,
            }}
        
        />
    );
};

export default McpTable;