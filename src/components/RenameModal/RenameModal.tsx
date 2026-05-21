import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Fonts } from '../fonts';

const THEME = {
  primary: '#0C69E0',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  text: '#1E293B',
  textMuted: '#64748B',
  border: '#E2E8F0',
};

interface RenameModalProps {
  visible: boolean;
  fileName: string;
  onClose: () => void;
  onConfirm: () => void;
  onChangeText: (text: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  visible,
  fileName,
  onClose,
  onConfirm,
  onChangeText,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.renameOverlay}>
        <View style={styles.renameContainer}>
          <Text style={styles.renameTitle}>Rename File</Text>
          <TextInput
            style={styles.renameInput}
            value={fileName}
            onChangeText={onChangeText}
            placeholder="Enter new name"
            placeholderTextColor={THEME.textMuted}
            autoFocus={true}
          />
          <View style={styles.renameButtons}>
            <TouchableOpacity style={styles.renameCancelBtn} onPress={onClose}>
              <Text style={styles.renameCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.renameConfirmBtn} onPress={onConfirm}>
              <Text style={styles.renameConfirmText}>Rename</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  renameOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  renameContainer: {
    backgroundColor: THEME.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  renameTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: Fonts.ManropeBold,
  },
  renameInput: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: THEME.text,
    backgroundColor: THEME.surfaceSecondary,
    marginBottom: 20,
    fontFamily: Fonts.ManropeRegular,
  },
  renameButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  renameCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: THEME.surfaceSecondary,
    alignItems: 'center',
  },
  renameCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.text,
    fontFamily: Fonts.ManropeSemiBold,
  },
  renameConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: THEME.primary,
    alignItems: 'center',
  },
  renameConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: Fonts.ManropeSemiBold,
  },
});
