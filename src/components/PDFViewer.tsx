import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Pdf from 'react-native-pdf';
import { Images } from '../assets/images';
import { Colors } from '../constants/colors';

const THEME = Colors;

interface PDFViewerProps {
  filePath: string;
  fileName: string;
  onBack: () => void;
  onShare?: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  filePath,
  fileName,
  onBack,
  onShare,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);

  // Convert file path to proper format for react-native-pdf
  // Avoid double file:// prefix
  const normalizedPath = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
  const source = { uri: normalizedPath, cache: false };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Image source={Images.headerArrow} style={styles.headerIcon} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
          <Text style={styles.fileMeta}>PDF Document</Text>
        </View>


        <TouchableOpacity style={styles.backButton} onPress={onShare} activeOpacity={0.7}>
          <Image source={Images.headerShareIcon} style={styles.headerIcon} resizeMode="contain" />
        </TouchableOpacity>

      </View>

      {/* PDF Viewer */}
      <View style={styles.content}>
        {error ? (
          <View style={styles.errorContainer}>
            <Icon name="error-outline" size={48} color={Colors.scanning} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => setError(null)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Pdf
              source={source}
              style={styles.pdf}
              onLoadComplete={(numberOfPages) => {
                setPageCount(numberOfPages);
                setLoading(false);
                setError(null);
              }}
              onPageChanged={(page) => setCurrentPage(page)}
              onError={(errorMessage) => {
                const errorString = String(errorMessage);
                console.warn('PDF error for path:', normalizedPath, 'Error:', errorString);
                // Check if file is actually a PDF or just HTML with .pdf extension
                if (errorString.includes('not in PDF format') || errorString.includes('corrupted')) {
                  setError(`This file is not a valid PDF.\nPath: ${normalizedPath}\n\nIt may be an HTML document saved with .pdf extension.`);
                } else {
                  setError(`Failed to load PDF:\n${errorString}\n\nPath: ${normalizedPath}`);
                }
                setLoading(false);
              }}
              spacing={10}
              enablePaging={true}
              enableRTL={false}
              enableAnnotationRendering={true}
              fitPolicy={0}
            />
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading PDF...</Text>
              </View>
            )}
          </>
        )}

        {/* Page indicator */}
        {!loading && !error && pageCount > 0 && (
          <View style={styles.pageIndicator}>
            <Text style={styles.pageText}>
              {currentPage} / {pageCount}
            </Text>
          </View>
        )}
      </View>
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
  headerIcon: {
    width: 32,
    height: 32,
  },
  backButton: {
    // width: 40,
    // height: 40,
    // justifyContent: 'center',
    // alignItems: 'center',
    // marginRight: 8,
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  fileName: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  fileMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    zIndex: 10,
  },
  pageIndicator: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pageText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textMuted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
