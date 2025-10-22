import React from 'react';
import {Table, Space, Button, Switch, Empty, ConfigProvider, Radio} from 'antd';
import {DeleteOutlined, EditOutlined} from '@ant-design/icons';
import {useTranslation} from 'react-i18next';
import {useLanguage} from '@/contexts/LanguageContext';
import {ModelItem} from '@/types/models';
import './modelTable.css'

interface EmbeddingModelTableProps {
    tableData: ModelItem[];
    handleSwitchChange: (checked: boolean, key: string) => void;
    handleDeleteModel: (record: ModelItem) => void;
    editModel: (record: ModelItem) => void;
    selectedEmbeddingModelKey: string | null; 
    handleEmbeddingModelChange: (modelKey: string) => void; 
}

const EmbeddingModelTable: React.FC<EmbeddingModelTableProps> = ({
    tableData,
    handleSwitchChange,
    handleDeleteModel,
    editModel,
    selectedEmbeddingModelKey, 
    handleEmbeddingModelChange 
}) => {
    const { t } = useTranslation('components');
    const { currentLanguage } = useLanguage();

    const columns = [
        {
            title: t('modelManagement.embeddingTitle'),
            width: 60,
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: ModelItem) => {
                return (
                    <div>
                        {text}
                    </div>
                );
            }
        },
        {
            title: t('modelManagement.providerColumn'),
            width: 70,
            dataIndex: 'provider',
            key: 'provider',
            render: (text: string, record: ModelItem) => {
                return <span style={{color: 'rgb(128, 143, 154)'}}>{text}</span>;
            }
        },
        {
            title: t('modelManagement.actionsColumn'),
            key: 'action',
            width: 80,
            render: (_: any, record: ModelItem) => {
                return (
                    <Space size="middle">
                        <Button
                            type="text"
                            icon={<EditOutlined/>}
                            size="small"
                            onClick={() => editModel(record)}
                        />
                        <Button
                            type="text"
                            icon={<DeleteOutlined/>}
                            size="small"
                            onClick={() => handleDeleteModel(record)}
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
                                   disabled={!record.enabled}
                                   checked={selectedEmbeddingModelKey === record.key}
                            />
                        </ConfigProvider>
                    </Space>
                );
            },
        },
    ];

    return (
        <Radio.Group 
            value={selectedEmbeddingModelKey} 
            onChange={(e) => handleEmbeddingModelChange(e.target.value)}
        >
            <Table
                size="small"
                columns={columns}
                dataSource={tableData}
                pagination={false}
                rowKey="key"
                showHeader={true}
                bordered={false}
                locale={{
                    emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('modelManagement.noEmbeddingModelData')}/>
                }}
                components={{
                    header: {
                        cell: (props: any) => (
                            <th {...props} style={{
                                backgroundColor: 'var(--model-management-table-header-th-backgroundColor)',
                                color: 'var(--model-management-table-header-th-color)',
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
                expandable={{expandIcon: () => null}}
            />
        </Radio.Group>
    );
};

export default EmbeddingModelTable;