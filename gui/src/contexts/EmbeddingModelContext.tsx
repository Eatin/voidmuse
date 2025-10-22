import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { ModelItem } from '../types/models';
import { storageService } from '../storage';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';

interface EmbeddingModelContextProps {
    embeddingModels: ModelItem[];
    selectedEmbeddingModelKey: string | null;
    selectedEmbeddingModel: ModelItem | null;

    refreshEmbeddingModels: () => Promise<void>;
    addEmbeddingModel: (model: ModelItem) => Promise<void>;
    updateEmbeddingModel: (model: ModelItem) => Promise<void>;
    deleteEmbeddingModel: (key: string) => Promise<void>;
    toggleEmbeddingModelEnabled: (key: string, enabled: boolean) => Promise<void>;
    selectEmbeddingModel: (modelKey: string) => Promise<void>;
}

const EmbeddingModelContext = createContext<EmbeddingModelContextProps | undefined>(undefined);

export const EmbeddingModelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { t } = useTranslation('errors');
    const [embeddingModels, setEmbeddingModels] = useState<ModelItem[]>([]);
    const [selectedEmbeddingModelKey, setSelectedEmbeddingModelKey] = useState<string | null>(null);

    const selectedEmbeddingModel = useMemo(() => {
        if (!selectedEmbeddingModelKey) return null;
        const result = embeddingModels.find(m => m.key === selectedEmbeddingModelKey) || null;
        return result;
    }, [embeddingModels, selectedEmbeddingModelKey]);

    const refreshEmbeddingModels = async (): Promise<void> => {
        try {
            const configs = await storageService.getEmbeddingModelConfigs();
            setEmbeddingModels(configs);
        } catch (error) {
            console.error('Failed to load embedding model data:', error);
            message.error(t('context.embeddingModel.loadFailed'));
        }
    };

    const saveEmbeddingModels = async (updatedModels: ModelItem[]): Promise<void> => {
        try {
            await storageService.setEmbeddingModelConfigs(updatedModels);
        } catch (error) {
            console.error('Failed to save embedding model data:', error);
            message.error(t('context.embeddingModel.saveFailed'));
            throw error;
        }
    };

    const addEmbeddingModel = async (model: ModelItem): Promise<void> => {
        const updatedModels = [...embeddingModels, model];
        await saveEmbeddingModels(updatedModels);
        setEmbeddingModels(updatedModels);
        message.success(t('context.embeddingModel.addSuccess'));
    };

    const updateEmbeddingModel = async (model: ModelItem): Promise<void> => {
        const updatedModels = embeddingModels.map(m =>
            m.key === model.key ? model : m
        );
        await saveEmbeddingModels(updatedModels);
        setEmbeddingModels(updatedModels);
        message.success(t('context.embeddingModel.updateSuccess'));
    };

    const deleteEmbeddingModel = async (key: string): Promise<void> => {
        const updatedModels = embeddingModels.filter(m => m.key !== key);
        await saveEmbeddingModels(updatedModels);
        setEmbeddingModels(updatedModels);

        // If the deleted model is the currently selected one, clear the selection
        if (selectedEmbeddingModelKey === key) {
            await selectEmbeddingModel('');
        }

        message.success(t('context.embeddingModel.deleteSuccess'));
    };

    const toggleEmbeddingModelEnabled = async (key: string, enabled: boolean): Promise<void> => {
        const updatedModels = embeddingModels.map(m =>
            m.key === key ? { ...m, enabled } : m
        );
        await saveEmbeddingModels(updatedModels);
        setEmbeddingModels(updatedModels);

        // If the disabled model is the currently selected one, clear the selection
        if (!enabled && selectedEmbeddingModelKey === key) {
            await selectEmbeddingModel('');
        }

        message.success(enabled ? t('context.embeddingModel.enableSuccess') : t('context.embeddingModel.disableSuccess'));
    };

    const selectEmbeddingModel = async (modelKey: string): Promise<void> => {
        try {
            if (modelKey) {
                await storageService.setSelectedEmbeddingModelKey(modelKey);
                setSelectedEmbeddingModelKey(modelKey);
            } else {
                await storageService.setSelectedEmbeddingModelKey('');
                setSelectedEmbeddingModelKey(null);
            }
        } catch (error) {
            console.error('Failed to save selected embedding model:', error);
            message.error(t('context.embeddingModel.saveSelectedFailed'));
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load saved selected embedding model
                const savedEmbeddingModelKey = await storageService.getSelectedEmbeddingModelKey();
                if (savedEmbeddingModelKey) {
                    setSelectedEmbeddingModelKey(savedEmbeddingModelKey);
                }
            } catch (error) {
                console.error('Failed to load selected embedding model:', error);
            }

            await refreshEmbeddingModels();
        };

        loadInitialData();
    }, []);

    // When embedding model data changes, check if the selected model is still valid
    useEffect(() => {
        const autoSelectFirstModel = async () => {
            // If no model is selected, or the selected model doesn't exist/is disabled
            const currentModelExists = selectedEmbeddingModelKey && embeddingModels.some(m =>
                String(m.key) === String(selectedEmbeddingModelKey) && m.enabled
            );

            if (embeddingModels.length > 0) {
                if (!currentModelExists) {
                    // Find the first enabled model
                    const firstEnabledModel = embeddingModels.find(m => m.enabled);
                    if (firstEnabledModel) {
                        await selectEmbeddingModel(firstEnabledModel.key);
                    }
                } else {
                    const selectedModel = embeddingModels.find(m => {
                        return String(m.key) === String(selectedEmbeddingModelKey);
                    });
                    if (selectedModel) {
                        await selectEmbeddingModel(selectedModel.key);
                    }
                    return;
                }
            }
        };
        
        autoSelectFirstModel();
    }, [embeddingModels, selectedEmbeddingModelKey]);

    const value = useMemo(() => ({
        embeddingModels,
        selectedEmbeddingModelKey,
        selectedEmbeddingModel,
        refreshEmbeddingModels,
        addEmbeddingModel,
        updateEmbeddingModel,
        deleteEmbeddingModel,
        toggleEmbeddingModelEnabled,
        selectEmbeddingModel
    }), [embeddingModels, selectedEmbeddingModelKey, selectedEmbeddingModel]);

    return <EmbeddingModelContext.Provider value={value}>{children}</EmbeddingModelContext.Provider>;
};

export const useEmbeddingModelContext = () => {
    const { t } = useTranslation('errors');
    const context = useContext(EmbeddingModelContext);
    if (context === undefined) {
        throw new Error(t('context.embeddingModel.contextError'));
    }
    return context;
};