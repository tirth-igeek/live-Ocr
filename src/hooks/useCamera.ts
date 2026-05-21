import { useState, useEffect, useCallback } from 'react';
import { Camera } from 'react-native-vision-camera';

export const useCamera = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [isLoading, setIsLoading] = useState(true);

  const checkPermission = useCallback(async () => {
    setIsLoading(true);
    const status = await Camera.getCameraPermissionStatus();
    setPermissionStatus(status);
    setHasPermission(status === 'granted');
    setIsLoading(false);
    return status === 'granted';
  }, []);

  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    const newStatus = await Camera.requestCameraPermission();
    setPermissionStatus(newStatus);
    setHasPermission(newStatus === 'granted');
    setIsLoading(false);
    return newStatus === 'granted';
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    hasPermission,
    permissionStatus,
    isLoading,
    checkPermission,
    requestPermission,
  };
};
