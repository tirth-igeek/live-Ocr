import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  useWindowDimensions,
  Alert,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { BannerAdSize } from 'react-native-google-mobile-ads';
import RNFS from 'react-native-fs';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import {
  fetchHomeData,
  refreshFiles,
  refreshPDFs,
  selectFiles,
  selectFileCount,
  selectPDFCount,
  selectUnreadPDFCount,
  selectIsLoading,
  selectFilteredFiles,
  selectSearchQuery,
  selectSearchVisible,
  selectFavorites,
  setSearchQuery,
  setSearchVisible,
  updateFileFavorite,
  removeFile,
  addFile,
} from '../store/slices/homeSlice';
import { SavedFile, formatFileSize, formatTimeAgo, formatFileDate, updateFilesList, downloadFile, shareFile, deleteFilePermanently, toggleFavorite } from '../utils/fileStorage';
import { DownloadModal } from '../components/Results/DownloadModal';
import { BannerAdComponent, useInterstitialAd } from '../components/ads/Ads';
import { Fonts } from '../components/fonts';
import { FileCard } from '../components/FileCard';
import { FileMenuModal } from '../components/FileMenuModal';
import { RenameModal } from '../components/RenameModal';

interface HomeScreenProps {
  onStartScan: () => void;
  onOpenFile?: (file: SavedFile, content: string) => void;
  onViewFile?: (fileId: string) => void;
  onShowAllFiles?: () => void;
  onShowPDFs?: () => void;
  hasDraft?: boolean;
  refreshTrigger?: number;
}

// Image assets
import { Images } from '../assets/images';
import { Colors } from '../constants/colors';

const THEME = Colors;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const isSmallDevice = SCREEN_WIDTH < 375;

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartScan, onOpenFile, onViewFile, onShowAllFiles, onShowPDFs, hasDraft, refreshTrigger }) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Redux dispatch and selectors
  const dispatch = useDispatch<AppDispatch>();
  const savedFiles = useSelector(selectFiles);
  const filteredFiles = useSelector(selectFilteredFiles);
  const fileCount = useSelector(selectFileCount);
  const pdfCount = useSelector(selectPDFCount);
  const unreadPDFCount = useSelector(selectUnreadPDFCount);
  const isLoading = useSelector(selectIsLoading);
  const searchQuery = useSelector(selectSearchQuery);
  const searchVisible = useSelector(selectSearchVisible);
  const favorites = useSelector(selectFavorites);

  // Local UI state (not in Redux)
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SavedFile | null>(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'recent' | 'pinned'>('recent');

  // Interstitial Ad hook - simplified and reliable
  const pendingNavRef = useRef<'allFiles' | 'pdfs' | null>(null);

  const { isLoaded, showAd } = useInterstitialAd({
    onAdDismissed: () => {
      // Navigate after ad is dismissed
      const target = pendingNavRef.current;
      pendingNavRef.current = null;

      if (target === 'allFiles') {
        onShowAllFiles?.();
      } else if (target === 'pdfs') {
        onShowPDFs?.();
      }
    },
    onAdFailedToShow: () => {
      // Failed to show, navigate directly
      const target = pendingNavRef.current;
      pendingNavRef.current = null;

      if (target === 'allFiles') {
        onShowAllFiles?.();
      } else if (target === 'pdfs') {
        onShowPDFs?.();
      }
    },
  });

  // Load data on initial mount
  useEffect(() => {
    dispatch(fetchHomeData());
  }, [dispatch]);

  // Handle refresh trigger from navigation
  useEffect(() => {
    if (refreshTrigger) {
      dispatch(refreshFiles());
      dispatch(refreshPDFs());
    }
  }, [refreshTrigger, dispatch]);

  const handleSearch = (query: string) => {
    dispatch(setSearchQuery(query));
  };

  const handleSetSearchVisible = (visible: boolean) => {
    dispatch(setSearchVisible(visible));
    if (!visible) {
      dispatch(setSearchQuery(''));
    }
  };

  const handleFileOpen = async (file: SavedFile) => {
    try {
      const content = await RNFS.readFile(file.path, 'utf8');
      onOpenFile?.(file, content);
    } catch (error) {
      Alert.alert('Error', 'Could not open file');
    }
  };

  const handleMenuOpen = (file: SavedFile, event: any) => {
    setSelectedFile(file);
    const { pageX, pageY } = event.nativeEvent;
    // Ensure menu stays within screen bounds
    const menuWidth = 180;
    const menuItemHeight = 48;
    const menuHeight = menuItemHeight * 4 + 24; // 4 items + padding
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;

    let x = pageX - menuWidth + 20;
    let y = pageY + 10;

    // Adjust if off-screen right
    if (x + menuWidth > screenWidth) {
      x = screenWidth - menuWidth - 10;
    }
    // Adjust if off-screen left
    if (x < 10) {
      x = 10;
    }
    // Adjust if off-screen bottom (show above instead)
    if (y + menuHeight > screenHeight) {
      y = pageY - menuHeight - 10;
    }
    // Ensure y is never negative
    if (y < 10) {
      y = 10;
    }

    setMenuPosition({ x, y });
    setMenuVisible(true);
  };

  const handleSharePress = () => {
    if (!selectedFile) return;
    setMenuVisible(false);
    shareFile(selectedFile.path, selectedFile.name);
  };

  const handleDownloadPress = () => {
    setMenuVisible(false);
    setDownloadModalVisible(true);
  };

  const handleDeletePress = () => {
    if (!selectedFile) return;
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${selectedFile.name}"?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setMenuVisible(false) },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFilePermanently(selectedFile);
              dispatch(removeFile(selectedFile.id));
              setMenuVisible(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete file');
            }
          },
        },
      ]
    );
  };

  const handlePinPress = async () => {
    if (!selectedFile) return;
    const isPinned = favorites.includes(selectedFile.id);
    try {
      await toggleFavorite(selectedFile.id);
      dispatch(updateFileFavorite({ fileId: selectedFile.id, isFavorite: !isPinned }));
      setMenuVisible(false);
    } catch (error) {
      Alert.alert('Error', isPinned ? 'Failed to unpin file' : 'Failed to pin file');
    }
  };

  const handleDownloadConfirm = async (fileName: string, format: 'doc' | 'pdf') => {
    if (!selectedFile) return;
    await downloadFile(
      selectedFile.path,
      fileName,
      format,
      () => {
        // On success: close modal and refresh PDF count
        setDownloadModalVisible(false);
        dispatch(refreshPDFs());
      },
      () => setDownloadModalVisible(false)
    );
  };

  const handleRenamePress = () => {
    if (!selectedFile) return;
    setNewFileName(selectedFile.name.replace('.txt', ''));
    setRenameModalVisible(true);
    setMenuVisible(false);
  };

  const handleRenameConfirm = async () => {
    if (!selectedFile || !newFileName.trim()) return;
    try {
      const newName = `${newFileName.trim()}.txt`;
      const newPath = `${RNFS.DocumentDirectoryPath}/${newName}`;

      await RNFS.moveFile(selectedFile.path, newPath);

      const updatedFiles = savedFiles.map(f =>
        f.id === selectedFile.id ? { ...f, name: newName, path: newPath } : f
      );

      await updateFilesList(updatedFiles);
      dispatch(refreshFiles());

      setRenameModalVisible(false);
      Alert.alert('Renamed', `File renamed to ${newName}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to rename file');
    }
  };

  const baseFiles = searchQuery ? filteredFiles : savedFiles;
  const displayFiles = activeTab === 'pinned'
    ? baseFiles.filter(file => favorites.includes(file.id))
    : baseFiles;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf': return THEME.danger;
      case 'image': return THEME.purple;
      default: return THEME.primary;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isLandscape && styles.scrollContentLandscape]}>
        {/* Header - New Design with Logo */}
        <View style={styles.header}>
          <Image source={Images.logo} style={styles.logoImage} resizeMode="contain" />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => handleSetSearchVisible(true)}>
            <Image source={Images.searchIcon} style={styles.searchIconImage} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        {/* Search Bar - Conditional */}
        {
          searchVisible && (
            <View style={styles.searchContainer}>
              <View style={styles.searchBox}>
                <Icon name="search" size={20} color="#94A3B8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search documents..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={handleSearch}
                  autoFocus={true}
                />
                <TouchableOpacity onPress={() => {
                  if (searchQuery.length > 0) {
                    handleSearch('');
                  } else {
                    handleSetSearchVisible(false);
                  }
                }}>
                  <Icon name="close" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>
          )
        }

        {/* Quick Scan and Stats Cards Row */}
        {
          !searchVisible && (
            <View style={styles.topRow}>
              <TouchableOpacity
                style={styles.quickScanCard}
                onPress={onStartScan}
                activeOpacity={0.9}>
                <LinearGradient
                  colors={['#0C69E0', '#07397A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.quickScanGradient}>
                  <View style={styles.quickScanContent}>
                    <View style={styles.quickScanIconContainer}>
                      <Image source={Images.quickScanIcon} style={styles.quickScanIconImage} />
                      <View style={styles.quickScanTextContainer}>
                        <Text style={styles.quickScanTitle}>Quick Scan</Text>
                        <Text style={styles.quickScanSubtitle}>Auto-detect edges and enhance clarity</Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              <View style={styles.statsColumn}>
                <TouchableOpacity
                  style={styles.statCard}
                  onPress={() => {
                    if (isLoaded) {
                      pendingNavRef.current = 'allFiles';
                      showAd();
                    } else {
                      onShowAllFiles?.();
                    }
                  }}
                  activeOpacity={0.85}>
                  <Image source={Images.totalScanIcon} style={styles.statIconImage} resizeMode="contain" />
                  <View>
                    <Text style={styles.statLabel}>Total Scan</Text>
                    <Text style={styles.statNumber}>{fileCount.toLocaleString()}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.statCard}
                  onPress={() => {
                    if (isLoaded) {
                      pendingNavRef.current = 'pdfs';
                      showAd();
                    } else {
                      onShowPDFs?.();
                    }
                  }}
                  activeOpacity={0.85}>
                  <Image source={Images.documentIcon} style={styles.statIconImage} resizeMode="contain" />
                  <View>
                    <Text style={styles.statLabel}>Documents</Text>
                    <Text style={styles.statNumber}>{pdfCount}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )
        }

        {/* Recent/Pinned Tabs */}
        {
          !searchVisible && (
            <View style={styles.tabsContainer}>
              <View style={styles.tabsRow}>
                <TouchableOpacity
                  style={[styles.tabButton, activeTab === 'recent' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('recent')}>
                  <Text style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}>Recent</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabButton, activeTab === 'pinned' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('pinned')}>
                  <Text style={[styles.tabText, activeTab === 'pinned' && styles.tabTextActive]}>Pinned</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={onShowAllFiles}>
                <Text style={styles.viewAllText}>View All ›</Text>
              </TouchableOpacity>
            </View>
          )
        }

        {/* Recent Files Section */}
        <View style={styles.filesSection}>
          {/* Section Header - Only shown when search is visible */}
          {searchVisible && (
            <View style={styles.filesHeader}>
              <Text style={styles.filesHeaderTitle}>Search Results</Text>
            </View>
          )}

          {/* Files List */}
          <View style={styles.filesList}>
            {searchVisible && searchQuery && displayFiles.length === 0 ? (
              <View style={styles.noResultsContainer}>
                <Icon name="search-off" size={48} color="#94A3B8" />
                <Text style={styles.noResultsTitle}>No results found</Text>
                <Text style={styles.noResultsSubtitle}>Try searching with different keywords</Text>
              </View>
            ) : displayFiles.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyIconContainer}>
                  <Icon name="cloud-off" size={64} color="#C7D2FE" />
                </View>
                <Text style={styles.emptyStateTitle}>No documents yet</Text>
                <Text style={styles.emptyStateSubtitle}>Start by scanning your first{'\n'}document to organize your{'\n'}digital life.</Text>
                <TouchableOpacity style={styles.scanButton} onPress={onStartScan}>
                  <LinearGradient
                    colors={['#0C69E0', '#07397A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.scanButtonGradient}>
                    <Image source={Images.addPhoto} style={styles.scanButtonIcon} resizeMode="contain" />
                    <Text style={styles.scanButtonText}>Scan New Doc</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {displayFiles.slice(0, 5).map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    isPinned={favorites.includes(file.id)}
                    onPress={handleFileOpen}
                    onMenuPress={handleMenuOpen}
                  />
                ))}
              </>
            )}
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView >

      {/* Banner Ad at Bottom */}
      < View style={styles.bannerContainer} >
        <BannerAdComponent size={BannerAdSize.BANNER} />
      </View >

      <FileMenuModal
        visible={menuVisible}
        position={menuPosition}
        isPinned={selectedFile ? favorites.includes(selectedFile.id) : false}
        onClose={() => setMenuVisible(false)}
        onShare={handleSharePress}
        onDownload={handleDownloadPress}
        onRename={handleRenamePress}
        onPin={handlePinPress}
        onDelete={handleDeletePress}
      />

      <RenameModal
        visible={renameModalVisible}
        fileName={newFileName}
        onClose={() => setRenameModalVisible(false)}
        onConfirm={handleRenameConfirm}
        onChangeText={setNewFileName}
      />

      <DownloadModal
        visible={downloadModalVisible}
        onClose={() => setDownloadModalVisible(false)}
        onDownload={handleDownloadConfirm}
        initialFileName={selectedFile?.name.replace('.txt', '')}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      )}
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContentLandscape: {
    paddingHorizontal: 40,
  },
  headerLandscape: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: THEME.surface,
  },
  sortText: {
    color: THEME.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  usernameSmall: {
    fontSize: 24,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: THEME.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: THEME.primary,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: {
    fontSize: 26,
    textAlign: 'center',
    lineHeight: 30,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    color: THEME.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 18,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: THEME.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  sectionSubtitleLink: {
    color: THEME.primary,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionRowLandscape: {
    paddingHorizontal: 60,
  },
  actionBtnLandscape: {
    width: '18%',
  },
  actionBtn: {
    alignItems: 'center',
    width: '22%',
  },
  actionCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  actionCircleSmall: {
    width: 48,
    height: 48,
    borderRadius: 14,
  },
  actionIconSmall: {
    fontSize: 24,
  },
  actionIcon: {
    fontSize: 26,
    textAlign: 'center',
    lineHeight: 30,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  storageBox: {
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 24,
    backgroundColor: THEME.surface,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  storageBoxLandscape: {
    marginHorizontal: 40,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  storageTitle: {
    color: THEME.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  storageText: {
    color: THEME.success,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  progressBg: {
    height: 10,
    backgroundColor: THEME.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME.success,
    borderRadius: 5,
  },
  storageSub: {
    color: THEME.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 12,
    letterSpacing: -0.2,
  },
  docsSection: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  docsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  viewAll: {
    backgroundColor: THEME.surface,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  viewAllText: {
    color: '#0C69E0',
    fontSize: 14,
    fontFamily: Fonts.ManropeSemiBold,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  docIcon: {
    width: 54,
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  docIconText: {
    fontSize: 28,
    textAlign: 'center',
    lineHeight: 32,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    gap: 10,
  },
  searchIcon: {
    fontSize: 20,
    color: THEME.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  searchPlaceholder: {
    color: THEME.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  searchResult: {
    color: THEME.textMuted,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  searchClearBtn: {
    padding: 4,
  },
  searchClearCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchHintBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: THEME.surfaceSecondary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  searchHintText: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  searchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  searchResultsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  searchResultsText: {
    color: THEME.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  clearSearchText: {
    color: THEME.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  chipsContainer: {
    marginTop: 8,
    marginBottom: 8,
    flexDirection: 'row',
  },
  chipsContent: {
    paddingHorizontal: 24,
    gap: 10,
  },
  chip: {
    backgroundColor: THEME.surface,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  chipActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  chipText: {
    color: THEME.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  spacer: {
    height: 12,
  },
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.background,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 28,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  fabSmall: {
    width: 56,
    height: 56,
    borderRadius: 28,
    bottom: 20,
    right: 20,
  },
  fabIcon: {
    fontSize: 32,
  },
  emptyFilesText: {
    textAlign: 'center',
    color: THEME.textMuted,
    fontSize: 14,
    paddingVertical: 20,
  },
  sortOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortMenu: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  sortMenuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textMuted,
    marginBottom: 8,
    paddingHorizontal: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sortMenuItemActive: {
    backgroundColor: THEME.primary + '15',
  },
  sortMenuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: THEME.text,
  },
  sortMenuTextActive: {
    color: THEME.primary,
  },
  scanSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  glassWrapper: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  glassCard: {
    flexDirection: 'row',
    backgroundColor: THEME.surface,
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 8,
    position: 'relative',
  },
  glassCardActive: {
    backgroundColor: THEME.surface,
  },
  glassSheen: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 100,
    height: 200,
    backgroundColor: '#FFF',
    opacity: 0.03,
    transform: [{ rotate: '35deg' }],
  },
  glassLeft: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassOrb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassOrbActive: {
    backgroundColor: THEME.primary,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  glassRight: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 16,
  },
  glassNumber: {
    color: THEME.text,
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -2,
    marginBottom: -4,
  },
  glassWord: {
    color: THEME.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
    padding: 0,
  },
  topRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  quickScanCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#C7D2FE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  quickScanContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  quickScanTitle: {
    fontSize: 16,
    fontFamily: Fonts.ManropeRegular,
    color: '#FFFFFF',
  },
  quickScanSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.ManropeBold,
    color: '#B8D7FF',
    lineHeight: 18,
    textAlign: "center"
  },
  statsColumn: {
    flex: 1,
    flexDirection: 'column',
    gap: 18,
    width: 120,
  },
  statCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    // borderWidth: 1,
    // borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  statIconBg: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: Fonts.ManropeSemiBold,
    color: '#94A3B8',
  },
  statNumber: {
    fontSize: 20,
    fontFamily: Fonts.ManropeBold,
    color: '#3D3D3D',
  },
  filterPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: '#6366F1',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filesSection: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  filesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filesHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  filesHeaderLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A56DB',
  },
  filesList: {
    gap: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: '#EFF1F2',
    borderRadius: 48,
    width: '100%',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    marginHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    padding: 24,
  },
  logoImage: {
    width: 120,
    height: 40,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIconImage: {
    width: 24,
    height: 24,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#E7F0FC',
    borderRadius: 16,
    padding: 4,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 16,
    fontFamily: Fonts.ManropeSemiBold,
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0C69E0',
    fontSize: 16,
    fontFamily: Fonts.ManropeSemiBold,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconImage: {
    width: 40,
    height: 40,
  },
  pdfsIslandWrapper: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  pdfsIsland: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.15)',
  },
  pdfsBlob: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239,68,68,0.12)',
    transform: [{ scale: 1.2 }],
  },
  pdfsBlobSecondary: {
    position: 'absolute',
    left: -20,
    bottom: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245,158,11,0.08)',
  },
  pdfsIconStack: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pdfsIconBack: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(239,68,68,0.2)',
    transform: [{ rotate: '-12deg' }, { scale: 0.95 }],
  },
  pdfsIconMid: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(239,68,68,0.4)',
    transform: [{ rotate: '6deg' }, { scale: 0.9 }],
  },
  pdfsIconFront: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ rotate: '0deg' }],
  },
  pdfsPulseBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  pdfsPulseText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 4,
  },
  pdfsContent: {
    flex: 1,
    paddingLeft: 18,
  },
  pdfsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pdfsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  pdfsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 1.5,
  },
  pdfsMainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  pdfsDesc: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  pdfsFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    marginLeft: 8,
  },
  quickScanIconImage: {
    width: 75,
    height: 75,
    resizeMode: 'contain',
  },
  quickScanTextContainer: {
    flex: 1,
    alignItems: 'center'
  },
  scanPageImage: {
    width: 32,
    height: 36,
    marginLeft: 8,
  },
  arrowIcon: {
    width: 16,
    height: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  quickScanGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 24,
  },
  quickScanIconContainer: {
    flex: 1,
    // flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0C69E0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 12,
  },
  scanButtonIcon: {
    width: 22,
    height: 20,
  },
  scanButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: Fonts.ManropeBold,
  },
});
