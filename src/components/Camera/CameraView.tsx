import React, { forwardRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { Colors } from '../../constants/colors';

type FlashMode = 'off' | 'on' | 'auto';

interface CameraViewProps {
  isActive: boolean;
  flashMode?: FlashMode;
}

export const CameraView = forwardRef<Camera, CameraViewProps>(
  ({ isActive, flashMode = 'off' }, ref) => {
    const device = useCameraDevice('back');

    if (!device) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No camera device available</Text>
        </View>
      );
    }

    // Map flashMode to torch prop
    const torch = flashMode === 'on' ? 'on' : 'off';

    return (
      <View style={styles.container}>
        <Camera
          ref={ref}
          style={styles.camera}
          device={device}
          isActive={isActive}
          photo={true}
          video={false}
          torch={torch}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
});
