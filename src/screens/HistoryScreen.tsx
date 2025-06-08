import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView } from 'react-native';
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
      // Sort workouts by date, most recent first
      const sortedWorkouts = loadedWorkouts.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setWorkouts(sortedWorkouts);
    }
  };

  const renderWeights = (weights: { [key: string]: string }) => {
    if (!weights || Object.keys(weights).length === 0) return null;
    return (
      <View style={styles.weightsContainer}>
        <Text style={styles.sectionTitle}>Weights Used:</Text>
        {Object.entries(weights).map(([key, value]) => (
          <Text style={styles.weightItem} key={key}>
            {key}: {value}
          </Text>
        ))}
      </View>
    );
  };

  const renderWorkout = ({ item }: { item: Workout }) => (
    <View style={styles.workoutCard}>
      <Text style={styles.date}>
        {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString()}
      </Text>
      
      <View style={styles.workoutContent}>
        <Text style={styles.workoutTitle}>Workout:</Text>
        <Text style={styles.description}>{item.description}</Text>
        
        {item.goal && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Goal:</Text>
            <Text style={styles.goal}>{item.goal}</Text>
          </View>
        )}
        
        {item.strategy && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Strategy:</Text>
            <Text style={styles.strategy}>{item.strategy}</Text>
          </View>
        )}
        
        {renderWeights(item.weights)}
        
        <View style={styles.resultContainer}>
          <Text style={styles.sectionTitle}>Result:</Text>
          <Text style={styles.result}>{item.result}</Text>
        </View>
      </View>
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
        showsVerticalScrollIndicator={false}
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
    fontSize: 28,
    fontWeight: 'bold',
    padding: 16,
    color: '#2196F3',
  },
  list: {
    padding: 16,
  },
  workoutCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  workoutContent: {
    gap: 12,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    color: '#444',
    lineHeight: 22,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 4,
  },
  goal: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: '500',
  },
  strategy: {
    fontSize: 15,
    color: '#666',
    fontStyle: 'italic',
  },
  weightsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  weightItem: {
    fontSize: 15,
    color: '#444',
    marginVertical: 2,
  },
  resultContainer: {
    marginTop: 8,
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
  },
  result: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
}); 