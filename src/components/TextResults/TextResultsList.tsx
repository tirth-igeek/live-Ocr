import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TextItem } from './TextItem';
import type { DetectedText } from '../../types';
import { Colors } from '../../constants/colors';

interface TextResultsListProps {
  detectedTexts: DetectedText[];
  onCopyText: (text: string) => void;
}

export const TextResultsList: React.FC<TextResultsListProps> = ({
  detectedTexts,
  onCopyText,
}) => {
  const isEmpty = detectedTexts.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scanned Text</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{detectedTexts.length}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={isEmpty && styles.emptyContent}>
        {isEmpty ? (
          <View style={styles.emptyState}>
            <Icon name="camera-alt" size={60} color={Colors.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No text scanned yet</Text>
            <Text style={styles.emptyDescription}>
              Point your camera at text and tap "Start Scanning"
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {detectedTexts.map((item, index) => (
              <TextItem
                key={index}
                text={item.text}
                onPress={() => onCopyText(item.text)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyDescription: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  listContainer: {
    paddingBottom: 20,
  },
});
