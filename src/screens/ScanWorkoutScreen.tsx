import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Camera } from 'expo-camera';
import { Workout, WorkoutSuggestion } from '../types';
import { saveWorkout } from '../utils/storage';

// Mock AI response for testing
const mockAIResponse = (): WorkoutSuggestion => ({
  workout: "AMRAP 10 min: 10 Power Cleans (40kg), 15 Push-ups, 20 Air Squats",
  goal: "5+ rounds in under 10 min",
  suggestedWeights: {
    clean: "45kg",
  },
  strategy: "Aim for 1 round every 2 minutes. Keep squats unbroken. Rest max 15 seconds."
});

export const ScanWorkoutScreen = () => {
  console.log('Component rendering');
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [suggestion, setSuggestion] = useState<WorkoutSuggestion | null>(null);
  const [result, setResult] = useState('');

  useEffect(() => {
    console.log('useEffect triggered - checking camera permission');
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    console.log('Checking camera permission...');
    try {
      const { status } = await Camera.getCameraPermissionsAsync();
      console.log('Current camera permission status:', status);
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error checking camera permission:', error);
    }
  };

  const requestCameraPermission = async () => {
    console.log('Requesting camera permission...');
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      console.log('Camera permission request result:', status);
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error requesting camera permission:', error);
    }
  };

  const handleCapture = async () => {
    console.log('Capture button pressed');
    try {
      const mockResponse = mockAIResponse();
      console.log('Setting suggestion:', mockResponse);
      setSuggestion(mockResponse);
    } catch (error) {
      console.error('Error capturing workout:', error);
    }
  };

  const handleEndWorkout = () => {
    console.log('End workout button pressed');
    console.log('Current result:', result);
    
    if (!result.trim()) {
      console.log('No result entered, showing error');
      Alert.alert("Error", "Please enter your workout result");
      return;
    }

    try {
      const workout: Workout = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        description: suggestion?.workout || '',
        weights: suggestion?.suggestedWeights || {},
        result: result,
        goal: suggestion?.goal,
        strategy: suggestion?.strategy
      };
      
      console.log('Saving workout:', workout);
      saveWorkout(workout);
      
      setSuggestion(null);
      setResult('');
      console.log('Workout saved successfully');
      Alert.alert("Success", "Workout saved successfully!");
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  console.log('Current state:', { hasPermission, suggestion: !!suggestion, result });

  if (hasPermission === null) {
    console.log('Rendering permission request view');
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    console.log('Rendering no permission view');
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={[styles.button, { marginTop: 20 }]} 
          onPress={requestCameraPermission}
        >
          <Text style={styles.buttonText}>Request Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  console.log('Rendering main view');
  return (
    <View style={styles.container}>
      {!suggestion ? (
        <View style={styles.container}>
          <Camera style={styles.camera} />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handleCapture}>
              <Text style={styles.buttonText}>Capture Workout</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.suggestionContainer}>
          <Text style={styles.title}>Workout Suggestion</Text>
          <Text style={styles.workoutText}>{suggestion.workout}</Text>
          <Text style={styles.goalText}>Goal: {suggestion.goal}</Text>
          <Text style={styles.strategyText}>Strategy: {suggestion.strategy}</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter your result (e.g., 4 rounds + 12 reps)"
            value={result}
            onChangeText={(text) => {
              console.log('Result input changed:', text);
              setResult(text);
            }}
          />
          
          <TouchableOpacity style={styles.button} onPress={handleEndWorkout}>
            <Text style={styles.buttonText}>End Workout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 35,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
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
    width: '100%',
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
});
