import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { ModelItem } from '../types/models';
import { storageService } from '../storage';
import { useMessage } from '@/utils/MessageUtils';
import { useTranslation } from 'react-i18next';

interface ModelContextProps {
    // State
    models: ModelItem[];
    selectedModelKey: string | null;
    selectedModel: ModelItem | null;
    selectedAutoCompleteModelKey: string | null; 
    selectedAutoCompleteModel: ModelItem | null; 

    // Operation methods
    refreshModels: () => Promise<void>;
    addModel: (model: ModelItem) => Promise<void>;
    updateModel: (model: ModelItem) => Promise<void>;
    deleteModel: (key: string) => Promise<void>;
    toggleModelEnabled: (key: string, enabled: boolean) => Promise<void>;
    selectModel: (modelKey: string) => Promise<void>;
    selectAutoCompleteModel: (modelKey: string) => Promise<void>; 
}

const ModelContext = createContext<ModelContextProps | undefined>(undefined);

export const ModelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { t } = useTranslation('errors');
    const [models, setModels] = useState<ModelItem[]>([]);
    const [selectedModelKey, setSelectedModelKey] = useState<string | null>(null);
    const [selectedAutoCompleteModelKey, setSelectedAutoCompleteModelKey] = useState<string | null>(null);
    const message = useMessage(); 

    // Calculate currently selected model object
    const selectedModel = useMemo(() => {
        if (!selectedModelKey) return null;
        const result = models.find(m => m.key === selectedModelKey) || null;
        return result;
    }, [models, selectedModelKey]);

    const selectedAutoCompleteModel = useMemo(() => {
        if (!selectedAutoCompleteModelKey) return null;
        const result = models.find(m => m.key === selectedAutoCompleteModelKey && m.enabled) || null;
        return result;
    }, [models, selectedAutoCompleteModelKey]);

    // Get model data from storage service
    const refreshModels = async (): Promise<void> => {
        try {
            const configs = await storageService.getModelConfigs();
            setModels(configs);
        } catch (error) {
            console.error('Failed to load model data:', error);
            message.error(t('context.model.loadFailed'));
        }
    };

    const saveModels = async (updatedModels: ModelItem[]): Promise<void> => {
        try {
            await storageService.setModelConfigs(updatedModels);
        } catch (error) {
            console.error('Failed to save model data:', error);
            message.error(t('context.model.saveFailed'));
            throw error; // Pass error to let caller know save failed
        }
    };

    const addModel = async (model: ModelItem): Promise<void> => {
        const updatedModels = [...models, model];
        await saveModels(updatedModels);
        setModels(updatedModels);
        message.success(t('context.model.addSuccess'));
    };

    const updateModel = async (model: ModelItem): Promise<void> => {
        const updatedModels = models.map(m =>
            m.key === model.key ? model : m
        );
        await saveModels(updatedModels);
        setModels(updatedModels);
        message.success(t('context.model.updateSuccess'));
    };

    const deleteModel = async (key: string): Promise<void> => {
        const updatedModels = models.filter(m => m.key !== key);
        await saveModels(updatedModels);
        setModels(updatedModels);

        // If the deleted model is currently selected, clear selection
        if (selectedModelKey === key) {
            await selectModel('');
        }

        message.success(t('context.model.deleteSuccess'));
    };

    const toggleModelEnabled = async (key: string, enabled: boolean): Promise<void> => {
        const updatedModels = models.map(m =>
            m.key === key ? { ...m, enabled } : m
        );
        await saveModels(updatedModels);
        setModels(updatedModels);

        // If the disabled model is currently selected, clear selection
        if (!enabled && selectedModelKey === key) {
            await selectModel('');
        }

        message.success(enabled ? t('context.model.enableSuccess') : t('context.model.disableSuccess'));
    };

    const selectModel = async (modelKey: string): Promise<void> => {
        try {
            if (modelKey) {
                await storageService.setSelectedModelKey(modelKey);
                setSelectedModelKey(modelKey);
            } else {
                // If empty string is passed, clear selection
                await storageService.setSelectedModelKey('');
                setSelectedModelKey(null);
            }
        } catch (error) {
            console.error('Failed to save selected model:', error);
            message.error(t('context.model.saveSelectedFailed'));
        }
    };

    const selectAutoCompleteModel = async (modelKey: string): Promise<void> => {
        try {
            if (modelKey) {
                await storageService.setSelectedAutoCompleteModelKey(modelKey);
                setSelectedAutoCompleteModelKey(modelKey);
            } else {
                await storageService.setSelectedAutoCompleteModelKey('');
                setSelectedAutoCompleteModelKey(null);
            }
        } catch (error) {
            console.error('Failed to save auto-complete model:', error);
            message.error(t('context.model.saveAutoCompleteFailed'));
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load saved selected model
                const savedModelKey = await storageService.getSelectedModelKey();
                if (savedModelKey) {
                    setSelectedModelKey(savedModelKey);
                }
                
                // New: Load saved auto-complete model
                const savedAutoCompleteModelKey = await storageService.getSelectedAutoCompleteModelKey();
                if (savedAutoCompleteModelKey) {
                    setSelectedAutoCompleteModelKey(savedAutoCompleteModelKey);
                }
            } catch (error) {
                console.error('Failed to load selected model:', error);
            }

            await refreshModels();
        };

        loadInitialData();
    }, []);

    // When model data changes, check if auto-complete model is still valid
    useEffect(() => {
        // If models is empty, skip validation logic
        if (models.length === 0) {
            return;
        }
        
        const validateAutoCompleteModel = async () => {
            if (selectedAutoCompleteModelKey) {
                const autoCompleteModelExists = models.some(m =>
                    String(m.key) === String(selectedAutoCompleteModelKey) && m.enabled
                );
                
                if (!autoCompleteModelExists) {
                    // If currently selected auto-complete model doesn't exist or is disabled, clear selection
                    await selectAutoCompleteModel('');
                }
            }
        };
        // Auto-select chat model
        const autoSelectChatModel = async () => {
            // If no model is selected, or selected model doesn't exist/is disabled
            const currentModelExists = selectedModelKey && models.some(m =>
                String(m.key) === String(selectedModelKey) && m.enabled
            );

            if (models.length > 0) {
                if (!currentModelExists) {
                    // Find the first enabled model
                    const firstEnabledModel = models.find(m => m.enabled);
                    if (firstEnabledModel) {
                        await selectModel(firstEnabledModel.key);
                    }
                } else {
                    const selectedModel = models.find(m => {
                        return String(m.key) === String(selectedModelKey);
                    });
                    if (selectedModel) {
                        await selectModel(selectedModel.key);
                    }
                    return;
                }
            }
        };
        validateAutoCompleteModel();
        autoSelectChatModel();
    }, [models, selectedAutoCompleteModelKey, selectedModelKey]);

    const value = useMemo(() => ({
        models,
        selectedModelKey,
        selectedModel,
        selectedAutoCompleteModelKey,
        selectedAutoCompleteModel, 
        refreshModels,
        addModel,
        updateModel,
        deleteModel,
        toggleModelEnabled,
        selectModel,
        selectAutoCompleteModel 
    }), [models, selectedModelKey, selectedModel, selectedAutoCompleteModelKey, selectedAutoCompleteModel]);

    return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>;
};

export const useModelContext = (): ModelContextProps => {
    const { t } = useTranslation('errors');
    const context = useContext(ModelContext);
    if (context === undefined) {
        throw new Error(t('context.model.contextError'));
    }
    return context;
};