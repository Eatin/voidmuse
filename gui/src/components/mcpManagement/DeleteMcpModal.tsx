import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import {Modal, ConfigProvider, Button} from 'antd';
import {ExclamationCircleFilled} from '@ant-design/icons';
import { McpItem } from '@/types/mcps';

interface DeleteMcpModalProps {
    visible: boolean;
    record: McpItem | null;
    onCancel: () => void;
    onDelete: (record: McpItem) => void;
}

const DeleteMcpModal: React.FC<DeleteMcpModalProps> = ({
                                                               visible,
                                                               record,
                                                               onCancel,
                                                               onDelete
                                                           }) => {
    const { t } = useTranslation('components');
    const { currentLanguage } = useLanguage();
    
    if (!record) return null;

    return (
        <ConfigProvider theme={{
            components: {
                Modal: {
                    contentBg: 'var(--delete-mcp-modal-contentBg)',
                },
            },
        }}>
            <Modal
                title={null}
                open={visible}
                onCancel={onCancel}
                footer={null}
                centered
                width={260}
                closable={false}
            >
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <ExclamationCircleFilled
                        style={{color: 'var(--delete-mcp-modal-exclamation-color)', fontSize: 20}}/>
                    <div style={{fontSize: '14px', fontWeight: 600, marginTop: 8}}>{t('mcpManagement.deleteModal.title')}</div>
                    <div style={{textAlign: 'center', marginTop: 16}}>
                        <div style={{fontSize: '14px', color: 'var(--delete-mcp-modal-text-color)'}}>
                            {t('mcpManagement.deleteModal.confirmText', { name: record.name })}
                        </div>
                        <div style={{fontSize: '12px', color: 'var(--delete-mcp-modal-description-color)', marginTop: 4}}>
                            {t('mcpManagement.deleteModal.warningText')}
                        </div>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: 10
                }}>

                    <ConfigProvider theme={{
                        components: {
                            Button: {
                                defaultBg: 'var(--delete-mcp-modal-okButton-background-color)',
                                defaultHoverBg: 'var(--delete-mcp-modal-okButton-hover-color)',
                                defaultColor: 'var(--delete-mcp-modal-okButton-color)',
                                defaultHoverColor: 'var(--delete-mcp-modal-okButton-color)',
                                defaultHoverBorderColor: '',
                                defaultActiveBorderColor: '',
                                defaultActiveColor: '',
                                defaultActiveBg: '',
                            }
                        },
                    }}>
                        <Button
                            onClick={() => onDelete(record)}
                            style={{
                                width: '230px',
                                height: '28px',
                                fontWeight: 'bold',
                                boxShadow: 'none',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            {t('mcpManagement.deleteModal.deleteButton')}
                        </Button>
                    </ConfigProvider>

                    <ConfigProvider theme={{
                        components: {
                            Button: {
                                defaultBg: 'var(--delete-mcp-modal-cancelButton-background-color)',
                                defaultHoverBg: 'var(--delete-mcp-modal-cancelButton-hover-color)',
                                defaultColor: 'var(--delete-mcp-modal-cancelButton-color)',
                                defaultHoverColor: 'var(--delete-mcp-modal-cancelButton-color)',
                                defaultHoverBorderColor: '',
                                defaultActiveBorderColor: '',
                                defaultActiveColor: '',
                                defaultActiveBg: '',
                            }
                        },
                    }}>
                        <Button
                            onClick={onCancel}
                            style={{
                                width: '230px',
                                height: '28px',
                                marginLeft: '0px',
                                fontWeight: 'bold',
                                boxShadow: 'none',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            {t('mcpManagement.deleteModal.cancelButton')}
                        </Button>

                    </ConfigProvider>
                </div>
            </Modal>
        </ConfigProvider>
    );
};

export default DeleteMcpModal;