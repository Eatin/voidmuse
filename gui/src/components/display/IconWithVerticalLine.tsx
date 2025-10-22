import React from 'react';
import { Tooltip } from 'antd';
import './IconWithVerticalLine.scss';

interface IconWithVerticalLineProps {
  icon: React.ReactNode;
  tooltipTitle: string;
  /** Child nodes displayed as main content */
  children: React.ReactNode;
  /** Optional external className for custom styles */
  className?: string;
}

const IconWithVerticalLine: React.FC<IconWithVerticalLineProps> = ({
  icon,
  tooltipTitle,
  children,
  className,
}) => {
  return (
    <div
      className={`icon-with-vertical-line-wrapper ${className || ''}`}
    >
      <Tooltip title={tooltipTitle} placement="left">
        <div className="icon-element-container">
          <div className="icon-element">{icon}</div>
        </div>
      </Tooltip>
      <div className="content-area">{children}</div>
    </div>
  );
};

export default IconWithVerticalLine;