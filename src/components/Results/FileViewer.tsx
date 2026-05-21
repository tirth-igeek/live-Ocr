import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Clipboard,
  ToastAndroid,
  Platform,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Images } from '../../assets/images';
import { Colors } from '../../constants/colors';
import type { SavedFile } from '../../utils/fileStorage';

const THEME = Colors;

interface FileViewerProps {
  file: SavedFile;
  content: string;
  onBack: () => void;
  onShare: () => void;
}

export const FileViewer: React.FC<FileViewerProps> = ({
  file,
  content,
  onBack,
  onShare,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    Clipboard.setString(content);
    setCopied(true);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Copied to clipboard', ToastAndroid.SHORT);
    }
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Image source={Images.headerArrow} style={styles.headerIcon} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
          <Text style={styles.fileMeta}>{formatFileSize(file.size)} • {formatTime(file.createdAt)}</Text>
        </View>
        <TouchableOpacity style={styles.actionButton} onPress={handleCopy} activeOpacity={0.7}>
          <Icon name={copied ? 'check' : 'content-copy'} size={22} color={copied ? Colors.success : Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onShare} activeOpacity={0.7}>
          <Icon name="share" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View> */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Image source={Images.headerArrow} style={styles.headerIcon} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
          <Text style={styles.fileMeta}>{formatFileSize(file.size)} • {formatTime(file.createdAt)}</Text>
        </View>
        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.backButton} onPress={handleCopy} activeOpacity={0.7}>
            <Image source={Images.headerCopyIcon} style={styles.headerIcon} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={onShare} activeOpacity={0.7}>
            <Image source={Images.headerShareIcon} style={styles.headerIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.textCard}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
          <View style={styles.contentContainer}>
            <Text style={styles.contentText}>{content}</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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
  headerIcon: {
    width: 32,
    height: 32,
  },
  titleContainer: {
    flex: 1,
    // alignItems: 'center',
    paddingHorizontal: 12,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  fileMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    // flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  textCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    margin: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    // minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  contentText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 26,
    fontFamily: 'monospace',
  },
});
