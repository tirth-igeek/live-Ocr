import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';

interface PermissionDeniedProps {
  onRetry: () => void;
}

export const PermissionDenied: React.FC<PermissionDeniedProps> = ({ onRetry }) => {
  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name="camera-alt" size={40} color="#3B82F6" />
      </View>
      <Text style={styles.title}>Camera Access Denied</Text>
      <Text style={styles.description}>
        We need camera access to scan text. Please enable camera permission in your device settings.
      </Text>
      <TouchableOpacity style={styles.primaryButton} onPress={openSettings}>
        <Text style={styles.primaryButtonText}>Open Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={onRetry}>
        <Text style={styles.secondaryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PermissionDenied;
