import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getWorkouts } from '../utils/storage';
import { Workout } from '../types';

export const HistoryScreen = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    const loadedWorkouts = await getWorkouts();
    if (loadedWorkouts) {
      setWorkouts(loadedWorkouts);
    }
  };

  const renderWorkout = ({ item }: { item: Workout }) => (
    <View style={styles.workoutCard}>
      <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.result}>Result: {item.result}</Text>
      {item.goal && <Text style={styles.goal}>Goal: {item.goal}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout History</Text>
      <FlatList
        data={workouts}
        renderItem={renderWorkout}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
  },
  list: {
    padding: 16,
  },
  workoutCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  result: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 4,
  },
  goal: {
    fontSize: 14,
    color: '#4CAF50',
  },
}); 