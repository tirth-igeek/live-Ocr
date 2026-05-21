import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  Clipboard,
  ToastAndroid,
  Platform,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import { Colors } from '../../constants/colors';
import type { DetectedText } from '../../types';
import { DownloadModal } from './DownloadModal';
import { ActionModal } from '../ActionModal';
import { getSavedFiles, SavedFile, formatFileSize, formatTimeAgo, updateFilesList, downloadFile, shareFile, deleteFilePermanently, toggleFavorite, getDownloadedPDFs, DownloadedPDF, deleteDownloadedPDF, saveDownloadedPDF, saveFileMetadata } from '../../utils/fileStorage';
import { useInterstitialAd } from '../ads/Ads';
import { Fonts } from '../fonts';
import RNHtmlToPdf from 'react-native-html-to-pdf';
import { Images } from '../../assets/images';

interface ResultsScreenProps {
  detectedTexts: DetectedText[];
  onBack: () => void;
  onCopyText: (text: string) => void;
  onClear: () => void;
  onGoHome?: () => void;
  onDownloadSuccess?: () => void;
}

const getDefaultFileName = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `scanned_${timestamp}`;
};

const THEME = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899',
  text: '#1E293B',
  textMuted: '#64748B',
  border: '#E2E8F0',
};

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  detectedTexts,
  onBack,
  onCopyText,
  onClear,
  onGoHome,
  onDownloadSuccess,
}) => {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'save' | 'download'>('save');
  const [actionFileName, setActionFileName] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'txt' | 'pdf'>('txt');
  const [hasSaved, setHasSaved] = useState(false);
  const allText = detectedTexts.map(t => t.text).join('\n');

  // Interstitial Ad hook
  const pendingSaveAlertRef = useRef(false);
  const [pendingSaveAlert, setPendingSaveAlert] = useState(false);

  // Keep ref in sync with state
  useEffect(() => {
    pendingSaveAlertRef.current = pendingSaveAlert;
  }, [pendingSaveAlert]);

  const { isLoaded, showAd } = useInterstitialAd({
    onAdDismissed: () => {
      // Show save success alert after ad is dismissed
      if (pendingSaveAlertRef.current) {
        pendingSaveAlertRef.current = false;
        setPendingSaveAlert(false);
        Alert.alert('Saved', `File saved as ${actionFileName.trim() || 'scanned_document'}.txt`, [
          { text: 'OK', onPress: () => onGoHome?.() }
        ]);
      }
    },
    onAdFailedToShow: () => {
      // Ad failed to show, show save success alert directly
      if (pendingSaveAlertRef.current) {
        pendingSaveAlertRef.current = false;
        setPendingSaveAlert(false);
        setHasSaved(true);
        Alert.alert('Saved', `File saved as ${actionFileName.trim() || 'scanned_document'}.txt`, [
          { text: 'OK', onPress: () => onGoHome?.() }
        ]);
      }
    },
  });

  const handleCopyAll = () => {
    Clipboard.setString(allText);
    setCopied(true);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Copied to clipboard', ToastAndroid.SHORT);
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (fileName: string, format: 'doc' | 'pdf') => {
    // Create temp file with scanned content and download it
    const tempFileName = `temp_${Date.now()}.txt`;
    const tempFilePath = `${RNFS.CachesDirectoryPath}/${tempFileName}`;

    try {
      // Write content to temp file
      await RNFS.writeFile(tempFilePath, allText, 'utf8');

      // Use common download function
      await downloadFile(
        tempFilePath,
        fileName,
        format,
        () => {
          // Cleanup temp file after successful download
          RNFS.unlink(tempFilePath).catch(() => { });
          // Notify parent that download succeeded
          onDownloadSuccess?.();
        },
        () => {
          // Cleanup temp file on error too
          RNFS.unlink(tempFilePath).catch(() => { });
        }
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to prepare download');
      console.error('Download preparation error:', error);
    }
  };

  const handleSave = async () => {
    setActionType('save');
    setShowActionModal(true);
  };

  const handleBackWithCheck = () => {
    if (!hasSaved && allText.trim().length > 0) {
      Alert.alert(
        'Unsaved Results',
        'You have unsaved results. Do you want to save them?',
        [
          {
            text: 'Save',
            onPress: () => {
              setActionType('save');
              setShowActionModal(true);
            },
          },
          {
            text: 'Don\'t Save',
            style: 'destructive',
            onPress: () => {
              onClear();
              onBack();
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      onBack();
    }
  };

  const handleDownloadPress = () => {
    setActionFileName(getDefaultFileName());
    setActionType('download');
    setShowActionModal(true);
  };

  const handleActionConfirm = async () => {
    const fileName = actionFileName.trim() || 'scanned_document';
    try {
      if (actionType === 'save') {
        // Write the file to disk first
        const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}.txt`;
        await RNFS.writeFile(filePath, allText, 'utf8');

        // Then save metadata
        const savedFile: SavedFile = {
          id: Date.now().toString(),
          name: fileName,
          path: filePath,
          size: allText.length,
          createdAt: Date.now(),
          type: 'txt',
        };
        await saveFileMetadata(savedFile);
        setHasSaved(true);
        console.log('File saved successfully at:', savedFile.path);

        // Show ad if loaded, otherwise show success alert directly
        if (isLoaded) {
          setPendingSaveAlert(true);
          showAd();
        } else {
          Alert.alert('Saved', `File saved as ${fileName}.txt`, [
            { text: 'OK', onPress: () => onGoHome?.() }
          ]);
        }
      } else if (actionType === 'download') {
        // Handle PDF download
        try {
          // Convert text to HTML for PDF generation
          const htmlContent = `
            <html>
              <head>
                <style>
                  body { 
                    font-family: Arial, sans-serif; 
                    font-size: 14px; 
                    line-height: 1.6;
                    padding: 20px;
                    margin: 0;
                  }
                  h1 { 
                    font-size: 18px; 
                    margin-bottom: 20px;
                    color: #333;
                  }
                </style>
              </head>
              <body>
                <h1>Scanned Document: ${fileName}</h1>
                <div>${allText.replace(/\n/g, '<br>')}</div>
              </body>
            </html>
          `;

          // Generate PDF
          const options = {
            html: htmlContent,
            fileName: fileName,
            directory: 'Downloads', // Save to Downloads folder
          };

          const pdf = await RNHtmlToPdf.convert(options);

          // The PDF is already saved to Downloads folder by RNHtmlToPdf
          // Get the actual file path from the returned PDF object
          const pdfFilePath = pdf.filePath || `${RNFS.ExternalDirectoryPath}/Downloads/${fileName}.pdf`;

          // Save to downloaded PDFs list with Downloads path
          const downloadedPDF: DownloadedPDF = {
            id: Date.now().toString(),
            name: fileName,
            path: pdfFilePath, // Use actual Downloads folder path
            size: allText.length,
            createdAt: Date.now(),
            format: 'pdf',
          };

          // Save to AsyncStorage
          await saveDownloadedPDF(downloadedPDF);

          Alert.alert('Success', `PDF downloaded to Downloads folder as ${fileName}.pdf`, [
            { text: 'OK' }
          ]);
          onDownloadSuccess?.();
        } catch (error) {
          console.error('PDF download error:', error);
          Alert.alert('Error', 'Failed to download PDF to Downloads folder');
        }
      }

      setShowActionModal(false);
      setActionFileName('');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', `Failed to ${actionType} file`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackWithCheck} activeOpacity={0.7}>
          <Image source={Images.headerArrow} style={styles.headerIcon} resizeMode="contain" />
        </TouchableOpacity>
        <Text style={styles.title}>Scanned Results</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.7}>
          <Image source={Images.saveIcon} style={styles.headerIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {detectedTexts.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="description" size={60} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Text Scanned</Text>
          <Text style={styles.emptyDesc}>
            Go back and start scanning to capture text
          </Text>
        </View>
      ) : (
        <View style={styles.textCard}>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
            <View style={styles.contentContainer}>
              <Text style={styles.fullText}>{allText}</Text>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.deleteButton} onPress={onClear} activeOpacity={0.7}>
          <Image source={Images.deleteFrameIcon} style={styles.deleteIcon} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={handleDownloadPress} activeOpacity={0.7}>
            <LinearGradient
              colors={['#10BA81', '#07543A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButton}>
              <Image source={Images.download} style={styles.actionIcon} resizeMode="contain" />
              <Text style={styles.actionButtonText}>Download</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCopyAll} activeOpacity={0.7}>
            <LinearGradient
              colors={['#0C69E0', '#052044']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButton}>
              <Image source={Images.copyIcon} style={styles.actionIcon} resizeMode="contain" />
              <Text style={styles.actionButtonText}>{copied ? 'Copied!' : 'Copy Text'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Download Modal */}
      <DownloadModal
        visible={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
      />

      {/* Action Modal */}
      <ActionModal
        visible={showActionModal}
        onClose={() => setShowActionModal(false)}
        title={actionType === 'save' ? 'Save File' : 'Download as a PDF'}
        buttonIcon={actionType === 'save' ? 'save' : 'download'}
        buttonText={actionType === 'save' ? 'Save' : 'Download PDF'}
        inputPlaceholder={actionType === 'save' ? 'Enter file name' : 'Enter file name for PDF'}
        inputValue={actionFileName}
        onInputChange={setActionFileName}
        onSubmit={handleActionConfirm}
        useCustomIcon={actionType === 'download'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: THEME.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  backButton: {
    // width: 40,
    // height: 40,
    // borderRadius: 20,
    // backgroundColor: Colors.surfaceSecondary,
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.ManropeSemiBold,
    color: Colors.text,
  },
  headerIcon: {
    width: 32,
    height: 32,
  },
  headerRight: {
    width: 40,
  },
  saveButton: {
    // width: 40,
    // height: 40,
    // borderRadius: 20,
    // backgroundColor: Colors.primaryLight + '20',
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#EAF2FF'
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    padding: 20,
  },
  textCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    margin: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  fullText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 26,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 17,
    gap: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  deleteButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    width: 44,
    height: 44,
  },
  actionButtons: {
    flex: 1,
    flexDirection: 'row',
    gap: 13,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  actionIcon: {
    width: 24,
    height: 24,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: Fonts.ManropeSemiBold,
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  copyButtonSuccess: {
    backgroundColor: Colors.success,
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  downloadBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Dimensions.get('window').width - 40,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    gap: 24
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeModalIcon: {
    width: 32,
    height: 32,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Fonts.ManropeBold,
    color: Colors.text,
  },
  inputContainer: {
    gap: 8
    // marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: Fonts.ManropeMedium,
    color: Colors.text,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 13,
    fontSize: 14,
    fontFamily: Fonts.ManropeRegular,
    color: Colors.text,
  },
  confirmSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 16,
  },
  confirmSaveText: {
    fontSize: 14,
    fontFamily: Fonts.ManropeBold,
    color: '#FFF',
  },
});
