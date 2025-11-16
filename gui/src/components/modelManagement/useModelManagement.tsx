import React, {useState, useEffect} from 'react';
import {Form} from 'antd';
import { useMessage } from '@/utils/MessageUtils';
import {useTranslation} from 'react-i18next';
import {ModelItem, ProviderOption, ModelOption, ModelPricing, TieredPricing} from '../../types/models';
import {useModelContext} from '../../contexts/ModelContext';
import {useEmbeddingModelContext} from '../../contexts/EmbeddingModelContext';

import {StorageService} from '../../storage/StorageService';

const embeddingProviderOptions: ProviderOption[] = [
    {label: 'OpenAI', value: 'OpenAI'},
    {label: 'TongYi', value: 'TongYi'},
    {label: 'Customize', value: 'Customize'},
];

const getEmbeddingModelOptions = (provider: string): ModelOption[] => {
    switch (provider) {
        case 'OpenAI':
            return [
                {label: 'text-embedding-3-small', value: 'text-embedding-3-small'},
                {label: 'text-embedding-3-large', value: 'text-embedding-3-large'},
            ];
        case 'TongYi':
            return [
                {label: 'text-embedding-v4', value: 'text-embedding-v4'},
                {label: 'text-embedding-v3', value: 'text-embedding-v3'},
            ];
        default:
            return [];
    }
};

const getEmbeddingProviderDocLink = (providerName: string): string => {
    switch (providerName) {
        case 'OpenAI':
            return 'https://platform.openai.com/docs/guides/embeddings';
        case 'TongYi':
            return 'https://help.aliyun.com/zh/dashscope/developer-reference/text-embedding-api-details';
        default:
            return '#';
    }
};

const getEmbeddingApiKeyLink = (providerName: string): string => {
    switch (providerName) {
        case 'OpenAI':
            return 'https://platform.openai.com/api-keys';
        case 'TongYi':
            return 'https://bailian.console.aliyun.com/?tab=model#/api-key';
        default:
            return '#';
    }
};

const getEmbeddingDefaultBaseUrl = (providerName: string): string => {
    switch (providerName) {
        case 'OpenAI':
            return 'https://api.openai.com/v1';
        case 'TongYi':
            return 'https://dashscope.aliyuncs.com/compatible-mode/v1';
        default:
            return '';
    }
};

const providerOptions: ProviderOption[] = [
    {label: 'DeepSeek', value: 'DeepSeek'},
    {label: 'OpenAI', value: 'OpenAI'},
    {label: 'OpenRouter', value: 'OpenRouter'},
    {label: 'Gemini', value: 'Gemini'},
    {label: '百度千帆QianFan', value: 'QianFan'},
    {label: '阿里云百炼AliYun', value: 'AliYun'},
    {label: '火山引擎Volcengine', value: 'Volcengine'},
    {label: 'Customize', value: 'Customize'},
];

const getModelOptions = (provider: string): ModelOption[] => {
    switch (provider) {
        case 'DeepSeek':
            return [
                {label: 'DeepSeek-V3', value: 'DeepSeek-V3'},
                {label: 'DeepSeek-R1', value: 'DeepSeek-Reasoner'}
            ];
        case 'OpenAI':
            return [
                {label: 'o4-mini', value: 'o4-mini'},
                {label: 'o3-mini', value: 'o3-mini'},
                {label: 'gpt-4o-mini', value: 'gpt-4o-mini'}
            ];
        case 'OpenRouter':
            return [
                {label: 'anthropic/claude-sonnet-4', value: 'anthropic/claude-sonnet-4'},
                {label: 'anthropic/claude-3.7-sonnet', value: 'anthropic/claude-3.7-sonnet'},
                {label: 'deepseek/deepseek-r1', value: 'deepseek/deepseek-r1'},
                {label: 'deepseek/deepseek-chat', value: 'deepseek/deepseek-chat'},
                {label: 'openai/o3-mini', value: 'openai/o3-mini'},
                {label: 'openai/o4-mini', value: 'openai/o4-mini'},
                {label: 'openai/gpt-4o-mini', value: 'openai/gpt-4o-mini'},
            ];
        case 'Gemini':
            return [
                {label: 'gemini-2.5-pro', value: 'gemini-2.5-pro'},
                {label: 'gemini-2.5-flash', value: 'gemini-2.5-flash'},
            ];
        case 'QianFan':
            return [
                {label: 'ernie-4.5-turbo-128k', value: 'ernie-4.5-turbo-128k'},
                {label: 'ernie-x1-turbo-32k', value: 'ernie-x1-turbo-32k'},
                {label: 'ernie-4.5-21b-a3b', value: 'ernie-4.5-21b-a3b'},
                {label: 'deepseek-V3', value: 'deepseek-v3'},
            ];
        case 'AliYun':
            return [
                {label: 'DeepSeek-V3', value: 'deepseek-v3'},
                {label: 'DeepSeek-R1', value: 'deepseek-r1-0528'},
                {label: 'qwen3-coder-480b-a35b-instruct', value: 'qwen3-coder-480b-a35b-instruct'},
                {label: 'qwen3-coder-30b-a3b-instruct', value: 'qwen3-coder-30b-a3b-instruct'},
            ];
        case 'Volcengine':
            return [
                {label: 'DeepSeek-R1', value: 'deepseek-r1-250528'},
                {label: 'DeepSeek-V3', value: 'deepseek-v3-250324'},
                {label: 'doubao-seed-1.6', value: 'doubao-seed-1-6-250615'},
                {label: 'doubao-seed-1.6-thinking', value: 'doubao-seed-1-6-thinking-250715'},
            ];
        default:
            return [];
    }
};

const getProviderDocLink = (providerName: string): string => {
    switch (providerName) {
        case 'DeepSeek':
            return 'https://api-docs.deepseek.com/zh-cn/';
        case 'OpenAI':
            return 'https://platform.openai.com/docs/api-reference';
        case 'OpenRouter':
            return 'https://openrouter.ai/docs';
        case 'Gemini':
            return 'https://ai.google.dev/gemini-api/docs';
        case 'QianFan':
            return 'https://cloud.baidu.com/doc/WENXINWORKSHOP/s/jlil56u11';
        case 'AliYun':
            return 'https://bailian.console.aliyun.com/?tab=doc#/doc';
        case 'Volcengine':
            return 'https://www.volcengine.com/docs/82379';
        default:
            return '#';
    }
};

const getApiKeyLink = (providerName: string): string => {
    switch (providerName) {
        case 'DeepSeek':
            return 'https://platform.deepseek.com/api_keys';
        case 'OpenAI':
            return 'https://platform.openai.com/api-keys';
        case 'OpenRouter':
            return 'https://openrouter.ai/keys';
        case 'Gemini':
            return 'https://aistudio.google.com/app/apikey';
        case 'QianFan':
            return 'https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application';
        case 'AliYun':
            return 'https://bailian.console.aliyun.com/?tab=model#/api-key';
        case 'Volcengine':
            return 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey';
        default:
            return '#';
    }
};

const getDefaultBaseUrl = (providerName: string): string => {
    switch (providerName) {
        case 'DeepSeek':
            return 'https://api.deepseek.com/v1';
        case 'OpenAI':
            return 'https://api.openai.com/v1';
        case 'OpenRouter':
            return 'https://openrouter.ai/api/v1';
        case 'Gemini':
            return 'https://generativelanguage.googleapis.com/v1';
        case 'QianFan':
            return 'https://qianfan.baidubce.com/v2';
        case 'AliYun':
            return 'https://dashscope.aliyuncs.com/compatible-mode/v1';
        case 'Volcengine':
            return 'https://ark.cn-beijing.volces.com/api/v3';
        default:
            return '';
    }
};

const getTransformedModelId = (provider: string, modelId: string, isCustomModel: boolean): string => {
    if (provider === 'DeepSeek' && !isCustomModel) {
        if (modelId.toLowerCase() === 'deepseek-reasoner') {
            return 'deepseek-reasoner';
        } else if (modelId.toLowerCase() === 'deepseek-v3') {
            return 'deepseek-chat';
        }
    }
    return modelId;
};

const getEmbeddingDefaultPricing = (provider: string, modelId: string): ModelPricing | undefined => {
    switch (provider) {
        case 'TongYi':
            if (['text-embedding-v4', 'text-embedding-v3'].includes(modelId.toLowerCase())) {
                // ¥0.0005/1000 tokens, converted to USD at exchange rate 7.2, then to per million tokens
                // ¥0.0005/1000 tokens = $0.0000694/1000 tokens = $0.0694/1M tokens
                return {
                    inputCostPerMillion: 0.0694,
                    outputCostPerMillion: 0 // embedding models typically only have input costs
                } as ModelPricing;
            }
            break;
        case 'OpenAI':
            if (modelId.toLowerCase().includes('text-embedding-3-small')) {
                return {
                    inputCostPerMillion: 0.01, // $0.01/1M tokens
                    outputCostPerMillion: 0
                } as ModelPricing;
            } else if (modelId.toLowerCase().includes('text-embedding-3-large')) {
                return {
                    inputCostPerMillion: 0.065, // $0.065/1M tokens
                    outputCostPerMillion: 0
                } as ModelPricing;
            }
            break;
        default:
            return undefined;
    }
    return undefined;
};

const getDefaultPricing = (provider: string, modelId: string): ModelPricing | TieredPricing | undefined => {
    // OpenRouter models don't need pricing configuration as they return specific prices via API
    if (provider === 'OpenRouter') {
        return undefined;
    }

    switch (provider) {
        case 'DeepSeek':
            if (['deepseek-v3', 'deepseek-chat'].includes(modelId.toLowerCase())) {
                return {
                    inputCostPerMillion: 0.27,
                    outputCostPerMillion: 1.10
                } as ModelPricing;
            } else if (['deepseek-reasoner', 'deepseek-r1'].some(id => modelId.toLowerCase().includes(id))) {
                return {
                    inputCostPerMillion: 0.55,
                    outputCostPerMillion: 2.19
                } as ModelPricing;
            }
            break;
        case 'OpenAI':
            if (modelId.toLowerCase().includes('gpt-4o-mini')) {
                return {
                    inputCostPerMillion: 0.15,
                    outputCostPerMillion: 0.60
                } as ModelPricing;
            } else if (modelId.toLowerCase().includes('o4-mini')) {
                return {
                    inputCostPerMillion: 1.10,
                    outputCostPerMillion: 4.40
                } as ModelPricing;
            } else if (modelId.toLowerCase().includes('o3-mini')) {
                return {
                    inputCostPerMillion: 1.10,
                    outputCostPerMillion: 4.40
                } as ModelPricing;
            }
            break;
        case 'Gemini':
            if (modelId.toLowerCase().includes('gemini-2.5-pro')) {
                return {
                    inputTiers: [
                        { threshold: 200000, costPerMillion: 1.25 },
                        { threshold: Infinity, costPerMillion: 2.50 }
                    ],
                    outputTiers: [
                        { threshold: 200000, costPerMillion: 10.00 },
                        { threshold: Infinity, costPerMillion: 15.00 }
                    ]
                } as TieredPricing;
            } else if (modelId.toLowerCase().includes('gemini-2.5-flash')) {
                return {
                    inputCostPerMillion: 0.30,
                    outputCostPerMillion: 2.50
                } as ModelPricing;
            }
            break;
        case 'QianFan':
            if (modelId.toLowerCase().includes('ernie-4.5-turbo-128k')) {
                return {
                    inputCostPerMillion: 0.111,  
                    outputCostPerMillion: 0.444  
                } as ModelPricing;
            } else if (modelId.toLowerCase().includes('ernie-x1-turbo-32k')) {
                return {
                    inputCostPerMillion: 0.139,  
                    outputCostPerMillion: 0.556  
                } as ModelPricing;
            } else if (modelId.toLowerCase().includes('ernie-4.5-21b-a3b')) {
                return {
                    inputCostPerMillion: 0.069,  
                    outputCostPerMillion: 0.278  
                } as ModelPricing;
            } else if (modelId.toLowerCase().includes('deepseek-v3')) {
                return {
                    inputCostPerMillion: 0.278,     
                    outputCostPerMillion: 1.111  
                } as ModelPricing;
            }
            break;
        case 'AliYun':
            if (modelId.toLowerCase().includes('deepseek-v3')) {
                return {
                    inputCostPerMillion: 0.278,  
                    outputCostPerMillion: 1.111  
                } as ModelPricing;
            } else if (modelId.toLowerCase().includes('deepseek-r1')) {
                return {
                    inputCostPerMillion: 0.556,  
                    outputCostPerMillion: 2.222  
                } as ModelPricing;
            } else if (modelId.toLowerCase().includes('qwen3-coder-480b-a35b-instruct')) {
                return {
                    inputTiers: [
                        { threshold: 32000, costPerMillion: 0.833 },    
                        { threshold: 128000, costPerMillion: 1.25 },    
                        { threshold: Infinity, costPerMillion: 2.083 }  
                    ],
                    outputTiers: [
                        { threshold: 32000, costPerMillion: 3.333 },    
                        { threshold: 128000, costPerMillion: 5.0 },     
                        { threshold: Infinity, costPerMillion: 8.333 }  
                    ]
                } as TieredPricing;
            } else if (modelId.toLowerCase().includes('qwen3-coder-30b-a3b-instruct')) {
                return {
                    inputTiers: [
                        { threshold: 32000, costPerMillion: 0.208 },   
                        { threshold: 128000, costPerMillion: 0.313 },  
                        { threshold: Infinity, costPerMillion: 1.042 } 
                    ],
                    outputTiers: [
                        { threshold: 32000, costPerMillion: 0.833 },  
                        { threshold: 128000, costPerMillion: 1.25 },  
                        { threshold: Infinity, costPerMillion: 5.208 }
                    ]
                } as TieredPricing;
            }
            break;
        case 'Volcengine':
             if (modelId.toLowerCase().includes('deepseek-r1')) {
                 return {
                     inputCostPerMillion: 0.556,   
                     outputCostPerMillion: 2.222   
                 } as ModelPricing;
             } else if (modelId.toLowerCase().includes('deepseek-v3')) {
                 return {
                     inputCostPerMillion: 0.278,   
                     outputCostPerMillion: 1.111   
                 } as ModelPricing;
             } else if (modelId.toLowerCase().includes('doubao-seed-1-6-250615')) {
                 return {
                     inputTiers: [
                         { threshold: 32000, costPerMillion: 0.111 },    
                         { threshold: 128000, costPerMillion: 0.167 },   
                         { threshold: Infinity, costPerMillion: 0.333 }  
                     ],
                     outputTiers: [
                         { threshold: 200, costPerMillion: 0.278 },      
                         { threshold: 32000, costPerMillion: 1.111 },    
                         { threshold: 128000, costPerMillion: 2.222 },   
                         { threshold: Infinity, costPerMillion: 3.333 }  
                     ]
                 } as TieredPricing;
             } else if (modelId.toLowerCase().includes('doubao-seed-1-6-thinking-250715')) {
                 return {
                     inputTiers: [
                         { threshold: 32000, costPerMillion: 0.111 },    
                         { threshold: 128000, costPerMillion: 0.167 },   
                         { threshold: Infinity, costPerMillion: 0.333 }  
                     ],
                     outputTiers: [
                         { threshold: 32000, costPerMillion: 1.111 },    
                         { threshold: 128000, costPerMillion: 2.222 },   
                         { threshold: Infinity, costPerMillion: 3.333 }  
                     ]
                 } as TieredPricing;
             }
             break;
        default:
            return undefined;
    }
    return undefined;
};

const useModelManagement = () => {
    const { t } = useTranslation('components');
    const message = useMessage();
    
    const {
        models,
        toggleModelEnabled,
        addModel,
        updateModel,
        deleteModel,
        selectedAutoCompleteModelKey,
        selectAutoCompleteModel
    } = useModelContext();

    const {
        embeddingModels,
        selectedEmbeddingModelKey, 
        addEmbeddingModel,
        updateEmbeddingModel,
        deleteEmbeddingModel,
        toggleEmbeddingModelEnabled,
        selectEmbeddingModel 
    } = useEmbeddingModelContext();

    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [currentProvider, setCurrentProvider] = useState<string>('');
    const [form] = Form.useForm();
    const [showModelIdInput, setShowModelIdInput] = useState(false);
    const [isModelSelectOpen, setIsModelSelectOpen] = useState(false);
    const [currentEditModel, setCurrentEditModel] = useState<ModelItem | null>(null);

    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState<boolean>(false);
    const [modelToDelete, setModelToDelete] = useState<ModelItem | null>(null);

    const handleSwitchChange = async (checked: boolean, key: string): Promise<void> => {
        await toggleModelEnabled(key, checked);
    };

    const handleDeleteModel = (record: ModelItem): void => {
        setModelToDelete(record);
        setIsDeleteModalVisible(true);
    };

    const handleCancelDelete = (): void => {
        setIsDeleteModalVisible(false);
        setModelToDelete(null);
    };

    const handleConfirmDelete = async (record: ModelItem): Promise<void> => {
        await deleteModel(record.key);
        setIsDeleteModalVisible(false);
        setModelToDelete(null);
    };

    const getTableData = (): ModelItem[] => {
        return models;
    };

    const showAddModelModal = (): void => {
        setIsModalVisible(true);
    };

    const handleCancel = (): void => {
        setIsModalVisible(false);
        form.resetFields();
        setCurrentProvider('');
        setShowModelIdInput(false);
        setIsModelSelectOpen(false);
        setCurrentEditModel(null);
    };

    const handleAddModel = async (): Promise<void> => {
        form.validateFields()
            .then(async values => {
                // For Customize provider, use modelId as both name and modelId
                const name = (values.provider === 'Customize' || values.isCustomModel) ? values.modelId : values.model;
                var modelId = (values.provider === 'Customize' || values.isCustomModel) ? values.modelId : name;
                modelId = getTransformedModelId(values.provider, modelId, values.isCustomModel || values.provider === 'Customize');

                const pricing = getDefaultPricing(values.provider, modelId);

                if (currentEditModel) {
                    const updatedModel = {
                        ...currentEditModel,
                        name: name,
                        provider: values.provider,
                        modelId: modelId,
                        apiKey: values.apiKey,
                        baseUrl: values.baseUrl,
                        isCustomModel: values.isCustomModel || values.provider === 'Customize',
                        pricing: pricing
                    };
                    console.log(`Updated model object: ${JSON.stringify(updatedModel)}`);
                    await updateModel(updatedModel);
                } else {
                    const newModel = {
                        key: Date.now().toString(),
                        name: name,
                        provider: values.provider,
                        enabled: true,
                        modelId: modelId,
                        apiKey: values.apiKey,
                        baseUrl: values.baseUrl,
                        isCustomModel: values.isCustomModel || values.provider === 'Customize',
                        pricing: pricing
                    };
                    console.log(`New model object: ${JSON.stringify(newModel)}`);
                    await addModel(newModel);
                }

                setIsModalVisible(false);
                form.resetFields();
                setShowModelIdInput(false);
                setIsModelSelectOpen(false);
                setCurrentEditModel(null);
            })
            .catch(info => {
                console.log('Form validation failed:', info);
            });
    };

    const handleProviderChange = (value: string) => {
        setCurrentProvider(value);
        if (value === 'Customize') {
            form.setFieldsValue({
                model: 'Customize',
                baseUrl: getDefaultBaseUrl(value),
                isCustomizeProvider: true
            });
            setShowModelIdInput(true);
        } else {
            form.setFieldsValue({
                model: undefined,
                modelId: undefined, 
                baseUrl: getDefaultBaseUrl(value),
                isCustomizeProvider: false
            });
            setShowModelIdInput(false);
        }
    };

    const editModel = (record: ModelItem): void => {
        setCurrentEditModel(record);
        form.setFieldsValue({
            provider: record.provider,
            model: record.provider === 'Customize' ? 'Customize' : record.name,
            modelId: record.modelId,
            apiKey: record.apiKey,
            baseUrl: record.baseUrl,
            isCustomizeProvider: record.provider === 'Customize'
        });
        setCurrentProvider(record.provider || '');
        setShowModelIdInput(!!record.modelId || record.provider === 'Customize'); 
        setIsModalVisible(true);
    };

    const handleAutoCompleteModelChange = async (modelKey: string): Promise<void> => {
        await selectAutoCompleteModel(modelKey);
    };

    const handleEmbeddingModelChange = async (modelKey: string): Promise<void> => {
        await selectEmbeddingModel(modelKey);
    };

    const handleEmbeddingProviderChange = (value: string) => {
        setCurrentProvider(value);
        if (value === 'Customize') {
            embeddingForm.setFieldsValue({
                model: 'Customize',
                baseUrl: getEmbeddingDefaultBaseUrl(value),
                isCustomizeProvider: true
            });
            setShowModelIdInput(true);
        } else {
            embeddingForm.setFieldsValue({
                model: undefined,
                modelId: undefined, 
                baseUrl: getEmbeddingDefaultBaseUrl(value),
                isCustomizeProvider: false
            });
            setShowModelIdInput(false);
        }
    };

    const [isEmbeddingModalVisible, setIsEmbeddingModalVisible] = useState<boolean>(false);
    const [currentEmbeddingEditModel, setCurrentEmbeddingEditModel] = useState<ModelItem | null>(null);
    const [embeddingForm] = Form.useForm();
    const [isEmbeddingDeleteModalVisible, setIsEmbeddingDeleteModalVisible] = useState<boolean>(false);
    const [embeddingModelToDelete, setEmbeddingModelToDelete] = useState<ModelItem | null>(null);

    const getEmbeddingTableData = (): ModelItem[] => {
        return embeddingModels;
    };

    const showEmbeddingAddModelModal = (): void => {
        setIsEmbeddingModalVisible(true);
    };

    const handleEmbeddingCancel = (): void => {
        setIsEmbeddingModalVisible(false);
        embeddingForm.resetFields();
        setCurrentProvider('');
        setShowModelIdInput(false);
        setIsModelSelectOpen(false);
        setCurrentEmbeddingEditModel(null);
    };

    const handleAddEmbeddingModel = async (): Promise<void> => {
        embeddingForm.validateFields()
            .then(async values => {
                const name = (values.provider === 'Customize' || values.isCustomModel) ? values.modelId : values.model;
                var modelId = (values.provider === 'Customize' || values.isCustomModel) ? values.modelId : name;
                modelId = getTransformedModelId(values.provider, modelId, values.isCustomModel || values.provider === 'Customize');

                const pricing = getEmbeddingDefaultPricing(values.provider, modelId);

                if (currentEmbeddingEditModel) {
                    const updatedModel = {
                        ...currentEmbeddingEditModel,
                        name: name,
                        provider: values.provider,
                        modelId: modelId,
                        apiKey: values.apiKey,
                        baseUrl: values.baseUrl,
                        dimensions: values.dimensions ? parseInt(values.dimensions) : undefined,
                        isCustomModel: values.isCustomModel || values.provider === 'Customize',
                        pricing: pricing
                    };
                    await updateEmbeddingModel(updatedModel);
                } else {
                    const newModel = {
                        key: Date.now().toString(),
                        name: name,
                        provider: values.provider,
                        enabled: true,
                        modelId: modelId,
                        apiKey: values.apiKey,
                        baseUrl: values.baseUrl,
                        dimensions: values.dimensions ? parseInt(values.dimensions) : undefined,
                        isCustomModel: values.isCustomModel || values.provider === 'Customize',
                        pricing: pricing
                    };
                    await addEmbeddingModel(newModel);
                }

                setIsEmbeddingModalVisible(false);
                embeddingForm.resetFields();
                setShowModelIdInput(false);
                setIsModelSelectOpen(false);
                setCurrentEmbeddingEditModel(null);
            })
            .catch(info => {
                console.log('Embedding model form validation failed:', info);
            });
    };

    const handleEmbeddingSwitchChange = async (checked: boolean, key: string): Promise<void> => {
        await toggleEmbeddingModelEnabled(key, checked);
    };

    const handleDeleteEmbeddingModel = (record: ModelItem): void => {
        setEmbeddingModelToDelete(record);
        setIsEmbeddingDeleteModalVisible(true);
    };

    const handleCancelEmbeddingDelete = (): void => {
        setIsEmbeddingDeleteModalVisible(false);
        setEmbeddingModelToDelete(null);
    };

    const handleConfirmEmbeddingDelete = async (record: ModelItem): Promise<void> => {
        await deleteEmbeddingModel(record.key);
        
        // Check if there are any embedding models left after deletion
        const remainingModels = embeddingModels.filter(model => model.key !== record.key);
        
        // If no models remain, automatically turn off Switch and clear selection
        if (remainingModels.length === 0) {
            if (isAutoEmbedding) {
                await handleAutoEmbeddingChange(false);
            }
            await selectEmbeddingModel('');
        }
        
        setIsEmbeddingDeleteModalVisible(false);
        setEmbeddingModelToDelete(null);
    };

    const editEmbeddingModel = (record: ModelItem): void => {
        setCurrentEmbeddingEditModel(record);
        embeddingForm.setFieldsValue({
            provider: record.provider,
            model: record.provider === 'Customize' ? 'Customize' : record.name,
            modelId: record.modelId,
            apiKey: record.apiKey,
            baseUrl: record.baseUrl,
            isCustomizeProvider: record.provider === 'Customize'
        });
        setCurrentProvider(record.provider || '');
        setShowModelIdInput(!!record.modelId || record.provider === 'Customize');
        setIsEmbeddingModalVisible(true);
    };

    const [isAutoEmbedding, setIsAutoEmbedding] = useState<boolean>(false);

    useEffect(() => {
        const loadAutoEmbeddingState = async () => {
            try {
                const storageService = StorageService.getInstance();
                const autoState = await storageService.getIsAutoEmbedding();
                setIsAutoEmbedding(autoState);
            } catch (error) {
                console.error('Failed to load auto embedding state:', error);
            }
        };
        loadAutoEmbeddingState();
    }, []);

    const handleAutoEmbeddingChange = async (checked: boolean): Promise<void> => {
        try {
            const storageService = StorageService.getInstance();
            await storageService.setIsAutoEmbedding(checked);
            setIsAutoEmbedding(checked);
            if (checked){
                message.success(t('modelManagement.autoEmbeddingEnabled'));
            }else {
                message.success(t('modelManagement.autoEmbeddingDisabled'));
            }
        } catch (error) {
            console.error('Failed to save auto embedding state:', error);
        }
    };

    return {
        modelData: models,
        expandedGroups: [],
        isModalVisible,
        currentProvider,
        form,
        showModelIdInput,
        setShowModelIdInput,
        isModelSelectOpen,
        setIsModelSelectOpen,
        currentEditModel,
        setCurrentEditModel,
        handleSwitchChange,
        toggleGroup: () => {
        },
        handleDeleteModel,
        getTableData,
        showAddModelModal,
        handleCancel,
        handleAddModel,
        providerOptions,
        getModelOptions,
        handleProviderChange,
        getProviderDocLink,
        getApiKeyLink,
        getDefaultBaseUrl,
        setCurrentProvider,
        setIsModalVisible,
        isDeleteModalVisible,
        modelToDelete,
        handleCancelDelete,
        handleConfirmDelete,
        editModel,
        selectedAutoCompleteModelKey,
        handleAutoCompleteModelChange,
        selectedEmbeddingModelKey,
        handleEmbeddingModelChange, 
        isEmbeddingModalVisible,
        currentEmbeddingEditModel,
        embeddingForm,
        showEmbeddingAddModelModal,
        handleEmbeddingCancel,
        handleAddEmbeddingModel,
        handleEmbeddingSwitchChange,
        handleDeleteEmbeddingModel,
        getEmbeddingTableData,
        editEmbeddingModel,
        isEmbeddingDeleteModalVisible,
        embeddingModelToDelete,
        handleCancelEmbeddingDelete,
        handleConfirmEmbeddingDelete,
        isAutoEmbedding,
        handleAutoEmbeddingChange,
        embeddingProviderOptions,
        getEmbeddingModelOptions,
        getEmbeddingProviderDocLink,
        getEmbeddingApiKeyLink,
        getEmbeddingDefaultBaseUrl,
        handleEmbeddingProviderChange
    };
};

export default useModelManagement;