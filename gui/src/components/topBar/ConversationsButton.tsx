import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Popover, Space, Tooltip } from 'antd';
import { Conversations } from '@ant-design/x';
import { HistoryOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Conversation } from '@ant-design/x/es/conversations';
import type { GetProp } from 'antd';
import './ConversationsButton.scss';
import { storageService } from '../../storage';
import { useChatContext } from '../../contexts/ChatContext';
import { ChatHistorySummary } from '../../types/messages';
import { ProjectInfoResponse } from '@/types/ide';
import { useProjectContext } from '@/contexts/ProjectContext';

const getTimeGroup = (timestamp: number, t: any): string => {
  const now = new Date();
  const date = new Date(timestamp);

  // Today
  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    return t('topBar.conversationsButton.today');
  }

  // Calculate start of this week (Sunday)
  const firstDayOfWeek = new Date(now);
  firstDayOfWeek.setDate(now.getDate() - now.getDay());
  firstDayOfWeek.setHours(0, 0, 0, 0);

  // This Week
  if (date >= firstDayOfWeek) {
    return t('topBar.conversationsButton.thisWeek');
  }

  // Calculate start of this month
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // This Month
  if (date >= firstDayOfMonth) {
    return t('topBar.conversationsButton.thisMonth');
  }

  // Calculate start of this year
  const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

  // This Year
  if (date >= firstDayOfYear) {
    return t('topBar.conversationsButton.thisYear');
  }

  // Earlier
  return t('topBar.conversationsButton.earlier');
};

const ConversationsButton: React.FC = () => {
  const { t } = useTranslation('components');
  const [visible, setVisible] = useState(false);
  const [sessionList, setSessionList] = useState<Conversation[]>([]);
  const { loadChatSession } = useChatContext();
  const { projectInfo } = useProjectContext();
  const projectInfoRef = useRef<ProjectInfoResponse | null>(null);

  useEffect(() => {
    projectInfoRef.current = projectInfo;
  }, [projectInfo]);

  // Get chat summary list
  useEffect(() => {
    const fetchChatSummaries = async () => {
      const projectName = projectInfoRef.current?.projectName;
      if (!projectName) return;

      const summaries = await storageService.getAllChatSummaries(projectName);
      // console.log(`projectName: ${projectName} summaries: ${JSON.stringify(summaries)}`);

      // Convert chat summaries to conversation list format
      const conversations: Conversation[] = summaries.map((summary: ChatHistorySummary) => {
        return {
          key: summary.id,
          label: summary.title,
          timestamp: summary.createdAt,
        };
      });

      setSessionList(conversations);
    };

    fetchChatSummaries();
  }, [visible, projectInfoRef]);

  const handleActiveChange = async (val: string) => {
    // Load chat session
    await loadChatSession(val);

    // Close popup
    setVisible(false);
  };

  // Add grouping to session list
  const groupedSessionList = sessionList.map(session => ({
    ...session,
    label: session.label,
    group: session.timestamp ? getTimeGroup(session.timestamp, t) : t('topBar.conversationsButton.uncategorized')
  }));

  // Custom grouping configuration
  const groupable: GetProp<typeof Conversations, 'groupable'> = {
    // Group sorting
    sort(a, b) {
      const groupOrder = [
        t('topBar.conversationsButton.today'),
        t('topBar.conversationsButton.thisWeek'),
        t('topBar.conversationsButton.thisMonth'),
        t('topBar.conversationsButton.thisYear'),
        t('topBar.conversationsButton.earlier'),
        t('topBar.conversationsButton.uncategorized')
      ];
      return groupOrder.indexOf(a) - groupOrder.indexOf(b);
    },
    // Custom group title
    title: (group, { components: { GroupTitle } }) =>
      group ? (
        <GroupTitle>
          <Space>
            <span>{group}</span>
          </Space>
        </GroupTitle>
      ) : (
        <GroupTitle />
      ),
  };

  // Add delete conversation handler
  const handleDeleteConversation = async (key: string) => {
    const projectName = projectInfoRef.current?.projectName;
    if (!projectName) return;

    try {
      // Call delete method
      await storageService.deleteChat(projectName, key);
      console.log('Conversation deleted successfully:', key);

      // Update conversation list
      const summaries = await storageService.getAllChatSummaries(projectName);
      const conversations: Conversation[] = summaries.map((summary: ChatHistorySummary) => ({
        key: summary.id,
        label: summary.title,
        timestamp: summary.createdAt,
      }));

      setSessionList(conversations);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  return (
    <Popover
      placement="bottom"
      styles={{ body: { padding: 0 } }}
      trigger="click"
      open={visible}
      onOpenChange={setVisible}
      content={
        <div className="conversations-container">
          <div className="conversations-header">
            <div className="conversations-title">{t('topBar.conversationsButton.history')}</div>
            <Tooltip title={t('topBar.conversationsButton.close')}>
              <Button
                type="text"
                icon={<CloseOutlined />}
                size="small"
                onClick={() => setVisible(false)}
              />
            </Tooltip>
          </div>
          <div className="conversations-body">
            <Conversations
              items={groupedSessionList}
              groupable={groupable}
              onActiveChange={handleActiveChange}
              menu={(conversation) => ({
                items: [
                  {
                    key: 'delete',
                    icon: <DeleteOutlined />,
                    label: t('topBar.conversationsButton.delete'),
                    onClick: (info) => {
                      info.domEvent.stopPropagation();
                      handleDeleteConversation(conversation.key);

                    },
                  },
                ],
              })}
            />
          </div>
        </div>
      }
    >
      <Tooltip title={t('topBar.conversationsButton.historySessions')}>
        <Button
          type="text"
          icon={<HistoryOutlined />}
          className="action-button"
          aria-label={t('topBar.conversationsButton.historySessions') as string}
          onClick={() => setVisible(true)}
        />
      </Tooltip>
    </Popover>
  );
};

export default ConversationsButton;