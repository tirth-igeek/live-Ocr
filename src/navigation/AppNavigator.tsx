import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useNavigation, Screen } from './NavigationContext';
import { Colors } from '../constants/colors';
import { launchImageLibrary } from 'react-native-image-picker';

// Screens
import {
  HomeScreen,
  AllFilesScreen,
  WelcomeScreen,
  LoadingScreen,
  PermissionDenied,
} from '../screens';

// Components
import {
  CameraView,
  CameraOverlay,
  PDFViewer,
} from '../components';
import { ResultsScreen, FileViewer } from '../components/Results';

// Hooks
import { useCamera, useOCR } from '../hooks';
import { shareFile } from '../utils/fileStorage';

// Separate component for FileViewer with navigation handling
const FileViewerWrapper: React.FC<{
  viewerFile: any;
  goHome: () => void;
  goBack: () => void;
}> = ({ viewerFile, goHome, goBack }) => {
  useEffect(() => {
    if (!viewerFile) {
      goHome();
    }
  }, [viewerFile, goHome]);

  if (!viewerFile) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FileViewer
        file={viewerFile}
        content={viewerFile.content}
        onBack={goBack}
        onShare={() => {
          shareFile(viewerFile.path, viewerFile.name);
        }}
      />
    </SafeAreaView>
  );
};

// Separate component for PDFViewer with navigation handling
const PDFViewerWrapper: React.FC<{
  viewingPDF: any;
  goBack: () => void;
  setViewingPDF: (pdf: any) => void;
  setViewerFile: (file: any) => void;
}> = ({ viewingPDF, goBack, setViewingPDF, setViewerFile }) => {
  // Handle TXT files - redirect to file viewer
  useEffect(() => {
    if (viewingPDF?.format === 'txt') {
      const loadTextFile = async () => {
        try {
          const RNFS = require('react-native-fs');
          const content = await RNFS.readFile(viewingPDF.path, 'utf8');

          setViewerFile({
            id: viewingPDF.id,
            name: viewingPDF.name,
            path: viewingPDF.path,
            size: viewingPDF.size,
            createdAt: viewingPDF.createdAt,
            type: 'txt',
            content: content,
          });

          // Clear viewingPDF so we go back to PDFS, then navigate to FILE_VIEWER
          setViewingPDF(null);
          // goBack() will be called by the onBack handler after this effect runs
        } catch (error) {
          console.error('Error reading text file:', error);
          // If file reading fails, treat it as a PDF and just open it
          setViewingPDF(null);
          goBack();
        }
      };

      loadTextFile();
    }
  }, [viewingPDF, setViewingPDF, setViewerFile, goBack]);

  // When viewingPDF is null, go back to PDFS screen
  useEffect(() => {
    if (!viewingPDF) {
      goBack();
    }
  }, [viewingPDF, goBack]);

  if (!viewingPDF) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingScreen />
      </SafeAreaView>
    );
  }

  // For TXT files, show loading while we redirect
  if (viewingPDF.format === 'txt') {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PDFViewer
        filePath={viewingPDF.path}
        fileName={viewingPDF.name}
        onBack={() => {
          // Clear viewing PDF and go back to PDFS
          setViewingPDF(null);
          goBack();
        }}
        onShare={() => shareFile(viewingPDF.path, `${viewingPDF.name}.${viewingPDF.format}`)}
      />
    </SafeAreaView>
  );
};

export const AppNavigator: React.FC = () => {
  const {
    currentScreen,
    viewerFile,
    viewingPDF,
    refreshHomeTrigger,
    hasDraft,
    navigate,
    goBack,
    goHome,
    setViewingPDF,
    setViewerFile,
    triggerHomeRefresh,
    setHasDraft,
  } = useNavigation();

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Camera and OCR hooks
  const { hasPermission, permissionStatus, isLoading, requestPermission, checkPermission } = useCamera();
  const { detectedTexts, processImage, clearTexts } = useOCR();

  // Camera screen state
  const cameraRef = useRef<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<Array<{ id: string; uri: string }>>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const lastCapturedPhotoRef = useRef<string | null>(null);
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');

  // Camera handlers
  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePhoto({
        flash: flashMode,
        enableShutterSound: false,
      });
      const photoUri = `file://${photo.path}`;
      const newPhoto = { id: Date.now().toString(), uri: photoUri };
      setCapturedPhotos(prev => [...prev, newPhoto]);
      lastCapturedPhotoRef.current = photo.path;
    } catch (error) {
      // Silent error handling
    }
  };

  const handleProcessBatch = async () => {
    setIsProcessingBatch(true);
    for (const photo of capturedPhotos) {
      const path = photo.uri.replace('file://', '');
      await processImage(path);
    }
    setIsProcessingBatch(false);
    navigate('RESULTS');
  };

  const handleFinishLiveScan = async () => {
    setIsProcessingBatch(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsProcessingBatch(false);
    navigate('RESULTS');
  };

  const handleSelectFromGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 10,
        includeBase64: false,
      });

      if (result.didCancel || result.errorCode) return;

      if (result.assets && result.assets.length > 0) {
        setIsProcessingBatch(true);
        for (const asset of result.assets) {
          if (asset.uri) {
            const path = asset.uri.replace('file://', '');
            await processImage(path);
          }
        }
        setIsProcessingBatch(false);
        navigate('RESULTS');
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const handleFinishPhotoCapture = async () => {
    const photoPath = lastCapturedPhotoRef.current;
    if (!photoPath) return;
    setIsProcessingBatch(true);
    await processImage(photoPath);
    setIsProcessingBatch(false);
    navigate('RESULTS');
    lastCapturedPhotoRef.current = null;
  };

  const handleClear = () => {
    clearTexts();
    setCapturedPhotos([]);
  };

  const handleToggleFlash = () => {
    setFlashMode(prev => {
      if (prev === 'off') return 'on';
      if (prev === 'on') return 'auto';
      return 'off';
    });
  };

  // Render screen based on current route
  switch (currentScreen) {
    case 'LOADING':
      return (
        <SafeAreaView style={styles.container}>
          <LoadingScreen />
        </SafeAreaView>
      );

    case 'PERMISSION_DENIED':
      return (
        <SafeAreaView style={styles.container}>
          <PermissionDenied onRetry={checkPermission} />
        </SafeAreaView>
      );

    case 'WELCOME':
      return (
        <SafeAreaView style={styles.container}>
          <WelcomeScreen
            onGetStarted={() => {
              requestPermission().then(() => {
                if (hasPermission) {
                  navigate('CAMERA');
                }
              });
            }}
          />
        </SafeAreaView>
      );

    case 'FILE_VIEWER':
      return (
        <FileViewerWrapper
          viewerFile={viewerFile}
          goHome={goHome}
          goBack={goBack}
        />
      );

    case 'PDF_VIEWER':
      return (
        <PDFViewerWrapper
          viewingPDF={viewingPDF}
          goBack={goBack}
          setViewingPDF={setViewingPDF}
          setViewerFile={setViewerFile}
        />
      );

    case 'PDFS':
      return (
        <SafeAreaView style={styles.container}>
          <AllFilesScreen
            title="PDFs"
            mode="pdfs"
            onBack={() => {
              goBack();
              triggerHomeRefresh();
            }}
            onOpenFile={(file, content) => {
              setViewingPDF({
                id: file.id,
                name: file.name,
                path: file.path,
                size: file.size,
                createdAt: file.createdAt,
                format: (file as any).format || (file.type === 'pdf' ? 'pdf' : 'txt'),
              });
              navigate('PDF_VIEWER');
            }}
          />
        </SafeAreaView>
      );

    case 'ALL_FILES':
      return (
        <SafeAreaView style={styles.container}>
          <AllFilesScreen
            title="All Files"
            mode="all"
            onBack={goBack}
            onOpenFile={(file, content) => {
              navigate('FILE_VIEWER', {
                viewerFile: {
                  id: file.id,
                  name: file.name,
                  path: file.path,
                  size: file.size,
                  createdAt: file.createdAt,
                  type: file.type,
                  content,
                },
              });
            }}
          />
        </SafeAreaView>
      );

    case 'RESULTS':
      return (
        <ResultsScreen
          detectedTexts={detectedTexts}
          onBack={() => {
            clearTexts();
            goBack();
          }}
          onCopyText={(text) => {
            // Copy to clipboard
          }}
          onClear={() => {
            clearTexts();
            goBack();
          }}
          onGoHome={() => {
            clearTexts();
            triggerHomeRefresh();
            goHome();
          }}
          onDownloadSuccess={triggerHomeRefresh}
        />
      );

    case 'CAMERA':
      return (
        <SafeAreaView style={styles.container}>
          <View style={[styles.contentContainer, isLandscape && styles.contentContainerLandscape]}>
            <View style={styles.cameraContainer}>
              <CameraView ref={cameraRef} isActive={true} flashMode={flashMode} />
              <CameraOverlay
                isScanning={isScanning}
                isManualMode={isManualMode}
                flashMode={flashMode}
                onToggleFlash={handleToggleFlash}
                onToggleScanning={() => {
                  if (!isScanning) clearTexts();
                  setIsScanning(!isScanning);
                }}
                onToggleMode={() => setIsManualMode(!isManualMode)}
                onCapture={handleCapture}
                onBack={goHome}
                onSelectFromGallery={handleSelectFromGallery}
                onFinishPhotoCapture={handleFinishPhotoCapture}
                onClear={handleClear}
                capturedPhotos={capturedPhotos}
                onShowResults={handleProcessBatch}
                onFinishLiveScan={handleFinishLiveScan}
                isProcessing={isProcessingBatch}
                autoStart={true}
              />
            </View>
          </View>
        </SafeAreaView>
      );

    case 'HOME':
    default:
      // Check permission state first
      if (isLoading) {
        return (
          <SafeAreaView style={styles.container}>
            <LoadingScreen />
          </SafeAreaView>
        );
      }

      if (permissionStatus === 'denied') {
        return (
          <SafeAreaView style={styles.container}>
            <PermissionDenied onRetry={checkPermission} />
          </SafeAreaView>
        );
      }

      return (
        <SafeAreaView style={styles.container}>
          <HomeScreen
            onStartScan={() => {
              // Request permission then navigate to camera
              requestPermission().then(() => {
                if (hasPermission || permissionStatus === 'granted') {
                  navigate('CAMERA');
                }
              });
            }}
            hasDraft={hasDraft}
            onOpenFile={(file, content) => {
              navigate('FILE_VIEWER', {
                viewerFile: {
                  id: file.id,
                  name: file.name,
                  path: file.path,
                  size: file.size,
                  createdAt: file.createdAt,
                  type: file.type,
                  content,
                },
              });
            }}
            onShowAllFiles={() => navigate('ALL_FILES')}
            onShowPDFs={() => navigate('PDFS')}
            refreshTrigger={refreshHomeTrigger}
          />
        </SafeAreaView>
      );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  contentContainerLandscape: {
    flexDirection: 'row',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
});
