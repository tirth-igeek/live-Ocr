import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="document-scanner" size={60} color="#3B82F6" />
        </View>
        <Text style={styles.title}>Live OCR Scanner</Text>
        <Text style={styles.description}>
          Point your camera at any text to instantly scan and copy it. Perfect for documents, business cards, and more.
        </Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={onGetStarted}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

export default WelcomeScreen;
