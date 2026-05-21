import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';
import { getDownloadedPDFs, DownloadedPDF, deleteDownloadedPDF, formatFileSize } from '../../utils/fileStorage';
import { Colors } from '../../constants/colors';

interface PDFsScreenProps {
  onBack: () => void;
  onOpenPDF: (pdf: DownloadedPDF) => void;
}

export const PDFsScreen: React.FC<PDFsScreenProps> = ({ onBack, onOpenPDF }) => {
  const [pdfs, setPdfs] = useState<DownloadedPDF[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPDFs();
  }, []);

  const loadPDFs = async () => {
    setLoading(true);
    const downloadedPdfs = await getDownloadedPDFs();
    setPdfs(downloadedPdfs);
    setLoading(false);
  };

  const handleDeletePDF = async (pdf: DownloadedPDF) => {
    Alert.alert(
      'Delete PDF',
      `Are you sure you want to delete "${pdf.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDownloadedPDF(pdf.id);
            loadPDFs();
          },
        },
      ]
    );
  };

  const renderPDFItem = ({ item }: { item: DownloadedPDF }) => {
    const getIconAndColor = () => {
      switch (item.format) {
        case 'pdf':
          return { icon: 'picture-as-pdf', color: Colors.danger };
        case 'doc':
          return { icon: 'description', color: Colors.primary };
        case 'txt':
          return { icon: 'text-snippet', color: Colors.textMuted };
        default:
          return { icon: 'insert-drive-file', color: Colors.textMuted };
      }
    };

    const { icon, color } = getIconAndColor();

    return (
      <TouchableOpacity
        style={styles.pdfItem}
        onPress={() => onOpenPDF(item)}
        activeOpacity={0.7}>
        <View style={styles.pdfIconContainer}>
          <Icon name={icon} size={28} color={color} />
        </View>
        <View style={styles.pdfInfo}>
          <Text style={styles.pdfName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.pdfMeta}>
            {formatFileSize(item.size)} • {item.format.toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePDF(item)}
          activeOpacity={0.7}>
          <Icon name="delete" size={20} color={Colors.danger} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Icon name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Documents</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : pdfs.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="picture-as-pdf" size={60} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No PDFs yet</Text>
          <Text style={styles.emptySubtitle}>
            Download files as PDF, DOC, or TXT from the results screen
          </Text>
        </View>
      ) : (
        <FlatList
          data={pdfs}
          renderItem={renderPDFItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default PDFsScreen;
