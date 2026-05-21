import React, { createContext, useContext, useState, useCallback } from 'react';
import type { DownloadedPDF } from '../utils/fileStorage';

export type Screen =
  | 'WELCOME'
  | 'HOME'
  | 'CAMERA'
  | 'RESULTS'
  | 'FILE_VIEWER'
  | 'ALL_FILES'
  | 'PDFS'
  | 'PDF_VIEWER'
  | 'PERMISSION_DENIED'
  | 'LOADING';

interface ViewerFile {
  id: string;
  name: string;
  path: string;
  size: number;
  createdAt: number;
  type: 'txt' | 'doc' | 'pdf';
  content: string;
}

interface NavigationState {
  currentScreen: Screen;
  previousScreen: Screen | null;

  // Screen-specific data
  viewerFile: ViewerFile | null;
  viewingPDF: DownloadedPDF | null;
  refreshHomeTrigger: number;
  hasDraft: boolean;
}

interface NavigationContextType extends NavigationState {
  navigate: (screen: Screen, data?: Partial<NavigationState>) => void;
  goBack: () => void;
  goHome: () => void;
  setViewerFile: (file: ViewerFile | null) => void;
  setViewingPDF: (pdf: DownloadedPDF | null) => void;
  triggerHomeRefresh: () => void;
  setHasDraft: (hasDraft: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('HOME');
  const [previousScreen, setPreviousScreen] = useState<Screen | null>(null);
  const [viewerFile, setViewerFileState] = useState<ViewerFile | null>(null);
  const [viewingPDF, setViewingPDFState] = useState<DownloadedPDF | null>(null);
  const [refreshHomeTrigger, setRefreshHomeTrigger] = useState(0);
  const [hasDraft, setHasDraftState] = useState(false);

  const navigate = useCallback((screen: Screen, data?: Partial<NavigationState>) => {
    // Use functional update to ensure we get the latest currentScreen value
    setCurrentScreen(prevScreen => {
      setPreviousScreen(prevScreen);
      return screen;
    });

    if (data?.viewerFile !== undefined) {
      setViewerFileState(data.viewerFile);
    }
    if (data?.viewingPDF !== undefined) {
      setViewingPDFState(data.viewingPDF);
    }
    if (data?.hasDraft !== undefined) {
      setHasDraftState(data.hasDraft);
    }
  }, []);

  const goBack = useCallback(() => {
    if (previousScreen) {
      setCurrentScreen(previousScreen);
      setPreviousScreen(null);
    } else {
      setCurrentScreen('HOME');
    }
  }, [previousScreen]);

  const goHome = useCallback(() => {
    // Use functional update to ensure we get the latest currentScreen value
    setCurrentScreen(prevScreen => {
      setPreviousScreen(prevScreen);
      return 'HOME';
    });
  }, []);

  const setViewerFile = useCallback((file: ViewerFile | null) => {
    setViewerFileState(file);
  }, []);

  const setViewingPDF = useCallback((pdf: DownloadedPDF | null) => {
    setViewingPDFState(pdf);
  }, []);

  const triggerHomeRefresh = useCallback(() => {
    setRefreshHomeTrigger(Date.now());
  }, []);

  const setHasDraft = useCallback((value: boolean) => {
    setHasDraftState(value);
  }, []);

  const value: NavigationContextType = {
    currentScreen,
    previousScreen,
    viewerFile,
    viewingPDF,
    refreshHomeTrigger,
    hasDraft,
    navigate,
    goBack,
    goHome,
    setViewerFile,
    setViewingPDF,
    triggerHomeRefresh,
    setHasDraft,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};
