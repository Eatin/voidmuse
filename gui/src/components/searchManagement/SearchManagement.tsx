import React from 'react';
import {Button, ConfigProvider, Typography} from 'antd';
import {PlusOutlined} from '@ant-design/icons';

import useSearchManagement from './useSearchManagement';
import SearchTable from './SearchTable';
import AddSearchModal from './AddSearchModal';
import DeleteSearchModal from './DeleteSearchModal';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

const {Title, Paragraph} = Typography;

const SearchManagement: React.FC = () => {
    const { t } = useTranslation('components');
    const { currentLanguage } = useLanguage();
    
    const {
        isModalVisible,
        currentProvider,
        form,
        currentEditConfig,
        handleSwitchChange,
        handleDeleteConfig,
        getTableData,
        showAddConfigModal,
        handleCancel,
        handleAddConfig,
        searchProviderOptions,
        isDeleteModalVisible,
        configToDelete,
        handleCancelDelete,
        handleConfirmDelete,
        editConfig,
        selectedSearchConfigKey,
        handleSearchConfigChange,
        handleProviderChange
    } = useSearchManagement();

    return (
        <div style={{padding: '24px'}}>
            <Typography>
                <Title level={2} style={{fontSize: '20px', fontWeight: 600, marginBottom: '16px'}}>{t('searchManagement.title')}</Title>
                <Title level={4} style={{fontSize: '16px', fontWeight: 500, marginBottom: '12px'}}>{t('searchManagement.subtitle')}</Title>
                <Paragraph style={{fontSize: '14px', color: 'rgb(122, 137, 153)', marginBottom: '24px'}}>
                    {t('searchManagement.description')}
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
                        onClick={showAddConfigModal}
                        style={{
                            width: '160px',
                            height: '30px',
                            fontWeight: 'bold',
                            boxShadow: 'none',
                            border: 'none',
                            outline: 'none',
                        }}
                    >
                        {t('searchManagement.addButton')}
                    </Button>
                </ConfigProvider>
            </div>

            <SearchTable
                tableData={getTableData()}
                handleSwitchChange={handleSwitchChange}
                handleDeleteConfig={handleDeleteConfig}
                editConfig={editConfig}
                selectedSearchConfigKey={selectedSearchConfigKey}
                handleSearchConfigChange={handleSearchConfigChange}
            />

            <AddSearchModal
                isModalVisible={isModalVisible}
                handleCancel={handleCancel}
                handleAddConfig={handleAddConfig}
                form={form}
                currentEditConfig={currentEditConfig}
                searchProviderOptions={searchProviderOptions}
                handleProviderChange={handleProviderChange}
            />

            <DeleteSearchModal
                isDeleteModalVisible={isDeleteModalVisible}
                configToDelete={configToDelete}
                handleCancelDelete={handleCancelDelete}
                handleConfirmDelete={handleConfirmDelete}
            />
        </div>
    );
};

export default SearchManagement;