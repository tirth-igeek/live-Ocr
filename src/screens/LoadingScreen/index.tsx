import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { styles } from './styles';

export const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.text}>Initializing Camera...</Text>
    </View>
  );
};

export default LoadingScreen;
