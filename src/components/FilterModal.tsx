import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/colors';
import { Fonts } from './fonts';

export type FilterType = 'name' | 'date' | 'size';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onFilterSelect: (filter: FilterType) => void;
  selectedFilter: FilterType;
  position: { x: number; y: number; width: number; height: number };
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onFilterSelect,
  selectedFilter,
  position,
}) => {
  const filterOptions = [
    { key: 'name' as FilterType, label: 'A-Z Sorting', icon: 'sort-by-alpha' },
    { key: 'date' as FilterType, label: 'Date Wise', icon: 'event' },
    { key: 'size' as FilterType, label: 'Size Wise', icon: 'data-usage' },
  ];

  // Calculate modal position to stay within screen bounds
  const getModalPosition = () => {
    const modalHeight = 44 * 3 + 16; // 3 options * 44px height + padding
    const modalWidth = 180;

    // Position below the filter button by default
    let top = position.y + position.height + 8;
    let left = position.x;

    // If modal would go below screen, position it above the button
    if (top + modalHeight > Dimensions.get('window').height - 20) {
      top = position.y - modalHeight - 8;
    }

    // Ensure modal doesn't go off the right edge
    if (left + modalWidth > Dimensions.get('window').width - 20) {
      left = Dimensions.get('window').width - modalWidth - 20;
    }

    // Ensure modal doesn't go off the left edge
    if (left < 20) {
      left = 20;
    }

    return { top, left };
  };

  const modalPosition = getModalPosition();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
        <View style={[styles.modalContainer, { top: modalPosition.top, left: modalPosition.left }]}>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterOption,
                selectedFilter === option.key && styles.selectedOption
              ]}
              onPress={() => {
                onFilterSelect(option.key);
                onClose();
              }}
              activeOpacity={0.7}>
              <Icon
                name={option.icon}
                size={20}
                color={selectedFilter === option.key ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[
                styles.filterText,
                selectedFilter === option.key && styles.selectedText
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalContainer: {
    position: 'absolute',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 180,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 12,
  },
  selectedOption: {
    backgroundColor: Colors.primaryLight + '20',
  },
  filterText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.ManropeMedium,
    color: Colors.text,
  },
  selectedText: {
    color: Colors.primary,
    fontFamily: Fonts.ManropeSemiBold,
  },
});
