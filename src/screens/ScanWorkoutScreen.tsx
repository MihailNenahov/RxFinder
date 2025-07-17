import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Workout, WorkoutSuggestion, UserProfile } from '../types';
import { saveWorkout, getUserProfile, saveUserProfile } from '../utils/storage';
import { analyzeWorkoutWithPhoto, submitWorkoutResult } from '../utils/ai';

const CameraView = ({ onCapture }: { onCapture: (imageUri: string) => void }) => {
  const takePicture = async () => {
    try {
      // First check if we have permission
      const { status: existingStatus } = await ImagePicker.getCameraPermissionsAsync();
      let finalStatus = existingStatus;

      // If we don't have permission, request it
      if (existingStatus !== 'granted') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        finalStatus = status;
      }

      // If we still don't have permission, show an alert
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take pictures. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
        return;
      }

      // If we have permission, launch the camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      if (!result.canceled) {
        console.log('Picture taken:', result.assets[0]);
        onCapture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraPlaceholder}>
        <Text style={styles.cameraPlaceholderText}>Camera View</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.captureButton} 
          onPress={takePicture}
        />
      </View>
    </View>
  );
};

export const ScanWorkoutScreen = () => {
  const [suggestion, setSuggestion] = useState<WorkoutSuggestion | null>(null);
  const [result, setResult] = useState('');
  const [userFeedback, setUserFeedback] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    checkPermissions();
    const loadProfile = async () => {
      const profile = await getUserProfile();
      setUserProfile(profile);
    };
    loadProfile();
  }, []);

  const checkPermissions = async () => {
    try {
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error checking permissions:', error);
      setHasPermission(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take pictures. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setHasPermission(false);
    }
  };

  const handleCapture = async (imageUri: string) => {
    setIsLoading(true);
    try {
      const aiResponse = await analyzeWorkoutWithPhoto(imageUri);
      setSuggestion(aiResponse);
    } catch (error) {
      console.error('Error analyzing workout:', error);
      
      if (error instanceof Error && error.message.includes('Authentication failed')) {
        Alert.alert(
          'Session Expired', 
          'Your session has expired. Please log in again.',
          [{ text: 'OK', onPress: () => {
            // The authentication error has already been handled by clearing the token
            // The app should automatically redirect to login
          }}]
        );
      } else {
        Alert.alert('Error', 'Failed to analyze workout. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndWorkout = async () => {
    console.log('handleEndWorkout: started');
    if (!result.trim()) {
      Alert.alert("Error", "Please enter your workout result");
      return;
    }
    setIsLoading(true);
    try {
      const workout: Workout = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        description: suggestion?.workout || '',
        weights: suggestion?.suggestedWeights || {},
        result: result,
        goal: suggestion?.goal,
        strategy: suggestion?.strategy,
        userFeedback: userFeedback,
      };

      await saveWorkout(workout);

      // Submit workout result to API
      if (suggestion?.workoutId) {
        await submitWorkoutResult({
          workout_id: suggestion.workoutId,
          result: result,
          userFeedback: userFeedback,
        });
      }

      console.log('Showing success alert');
      Alert.alert('Success', 'Workout and profile updated successfully!');

      setSuggestion(null);
      setResult('');
      setUserFeedback('');
      console.log('handleEndWorkout: finished successfully');
    } catch (error) {
      console.error('handleEndWorkout: error', error);
      Alert.alert('Error', 'Something went wrong while saving your workout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.container}>
          <Text>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.container}>
          <TouchableOpacity 
            style={[styles.button, { marginTop: 20 }]} 
            onPress={requestPermissions}
          >
            <Text style={styles.buttonText}>Request Camera Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Processing your workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (suggestion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.suggestionContainer}>
          <Text style={styles.title}>Workout Suggestion</Text>
          <Text style={styles.workoutText}>{suggestion.workout}</Text>
          <Text style={styles.goalText}>Goal: {suggestion.goal}</Text>
          
          {suggestion.suggestedWeights && Object.keys(suggestion.suggestedWeights).length > 0 && (
            <View style={styles.weightsContainer}>
              <Text style={styles.weightsTitle}>Recommended Weights:</Text>
              {Object.entries(suggestion.suggestedWeights).map(([exercise, weight]) => (
                <Text key={exercise} style={styles.weightText}>
                  • {exercise}: {weight}
                </Text>
              ))}
            </View>
          )}
          
          <Text style={styles.strategyText}>Strategy: {suggestion.strategy}</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter your result (e.g., 4 rounds + 12 reps)"
            value={result}
            onChangeText={setResult}
            editable={!isLoading}
          />
          
          <TextInput
            style={styles.input}
            placeholder="How did it feel? (e.g., Thrusters were tough, pull-ups unbroken, breathing hard at the end)"
            value={userFeedback}
            onChangeText={setUserFeedback}
            editable={!isLoading}
          />
          
          <TouchableOpacity style={styles.button} onPress={handleEndWorkout} disabled={isLoading}>
            <Text style={styles.buttonText}>End Workout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView onCapture={handleCapture} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholderText: {
    color: '#fff',
    fontSize: 18,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 35,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    borderWidth: 5,
    borderColor: '#2196F3',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    margin: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  suggestionContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  workoutText: {
    fontSize: 18,
    marginBottom: 10,
  },
  goalText: {
    fontSize: 16,
    color: '#4CAF50',
    marginBottom: 10,
  },
  strategyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  weightsContainer: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  weightsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  weightText: {
    fontSize: 15,
    color: '#2E7D32',
    marginBottom: 4,
  },
});
