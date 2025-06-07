declare module 'expo-camera' {
  import * as React from 'react';
  import { ViewStyle } from 'react-native';

  export interface CameraProps {
    style?: ViewStyle;
    type?: 'front' | 'back';
    ref?: any;
  }

  export const Camera: React.FC<CameraProps> & {
    requestCameraPermissionsAsync(): Promise<{ status: string }>;
    getCameraPermissionsAsync(): Promise<{ status: string }>;
  };
} 