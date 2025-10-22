import React, {useEffect, useState} from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import {Button, Divider, Modal, Form, Input, Select, Typography, ConfigProvider, Flex} from 'antd';
import type { Rule } from 'antd/es/form';
import './mcpModal.css'
import {useMcpContext} from '@/contexts/McpContext';
const { TextArea } = Input;
interface McpItem {
    key: string;
    name: string;
    config: string;
    enabled?: boolean;
}


interface AddMcpModalProps {
    isModalVisible: boolean;
    handleCancel: () => void;
    handleAddMcp: () => void;
    form: any; // Use appropriate FormInstance type if available
    currentEditMcp: McpItem | null;
    handleProviderChange: (value: string) => void;
    showMcpIdInput: boolean;
    setShowMcpIdInput: (show: boolean) => void;
    isMcpSelectOpen: boolean;
    setIsMcpSelectOpen: (open: boolean) => void;
}

const {Option} = Select;

const AddMcpModal: React.FC<AddMcpModalProps> = ({
                                                         isModalVisible,
                                                         handleCancel,
                                                         handleAddMcp,
                                                         form,
                                                         currentEditMcp,
                                                     }) => {
    const { t } = useTranslation('components');
    const { currentLanguage } = useLanguage();
    
    const { mcps } = useMcpContext();

    const checkMcpExists = (_: Rule, value: string) => { 
        
        try {
            const config = JSON.parse(value);
            const mcpServers = Object.keys(config.mcpServers);
            if (mcpServers.length > 1){
                return Promise.reject(t('mcpManagement.addModal.validation.singleService'));
            }
            const name = Object.keys(config.mcpServers)[0]; 
            if (currentEditMcp && currentEditMcp.name === name) {
                return Promise.resolve();
            }
            const isDuplicate = mcps.some(mcp =>
                mcp.name === name
            );

            if (isDuplicate) {
                return Promise.reject(t('mcpManagement.addModal.validation.serviceExists'));
            }
        } catch (error) {
            return Promise.reject(t('mcpManagement.addModal.validation.invalidJson'));
        }

        return Promise.resolve();
    };
    
    return (
        <ConfigProvider theme={{
            components: {
                Select: {
                    selectorBg: 'var(--mcp-modal-select-selectorBg)',
                    colorBgElevated: 'var(--mcp-modal-select-colorBgElevated)',
                    activeBorderColor: 'var(--mcp-modal-select-activeBorderColor)',
                    activeOutlineColor: 'transparent', 
                    hoverBorderColor: 'var(--mcp-modal-select-hoverBorderColor)', 
                    optionSelectedBg: 'var(--mcp-modal-select-optionSelectedBg)'
                },
                Modal: {
                    contentBg: 'var(--mcp-modal-contentBg)',
                    headerBg: 'var(--mcp-modal-headerBg)'
                },
                Input: {
                }
            },
        }}>

            <Modal
                title={currentEditMcp ? t('mcpManagement.addModal.editTitle') : t('mcpManagement.addModal.title')}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={420}
                destroyOnClose={true}
            >
                <Form
                    form={form}
                    layout="vertical"
                    name="addMcpForm"
                    style={{paddingTop: 10}}
                >

                    <Form.Item
                        name="config"
                        rules={[
                            {validator: checkMcpExists} 
                        ]}
                        
                        style={{marginBottom: 5, width: '100%', fontWeight: 500}}
                    >
                        <Flex justify="space-between" align="center" style={{width: '100%'}}>
                            <span style={{fontWeight: 500, paddingBottom: 8}}>
                                <span style={{color: 'red', marginRight: 4}}>*</span>
                                {t('mcpManagement.addModal.configLabel')}
                            </span>
                        </Flex>
                        <TextArea
                            rows={10}
                            className="mcpModalInput"
                            style={{
                                height: '300px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--mcp-modal-input-background-color)',
                                fontWeight: 600,
                                color: 'var(--mcp-modal-input-color)',
                                boxShadow: 'none',
                                caretColor: 'var(--mcp-modal-input-caret-color)',
                            }}
                            defaultValue={currentEditMcp? currentEditMcp.config : t('mcpManagement.addModal.configPlaceholder') as string}
                            onChange={(e) => form.setFieldsValue({config: e.target.value})}
                        />
                    </Form.Item>

                    <Divider style={{marginBottom: 5, marginTop: 0}}/>

                    <Form.Item style={{marginBottom: -10, width: '100%'}}>
                        <ConfigProvider theme={{
                            components: {
                                Button: {
                                    defaultBg: 'var(--mcp-modal-button-background-color)',
                                    defaultHoverBg: 'var(--mcp-modal-button-hover-background-color)',
                                    defaultColor: 'var(--mcp-modal-button-color)',
                                    defaultHoverColor: 'var(--mcp-modal-button-color)',
                                    defaultHoverBorderColor: '',
                                    defaultActiveBorderColor: '',
                                    defaultActiveColor: 'var(--mcp-modal-button-color)',
                                    defaultActiveBg:'var(--mcp-modal-button-hover-background-color)',
                                },
                            },
                        }}>
                            <Button
                                onClick={handleAddMcp}
                                style={{
                                    height: '27px',
                                    fontWeight: 'bold',
                                    boxShadow: 'none',
                                    width: '100%',
                                    borderRadius: '4px'
                                }}
                            >
                                {currentEditMcp ? t('mcpManagement.addModal.confirmButton') : t('mcpManagement.addModal.addButton')}
                            </Button>
                        </ConfigProvider>
                    </Form.Item>

                </Form>
            </Modal>
        </ConfigProvider>
    );
};

export default AddMcpModal;