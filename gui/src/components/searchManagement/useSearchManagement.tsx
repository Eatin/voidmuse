import React, {useState, useEffect} from 'react';
import {Form, message} from 'antd';
import {SearchConfigItem, SearchProviderOption, SearchEngineOption} from '../../types/search';
import { useTranslation } from 'react-i18next';
import {StorageService} from '../../storage/StorageService';

const searchProviderOptions: SearchProviderOption[] = [
    {label: 'Google', value: 'google'},
    {label: '博查', value: 'bocha'},
];

const useSearchManagement = () => {
    const { t } = useTranslation('components');
    const [searchConfigs, setSearchConfigs] = useState<SearchConfigItem[]>([]);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [currentProvider, setCurrentProvider] = useState<string>('');
    const [form] = Form.useForm();
    const [currentEditConfig, setCurrentEditConfig] = useState<SearchConfigItem | null>(null);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState<boolean>(false);
    const [configToDelete, setConfigToDelete] = useState<SearchConfigItem | null>(null);
    const [selectedSearchConfigKey, setSelectedSearchConfigKey] = useState<string>('');

    useEffect(() => {
        loadSearchConfigs();
    }, []);

    // Check if selected configuration is still valid when search configuration data changes
    useEffect(() => {
        const autoSelectFirstConfig = async () => {
            // If no configuration is selected, or the selected configuration doesn't exist/is disabled
            const currentConfigExists = selectedSearchConfigKey && searchConfigs.some(c =>
                String(c.key) === String(selectedSearchConfigKey) && c.enabled
            );

            if (searchConfigs.length > 0) {
                if (!currentConfigExists) {
                    const firstEnabledConfig = searchConfigs.find(c => c.enabled);
                    if (firstEnabledConfig) {
                        await selectSearchConfig(firstEnabledConfig.key);
                    }
                } else {
                    const selectedConfig = searchConfigs.find(c => {
                        return String(c.key) === String(selectedSearchConfigKey);
                    });
                    if (selectedConfig) {
                        await selectSearchConfig(selectedConfig.key);
                    }
                    return;
                }
            }
        };
        
        autoSelectFirstConfig();
    }, [searchConfigs, selectedSearchConfigKey]);

    const loadSearchConfigs = async (): Promise<void> => {
        try {
            const storageService = StorageService.getInstance();
            const configs = await storageService.getSearchConfigs() || [];
            setSearchConfigs(configs);

            // Load selected search configuration
            const selectedKey = await storageService.getSelectedSearchConfigKey();
            if (selectedKey) {
                setSelectedSearchConfigKey(selectedKey);
            }
        } catch (error) {
            console.error('Failed to load search configurations:', error);
        }
    };

    const addSearchConfig = async (config: SearchConfigItem): Promise<void> => {
        try {
            const storageService = StorageService.getInstance();
            const newConfigs = [...searchConfigs, config];
            await storageService.setSearchConfigs(newConfigs);
            setSearchConfigs(newConfigs);
            message.success(t('searchManagement.messages.addSuccess'));
        } catch (error) {
            console.error('Failed to add search configuration:', error);
            message.error(t('searchManagement.messages.addFailed'));
        }
    };

    const updateSearchConfig = async (config: SearchConfigItem): Promise<void> => {
        try {
            const storageService = StorageService.getInstance();
            const newConfigs = searchConfigs.map(item =>
                String(item.key) === String(config.key) ? config : item
            );
            await storageService.setSearchConfigs(newConfigs);
            setSearchConfigs(newConfigs);
            message.success(t('searchManagement.messages.updateSuccess'));
        } catch (error) {
            console.error('Failed to update search configuration:', error);
            message.error(t('searchManagement.messages.updateFailed'));
        }
    };

    const deleteSearchConfig = async (key: string): Promise<void> => {
        try {
            const storageService = StorageService.getInstance();
            const newConfigs = searchConfigs.filter(item => String(item.key) !== String(key));
            await storageService.setSearchConfigs(newConfigs);
            setSearchConfigs(newConfigs);

            if (String(selectedSearchConfigKey) === String(key)) {
                setSelectedSearchConfigKey('');
                await storageService.setSelectedSearchConfigKey('');
            }

            message.success(t('searchManagement.messages.deleteSuccess'));
        } catch (error) {
            console.error('Failed to delete search configuration:', error);
            message.error(t('searchManagement.messages.deleteFailed'));
        }
    };

    const toggleSearchConfigEnabled = async (key: string, enabled: boolean): Promise<void> => {
        try {
            const storageService = StorageService.getInstance();
            const newConfigs = searchConfigs.map(item =>
                String(item.key) === String(key) ? {...item, enabled} : item
            );
            await storageService.setSearchConfigs(newConfigs);
            setSearchConfigs(newConfigs);
        } catch (error) {
            console.error('Failed to toggle search configuration status:', error);
        }
    };

    const selectSearchConfig = async (key: string, showMessage: boolean = false): Promise<void> => {
        try {
            const storageService = StorageService.getInstance();
            await storageService.setSelectedSearchConfigKey(key);
            setSelectedSearchConfigKey(key);
            if (showMessage) {
                message.success(t('searchManagement.messages.selectSuccess'));
            }
        } catch (error) {
            console.error('Failed to select search configuration:', error);
            if (showMessage) {
                message.error(t('searchManagement.messages.selectFailed'));
            }
        }
    };

    const handleSwitchChange = async (checked: boolean, key: string): Promise<void> => {
        await toggleSearchConfigEnabled(key, checked);
    };

    const handleDeleteConfig = (record: SearchConfigItem): void => {
        setConfigToDelete(record);
        setIsDeleteModalVisible(true);
    };

    const handleCancelDelete = (): void => {
        setIsDeleteModalVisible(false);
        setConfigToDelete(null);
    };

    const handleConfirmDelete = async (record: SearchConfigItem): Promise<void> => {
        await deleteSearchConfig(String(record.key));
        setIsDeleteModalVisible(false);
        setConfigToDelete(null);
    };

    const getTableData = (): SearchConfigItem[] => {
        return searchConfigs;
    };

    const showAddConfigModal = (): void => {
        setIsModalVisible(true);
    };

    const handleCancel = (): void => {
        setIsModalVisible(false);
        form.resetFields();
        setCurrentProvider('');
        setCurrentEditConfig(null);
    };

    const handleAddConfig = async (): Promise<void> => {
        form.validateFields()
            .then(async values => {
                // Simplified name generation logic, only use provider
                const name = `${values.provider}`;

                if (currentEditConfig) {
                    const updatedConfig = {
                        ...currentEditConfig,
                        name: name,
                        provider: values.provider,
                        config: values.config,
                    };

                    await updateSearchConfig(updatedConfig);
                } else {
                    const newConfig = {
                        key: Date.now().toString(),
                        name: name,
                        provider: values.provider,
                        enabled: true,
                        config: values.config,
                    };
                    await addSearchConfig(newConfig);
                }

                setIsModalVisible(false);
                form.resetFields();
                setCurrentEditConfig(null);
            })
            .catch(info => {
                console.log('Form validation failed:', info);
            });
    };

    const handleProviderChange = (value: string) => {
        setCurrentProvider(value);
    };

    const editConfig = (record: SearchConfigItem): void => {
        setCurrentEditConfig(record);
        form.setFieldsValue({
            provider: record.provider,
            config: record.config,
        });
        setCurrentProvider(record.provider || '');
        setIsModalVisible(true);
    };

    const handleSearchConfigChange = async (configKey: string): Promise<void> => {
        await selectSearchConfig(configKey, true);
    };

    return {
        searchConfigs,
        isModalVisible,
        currentProvider,
        form,
        currentEditConfig,
        isDeleteModalVisible,
        configToDelete,
        selectedSearchConfigKey,
        handleSwitchChange,
        handleDeleteConfig,
        getTableData,
        showAddConfigModal,
        handleCancel,
        handleAddConfig,
        searchProviderOptions,
        handleProviderChange,
        setCurrentProvider,
        setIsModalVisible,
        handleCancelDelete,
        handleConfirmDelete,
        editConfig,
        handleSearchConfigChange,
    };
};

export default useSearchManagement;