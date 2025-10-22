import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ErrorLog } from '@/types/error';
import { errorReportingService } from '@/services/ErrorReportingService';

interface ErrorNotificationContextType {
  hasNewErrors: boolean;
  newErrors: ErrorLog[];
  showNotification: boolean;
  checkNewErrors: () => Promise<void>;
  showNotificationPopup: () => void;
  hideNotificationPopup: () => void;
  markAllAsNotified: () => Promise<void>;
}

const ErrorNotificationContext = createContext<ErrorNotificationContextType | undefined>(undefined);

interface ErrorNotificationProviderProps {
  children: ReactNode;
}

export const ErrorNotificationProvider: React.FC<ErrorNotificationProviderProps> = ({ children }) => {
  const [hasNewErrors, setHasNewErrors] = useState(false);
  const [newErrors, setNewErrors] = useState<ErrorLog[]>([]);
  const [showNotification, setShowNotification] = useState(false);

  const checkNewErrors = useCallback(async () => {
    try {
      const hasNew = await errorReportingService.hasNewErrors();
      const newErrorList = await errorReportingService.getNewErrors();
      
      setHasNewErrors(hasNew);
      setNewErrors(newErrorList);
      
      // Show notification if there are new errors and no notification is currently displayed
      if (hasNew && newErrorList.length > 0 && !showNotification) {
        setShowNotification(true);
      }
    } catch (error) {
      console.error('Error occurred while checking new errors:', error);
    }
  }, [showNotification]);

  // Show notification popup
  const showNotificationPopup = useCallback(() => {
    setShowNotification(true);
  }, []);

  // Hide notification popup
  const hideNotificationPopup = useCallback(() => {
    setShowNotification(false);
  }, []);

  // Mark all errors as notified
  const markAllAsNotified = useCallback(async () => {
    try {
      await errorReportingService.markAllAsNotified();
      setHasNewErrors(false);
      setNewErrors([]);
      setShowNotification(false);
    } catch (error) {
      console.error('Error occurred while marking errors as notified:', error);
    }
  }, []);

  // Listen for error changes
  useEffect(() => {
    const handleErrorsChange = async () => {
      await checkNewErrors();
    };

    // Add error change listener
    errorReportingService.addListener(handleErrorsChange);

    // Initial check
    checkNewErrors();

    // Clean up listener
    return () => {
      errorReportingService.removeListener(handleErrorsChange);
    };
  }, [checkNewErrors]);

  // Periodically check for new errors (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      checkNewErrors();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [checkNewErrors]);

  const value: ErrorNotificationContextType = {
    hasNewErrors,
    newErrors,
    showNotification,
    checkNewErrors,
    showNotificationPopup,
    hideNotificationPopup,
    markAllAsNotified,
  };

  return (
    <ErrorNotificationContext.Provider value={value}>
      {children}
    </ErrorNotificationContext.Provider>
  );
};

export const useErrorNotification = (): ErrorNotificationContextType => {
  const context = useContext(ErrorNotificationContext);
  if (context === undefined) {
    throw new Error('useErrorNotification must be used within an ErrorNotificationProvider');
  }
  return context;
};