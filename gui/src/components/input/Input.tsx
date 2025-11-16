import {
    CloudUploadOutlined,
    SendOutlined,
    GlobalOutlined
} from '@ant-design/icons';
import {Attachments, AttachmentsProps} from '@ant-design/x';
import Sender from '../sender/index'
import {Button, Divider, Flex, type GetProp, type GetRef, theme, Tooltip, ConfigProvider} from 'antd';
import { useMessage } from '@/utils/MessageUtils';
import React, {useState} from 'react';
import { useTranslation } from 'react-i18next';
import ModelDropdown from "../dropdown/ModelDropdown";
import './input.css';
import StopIcon from "../icon/StopIcon";
import { ContextItem } from '@/types/context';
import { StorageService } from '@/storage/StorageService';
import { useTabContext } from '@/contexts/TabContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { TabType } from '@/types/tabs';
import SearchManagement from '../searchManagement/SearchManagement';

interface InputProps {
    onRequest?: (htmlText: string, plainText: string, contextItems: ContextItem[]) => void;
    loading?: boolean; 
    onCancel?: () => void;
}

const Input: React.FC<InputProps> = ({onRequest, loading = false, onCancel}) => {

    const { t } = useTranslation('components');
    const { currentLanguage } = useLanguage();
    const message = useMessage();
    
    const [open, setOpen] = React.useState(false);
    const [items, setItems] = React.useState<GetProp<AttachmentsProps, 'items'>>([]);
    const [text, setText] = React.useState('');

    const attachmentsRef = React.useRef<GetRef<typeof Attachments>>(null);

    const senderRef = React.useRef<GetRef<typeof Sender>>(null);

    const senderHeader = (
        <Sender.Header
            styles={{
                content: {
                    padding: 0,
                },
            }}
            open={open}
            onOpenChange={setOpen}
            forceRender
        >
            <Attachments
                ref={attachmentsRef}
                // Mock not real upload file
                beforeUpload={() => false}
                items={items}
                onChange={({fileList}) => setItems(fileList)}
                placeholder={(type) =>
                    type === 'drop'
                        ? {
                            title: t('input.attachments.dropTitle'),
                        }
                        : {
                            icon: <CloudUploadOutlined/>,
                            title: t('input.attachments.uploadTitle'),
                            description: t('input.attachments.uploadDescription'),
                        }
                }
                getDropContainer={() => senderRef.current?.nativeElement}
            />
        </Sender.Header>
    );

    const {token} = theme.useToken();
    const [value, setValue] = useState<string>('');

    const iconStyle = {
        fontSize: 18,
        color: token.colorText,
    };

    const [checked, setChecked] = useState(false);
    const { addTab } = useTabContext();

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
    };

    const handleSearchToggle = async () => {
        if (!checked) {
            // Prepare to enable internet search, first validate if there's a selected search configuration
            try {
                const storageService = StorageService.getInstance();
                const selectedSearchConfigKey = await storageService.getSelectedSearchConfigKey();

                if (!selectedSearchConfigKey) {
                    // No selected search configuration, navigate to search configuration page
                    message.warning(t('input.searchConfigWarning'));
                    addTab(TabType.SEARCH, t('input.searchTabTitle'), <SearchManagement />);
                    return;
                }
            } catch (error) {
                console.error('searchConfigCheckFailed fail:', error);
                message.error(t('input.searchConfigCheckFailed'));
                return;
            }
        }
        
        setChecked(!checked);
    };

    return (
        <Flex align="end">
            <ConfigProvider theme={{
                components: {
                    Button: {
                        defaultHoverBorderColor: '',
                        defaultHoverBg: 'var(--model-dropdown-background-color)',
                        defaultActiveBorderColor: '',
                    },
                },
            }}>
                <Sender
                    placeholder={t('input.placeholder') as string}
                    // submitType="shiftEnter"
                    header={senderHeader}
                    footer={({components}) => {
                        const {SendButton, LoadingButton, SpeechButton} = components;
                        return (
                            <Flex justify="space-between" align="center">
                                <Flex gap="small" align="center">
                                    <Tooltip title={t('input.internetSearchTooltip')}>
                                        <Button
                                            variant="filled"
                                            icon={<GlobalOutlined
                                                style={{
                                                    marginRight: -5,
                                                    color: checked ? 'var(--input-internetConnection-button-checked-color)' : 'var(--input-internetConnection-icon-color)'
                                                }}/>}
                                            onClick={handleSearchToggle}
                                            style={{
                                                fontWeight: 400,
                                                boxShadow: 'none',
                                                outline: 'none',
                                                fontSize: 12,
                                                width: 72,
                                                height: 27,
                                                color: checked ? 'var(--input-internetConnection-button-checked-color)' : 'var(--input-internetConnection-button-color)',
                                                borderRadius: 4,
                                                borderColor: checked ? 'var(--input-internetConnection-button-checked-borderColor)' : undefined,
                                                backgroundColor: checked ? 'var(--input-internetConnection-button-checked-backgroundColor)' : undefined
                                            }}
                                        >
                                            {t('input.internetSearch')}
                                        </Button>
                                    </Tooltip>
                                </Flex>
                                <Flex align="center">
                                    <ModelDropdown/>
                                    <Divider type="vertical"/>
                                    {loading ? (
                                        <Button type="text" icon={<StopIcon/>} onClick={handleCancel}/>
                                    ) : (
                                        <Tooltip title={t('input.sendTooltip')}>
                                            <SendButton
                                                type="text"
                                                color="primary"
                                                icon={<SendOutlined
                                                    style={{color: 'var(--model-dropdown-icon-color)'}}/>}
                                                shape="default"
                                                disabled={false}
                                            />
                                        </Tooltip>
                                    )}
                                </Flex>
                            </Flex>
                        );
                    }}
                    styles={{
                        footer: {paddingLeft: 8, paddingBottom: 6, paddingRight: 6, paddingTop: 0},
                    }}
                    value={text}
                    onChange={setText}
                    onPasteFile={(_, files) => {
                        for (const file of files) {
                            attachmentsRef.current?.upload(file);
                        }
                        setOpen(true);
                    }}
                    onSubmit={(htmlText, plainText) => {
                        // console.log(`onSubmit,html: ${htmlText}, plainText: ${plainText}`);
                        // console.dir(items);
                    
                        // Build feature list
                        const contextItems: ContextItem[] = [];
                    
                        // Add search functionality
                        if (checked && plainText?.trim()) {
                            contextItems.push({
                                type: 'search',
                                name: t('input.internetSearchName'),
                                value: plainText.trim()
                            });
                        }
                    
                        // Use DOM parsing to extract mention information
                        // Create a temporary DOM element to parse HTML
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = htmlText;
                        
                        // Find all elements with mention class
                        const mentionElements = tempDiv.querySelectorAll('.mention');
                        console.log('Found mention elements:', mentionElements);
                        
                        // Iterate and extract mention information
                        mentionElements.forEach((element) => {
                            const type = element.getAttribute('expansion-data-type');
                            const label = element.getAttribute('data-label');
                            const path = element.getAttribute('expansion-data-path');
                            const selected = element.getAttribute('expansion-data-selected');
                            const line = element.getAttribute('expansion-data-line');

                            if (type === 'file') {
                                contextItems.push({
                                    type: 'file',
                                    name: label || '',
                                    value: path || label || '',
                                    selected: selected || '',
                                    line: line || '',
                                });
                            } else if (type === 'fileEdit') {
                                contextItems.push({
                                    type: 'fileEdit',
                                    name: label || '',
                                    value: path || label || '',
                                    selected: selected || '',
                                    line: line || '',
                                });
                            }else if (type === 'codebase' ) {
                                contextItems.push({ 
                                    type: 'codebase',
                                    name: 'codebase',
                                    value: 'codebase'
                                });
                            }
                        });
                        
                        if (onRequest && plainText?.trim()) {
                            onRequest(htmlText, plainText, contextItems);
                        }
                    
                        setItems([]);
                        setText('');
                    }}
                    actions={false}
                />
            </ConfigProvider>
        </Flex>
    );
};

export default Input;