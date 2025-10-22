import React from 'react';
import {Button, Divider, Modal, Form, Input, Select, Switch, Typography, ConfigProvider, Flex} from 'antd';
import {ModelItem, ProviderOption, ModelOption} from '@/types/models';
import {FormInstance, type Rule} from 'antd/es/form';
import './modelModal.css';
import {useEmbeddingModelContext} from '@/contexts/EmbeddingModelContext';
import {isIDEPlatform} from '@/utils/PlatformUtils';
import {IDEService} from '@/api/IDEService';
import {useTranslation} from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

const {Text, Link} = Typography;
const {Option} = Select;

interface AddEmbeddingModelModalProps {
    isModalVisible: boolean;
    handleCancel: () => void;
    handleAddModel: () => Promise<void>;
    form: FormInstance;
    currentEditModel: ModelItem | null;
    embeddingProviderOptions: ProviderOption[];
    getEmbeddingModelOptions: (provider: string) => ModelOption[];
    currentProvider: string;
    handleEmbeddingProviderChange: (value: string) => void;
    showModelIdInput: boolean;
    setShowModelIdInput: (show: boolean) => void;
    isModelSelectOpen: boolean;
    setIsModelSelectOpen: (open: boolean) => void;
    getEmbeddingProviderDocLink: (provider: string) => string;
    getEmbeddingApiKeyLink: (provider: string) => string;
}

const AddEmbeddingModelModal: React.FC<AddEmbeddingModelModalProps> = ({
                                                                           isModalVisible,
                                                                           handleCancel,
                                                                           handleAddModel,
                                                                           form,
                                                                           currentEditModel,
                                                                           embeddingProviderOptions,
                                                                           getEmbeddingModelOptions,
                                                                           currentProvider,
                                                                           handleEmbeddingProviderChange,
                                                                           showModelIdInput,
                                                                           setShowModelIdInput,
                                                                           isModelSelectOpen,
                                                                           setIsModelSelectOpen,
                                                                           getEmbeddingProviderDocLink,
                                                                           getEmbeddingApiKeyLink,

                                                                       }) => {
    const {t} = useTranslation('components');
    const { currentLanguage } = useLanguage(); // Subscribe to language changes: When language changes, the component will re-render
    const {embeddingModels} = useEmbeddingModelContext();

    const checkModelExists = (_: Rule, value: string) => {
        if (currentEditModel && currentEditModel.name === value) {
            return Promise.resolve();
        }

        const isDuplicate = embeddingModels.some(model =>
            model.name === value && model.provider === currentProvider
        );

        if (isDuplicate) {
            return Promise.reject(t('modelManagement.addModel.validation.modelExists'));
        }

        return Promise.resolve();
    };

    const handleLinkClick = (url: string, event: React.MouseEvent) => {
        if (isIDEPlatform()) {
            event.preventDefault();
            IDEService.getInstance().openUrl({url});
        }
    };

    return (
        <ConfigProvider theme={{
            components: {
                Select: {
                    selectorBg: 'var(--model-modal-select-selectorBg)',
                    colorBgElevated: 'var(--model-modal-select-colorBgElevated)',
                    activeBorderColor: 'var(--model-modal-select-activeBorderColor)', 
                    activeOutlineColor: 'transparent',
                    hoverBorderColor: 'var(--model-modal-select-hoverBorderColor)', 
                    optionSelectedBg: 'var(--model-modal-select-optionSelectedBg)'
                },
                Modal: {
                    contentBg: 'var(--model-modal-contentBg)',
                    headerBg: 'var(--model-modal-headerBg)'
                },
                Input: {}
            },
        }}>
            <Modal
                title={currentEditModel ? t('modelManagement.addEmbeddingModel.editTitle') : t('modelManagement.addEmbeddingModel.title')}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={420}
                destroyOnClose={true}
            >
                <Form
                    form={form}
                    layout="vertical"
                    name="addEmbeddingModelForm"
                    style={{paddingTop: 10}}
                >
                    <Form.Item
                        name="provider"
                        label={t('modelManagement.addModel.provider')}
                        rules={[{required: true, message: t('modelManagement.addModel.validation.providerRequired') as string}]}
                        style={{marginBottom: 5, width: '100%', fontWeight: 500, marginTop: -5}}
                    >
                        <Select
                            placeholder={t('modelManagement.addModel.placeholders.selectProvider')}
                            options={embeddingProviderOptions}
                            style={{height: '30px', borderRadius: 4}}
                            dropdownStyle={{fontWeight: 'bold'}}
                            onChange={handleEmbeddingProviderChange} 
                        />
                    </Form.Item>

                    {(currentProvider !== 'Customize') && (
                        <Form.Item
                            name="model"
                            label={t('modelManagement.addModel.model')}
                            rules={[
                                {required: currentProvider !== 'Customize', message: t('modelManagement.addModel.validation.modelRequired') as string},
                                {validator: checkModelExists} 
                            ]}
                            dependencies={['provider']}
                            style={{marginBottom: 5, width: '100%', fontWeight: 500}}
                        >
                            <Select
                                placeholder={t('modelManagement.addModel.placeholders.selectModel')}
                                style={{height: '30px', borderRadius: 4}}
                                options={getEmbeddingModelOptions(currentProvider)}
                                open={isModelSelectOpen}
                                onDropdownVisibleChange={(open) => setIsModelSelectOpen(open)}
                                onChange={() => setShowModelIdInput(false)}
                                dropdownRender={(menu: React.ReactElement<any, string | React.JSXElementConstructor<any>>) => {
                                    const hasOptions = Array.isArray(getEmbeddingModelOptions(currentProvider)) &&
                                        getEmbeddingModelOptions(currentProvider).length > 0;

                                    return (
                                        <>
                                            {menu}

                                            {hasOptions && (
                                                <>
                                                    <Divider style={{marginBottom: 0, marginTop: 0}}/>

                                                    <Button
                                                        type="text"
                                                        style={{
                                                            width: '100%',
                                                            textAlign: 'left',
                                                            padding: '8px 12px',
                                                            height: 'auto',
                                                            display: 'flex',
                                                            justifyContent: 'space-between'
                                                        }}
                                                        onClick={() => {
                                                            setShowModelIdInput(true);
                                                            form.setFieldsValue({
                                                                model: t('modelManagement.addModel.customModel'),
                                                                isCustomModel: true
                                                            }); 
                                                            setIsModelSelectOpen(false); 
                                                        }}
                                                    >
                                                        <span style={{fontWeight: 'bold'}}>{t('modelManagement.addModel.useOtherModel')}</span>
                                                        <span>{t('modelManagement.addModel.customModelDescription')}</span>
                                                    </Button>
                                                </>
                                            )}
                                        </>
                                    );
                                }}
                            />
                        </Form.Item>
                    )}

                    {(showModelIdInput || currentProvider === 'Customize') && (
                        <Form.Item
                            name="modelId"
                            rules={[{
                                required: showModelIdInput || currentProvider === 'Customize',
                                message: t('modelManagement.addModel.validation.modelIdRequired') as string
                            }]}
                            style={{marginBottom: 5, width: '100%', fontWeight: 500}}
                        >
                            <Flex justify="space-between" align="center" style={{width: '100%'}}>
                                <span style={{fontWeight: 500, paddingBottom: 8}}>
                                    <span style={{color: 'red', marginRight: 4}}>*</span>
                                    {t('modelManagement.addModel.modelId')}
                                </span>
                                {currentProvider !== 'Customize' && (
                                    <a href={getEmbeddingProviderDocLink(currentProvider)}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       onClick={(e) => handleLinkClick(getEmbeddingProviderDocLink(currentProvider), e)}
                                       style={{
                                           fontSize: '12px',
                                           color: 'var(--model-modal-a-color)',
                                           textDecoration: 'underline'
                                       }}>{t('modelManagement.addModel.checkProvider')}</a>
                                )}
                            </Flex>

                            <Input className="modelModalInput"
                                   defaultValue={currentEditModel?.modelId}
                                   onChange={(e) => form.setFieldsValue({modelId: e.target.value})}
                                   style={{
                                       height: '27px',
                                       borderRadius: '4px',
                                       backgroundColor: 'var(--model-modal-input-background-color)',
                                       fontWeight: 600,
                                       color: 'var(--model-modal-input-color)',
                                       boxShadow: 'none',
                                       caretColor: 'var(--text-color)'
                                   }}
                                   placeholder={t('modelManagement.addModel.placeholders.enterModelId') as string}
                            />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="apiKey"
                        rules={[{required: true, message: t('modelManagement.addModel.validation.apiKeyRequired') as string}]}
                        style={{marginBottom: 5, width: '100%', fontWeight: 500}}
                    >
                        <Flex justify="space-between" align="center" style={{width: '100%'}}>
                            <span style={{fontWeight: 500, paddingBottom: 8}}>
                                <span style={{color: 'red', marginRight: 4}}>*</span>
                                {t('modelManagement.addModel.apiKey')}
                            </span>
                            {currentProvider && currentProvider !== 'Customize' && (
                                <a href={getEmbeddingApiKeyLink(currentProvider)}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   onClick={(e) => handleLinkClick(getEmbeddingApiKeyLink(currentProvider), e)}
                                   style={{
                                       fontSize: '12px',
                                       color: 'var(--model-modal-a-color)',
                                       textDecoration: 'underline'
                                   }}>{t('modelManagement.addModel.getApiKey')}</a>
                            )}
                        </Flex>
                        <Input
                            className="modelModalInput"
                            style={{
                                height: '27px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--model-modal-input-background-color)',
                                fontWeight: 600,
                                color: 'var(--model-modal-input-color)',
                                boxShadow: 'none',
                                caretColor: 'var(--model-modal-input-caret-color)',
                            }}
                            placeholder={currentEditModel ? t('modelManagement.addModel.placeholders.enterNewApiKey') as string : t('modelManagement.addModel.placeholders.enterApiKey') as string}
                            defaultValue={currentEditModel?.apiKey}
                            onChange={(e) => form.setFieldsValue({apiKey: e.target.value})}
                        />
                    </Form.Item>

                    <Form.Item
                        name="baseUrl"
                        rules={[{required: true, message: t('modelManagement.addModel.validation.baseUrlRequired') as string}]}
                        style={{marginBottom: 5, width: '100%', fontWeight: 500}}
                    >
                        <Flex justify="space-between" align="center" style={{width: '100%'}}>
                            <span style={{fontWeight: 500, paddingBottom: 8}}>
                                <span style={{color: 'red', marginRight: 4}}>*</span>
                                {t('modelManagement.addModel.baseUrl')}
                            </span>
                        </Flex>
                        <Input
                            key={`baseUrl-${currentProvider}-${currentEditModel?.key || 'new'}`}
                            className="modelModalInput"
                            style={{
                                height: '27px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--model-modal-input-background-color)',
                                fontWeight: 600,
                                color: 'var(--model-modal-input-color)',
                                boxShadow: 'none',
                                caretColor: 'var(--model-modal-input-caret-color)',
                            }}
                            placeholder={currentEditModel ? t('modelManagement.addModel.placeholders.enterNewBaseUrl') as string : t('modelManagement.addModel.placeholders.enterBaseUrl') as string}
                            defaultValue={form.getFieldValue('baseUrl') || (currentEditModel ? currentEditModel?.baseUrl : undefined)}
                            onChange={(e) => form.setFieldsValue({baseUrl: e.target.value})}
                        />
                    </Form.Item>

                    <Divider style={{marginBottom: 5, marginTop: 0}}/>

                    <Form.Item style={{marginBottom: -10, width: '100%'}}>
                        <ConfigProvider theme={{
                            components: {
                                Button: {
                                    defaultBg: 'var(--model-modal-button-background-color)',
                                    defaultHoverBg: 'var(--model-modal-button-hover-background-color)',
                                    defaultColor: 'var(--model-modal-button-color)',
                                    defaultHoverColor: 'var(--model-modal-button-color)',
                                    defaultHoverBorderColor: '',
                                    defaultActiveBorderColor: '',
                                    defaultActiveColor: 'var(--model-modal-button-color)',
                                    defaultActiveBg: 'var(--model-modal-button-hover-background-color)',
                                },
                            },
                        }}>
                            <Button
                                onClick={handleAddModel}
                                style={{
                                    height: '27px',
                                    fontWeight: 'bold',
                                    boxShadow: 'none',
                                    width: '100%',
                                    borderRadius: '4px'
                                }}
                            >
                                {currentEditModel ? t('modelManagement.addModel.confirm') : t('modelManagement.addEmbeddingModel.addButton')}
                            </Button>
                        </ConfigProvider>
                    </Form.Item>

                    <Form.Item name="isCustomModel" hidden={true}>
                        <Input type="hidden"/>
                    </Form.Item>

                    <Form.Item name="isCustomizeProvider" hidden={true}>
                        <Input type="hidden"/>
                    </Form.Item>
                </Form>
            </Modal>
        </ConfigProvider>
    );
};

export default AddEmbeddingModelModal;