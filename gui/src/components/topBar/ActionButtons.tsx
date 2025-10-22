import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Popover, Tooltip, Badge } from 'antd';
import {
  PlusOutlined,
  SettingOutlined,
  CloseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import './ActionButtons.scss';
import SettingList from '@/components/setting/SettingList';
import ConversationsButton from './ConversationsButton';
import { useChatContext } from '@/contexts/ChatContext';
import { useNavigationContext } from '@/contexts/NavigationContext';
import { useErrorNotification } from '@/contexts/ErrorNotificationContext';
import { useTabContext } from '@/contexts/TabContext';
import { TabType } from '@/types/tabs';
import { IDEService } from '@/api/IDEService';
import ErrorCenter from '@/components/errors/ErrorCenter';
import { isVscodePlatform } from '@/utils/PlatformUtils';

interface ActionButtonsProps {
  isChatTab: boolean;
}

/**
 * Action buttons component that displays different button combinations based on the current tab type
 */
const ActionButtons: React.FC<ActionButtonsProps> = ({
  isChatTab,
}) => {
  const { t } = useTranslation('components');
  const [settingVisible, setSettingVisible] = useState(false);
  const { createNewSession } = useChatContext();
  const { goToPreviousQuestion, goToNextQuestion } = useNavigationContext();
  const { hasNewErrors, newErrors, markAllAsNotified } = useErrorNotification();
  const { addTab } = useTabContext();

  const handleSettingVisibleChange = (visible: boolean) => {
    setSettingVisible(visible);
  };

  const closeWindow = async () => {
    await IDEService.getInstance().closeWindow();
  }

  const refreshPage = () => {
    window.location.reload();
  }

  const handleErrorButtonClick = async () => {
    await markAllAsNotified();
    addTab(TabType.ERROR_CENTER, t('setting.settingList.errorCenter'), <ErrorCenter />);

  }

  return (
    <div className="action-buttons">
      {isChatTab && (
        <>
          <Tooltip title={t('topBar.actionButtons.previousQuestion')}>
            <Button
              type="text"
              icon={<ArrowUpOutlined />}
              className="action-button"
              aria-label={t('topBar.actionButtons.previousQuestion') as string}
              onClick={goToPreviousQuestion}
            />
          </Tooltip>
          <Tooltip title={t('topBar.actionButtons.nextQuestion')}>
            <Button
              type="text"
              icon={<ArrowDownOutlined />}
              className="action-button"
              aria-label={t('topBar.actionButtons.nextQuestion') as string}
              onClick={goToNextQuestion}
            />
          </Tooltip>
          <Tooltip title={t('topBar.actionButtons.newSession')}>
            <Button
              type="text"
              icon={<PlusOutlined />}
              className="action-button"
              aria-label={t('topBar.actionButtons.newSession') as string}
              onClick={createNewSession}
            />
          </Tooltip>
          <ConversationsButton />
        </>
      )}
      <Tooltip title={t('topBar.actionButtons.errorNotification')}>
        <Badge count={newErrors.length} size="small">
          <Button
            type="text"
            icon={
              <ExclamationCircleOutlined
                style={{
                  color: hasNewErrors ? '#ff4d4f' : undefined,
                }}
              />
            }
            className="action-button"
            aria-label={t('topBar.actionButtons.errorNotification') as string}
            onClick={handleErrorButtonClick}
          />
        </Badge>
      </Tooltip>
      <Tooltip title={t('topBar.actionButtons.settings')}>
        <Popover
          placement="bottom"
          styles={{ body: { padding: 0 } }}
          open={settingVisible}
          onOpenChange={handleSettingVisibleChange}
          content={<SettingList />}
          trigger="click"
        >
          <Button
            type="text"
            icon={<SettingOutlined />}
            className="action-button"
            aria-label={t('topBar.actionButtons.settings') as string}
          />
        </Popover>
      </Tooltip>
      {!isVscodePlatform() && (
        <Tooltip title={t('topBar.actionButtons.refresh')}>
          <Button
            type="text"
            icon={<ReloadOutlined />}
            className="action-button"
            aria-label={t('topBar.actionButtons.refresh') as string}
            onClick={refreshPage}
          />
        </Tooltip>
      )}
      <Tooltip title={t('topBar.actionButtons.close')} placement="bottomLeft">
        <Button
          type="text"
          icon={<CloseOutlined />}
          className="action-button"
          aria-label={t('topBar.actionButtons.close') as string}
          onClick={closeWindow}
        />
      </Tooltip>
    </div>
  );
};

export default ActionButtons;