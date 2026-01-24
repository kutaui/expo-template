import { useCameraDevice, useCameraPermission, Camera } from 'react-native-vision-camera';
import { useEffect, useState } from 'react';

export function useCameraPermissions() {
  const permission = useCameraPermission();
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const device = useCameraDevice('back');

  useEffect(() => {
    const checkPermission = async () => {
      const status = await Camera.getCameraPermissionStatus();
      if (status === 'granted') {
        setIsPermissionGranted(true);
      } else if (status === 'not-determined') {
        const newStatus = await Camera.requestCameraPermission();
        setIsPermissionGranted(newStatus === 'granted');
      }
    };

    checkPermission();
  }, []);

  return {
    isPermissionGranted,
    requestPermission: Camera.requestCameraPermission,
    device,
    permission
  };
}
