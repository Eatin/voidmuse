import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import {Button, ConfigProvider, Typography} from 'antd';
import {PlusOutlined} from '@ant-design/icons';
import McpTable from './McpTable';
import AddMcpModal from './AddMcpModal';
import DeleteMcpModal from './DeleteMcpModal'; 
import useMcpManagement from './useMcpManagement';

const {Title, Paragraph} = Typography;

const McpManagement: React.FC = () => {
    const { t } = useTranslation('components');
    const { currentLanguage } = useLanguage();
    
    const {
        expandedGroups,
        isModalVisible,
        form,
        showMcpIdInput,
        setShowMcpIdInput,
        isMcpSelectOpen,
        setIsMcpSelectOpen,
        currentEditMcp,
        handleSwitchChange,
        toggleGroup,
        handleDeleteMcp,
        getTableData,
        showAddMcpModal,
        handleCancel,
        handleAddMcp,
        handleProviderChange,
        isDeleteModalVisible,
        mcpToDelete,
        handleCancelDelete,
        handleConfirmDelete,
        editMcp  
    } = useMcpManagement();

    return (
        <div style={{padding: '24px'}}>
            <Typography>
                <Title level={2} style={{fontSize: '20px', fontWeight: 600, marginBottom: '16px'}}>{t('mcpManagement.title')}</Title>
                <Title level={4} style={{fontSize: '16px', fontWeight: 500, marginBottom: '12px'}}>{t('mcpManagement.subtitle')}</Title>
                <Paragraph style={{fontSize: '14px', color: 'rgb(122, 137, 153)', marginBottom: '24px'}}>
                    {t('mcpManagement.description')}
                </Paragraph>
            </Typography>

            <div style={{marginBottom: '16px'}}>

                <ConfigProvider
                    theme={{
                        components: {
                            Button: {
                                defaultBg: 'var(--mcp-management-add-button-background-color)',
                                defaultHoverBg: 'var(--mcp-management-add-button-hover-background-color)',
                                defaultColor: 'var(--text-color)',
                                defaultHoverColor: 'var(--text-color)',
                                defaultHoverBorderColor: '',
                                defaultActiveBorderColor: 'rgb(255,0,0)',
                                defaultActiveColor: 'var(--text-color)',
                                defaultActiveBg:'var(--mcp-management-add-button-hover-background-color)',
                            },
                        },
                    }}
                >

                    <Button
                        icon={<PlusOutlined/>}
                        onClick={showAddMcpModal}
                        style={{
                            width: '160px',
                            height: '30px',
                            fontWeight: 'bold',
                            boxShadow: 'none',
                            border: 'none',
                            outline: 'none',
                        }}
                    >
                        {t('mcpManagement.addButton')}
                    </Button>

                </ConfigProvider>
            </div>

            <McpTable
                tableData={getTableData()}
                expandedGroups={expandedGroups}
                toggleGroup={toggleGroup}
                handleSwitchChange={handleSwitchChange}
                handleDeleteMcp={handleDeleteMcp}
                editMcp={editMcp}  
            />

            <AddMcpModal
                isModalVisible={isModalVisible}
                handleCancel={handleCancel}
                handleAddMcp={handleAddMcp}
                form={form}
                currentEditMcp={currentEditMcp}
                handleProviderChange={handleProviderChange}
                showMcpIdInput={showMcpIdInput}
                setShowMcpIdInput={setShowMcpIdInput}
                isMcpSelectOpen={isMcpSelectOpen}
                setIsMcpSelectOpen={setIsMcpSelectOpen}
            />
            
            <DeleteMcpModal
                visible={isDeleteModalVisible}
                record={mcpToDelete}
                onCancel={handleCancelDelete}
                onDelete={handleConfirmDelete}
            />
        </div>
    );
};

export default McpManagement;