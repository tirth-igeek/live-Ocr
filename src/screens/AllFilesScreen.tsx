import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { selectFavorites, updateFileFavorite, refreshFiles } from '../store/slices/homeSlice';
import { getSavedFiles, SavedFile, formatFileSize, formatTimeAgo, updateFilesList, downloadFile, shareFile, deleteFilePermanently, toggleFavorite, getDownloadedPDFs, DownloadedPDF, deleteDownloadedPDF } from '../utils/fileStorage';
import { DownloadModal } from '../components/Results/DownloadModal';
import { FileCard } from '../components/FileCard';
import { FileMenuModal } from '../components/FileMenuModal';
import { RenameModal } from '../components/RenameModal';
import { FilterModal, FilterType } from '../components/FilterModal';
import { Images } from '../assets/images';
import { Colors } from '../constants/colors';

interface AllFilesScreenProps {
  onBack: () => void;
  onOpenFile?: (file: SavedFile, content: string) => void;
  title?: string;
  mode?: 'all' | 'pdfs';
}

const THEME = Colors;

export const AllFilesScreen: React.FC<AllFilesScreenProps> = ({ onBack, onOpenFile, title = 'All Files', mode = 'all' }) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const dispatch = useDispatch<AppDispatch>();
  const favorites = useSelector(selectFavorites);
  const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);
  const [downloadedPDFs, setDownloadedPDFs] = useState<DownloadedPDF[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SavedFile | null>(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('name');
  const [filterPosition, setFilterPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    loadFiles();
  }, [mode]);

  useEffect(() => {
    if (mode === 'pdfs') {
      setDownloadedPDFs(prev => sortPDFs(prev));
    } else {
      setSavedFiles(prev => sortSavedFiles(prev));
    }
  }, [selectedFilter]);

  const loadFiles = async () => {
    if (mode === 'pdfs') {
      const pdfs = await getDownloadedPDFs();
      setDownloadedPDFs(sortPDFs(pdfs));
    } else {
      const files = await getSavedFiles();
      setSavedFiles(sortSavedFiles(files));
    }
  };

  const sortSavedFiles = (files: SavedFile[], filter: FilterType = selectedFilter): SavedFile[] => {
    const sortedFiles = [...files];
    switch (filter) {
      case 'name':
        return sortedFiles.sort((a, b) => a.name.localeCompare(b.name));
      case 'date':
        return sortedFiles.sort((a, b) => {
          const dateA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt).getTime();
          const dateB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
      case 'size':
        return sortedFiles.sort((a, b) => (b.size || 0) - (a.size || 0));
      default:
        return sortedFiles;
    }
  };

  const sortPDFs = (pdfs: DownloadedPDF[], filter: FilterType = selectedFilter): DownloadedPDF[] => {
    const sortedFiles = [...pdfs];
    switch (filter) {
      case 'name':
        return sortedFiles.sort((a, b) => a.name.localeCompare(b.name));
      case 'date':
        return sortedFiles.sort((a, b) => {
          const dateA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt).getTime();
          const dateB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
      case 'size':
        return sortedFiles.sort((a, b) => (b.size || 0) - (a.size || 0));
      default:
        return sortedFiles;
    }
  };

  const handleFilterPress = (event: any) => {
    event.target.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
      setFilterPosition({ x: px, y: py, width, height });
      setFilterModalVisible(true);
    });
  };

  const handleFilterSelect = (filter: FilterType) => {
    setSelectedFilter(filter);
  };

  const handleFileOpen = async (file: SavedFile | DownloadedPDF) => {
    try {
      if (mode === 'pdfs') {
        if (onOpenFile) {
          onOpenFile(file as SavedFile, '');
        }
      } else {
        const content = await RNFS.readFile(file.path, 'utf8');
        if (onOpenFile) {
          onOpenFile(file as SavedFile, content);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open file');
    }
  };

  const handleMenuOpen = (file: SavedFile, event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    const menuWidth = 180;
    const menuHeight = 250;
    let x = pageX - menuWidth + 20;
    let y = pageY;
    if (x < 10) x = 10;
    if (x + menuWidth > width - 10) x = width - menuWidth - 10;
    if (y + menuHeight > height - 10) y = pageY - menuHeight;
    setMenuPosition({ x, y });
    setSelectedFile(file);
    setMenuVisible(true);
  };

  const handleMenuClose = () => {
    setMenuVisible(false);
    setSelectedFile(null);
  };

  const handleShare = async () => {
    if (!selectedFile) return;
    try {
      await shareFile(selectedFile.path, selectedFile.name);
    } catch (error) {
      Alert.alert('Share Error', String(error));
    }
    setMenuVisible(false);
  };

  const handleDownload = () => {
    setDownloadModalVisible(true);
    setMenuVisible(false);
  };

  const handleDownloadConfirm = async (fileName: string, format: 'doc' | 'pdf') => {
    if (!selectedFile) return;
    await downloadFile(
      selectedFile.path,
      fileName,
      format,
      () => setDownloadModalVisible(false),
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
      setSavedFiles(updatedFiles);
      setRenameModalVisible(false);
      setNewFileName('');
      setSelectedFile(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to rename file');
    }
  };

  const handleDelete = () => {
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
              await deleteFilePermanently(selectedFile.path);
              await loadFiles();
              setMenuVisible(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete file');
            }
          },
        },
      ]
    );
  };

  const handleDeletePress = (file: SavedFile | DownloadedPDF) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${file.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (mode === 'pdfs') {
                await deleteDownloadedPDF(file.id);
                setDownloadedPDFs(prev => prev.filter(f => f.id !== file.id));
              } else {
                await deleteFilePermanently(file.path);
                await loadFiles();
              }
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
      dispatch(refreshFiles());
      setMenuVisible(false);
    } catch (error) {
      Alert.alert('Error', isPinned ? 'Failed to unpin file' : 'Failed to pin file');
    }
  };

  const renderDoc = ({ item }: { item: SavedFile | DownloadedPDF }) => (
    <FileCard
      file={item as SavedFile}
      isPinned={mode === 'all' ? favorites.includes(item.id) : false}
      onPress={handleFileOpen}
      onMenuPress={mode === 'all' ? handleMenuOpen : undefined}
      onDeletePress={mode === 'pdfs' ? handleDeletePress : undefined}
      isPdfMode={mode === 'pdfs'}
    />
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, isLandscape && styles.headerLandscape]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Image source={Images.headerArrow} style={styles.headerIcon} resizeMode="contain" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity style={styles.filterButton} onPress={handleFilterPress} activeOpacity={0.7}>
          <Image source={Images.headerFilter} style={styles.headerIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={mode === 'pdfs' ? downloadedPDFs : savedFiles}
        renderItem={renderDoc}
        keyExtractor={x => x.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Image
              source={mode === 'pdfs' ? Images.pdfIcon : Images.fileIcon}
              style={styles.emptyIcon}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>No {mode === 'pdfs' ? 'PDFs' : 'files'} yet</Text>
            <Text style={styles.emptySubtitle}>
              {mode === 'pdfs'
                ? 'Downloaded PDFs will appear here'
                : 'Scanned documents will appear here'}
            </Text>
          </View>
        }
      />

      <FileMenuModal
        visible={menuVisible}
        position={menuPosition}
        isPinned={selectedFile ? favorites.includes(selectedFile.id) : false}
        onClose={handleMenuClose}
        onShare={handleShare}
        onDownload={handleDownload}
        onRename={handleRenamePress}
        onPin={handlePinPress}
        onDelete={handleDelete}
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

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onFilterSelect={handleFilterSelect}
        selectedFilter={selectedFilter}
        position={filterPosition}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
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
  headerLandscape: {
    paddingTop: 12,
  },
  backButton: {
    padding: 4,
  },
  filterButton: {
    padding: 4,
  },
  headerIcon: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
  },
  listContent: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
  },
});

export default AllFilesScreen;
