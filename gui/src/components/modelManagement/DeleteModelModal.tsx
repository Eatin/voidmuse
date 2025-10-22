import React from 'react';
import { Modal, ConfigProvider, Button } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { ModelItem } from '@/types/models';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

interface DeleteModelModalProps {
    visible: boolean;
    record: ModelItem | null;
    onCancel: () => void;
    onDelete: (record: ModelItem) => void;
}

const DeleteModelModal: React.FC<DeleteModelModalProps> = ({
    visible,
    record,
    onCancel,
    onDelete
}) => {
    const { t } = useTranslation('components');
    const { currentLanguage } = useLanguage(); // Subscribe to language changes: When language changes, the component will re-render
    if (!record) return null;

    return (
        <ConfigProvider theme={{
            components: {
                Modal: {
                    contentBg: 'var(--modal-contentBg)',
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <ExclamationCircleFilled
                        style={{ color: 'var(--modal-exclamation-color)', fontSize: 20 }} />
                    <div style={{ fontSize: '14px', fontWeight: 600, marginTop: 8 }}>{t('modelManagement.deleteModel.title')}</div>
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
                                defaultBg: 'var(--modal-okButton-background-color)',
                                defaultHoverBg: 'var(--modal-okButton-hover-color)',
                                defaultColor: 'var(--modal-okButton-color)',
                                defaultHoverColor: 'var(--modal-okButton-color)',
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
                            {t('modelManagement.deleteModel.delete')}
                        </Button>
                    </ConfigProvider>

                    <ConfigProvider theme={{
                        components: {
                            Button: {
                                defaultBg: 'var(--modal-cancelButton-background-color)',
                                defaultHoverBg: 'var(--modal-cancelButton-hover-color)',
                                defaultColor: 'var(--modal-cancelButton-color)',
                                defaultHoverColor: 'var(--modal-cancelButton-color)',
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
                            {t('modelManagement.deleteModel.cancel')}
                        </Button>

                    </ConfigProvider>
                </div>
            </Modal>
        </ConfigProvider>
    );
};

export default DeleteModelModal;