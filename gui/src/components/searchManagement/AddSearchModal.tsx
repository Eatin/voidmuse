import React, { useState } from 'react';
import {Modal, Form, Select, ConfigProvider, Flex, Button, Divider, Input, Typography, Space} from 'antd';
import {SearchConfigItem, SearchProviderOption} from '@/types/search';
import './searchModelModal.css'
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { IDEService } from '@/api/IDEService';

const { TextArea } = Input;
const { Link, Text } = Typography;

interface AddSearchModalProps {
    isModalVisible: boolean;
    handleCancel: () => void;
    handleAddConfig: () => void;
    form: any;
    currentEditConfig: SearchConfigItem | null;
    searchProviderOptions: SearchProviderOption[];
    handleProviderChange: (value: string) => void;
}

const AddSearchModal: React.FC<AddSearchModalProps> = ({
    isModalVisible,
    handleCancel,
    handleAddConfig,
    form,
    currentEditConfig,
    searchProviderOptions,
    handleProviderChange,
}) => {
    const { t } = useTranslation('components');
    const { currentLanguage } = useLanguage();
    const [selectedProvider, setSelectedProvider] = useState<string>('google');
    // Get default configuration for different providers
    const getDefaultConfig = (provider: string): string => {
        const defaultConfigs: Record<string, object> = {
            'google': {
                "apiKey": "your-google-api-key",
                "cx":"your-google-search-engine-id"
            },
            'bocha': {
                "apiKey": "your-bocha-api-key",
            },
        };

        const config = defaultConfigs[provider];
        return config ? JSON.stringify(config, null, 2) : '';
    };

    // Get provider documentation information
    const getProviderDocumentation = (provider: string) => {
        const urlMappings: Record<string, any> = {
            'google': {
                mainDoc: {
                    url: 'https://github.com/voidmuse/voidmuse/-/blob/dev/doc/googleSearchConfig.md'
                },
                params: [
                    {
                        name: 'apiKey',
                        url: 'https://developers.google.com/custom-search/v1/overview'
                    },
                    {
                        name: 'cx',
                        url: 'https://programmablesearchengine.google.com/controlpanel/all'
                    }
                ]
            },
            'bocha': {
                mainDoc: {
                    url: 'https://github.com/voidmuse/voidmuse/-/blob/dev/doc/bochaSearchConfig.md'
                },
                params: [
                    {
                        name: 'apiKey',
                        url: 'https://open.bochaai.com/api-keys'
                    }
                ]
            },
        };
        
        const urlConfig = urlMappings[provider];
        if (!urlConfig) return null;
        
        return {
            mainDoc: {
                title: t(`searchManagement.addModal.providers.${provider}.configDoc`),
                url: urlConfig.mainDoc.url
            },
            params: urlConfig.params.map((param: any) => ({
                name: param.name,
                description: t(`searchManagement.addModal.providers.${provider}.params.${param.name}`),
                url: param.url
            }))
        };
    };

    // Initialize default configuration
    React.useEffect(() => {
        if (!currentEditConfig && selectedProvider === 'google') {
            const defaultConfig = getDefaultConfig('google');
            if (defaultConfig) {
                form.setFieldsValue({
                    provider: 'google',
                    config: defaultConfig
                });
            }
        }
    }, [form, currentEditConfig, selectedProvider]);

    // Handle provider change and auto-fill default configuration
    const handleProviderChangeWithDefault = (value: string) => {
        handleProviderChange(value);
        setSelectedProvider(value);

        // Auto-fill default configuration if not in edit mode
        if (!currentEditConfig) {
            const defaultConfig = getDefaultConfig(value);
            if (defaultConfig) {
                form.setFieldsValue({
                    config: defaultConfig
                });
            }
        }
    };

    return (
        <ConfigProvider theme={{
            components: {
                Select: {
                    selectorBg: 'var(--search-modal-select-selectorBg)',
                    colorBgElevated: 'var(--search-modal-select-colorBgElevated)',
                    activeBorderColor: 'var(--search-modal-select-activeBorderColor)',
                    activeOutlineColor: 'transparent',
                    hoverBorderColor: 'var(--search-modal-select-hoverBorderColor)',
                    optionSelectedBg: 'var(--search-modal-select-optionSelectedBg)'
                },
                Modal: {
                    contentBg: 'var(--search-modal-contentBg)',
                    headerBg: 'var(--search-modal-headerBg)'
                },
                Input: {

                }
            },
        }}>
            <Modal
                title={currentEditConfig ? t('searchManagement.addModal.editTitle') : t('searchManagement.addModal.title')}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={600}
                destroyOnClose={true}
            >
                <Form
                    form={form}
                    layout="vertical"
                    name="addSearchForm"
                    style={{paddingTop: 10}}
                >
                    <Form.Item
                        name="provider"
                        label={t('searchManagement.addModal.provider')}
                        rules={[{required: true, message: t('searchManagement.addModal.validation.providerRequired') as string}]}
                        style={{marginBottom: 16, width: '100%', fontWeight: 500}}
                    >
                        <Select
                            placeholder="select search provider"
                            options={searchProviderOptions}
                            style={{height: '30px', borderRadius: 4}}
                            onChange={handleProviderChangeWithDefault}
                            defaultValue="google"
                        />
                    </Form.Item>

                    <Form.Item
                        name="config"
                        label={t('searchManagement.addModal.config')}
                        rules={[
                            { required: true, message: t('searchManagement.addModal.validation.configRequired') as string },
                            {
                                validator: (_, value) => {
                                    if (!value) return Promise.resolve();
                                    try {
                                        JSON.parse(value);
                                        return Promise.resolve();
                                    } catch {
                                        return Promise.reject(new Error(t('searchManagement.addModal.validation.invalidJson') as string));
                                    }
                                },
                            },
                        ]}
                        style={{marginBottom: 5, width: '100%', fontWeight: 500}}
                    >
                        <TextArea
                            rows={10}
                            className="searchModalTextArea"
                            placeholder={t('searchManagement.addModal.configPlaceholder') as string}
                            style={{
                                height: '100px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--search-modal-input-background-color)',
                                fontWeight: 600,
                                color: 'var(--search-modal-input-color)',
                                boxShadow: 'none',
                                caretColor: 'var(--search-modal-input-caret-color)',
                            }}
                        />
                    </Form.Item>

                    {/* 配置文档和参数说明 */}
                    {selectedProvider && getProviderDocumentation(selectedProvider) && (
                        <div style={{
                            marginBottom: 16,
                            padding: '12px',
                            borderRadius: '6px',
                            color: 'var(--search-modal-input-color)',
                        }}>
                            <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                <div>
                                    <Link
                                        onClick={() => {
                                            const url = getProviderDocumentation(selectedProvider)?.mainDoc.url;
                                            if (url) {
                                                IDEService.getInstance().openUrl({ url });
                                            }
                                        }}
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            color: 'var(--search-modal-link-color)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        📖 {getProviderDocumentation(selectedProvider)?.mainDoc.title as string}
                                    </Link>
                                </div>
                                
                                <div>
                                    <Text style={{
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: 'var(--search-modal-input-color)'
                                    }}>
                                        {t('searchManagement.addModal.paramDescription')}：
                                    </Text>
                                    <div style={{ marginTop: 6 }}>
                                        {getProviderDocumentation(selectedProvider)?.params.map((param: any, index: number) => (
                                            <div key={index} style={{ marginBottom: 4 }}>
                                                <Text style={{
                                                    fontSize: '12px',
                                                    color: 'var(--search-modal-input-color)'
                                                }}>
                                                    • <Text code style={{ fontSize: '11px' }}>{param.name}</Text>: {param.description} - 
                                                </Text>
                                                <Link
                                                    onClick={() => {
                                                        if (param.url) {
                                                            IDEService.getInstance().openUrl({ url: param.url });
                                                        }
                                                    }}
                                                    style={{
                                                        fontSize: '12px',
                                                        color: 'var(--search-modal-link-color, #1890ff)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {t('searchManagement.addModal.getAddress')}
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Space>
                        </div>
                    )}

                    <Divider style={{marginBottom: 5, marginTop: 0}}/>

                    <Form.Item style={{marginBottom: -10, width: '100%'}}>
                        <ConfigProvider theme={{
                            components: {
                                Button: {
                                    defaultBg: 'var(--search-modal-button-background-color)',
                                    defaultHoverBg: 'var(--search-modal-button-hover-background-color)',
                                    defaultColor: 'var(--search-modal-button-color)',
                                    defaultHoverColor: 'var(--search-modal-button-color)',
                                    defaultHoverBorderColor: '',
                                    defaultActiveBorderColor: '',
                                    defaultActiveColor: 'var(--search-modal-button-color)',
                                    defaultActiveBg:'var(--search-modal-button-hover-background-color)',
                                },
                            },
                        }}>
                            <Button
                                onClick={handleAddConfig}
                                style={{
                                    height: '27px',
                                    fontWeight: 'bold',
                                    boxShadow: 'none',
                                    width: '100%',
                                    borderRadius: '4px'
                                }}
                            >
                                {currentEditConfig ? t('searchManagement.addModal.confirmButton') : t('searchManagement.addModal.addButton')}
                            </Button>
                        </ConfigProvider>
                    </Form.Item>

                </Form>
            </Modal>
        </ConfigProvider>
    );
};

export default AddSearchModal;