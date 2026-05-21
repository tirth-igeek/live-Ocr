import React from 'react';
import { Modal, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Fonts } from '../fonts';

const THEME = {
  primary: '#0C69E0',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#7C3AED',
};

interface FileMenuModalProps {
  visible: boolean;
  position: { x: number; y: number };
  isPinned?: boolean;
  onClose: () => void;
  onShare: () => void;
  onDownload: () => void;
  onRename: () => void;
  onPin: () => void;
  onDelete: () => void;
}

export const FileMenuModal: React.FC<FileMenuModalProps> = ({
  visible,
  position,
  isPinned = false,
  onClose,
  onShare,
  onDownload,
  onRename,
  onPin,
  onDelete,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <TouchableOpacity
        style={[styles.menuOverlay, { justifyContent: 'flex-start', alignItems: 'flex-start' }]}
        activeOpacity={1}
        onPress={onClose}>
        <View style={[styles.menuContainer, { position: 'absolute', left: position.x, top: position.y }]}>
          <TouchableOpacity style={styles.menuItem} onPress={onPin}>
            <Icon name={isPinned ? 'push-pin' : 'push-pin'} size={20} color={THEME.purple} />
            <Text style={styles.menuText}>{isPinned ? 'Unpin' : 'Pin'}</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={onShare}>
            <Icon name="share" size={20} color={THEME.primary} />
            <Text style={styles.menuText}>Share</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={onDownload}>
            <Icon name="download" size={20} color={THEME.success} />
            <Text style={styles.menuText}>Download</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={onRename}>
            <Icon name="edit" size={20} color={THEME.warning} />
            <Text style={styles.menuText}>Rename</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={onDelete}>
            <Icon name="delete" size={20} color={THEME.danger} />
            <Text style={styles.menuText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuText: {
    fontSize: 14,
    fontFamily: Fonts.ManropeMedium,
    color: '#1E293B',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
});
