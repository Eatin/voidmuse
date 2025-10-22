import React from 'react';
import { BulbOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './ReasoningChain.scss';
import Markdown from './Markdown';
import IconWithVerticalLine from './IconWithVerticalLine';
import { MessageStatus } from '@ant-design/x/es/use-x-chat';
import CollapsePanel from '@/components/display/CollapsePanel';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReasoningChainProps {
  content: string;
  status: MessageStatus;
}

const ReasoningChain: React.FC<ReasoningChainProps> = ({ 
  content,
  status
}) => {
  const { t } = useTranslation('components');
  const { currentLanguage } = useLanguage();

  return (
    <CollapsePanel title={t('display.reasoningChain.title')} defaultOpen={status === 'loading'} >
      <div
        className={`reasoning-chain-outer-wrapper`}
      >
        <IconWithVerticalLine
          icon={<BulbOutlined />}
          tooltipTitle={t('display.reasoningChain.tooltip')}
        >
          <div className="reasoning-content">
            <Markdown content={content} />
          </div>
        </IconWithVerticalLine>
      </div>
    </CollapsePanel>
  );
};

export default ReasoningChain;