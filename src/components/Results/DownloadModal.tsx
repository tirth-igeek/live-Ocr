import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';

interface DownloadModalProps {
  visible: boolean;
  onClose: () => void;
  onDownload: (fileName: string, format: 'doc' | 'pdf') => void;
  initialFileName?: string;
}

const getDefaultFileName = () => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `scanned_${timestamp}`;
};

export const DownloadModal: React.FC<DownloadModalProps> = ({
  visible,
  onClose,
  onDownload,
  initialFileName,
}) => {
  const [fileName, setFileName] = useState(initialFileName || getDefaultFileName);
  const [selectedFormat, setSelectedFormat] = useState<'doc' | 'pdf'>('doc');

  useEffect(() => {
    if (visible) {
      setFileName(initialFileName || getDefaultFileName());
    }
  }, [visible, initialFileName]);

  const handleDownload = () => {
    const name = fileName.trim() || 'scanned_document';
    onDownload(name, selectedFormat);
    setFileName('');
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Download File</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Icon name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* File Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>File Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter file name"
              placeholderTextColor={Colors.textMuted}
              value={fileName}
              onChangeText={setFileName}
              autoFocus={true}
            />
          </View>

          {/* Format Selection */}
          <View style={styles.formatContainer}>
            <Text style={styles.label}>Select Format</Text>
            <View style={styles.formatButtons}>
              <TouchableOpacity
                style={[
                  styles.formatButton,
                  selectedFormat === 'doc' && styles.formatButtonActive,
                ]}
                onPress={() => setSelectedFormat('doc')}
                activeOpacity={0.7}>
                <Icon
                  name="description"
                  size={24}
                  color={selectedFormat === 'doc' ? Colors.primary : Colors.textSecondary}
                />
                <Text style={[styles.formatText, selectedFormat === 'doc' && styles.formatTextActive]}>
                  DOC
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.formatButton,
                  selectedFormat === 'pdf' && styles.formatButtonActive,
                ]}
                onPress={() => setSelectedFormat('pdf')}
                activeOpacity={0.7}>
                <Icon
                  name="picture-as-pdf"
                  size={24}
                  color={selectedFormat === 'pdf' ? Colors.primary : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.formatText,
                    selectedFormat === 'pdf' && styles.formatTextActive,
                  ]}>
                  PDF
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Download Button */}
          <TouchableOpacity style={styles.downloadButton} onPress={handleDownload} activeOpacity={0.7}>
            <Icon name="download" size={20} color="#FFF" />
            <Text style={styles.downloadText}>Download</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  formatContainer: {
    marginBottom: 24,
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  formatButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '20',
  },
  formatText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  formatTextActive: {
    color: Colors.primary,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  downloadText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
