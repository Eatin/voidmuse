import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ProjectInfoResponse } from '@/types/ide';
import { IDEService } from '@/api/IDEService';

interface ProjectContextType {
  projectInfo: ProjectInfoResponse | null;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projectInfo, setProjectInfo] = useState<ProjectInfoResponse | null>(null);

  useEffect(() => {
    const initProjectInfo = async () => {
      try {
        const info = await IDEService.getInstance().getProjectConfig();
        setProjectInfo(info);
      } catch (error) {
        console.error('Failed to get project info:', error);
      }
    };

    initProjectInfo();
  }, []);

  const value = {
    projectInfo
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProjectContext = () => {
    const { t } = useTranslation('errors');
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error(t('context.project.contextError'));
    }
    return context;
};