import React, { createContext, useContext, ReactNode, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface NavigationActions {
  scrollToPreviousUserQuestion: () => void;
  scrollToNextUserQuestion: () => void;
}

interface NavigationContextProps {
  registerNavigationActions: (actions: NavigationActions) => void;
  goToPreviousQuestion: () => void;
  goToNextQuestion: () => void;
}

const NavigationContext = createContext<NavigationContextProps | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigationActionsRef = useRef<NavigationActions | null>(null);

  // Register navigation action methods
  const registerNavigationActions = (actions: NavigationActions) => {
    navigationActionsRef.current = actions;
  };

  // Navigate to previous user question
  const goToPreviousQuestion = () => {
    if (navigationActionsRef.current) {
      navigationActionsRef.current.scrollToPreviousUserQuestion();
    }
  };

  // Navigate to next user question
  const goToNextQuestion = () => {
    if (navigationActionsRef.current) {
      navigationActionsRef.current.scrollToNextUserQuestion();
    }
  };

  const value = {
    registerNavigationActions,
    goToPreviousQuestion,
    goToNextQuestion
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = () => {
    const { t } = useTranslation('errors');
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error(t('context.navigation.contextError'));
    }
    return context;
};

export type { NavigationActions };