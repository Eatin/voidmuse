import React from 'react';
import {Table, Space, Button, Switch, Empty, Radio, ConfigProvider} from 'antd';
import {DeleteOutlined, EditOutlined} from '@ant-design/icons';
import {useTranslation} from 'react-i18next';
import {useLanguage} from '@/contexts/LanguageContext';
import {ModelItem} from '@/types/models';
import './modelTable.css'

interface ModelTableProps {
    tableData: ModelItem[];
    expandedGroups: string[];
    toggleGroup: (groupKey: string) => void;
    handleSwitchChange: (checked: boolean, key: string) => void;
    handleDeleteModel: (record: ModelItem) => void;
    editModel: (record: ModelItem) => void;
    selectedAutoCompleteModelKey: string | null; 
    handleAutoCompleteModelChange: (modelKey: string) => void; 
}

const ModelTable: React.FC<ModelTableProps> = ({
                                                   tableData,
                                                   expandedGroups,
                                                   toggleGroup,
                                                   handleSwitchChange,
                                                   handleDeleteModel,
                                                   editModel,
                                                   selectedAutoCompleteModelKey, 
                                                   handleAutoCompleteModelChange 
                                               }) => {
    const { t } = useTranslation('components');
    const { currentLanguage } = useLanguage();

    const columns = [
        {
            title: t('modelManagement.modelColumn'),
            width: 60,
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: ModelItem) => {
                // let icon = null;
                // if (text.includes('gpt')) {
                //     icon = <span style={{marginRight: 8}}> <OpenAIFilled/> ️</span>;
                // } else if (text.includes('DeepSeek')) {
                //     icon = <span style={{marginRight: 8}}> <DeepSeekIcon/> </span>;
                // }

                return (
                    <div>
                        {/*{icon}{text}*/}
                        {text}
                    </div>
                );
            }
        },
        {
            title: t('modelManagement.providerColumn'),
            width: 50,
            dataIndex: 'provider',
            key: 'provider',
            render: (text: string, record: ModelItem) => {
                return <span style={{color: 'rgb(128, 143, 154)'}}>{text}</span>;
            }
        },
        {
            title: t('modelManagement.autoCompleteColumn'),
            key: 'autoComplete',
            width: 40,
            align: 'center' as const,
            render: (_: any, record: ModelItem) => {
                return (
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
                        />
                    </ConfigProvider>
                );
            },
        },
        {
            title: t('modelManagement.actionsColumn'),
            key: 'action',
            width: 50,
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
                        <Switch
                            checked={record.enabled}
                            onChange={(checked) => handleSwitchChange(checked, record.key)}
                            size="small"
                            style={{
                                backgroundColor: record.enabled ? "rgb(0,170,98)" : "rgb(233,236,240)"
                            }}
                        />
                    </Space>
                );
            },
        },
    ];

    return (
        <Radio.Group 
            value={String(selectedAutoCompleteModelKey)}
            onChange={(e) => handleAutoCompleteModelChange(e.target.value)}
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
                    emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('modelManagement.noModelData')}/>
                }}
                style={{
                    // borderTop: '1px solid #f0f0f0',
                    // borderBottom: '1px solid #f0f0f0'
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

export default ModelTable;