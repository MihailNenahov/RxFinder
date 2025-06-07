import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Camera } from 'expo-camera';
import { Workout, WorkoutSuggestion } from '../types';
import { saveWorkout } from '../utils/storage';

// Mock AI response
const mockAIResponse = (): WorkoutSuggestion => ({
  workout: "AMRAP 10 min: 10 Power Cleans (40kg), 15 Push-ups, 20 Air Squats",
  goal: "5+ rounds in under 10 min",
  suggestedWeights: {
    clean: "45kg",
  },
  strategy: "Aim for 1 round every 2 minutes. Keep squats unbroken. Rest max 15 seconds."
});

export const ScanWorkoutScreen = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(false);
  const [suggestion, setSuggestion] = useState<WorkoutSuggestion | null>(null);
  const [result, setResult] = useState('');

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleCapture = async () => {
    // In a real app, we would process the image here
    // For now, we'll just simulate the AI response
    setSuggestion(mockAIResponse());
  };

  const handleEndWorkout = () => {
    Alert.alert(
      "End Workout",
      "Are you sure you ended your workout?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: () => {
            if (!result.trim()) {
              Alert.alert("Error", "Please enter your workout result");
              return;
            }
            
            const workout: Workout = {
              id: Date.now().toString(),
              date: new Date().toISOString(),
              description: suggestion?.workout || '',
              weights: suggestion?.suggestedWeights || {},
              result: result,
              goal: suggestion?.goal,
              strategy: suggestion?.strategy
            };

            saveWorkout(workout);
            setSuggestion(null);
            setResult('');
            Alert.alert("Success", "Workout saved successfully!");
          }
        }
      ]
    );
  };

  if (!hasPermission) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

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
            onChangeText={setResult}
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
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 35,
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
}); 