import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Image, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';
import { Fonts } from '../fonts';
import { Images } from '../../assets/images';

interface CapturedPhoto {
  id: string;
  uri: string;
}

type FlashMode = 'off' | 'on' | 'auto';

interface CameraOverlayProps {
  isScanning: boolean;
  isManualMode: boolean;
  onToggleScanning: () => void;
  onClear: () => void;
  onToggleMode: () => void;
  onCapture: () => void;
  onBack?: () => void;
  capturedPhotos?: CapturedPhoto[];
  onShowResults?: () => void;
  onFinishLiveScan?: () => void;
  onFinishPhotoCapture?: () => void;
  onSelectFromGallery?: () => void;
  isProcessing?: boolean;
  autoStart?: boolean;
  flashMode?: FlashMode;
  onToggleFlash?: () => void;
}

export const CameraOverlay: React.FC<CameraOverlayProps> = ({
  isScanning,
  isManualMode,
  onToggleScanning,
  onClear,
  onToggleMode,
  onCapture,
  onBack,
  capturedPhotos = [],
  onShowResults,
  onFinishLiveScan,
  onFinishPhotoCapture,
  onSelectFromGallery,
  isProcessing,
  autoStart = true,
  flashMode = 'off',
  onToggleFlash,
}) => {
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<'live' | 'photo'>('live');
  const [captured, setCaptured] = useState(false);

  // Flash mode icons mapping - order: disable -> on -> auto -> disable
  const getFlashIcon = () => {
    switch (flashMode) {
      case 'off':
        return Images.flashDisable;
      case 'on':
        return Images.flashOn;
      case 'auto':
        return Images.flashAuto;
      default:
        return Images.flashDisable;
    }
  };

  // Auto-start live scanning when entering screen
  useEffect(() => {
    if (autoStart && mode === 'live' && !isScanning) {
      onToggleScanning();
    }
  }, [autoStart, mode]);

  useEffect(() => {
    if (captured) {
      const timer = setTimeout(() => {
        setCaptured(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [captured]);

  const handleCapture = () => {
    if (mode === 'photo') {
      setCaptured(true);
      onCapture();
      // Auto-navigate to results after 2 seconds
      setTimeout(() => {
        onFinishPhotoCapture?.();
      }, 2000);
    }
  };

  const handleLiveStop = () => {
    onToggleScanning();
    onFinishLiveScan?.();
  };

  const handleConfirm = () => {
    setCaptured(false);
    // Start processing
  };

  const handleModeChange = (newMode: 'live' | 'photo') => {
    setMode(newMode);
    setCaptured(false);
    onClear();
    onToggleMode();
  };

  return (
    <View style={styles.overlay}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Image source={Images.headerArrowWhite} style={styles.headerIcon} resizeMode="contain" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner</Text>
        <TouchableOpacity
              style={styles.flashButton}
              onPress={onToggleFlash}
              activeOpacity={0.7}>
              <Image source={getFlashIcon()} style={styles.flashIcon} />
            </TouchableOpacity>
      </View>

      {/* Camera Frame Area */}
      <View style={styles.cameraArea}>
        {/* Status Indicator */}
        <View style={styles.statusContainer}>
          {isScanning && mode === 'live' && (
            <View style={styles.scanningBadge}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.scanningText}>Scanning...</Text>
            </View>
          )}
          {!isScanning && mode === 'live' && (
            <View style={styles.scanningBadge}>
              <Icon name="videocam" size={16} color="#FFF" />
              <Text style={styles.scanningText}>Live Scan</Text>
            </View>
          )}
          {captured && (
            <View style={styles.capturedBadge}>
              <Text style={styles.capturedText}>Photo Captured</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Mode Toggle Row */}
        <View style={styles.modeToggleRow}>
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'live' && styles.modeButtonActive]}
              onPress={() => handleModeChange('live')}
              activeOpacity={0.7}>
              <View style={styles.modeButtonContent}>
                <Text style={[styles.modeButtonText, mode === 'live' && styles.modeButtonTextActive]}>
                  Live
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'photo' && styles.modeButtonActive]}
              onPress={() => handleModeChange('photo')}
              activeOpacity={0.7}>
              <View style={styles.modeButtonContent}>
                <Text style={[styles.modeButtonText, mode === 'photo' && styles.modeButtonTextActive]}>
                  Photo
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Controls Row */}
        {mode === 'live' ? (
          // Live Mode - Centered Stop Button
          <View style={styles.mainControlsLive}>
            <TouchableOpacity
              style={styles.stopButtonLarge}
              onPress={handleLiveStop}
              activeOpacity={0.8}>
              <Image source={Images.stopScanningIcon} style={styles.stopIconLarge} resizeMode="contain" />
            </TouchableOpacity>
          </View>
        ) : (
          // Photo Mode - Full Controls
          <View style={styles.mainControls}>
            {/* Left - Gallery / Photo Gallery */}
            <View style={styles.leftControl}>
              {capturedPhotos.length === 0 ? (
                <TouchableOpacity
                  style={styles.galleryButton}
                  onPress={onSelectFromGallery}
                  activeOpacity={0.7}>
                  <Icon name="photo-library" size={26} color="#FFF" />
                </TouchableOpacity>
              ) : (
                <View style={styles.photoThumbnailContainer}>
                  <Image source={{ uri: capturedPhotos[0].uri }} style={styles.photoThumbnail} />
                  {capturedPhotos.length > 1 ? (
                    <View style={styles.photoCountBadge}>
                      <Text style={styles.photoCountText}>+{capturedPhotos.length - 1}</Text>
                    </View>
                  ) : (
                    <View style={styles.newPhotoBadge} />
                  )}
                </View>
              )}
            </View>

            {/* Center - Capture Button */}
            <TouchableOpacity
              style={[styles.captureBtn, isProcessing && styles.captureBtnDisabled]}
              onPress={handleCapture}
              disabled={isProcessing}
              activeOpacity={0.8}>
              <Image source={Images.captureIcon} style={styles.captureBtnInner} resizeMode="contain" />
            </TouchableOpacity>

            {/* Right - Placeholder (for layout balance) */}
            <View style={styles.sideButtonPlaceholder} />
          </View>
        )}

      </View>

      {/* Full-screen loading overlay during processing */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  backButton: {
    // width: 40,
    // height: 40,
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  headerIcon: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: Fonts.ManropeSemiBold
  },
  headerRight: {
    width: 40,
  },
  flashButton: {
    // width: 32,
    // height: 32,
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  flashIcon: {
    width: 32,
    height: 32,
  },
  // Camera Area Styles
  cameraArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 16,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Colors.primary,
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 16,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 16,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 16,
  },
  // Status Badge Styles
  statusContainer: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scanningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  scanningText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  capturedBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  capturedText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Bottom Controls Styles
  bottomControls: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 16,
  },
  modeToggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2C',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF0D',
    padding: 3,
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modeButtonActive: {
    backgroundColor: '#2563EB',
  },
  modeButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  modeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  mainControlsLive: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sideButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sideButtonDisabled: {
    opacity: 0.3,
  },
  sideButtonLoading: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primary,
  },
  leftControl: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyControl: {
    width: 56,
    height: 56,
  },
  photoThumbnailContainer: {
    position: 'relative',
  },
  photoThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  newPhotoBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  photoCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  photoCountText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  blankPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  galleryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recordDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.scanning,
  },
  stopButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stopIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: Colors.scanning,
  },
  // Camera-style stop button for live mode - blue with white border
  stopButtonLarge: {
    // width: 64,
    // height: 64,
    // borderRadius: 36,
    // backgroundColor: '#2563EB',
    // justifyContent: 'center',
    // alignItems: 'center',
    // borderWidth: 4,
    // borderColor: 'rgba(255,255,255,0.3)',
  },
  stopIconLarge: {
    width: 75,
    height: 75,
  },
  captureBtn: {
    // width: 64,
    // height: 64,
    // borderRadius: 32,
    // backgroundColor: Colors.surface,
    // justifyContent: 'center',
    // alignItems: 'center',
    // borderWidth: 3,
    // borderColor: Colors.primary,
    // shadowColor: Colors.primary,
    // shadowOffset: { width: 0, height: 3 },
    // shadowOpacity: 0.3,
    // shadowRadius: 6,
    // elevation: 4,
  },
  captureBtnDisabled: {
    opacity: 0.5,
  },
  sideButtonPlaceholder: {
    width: 56,
    height: 56,
  },
  captureBtnInner: {
    width: 75,
    height: 75,
  },
  // Processing overlay styles
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
});
