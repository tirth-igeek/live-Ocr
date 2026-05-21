import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../constants/colors';
import { Fonts } from './fonts';
import { Images } from '../assets/images';

interface ActionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  buttonIcon: string;
  buttonText: string;
  inputPlaceholder: string;
  inputValue: string;
  onInputChange: (text: string) => void;
  onSubmit: () => void;
  useCustomIcon?: boolean; // For download button
}

export const ActionModal: React.FC<ActionModalProps> = ({
  visible,
  onClose,
  title,
  buttonIcon,
  buttonText,
  inputPlaceholder,
  inputValue,
  onInputChange,
  onSubmit,
  useCustomIcon = false,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Image source={Images.closeModal} style={styles.closeModalIcon} resizeMode="contain" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>File Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder={inputPlaceholder}
              placeholderTextColor={Colors.textMuted}
              value={inputValue}
              onChangeText={onInputChange}
              autoFocus={true}
            />
          </View>

          <TouchableOpacity onPress={onSubmit} activeOpacity={0.7}>
            <LinearGradient
              colors={['#0C69E0', '#052044']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmBtn}>
              {buttonIcon === 'save' ? (
                <Image source={Images.saveModalIcon} style={styles.buttonIcon} resizeMode="contain" />
              ) : buttonIcon === 'download' ? (
                <Image source={Images.download} style={styles.buttonIcon} resizeMode="contain" />
              ) : (
                <Icon name={buttonIcon} size={20} color="#FFF" />
              )}
              <Text style={styles.confirmBtnText}>{buttonText}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    gap: 24,
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
    gap: 8,
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
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 16,
  },
  confirmBtnText: {
    fontSize: 14,
    fontFamily: Fonts.ManropeBold,
    color: '#FFF',
  },
  buttonIcon: {
    width: 20,
    height: 20,
  },
});
