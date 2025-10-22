import React, { useState, useRef, useMemo } from 'react';
import { CaretRightOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useSize } from 'ahooks';
import { useTranslation } from 'react-i18next';
import './CollapsePanel.scss';
import { useLanguage } from '@/contexts/LanguageContext';

interface CollapsePanelProps {
  icon?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

const COLLAPSE_HEIGHT_THRESHOLD = 250; 

const CollapsePanel: React.FC<CollapsePanelProps> = ({ 
  icon,
  title, 
  children, 
  defaultOpen = false
}) => {
  const { t } = useTranslation('components');
  const { currentLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const size = useSize(contentRef);
  // Show collapse button when content height exceeds threshold
  const showCollapseButton = useMemo(() => {
    if (!size?.height) {
      return false;
    }
    return size.height > COLLAPSE_HEIGHT_THRESHOLD;
  }, [size?.height]);

  const toggleCollapse = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <div className="collapse-panel-wrapper">
      {/* Button section */}
      <div className="collapse-button-container" onClick={toggleCollapse}>
        <div className="collapse-button">
          <CaretRightOutlined 
            rotate={isOpen ? 90 : 0} 
            className="collapse-icon"
          />
          {icon && <span className="header-icon">{icon}</span>}
          <span className="header-title">{title}</span>
        </div>
      </div>
      
      {/* Content section - only displayed when expanded */}
      {isOpen && (
        <>
          <div className="collapse-content" ref={contentRef}>
            {children}
          </div>
          {showCollapseButton && (
            <div className="collapse-footer-container">
              <Button
                type="primary"
              ghost
              onClick={() => setIsOpen(false)}
              size="small"
              className="collapse-footer-button"
            >
              {t('display.collapsePanel.collapse')}
            </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CollapsePanel;