import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';

interface PermissionRequestProps {
  onRequestPermission: () => void;
}

export const PermissionRequest: React.FC<PermissionRequestProps> = ({
  onRequestPermission,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Camera permission is required for live text detection
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={onRequestPermission}>
        <Text style={styles.buttonText}>Grant Permission</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    color: Colors.text,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
