import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';

interface TextItemProps {
  text: string;
  onPress: () => void;
}

export const TextItem: React.FC<TextItemProps> = ({ text, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.content}>
        <Text style={styles.text} numberOfLines={2} ellipsizeMode="tail">
          {text}
        </Text>
        <Text style={styles.hint}>Tap to copy</Text>
      </View>
      <View style={styles.indicator} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  text: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  hint: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },
  indicator: {
    width: 4,
    backgroundColor: Colors.primary,
  },
});
