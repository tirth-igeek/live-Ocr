import React from 'react';
import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Fonts } from '../fonts';
import { formatFileDate, formatFileSize, SavedFile } from '../../utils/fileStorage';

import { Images } from '../../assets/images';
import { Colors } from '../../constants/colors';

interface FileCardProps {
  file: SavedFile;
  isPinned?: boolean;
  onPress: (file: SavedFile) => void;
  onMenuPress?: (file: SavedFile, event: any) => void;
  onDeletePress?: (file: SavedFile) => void;
  isPdfMode?: boolean;
}

export const FileCard: React.FC<FileCardProps> = ({ file, isPinned = false, onPress, onMenuPress, onDeletePress, isPdfMode = false }) => {
  return (
    <TouchableOpacity
      style={styles.fileCard}
      onPress={() => onPress(file)}
      onLongPress={(e) => onMenuPress?.(file, e)}
      delayLongPress={300}
      activeOpacity={0.7}>
      <Image source={isPdfMode ? Images.pdfIcon : Images.fileIcon} style={isPdfMode ? styles.pdfIconImage : styles.fileIconSmallImage} resizeMode="contain" />
      <View style={styles.fileContent}>
        <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
        <View style={styles.fileMetaRow}>
          <Text style={styles.fileMetaText}>{formatFileDate(file.createdAt)}</Text>
          <View style={styles.fileMetaDot} />
          <Text style={styles.fileMetaText}>{formatFileSize(file.size || 0)}</Text>
        </View>
      </View>
      <View style={styles.rightActions}>
        {isPinned && !isPdfMode && (
          <View style={styles.pinIconContainer}>
            <Icon name="push-pin" size={14} color="#7C3AED" />
          </View>
        )}
        {isPdfMode && onDeletePress ? (
          <TouchableOpacity
            style={styles.deleteActionBtn}
            onPress={() => onDeletePress(file)}
            activeOpacity={0.6}>
            <Image source={Images.deleteFrameIcon1} style={styles.deleteIconImage} resizeMode="contain" />
          </TouchableOpacity>
        ) : onMenuPress ? (
          <TouchableOpacity
            style={styles.fileActionBtn}
            onPress={(e) => onMenuPress(file, e)}
            activeOpacity={0.6}>
            <Icon name="more-vert" size={20} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fileCard: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  fileIconSmallImage: {
    width: 56,
    height: 56,
  },
  pdfIconImage: {
    width: 56,
    height: 56,
  },
  deleteIconImage: {
    width: 32,
    height: 32,
  },
  deleteActionBtn: {
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileContent: {
    flex: 1,
  },
  fileName: {
    color: '#1E293B',
    fontSize: 14,
    fontFamily: Fonts.ManropeRegular,
    marginBottom: 4,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pinIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileMetaText: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: Fonts.ManropeBold,
  },
  fileMetaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
    marginHorizontal: 8,
  },
  fileActionBtn: {
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
