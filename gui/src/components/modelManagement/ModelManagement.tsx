import React, {useEffect, useRef, useState} from 'react';
import {Button, ConfigProvider, Progress, ProgressProps, Switch, Typography, Tooltip} from 'antd';
import {PlusOutlined} from '@ant-design/icons';
import {useTranslation} from 'react-i18next';
import useModelManagement from './useModelManagement';
import ModelTable from './ModelTable';
import AddModelModal from './AddModelModal';
import DeleteModelModal from './DeleteModelModal';
import EmbeddingModelTable from './EmbeddingModelTable';
import AddEmbeddingModelModal from './AddEmbeddingModelModal';
import {IDEService} from '@/api/IDEService';
import {isIDEPlatform} from '@/utils/PlatformUtils';
import {emitter} from '@/api/ForIDEApi';
import { useLanguage } from '@/contexts/LanguageContext';

const {Title, Paragraph} = Typography;

const ModelManagement: React.FC = () => {
    const { currentLanguage } = useLanguage(); // Subscribe to language changes: When language changes, the component will re-render
    const {t} = useTranslation('components');
    
    const [indexingProgress, setIndexingProgress] = useState<number>(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const {
        expandedGroups,
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
        toggleGroup,
        handleDeleteModel,
        getTableData,
        showAddModelModal,
        handleCancel,
        handleAddModel,
        providerOptions,
        getModelOptions,
        handleProviderChange,
        setCurrentProvider,
        setIsModalVisible,
        getProviderDocLink,
        getApiKeyLink,
        isDeleteModalVisible,
        modelToDelete,
        handleCancelDelete,
        handleConfirmDelete,
        editModel,
        selectedAutoCompleteModelKey,
        handleAutoCompleteModelChange,
        // EmbeddingModel related
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
        selectedEmbeddingModelKey,
        handleEmbeddingModelChange,
        isAutoEmbedding,
        handleAutoEmbeddingChange,
        embeddingProviderOptions,
        getEmbeddingModelOptions,
        getEmbeddingProviderDocLink,
        getEmbeddingApiKeyLink,
        getEmbeddingDefaultBaseUrl,
        handleEmbeddingProviderChange
    } = useModelManagement();

    const conicColors: ProgressProps['strokeColor'] = {
        '0%': '#ffccc7',
        '50%': '#ffe58f',
        '100%': '#87d068',
    };

    // Get codebase indexing progress
    const fetchIndexingProgress = async () => {
        try {
            const ideService = IDEService.getInstance();
            const progressStr = await ideService.getCodebaseIndexingProgress();
            const progressValue = parseFloat(progressStr);
            // Convert 0.0-1.0 to 0-100
            const percentValue = Math.round(progressValue * 100);
            setIndexingProgress(percentValue);

            // Clear timer if progress reaches 100%
            if (percentValue >= 100 && intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        } catch (error) {
            console.error('Failed to get indexing progress:', error);
            setIndexingProgress(0);
        }
    };

    // Listen to getEmbeddings event and start timer
    useEffect(() => {
        const handleGetEmbeddings = () => {
            console.log('Received getEmbeddings event, starting indexing progress query timer');

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            fetchIndexingProgress();

            // Start timer, query every 5 seconds
            intervalRef.current = setInterval(() => {
                fetchIndexingProgress();
            }, 5000);
        };

        // Listen to getEmbeddings event
        emitter.on('getEmbeddings', handleGetEmbeddings);

        return () => {
            emitter.off('getEmbeddings', handleGetEmbeddings);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, []);

    // Query indexing progress immediately when component mounts
    useEffect(() => {
        if (isIDEPlatform()) {
            fetchIndexingProgress();
        }
    }, []);

    return (
        <div style={{padding: '24px'}}>
            <Typography>
                <Title level={2} style={{fontSize: '20px', fontWeight: 600, marginBottom: '16px'}}>{t('modelManagement.title')}</Title>
                <Title level={4} style={{fontSize: '16px', fontWeight: 500, marginBottom: '12px'}}>{t('modelManagement.subtitle')}</Title>
                <Paragraph style={{fontSize: '14px', color: 'rgb(122, 137, 153)', marginBottom: '24px'}}>
                    {t('modelManagement.description')}
                </Paragraph>
            </Typography>

            <div style={{marginBottom: '16px'}}>
                <ConfigProvider
                    theme={{
                        components: {
                            Button: {
                                defaultBg: 'var(--model-management-add-button-background-color)',
                                defaultHoverBg: 'var(--model-management-add-button-hover-background-color)',
                                defaultColor: 'var(--text-color)',
                                defaultHoverColor: 'var(--text-color)',
                                defaultHoverBorderColor: '',
                                defaultActiveColor: 'var(--text-color)',
                                defaultActiveBg: 'var(--model-management-add-button-hover-background-color)',
                            },
                        },
                    }}
                >
                    <Button
                        icon={<PlusOutlined/>}
                        onClick={showAddModelModal}
                        style={{
                            width: '160px',
                            height: '30px',
                            fontWeight: 'bold',
                            boxShadow: 'none',
                            border: 'none',
                            outline: 'none',
                        }}
                    >
                        {t('modelManagement.addModelButton')}
                    </Button>
                </ConfigProvider>
            </div>

            <ModelTable
                tableData={getTableData()}
                expandedGroups={expandedGroups}
                toggleGroup={toggleGroup}
                handleSwitchChange={handleSwitchChange}
                handleDeleteModel={handleDeleteModel}
                editModel={editModel}
                selectedAutoCompleteModelKey={selectedAutoCompleteModelKey}
                handleAutoCompleteModelChange={handleAutoCompleteModelChange}
            />

            <div style={{marginTop: '40px', marginBottom: '16px'}}>
                <Title level={4}
                       style={{fontSize: '16px', fontWeight: 500, marginBottom: '12px'}}>{t('modelManagement.embeddingTitle')}</Title>
                <Paragraph style={{fontSize: '14px', color: 'rgb(122, 137, 153)', marginBottom: '24px'}}>
                    {t('modelManagement.embeddingDescription')}
                </Paragraph>

                <ConfigProvider
                    theme={{
                        components: {
                            Button: {
                                defaultBg: 'var(--model-management-add-button-background-color)',
                                defaultHoverBg: 'var(--model-management-add-button-hover-background-color)',
                                defaultColor: 'var(--text-color)',
                                defaultHoverColor: 'var(--text-color)',
                                defaultHoverBorderColor: '',
                                defaultActiveColor: 'var(--text-color)',
                                defaultActiveBg: 'var(--model-management-add-button-hover-background-color)',
                            },
                            Switch: {
                                colorPrimary: 'rgb(0,170,98)',
                                colorPrimaryHover: 'rgb(0,170,98)',
                                colorTextQuaternary: 'rgb(233,236,240)',
                            },
                        },
                    }}
                >
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <Button
                            icon={<PlusOutlined/>}
                            onClick={showEmbeddingAddModelModal}
                            style={{
                                width: '200px',
                                height: '30px',
                                fontWeight: 'bold',
                                boxShadow: 'none',
                                border: 'none',
                                outline: 'none',
                            }}
                        >
                            {t('modelManagement.addEmbeddingModelButton')}
                        </Button>
                        <Tooltip title={t('modelManagement.autoEmbeddingTooltip')}>
                            <Switch size="small"
                                    checked={isAutoEmbedding}
                                    disabled={!selectedEmbeddingModelKey}
                                    onChange={handleAutoEmbeddingChange}
                            />
                        </Tooltip>

                        <Progress type="circle" percent={indexingProgress} size={20} strokeColor={conicColors}/>
                    </div>
                </ConfigProvider>
            </div>

            <EmbeddingModelTable
                tableData={getEmbeddingTableData()}
                handleSwitchChange={handleEmbeddingSwitchChange}
                handleDeleteModel={handleDeleteEmbeddingModel}
                editModel={editEmbeddingModel}
                selectedEmbeddingModelKey={selectedEmbeddingModelKey}
                handleEmbeddingModelChange={handleEmbeddingModelChange}
            />

            <AddModelModal
                isModalVisible={isModalVisible}
                handleCancel={handleCancel}
                handleAddModel={handleAddModel}
                form={form}
                currentEditModel={currentEditModel}
                providerOptions={providerOptions}
                getModelOptions={getModelOptions}
                currentProvider={currentProvider}
                handleProviderChange={handleProviderChange}
                showModelIdInput={showModelIdInput}
                setShowModelIdInput={setShowModelIdInput}
                isModelSelectOpen={isModelSelectOpen}
                setIsModelSelectOpen={setIsModelSelectOpen}
                getProviderDocLink={getProviderDocLink}
                getApiKeyLink={getApiKeyLink}
            />

            <DeleteModelModal
                visible={isDeleteModalVisible}
                record={modelToDelete}
                onCancel={handleCancelDelete}
                onDelete={handleConfirmDelete}
            />

            <AddEmbeddingModelModal
                isModalVisible={isEmbeddingModalVisible}
                handleCancel={handleEmbeddingCancel}
                handleAddModel={handleAddEmbeddingModel}
                form={embeddingForm}
                currentEditModel={currentEmbeddingEditModel}
                embeddingProviderOptions={embeddingProviderOptions}
                getEmbeddingModelOptions={getEmbeddingModelOptions}
                currentProvider={currentProvider}
                handleEmbeddingProviderChange={handleEmbeddingProviderChange}
                showModelIdInput={showModelIdInput}
                setShowModelIdInput={setShowModelIdInput}
                isModelSelectOpen={isModelSelectOpen}
                setIsModelSelectOpen={setIsModelSelectOpen}
                getEmbeddingProviderDocLink={getEmbeddingProviderDocLink}
                getEmbeddingApiKeyLink={getEmbeddingApiKeyLink}
            />

            <DeleteModelModal
                visible={isEmbeddingDeleteModalVisible}
                record={embeddingModelToDelete}
                onCancel={handleCancelEmbeddingDelete}
                onDelete={handleConfirmEmbeddingDelete}
            />
        </div>
    );
};

export default ModelManagement;