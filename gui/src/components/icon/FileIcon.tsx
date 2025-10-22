import React, { useMemo } from 'react';
import { FileOutlined } from '@ant-design/icons';
import './FileIcon.scss';

export interface FileIconProps {
  fileName?: string;       
  className?: string;
  style?: React.CSSProperties;
  color?: string;           
  type?: string;           
}

const FileIcon: React.FC<FileIconProps> = ({ 
  fileName = '', 
  className = '', 
  style, 
  color = '#3c85f3',
  type 
}) => {
  const getFileExtension = (fileName: string): string => {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  const iconInfo = useMemo(() => {
    if (type) {
      return { iconName: type, fileExt: type };
    }

    const fileExt = getFileExtension(fileName);
    
    const iconMap: Record<string, string> = {
      'js': 'lang-js',
      'jsx': 'lang-react',
      'ts': 'lang-ts',
      'tsx': 'lang-react',
      'css': 'lang-css',
      'scss': 'lang-css',
      'sass': 'lang-css',
      'less': 'lang-css',
      'html': 'lang-html',
      'xml': 'lang-xml',
      'json': 'lang-json',
      'md': 'lang-md',
      'markdown': 'lang-md',
      'py': 'lang-python',
      'java': 'lang-java',
      'c': 'lang-c',
      'h': 'lang-headerfile',
      'cpp': 'lang-cpp',
      'hpp': 'lang-headerfile',
      'cs': 'lang-csharp',
      'go': 'lang-go',
      'rs': 'lang-rs',
      'vue': 'lang-vue',
      'sh': 'lang-bat',
      'bash': 'lang-bat',
      'ps1': 'lang-bat',
      'bat': 'lang-bat',
      'yml': 'lang-yml',
      'yaml': 'lang-yml',
      'svg': 'lang-svg',
      'png': 'lang-img',
      'jpg': 'lang-img',
      'jpeg': 'lang-img',
      'gif': 'lang-img',
      'ico': 'lang-ico',
      'pdf': 'lang-pdf',
      'txt': 'lang-txt',
      'dockerfile': 'lang-docker',
      'readme': 'readme',
      'license': 'Authorizationfile',
      'settings.json': 'settingsfile',
      '.gitignore': 'lang-git',
      '.gitconfig': 'lang-git',
    };

    if (fileName.toLowerCase() === 'readme.md') {
      return { iconName: 'readme', fileExt };
    }
    
    if (fileName.toLowerCase() === 'license' || fileName.toLowerCase() === 'license.txt') {
      return { iconName: 'Authorizationfile', fileExt };
    }
    
    if (fileName.toLowerCase().includes('settings') || fileName.toLowerCase().includes('config')) {
      return { iconName: 'settingsfile', fileExt };
    }

    const iconName = iconMap[fileExt] || 'f'; 
    return { iconName, fileExt };
  }, [fileName, type]);

  const iconPath = `./assets/icons/${iconInfo.iconName}.svg`;
  
  const svgStyle = {
    ...style,
    '--icon-color': color
  } as React.CSSProperties;
  
  return (
    <div 
      className="file-icon-container" 
      data-file-type={iconInfo.fileExt}
      style={svgStyle}
    >
      <img 
        src={iconPath}
        alt={`${iconInfo.fileExt} file`} 
        className={`file-icon ${className}`}
        onError={(e) => {
          const target = e.currentTarget as HTMLImageElement;
          target.style.display = 'none';
          const fallbackEl = target.parentElement?.querySelector('.file-icon-fallback');
          if (fallbackEl) {
            (fallbackEl as HTMLElement).style.display = 'inline-block';
          }
        }}
      />
      <FileOutlined 
        className={`file-icon-fallback ${className}`} 
        style={{ color, display: 'none' }} 
      />
    </div>
  );
};

export default FileIcon; 