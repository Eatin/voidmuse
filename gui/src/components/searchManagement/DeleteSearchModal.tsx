import React from 'react';
import {Modal, ConfigProvider, Button} from 'antd';
import {ExclamationCircleFilled} from '@ant-design/icons';
import {SearchConfigItem} from '@/types/search';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

interface DeleteSearchModalProps {
    isDeleteModalVisible: boolean;
    configToDelete: SearchConfigItem | null;
    handleCancelDelete: () => void;
    handleConfirmDelete: (record: SearchConfigItem) => Promise<void>;
}

const DeleteSearchModal: React.FC<DeleteSearchModalProps> = ({
    isDeleteModalVisible,
    configToDelete,
    handleCancelDelete,
    handleConfirmDelete,
}) => {
    const { t } = useTranslation('components');
    const { currentLanguage } = useLanguage(); // Subscribe to language changes: When language changes, the component will re-render
    if (!configToDelete) return null;

    return (
        <ConfigProvider theme={{
            components: {
                Modal: {
                    contentBg: 'var(--delete-search-modal-contentBg)',
                },
            },
        }}>
            <Modal
                title={null}
                open={isDeleteModalVisible}
                onCancel={handleCancelDelete}
                footer={null}
                centered
                width={260}
                closable={false}
            >
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <ExclamationCircleFilled
                        style={{color: 'var(--delete-search-modal-exclamation-color)', fontSize: 20}}/>
                    <div style={{fontSize: '14px', fontWeight: 600, marginTop: 8}}>{t('searchManagement.deleteSearch.title')}</div>
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
                                defaultBg: 'var(--delete-search-modal-okButton-background-color)',
                                defaultHoverBg: 'var(--delete-search-modal-okButton-hover-color)',
                                defaultColor: 'var(--delete-search-modal-okButton-color)',
                                defaultHoverColor: 'var(--delete-search-modal-okButton-color)',
                                defaultHoverBorderColor: '',
                                defaultActiveBorderColor: '',
                                defaultActiveColor: '',
                                defaultActiveBg: '',
                            }
                        },
                    }}>
                        <Button
                            onClick={() => handleConfirmDelete(configToDelete)}
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
                            {t('searchManagement.deleteSearch.delete')}
                        </Button>
                    </ConfigProvider>

                    <ConfigProvider theme={{
                        components: {
                            Button: {
                                defaultBg: 'var(--delete-search-modal-cancelButton-background-color)',
                                defaultHoverBg: 'var(--delete-search-modal-cancelButton-hover-color)',
                                defaultColor: 'var(--delete-search-modal-cancelButton-color)',
                                defaultHoverColor: 'var(--delete-search-modal-cancelButton-color)',
                                defaultHoverBorderColor: '',
                                defaultActiveBorderColor: '',
                                defaultActiveColor: '',
                                defaultActiveBg: '',
                            }
                        },
                    }}>
                        <Button
                            onClick={handleCancelDelete}
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
                            {t('searchManagement.deleteSearch.cancel')}
                        </Button>
                    </ConfigProvider>
                </div>
            </Modal>
        </ConfigProvider>
    );
};

export default DeleteSearchModal;