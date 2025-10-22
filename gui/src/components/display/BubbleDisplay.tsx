import './BubbleDisplay.scss';
import React, { useEffect, useMemo } from 'react';
import Bubble from '../bubble/index';
import { ChatMessage } from '@/types/messages';
import type { BubbleProps } from '@ant-design/x';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import MarkdownFooter from './MarkdownFooter';
import AssistantDisplay from './AssistantDisplay';
import UserDisplay from './UserDisplay';
import { MessageInfo } from '@ant-design/x/es/use-x-chat';
import type { GetRef } from 'antd';
import { useChatContext } from '@/contexts/ChatContext';
import { useNavigationContext } from '@/contexts/NavigationContext';

interface BubbleDisplayProps {
  messageInfos: MessageInfo<ChatMessage>[];
}

const BubbleDisplay: React.FC<BubbleDisplayProps> = ({ messageInfos }) => {
  const bubbleListRef = React.useRef<GetRef<typeof Bubble.List>>(null);
  const { retryMessage, currentChatId } = useChatContext();
  const { registerNavigationActions } = useNavigationContext();
  const [currentUserQuestionIndex, setCurrentUserQuestionIndex] = React.useState(-1);

  // Get indices of all user questions
  const userQuestionIndices = useMemo(() => {
    return messageInfos
      .map((item, index) => ({ index, role: item.message.role }))
      .filter(item => item.role === 'user')
      .map(item => item.index);
  }, [messageInfos]);

  // When there are new user messages, automatically update current index to the latest user message
  useEffect(() => {
    if (userQuestionIndices.length > 0) {
      const latestUserQuestionIndex = userQuestionIndices[userQuestionIndices.length - 1];
      // Only update when the latest user message index is greater than current index (indicating new messages)
      if (latestUserQuestionIndex > currentUserQuestionIndex) {
        // No currently selected question: clicking previous question will navigate to latest user message
        setCurrentUserQuestionIndex(-1);
      }
    }
  }, [userQuestionIndices]);

  // Auto scroll to latest message when switching conversations
  useEffect(() => {
    const targetIndex = userQuestionIndices[userQuestionIndices.length - 1];
    if (bubbleListRef.current) {
      bubbleListRef.current.scrollTo({ key: targetIndex });
      // No currently selected question: clicking previous question will navigate to latest user message
      setCurrentUserQuestionIndex(-1);
    }
  }, [currentChatId]);

  // Navigate to previous user question
  const scrollToPreviousUserQuestion = () => {
    if (userQuestionIndices.length === 0) return;

    // console.log('userQuestionIndices', userQuestionIndices, currentUserQuestionIndex);

    let targetIndex = currentUserQuestionIndex;
    if (currentUserQuestionIndex === -1) {
      // If no currently selected question, select the last user question
      targetIndex = userQuestionIndices[userQuestionIndices.length - 1];
    } else {
      // Find the position of current question in user question list
      const currentPos = userQuestionIndices.indexOf(currentUserQuestionIndex);
      if (currentPos > 0) {
        targetIndex = userQuestionIndices[currentPos - 1];
      } else {
        targetIndex = 0;
      }
    }
    
    if (bubbleListRef.current) {
      bubbleListRef.current.scrollTo({ key: targetIndex });
      setCurrentUserQuestionIndex(targetIndex);
    }
  };

  // Navigate to next user question
  const scrollToNextUserQuestion = () => {
    if (userQuestionIndices.length === 0) return;
    
    let targetIndex = currentUserQuestionIndex;
    if (currentUserQuestionIndex === -1) {
      // If no currently selected question, select the first user question
      targetIndex = userQuestionIndices[0];
    } else {
      // Find the position of current question in user question list
      const currentPos = userQuestionIndices.indexOf(currentUserQuestionIndex);
      if (currentPos < userQuestionIndices.length - 1) {
        targetIndex = userQuestionIndices[currentPos + 1];
      }
    }
    
    if (bubbleListRef.current) {
      bubbleListRef.current.scrollTo({ key: targetIndex });
      setCurrentUserQuestionIndex(targetIndex);
    }
  };

  useEffect(() => {
    registerNavigationActions({
      scrollToPreviousUserQuestion,
      scrollToNextUserQuestion
    });
  }, [registerNavigationActions, currentUserQuestionIndex, userQuestionIndices]);

  const bubbleItems = messageInfos.map((item, index) => {
    const { message, status } = item;
    const loading = status === 'loading' && message.messages.every(msg => msg.content === '');
    return {
      key: index,
      role: message.role || 'user',
      loading: loading,
      content: message,
      typing: status === 'loading' ? {step: 3, interval: 20} : false,
      footer: () => {
        if (message.role === 'assistant' && status != 'loading') {
          const normalMessage = message.messages.filter(msg => msg.type === 'normal');
          return <MarkdownFooter 
            messageContext={normalMessage[0]?.content}
            timingInfo={message.timing}
            tokenUsage={message.tokenUsage}
            onRetry={() => retryMessage(index)}
          />;
        }
        return null;
      },
    };
  });

  const bubbleRoles: Record<string, BubbleProps<ChatMessage>> = {
    user: {
      placement: 'end',
      variant: 'filled',
      avatar: <UserOutlined />,
      shape: 'corner',
      header: 'User',
      className: 'user-bubble',
      messageRender: (message) => {
        return <UserDisplay 
          content={message.messages[0]?.content as string || ''} 
        />;
      },
    },
    assistant: {
      placement: 'start',
      variant: 'borderless',
      avatar: <RobotOutlined />,
      header: 'VoidMuse',
      className: 'assistant-bubble',
      messageRender: (message) => {
        return <AssistantDisplay 
          messages={message.messages} status={message.status}
        />;
      },
    },
  };

  return <Bubble.List 
    ref={bubbleListRef} 
    style={{
      height: '100%',
      paddingBottom: '10px',
      paddingRight: '10px',
      paddingLeft: '10px'
    }}
    items={bubbleItems} 
    roles={bubbleRoles} 
    autoScroll={true} />;
};

export default BubbleDisplay;
