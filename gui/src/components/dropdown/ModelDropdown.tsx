import React, {useState, useEffect} from 'react';
import {ConfigProvider, MenuProps} from 'antd';
import {Button, Dropdown, Space, Tooltip} from 'antd';
import {FileImageOutlined, OpenAIOutlined, PlusOutlined} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import DeepSeekIcon from "../icon/DeepSeek";
import { useTabContext } from '@/contexts/TabContext';
import { useModelContext } from '@/contexts/ModelContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { TabType } from '@/types/tabs';
import ModelManagement from '../modelManagement/ModelManagement';

const ModelDropdown: React.FC = () => {

    const { addTab } = useTabContext();
    const { models, selectedModel, selectModel } = useModelContext();
    const { t } = useTranslation('components');
    const { currentLanguage } = useLanguage();

    const [open, setOpen] = useState(false);
    const [selectedIcon, setSelectedIcon] = useState<React.ReactNode>(<OpenAIOutlined/>);
    const [selectedLabel, setSelectedLabel] = useState(t('dropdown.modelDropdown.selectModel'));
    const [modelItems, setModelItems] = useState<MenuProps['items']>([]);
    const [modelMap, setModelMap] = useState<{ [key: string]: { icon: React.ReactNode, text: string } }>({});

    useEffect(() => {
        const enabledModels = models.filter(model => model.enabled);
        
        const newModelMap: { [key: string]: { icon: React.ReactNode, text: string } } = {};
        
        const newModelItems: MenuProps['items'] = [
            {
                key: 'customizeModelGroup',
                type: 'group',
                label: t('dropdown.modelDropdown.customModels'),
                children: enabledModels.map(model => {
                    const key = model.key;
                    let icon = <OpenAIOutlined/>;
                    if (model.provider === 'DeepSeek' || model.name.includes('DeepSeek')) {
                        icon = <DeepSeekIcon/>;
                    }
                    
                    newModelMap[key] = {
                        icon: icon,
                        text: model.name
                    };
                    
                    return {
                        key: key,
                        label: (
                            <Space style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                                <Space style={{minWidth: 0, flex: 1, overflow: 'hidden'}}>
                                    {/*{icon}*/}
                                    <Tooltip 
                                        title={model.name.length > 30 ? model.name : null} 
                                        placement="left"
                                    >
                                        <span style={{
                                            maxWidth: '180px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            display: 'inline-block',
                                            verticalAlign: 'top'
                                        }}>{model.name}</span>
                                    </Tooltip>
                                </Space>
                                {/* Add icon here if model supports image processing */}
                            </Space>
                        )
                    };
                })
            },
            // Add divider
            {
                key: 'dividerComponentKey',
                type: 'divider',
            },
            // Add bottom button item
            {
                key: 'add',
                label: (
                    <ConfigProvider
                        theme={{
                            components: {
                                Button: {
                                    defaultBg: 'transparent',
                                    defaultHoverBg: 'transparent',
                                    defaultColor: 'var(--text-color)',
                                    defaultHoverColor: 'var(--text-color)',
                                    defaultHoverBorderColor: '',
                                    defaultActiveBorderColor: '',
                                    defaultActiveBg: 'transparent',
                                    defaultActiveColor: 'var(--text-color)',
                                },
                            },
                        }}
                    >
                        <Button
                            icon={<PlusOutlined/>}
                            style={{
                                width: '100%',
                                height: '100%',
                                textAlign: 'left',
                                boxShadow: 'none',
                                outline: 'none',
                                border: 'none'
                            }}
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent event bubbling to avoid menu closing
                                addTab(TabType.MODEL, t('setting.settingList.modelManagement'), <ModelManagement />);
                                setOpen(false); // Close dropdown menu after adding
                            }}
                        >
                            {t('dropdown.modelDropdown.addNewItem')}
                        </Button>
                    </ConfigProvider>
                ),
            },
        ];
        
        setModelItems(newModelItems);
        setModelMap(newModelMap);
    }, [models]);
    
    // Update display when selected model changes
    useEffect(() => {
        if (selectedModel && modelMap[selectedModel.key]) {
            setSelectedIcon(modelMap[selectedModel.key].icon);
            setSelectedLabel(modelMap[selectedModel.key].text);
        } else if (models.length > 0) {
            // If no model is selected but models are available, show the first model
            const firstModel = models.find(m => m.enabled);
            if (firstModel && modelMap[firstModel.key]) {
                setSelectedIcon(modelMap[firstModel.key].icon);
                setSelectedLabel(modelMap[firstModel.key].text);
            }
        } else {
            // Show default value when no models are available
            setSelectedIcon(<OpenAIOutlined/>);
            setSelectedLabel(t('dropdown.modelDropdown.selectModel'));
        }
    }, [selectedModel, modelMap, models]);

    const handleMenuClick: MenuProps['onClick'] = (e) => {
        // Click handling for adding new item is processed inside the button
        if (e.key === 'add') return;
        
        selectModel(e.key);
        setOpen(false); 
    };

    const handleOpenChange = (flag: boolean) => {
        setOpen(flag);
    };

    return (
        <Dropdown
            menu={{
                items: modelItems,
                onClick: handleMenuClick,
            }}
            onOpenChange={handleOpenChange}
            open={open}
            trigger={['click']}
            placement="top"
            arrow={true}
            destroyOnHidden={true}
            overlayStyle={{minWidth: '200px', maxWidth: '250px'}}
        >
            <Button style={{
                fontSize: 12,
                height: 27,
                paddingLeft: 10,
                paddingRight: 10,
                color: 'var(--model-dropdown-button-color)',
                borderRadius: 4
            }}>
                {/*<span style={{marginRight: -5, color: 'var(--model-dropdown-icon-color)'}}>{selectedIcon}</span>*/}
                <Tooltip 
                    title={selectedLabel && selectedLabel.length > 30 ? selectedLabel : null}
                    placement="top"
                >
                    <span style={{
                        maxWidth: '120px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                        verticalAlign: 'top'
                    }}>{selectedLabel}</span>
                </Tooltip>
            </Button>
        </Dropdown>
    );

};

export default ModelDropdown;

