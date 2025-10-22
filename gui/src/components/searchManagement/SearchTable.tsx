import React from 'react';
import {Button, Space, Table, Radio, ConfigProvider, Empty} from 'antd';
import {DeleteOutlined, EditOutlined} from '@ant-design/icons';
import {SearchConfigItem} from '../../types/search';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

interface SearchTableProps {
    tableData: SearchConfigItem[];
    handleSwitchChange: (checked: boolean, key: string) => Promise<void>;
    handleDeleteConfig: (record: SearchConfigItem) => void;
    editConfig: (record: SearchConfigItem) => void;
    selectedSearchConfigKey: string;
    handleSearchConfigChange: (configKey: string) => Promise<void>;
}

const SearchTable: React.FC<SearchTableProps> = ({
    tableData,
    handleDeleteConfig,
    editConfig,
    selectedSearchConfigKey,
    handleSearchConfigChange
}) => {
    const { t } = useTranslation('components');
    const { currentLanguage } = useLanguage();
    const columns = [
        {
            title: t('searchManagement.table.provider'),
            dataIndex: 'provider',
            key: 'provider',
        },
        {
            title: t('searchManagement.table.config'),
            dataIndex: 'config',
            key: 'config',
            render: (_: any, record: SearchConfigItem) => (
                <div>
                    {record.config}
                </div>
            ),
        },
        {
            title: t('searchManagement.table.actions'),
            key: 'actions',
            render: (_: any, record: SearchConfigItem) => {
                return (
                    <Space size="small">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => editConfig(record)}
                            size="small"
                        />
                        <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteConfig(record)}
                            size="small"
                        />
                        <ConfigProvider theme={{
                            components: {
                                Radio: {
                                    colorPrimary: 'var(--model-table-radio-colorPrimary)'
                                }
                            },
                        }}>
                            <Radio className="model-table-radio"
                                   value={record.key}
                            />
                        </ConfigProvider>
                    </Space>
                );
            },
        },
    ];

    return (
        <Radio.Group 
            value={String(selectedSearchConfigKey)}
            onChange={(e) => handleSearchConfigChange(e.target.value)}
        >
            <Table
                columns={columns}
                dataSource={tableData}
                pagination={false}
                className="search-table"
                rowKey="key"
                showHeader={true}
                bordered={false}
                locale={{
                    emptyText: (
                        <Empty
                            description={t('searchManagement.table.noData')}
                            style={{ margin: '20px 0' }}
                        />
                    ),
                }}
                components={{
                    header: {
                        cell: (props: any) => (
                            <th {...props} style={{
                                backgroundColor: 'var(--search-management-table-header-th-backgroundColor)',
                                color: 'var(--search-management-table-header-th-color)',
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
            />
        </Radio.Group>
    );
};

export default SearchTable;