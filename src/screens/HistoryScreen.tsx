import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { getWorkouts as getLocalWorkouts } from '../utils/storage';
import { getWorkoutHistory } from '../utils/ai';
import { Workout } from '../types';

export const HistoryScreen = () => {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [localWorkouts, setLocalWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Try to load API workouts first
      await loadApiWorkouts(1, true);
      console.log('API workouts loaded successfully');
      // Only load local workouts as fallback if API fails
    } catch (error) {
      console.error('Error loading API workouts, falling back to local:', error);
      // If API fails, show local workouts as fallback
      await loadLocalWorkouts();
    } finally {
      setIsLoading(false);
    }
  };

  const loadApiWorkouts = async (pageNumber: number = 1, reset: boolean = false) => {
    try {
      console.log(`Loading API workouts page ${pageNumber}...`);
      const apiWorkouts = await getWorkoutHistory(pageNumber, 10);
      console.log('API workouts response:', apiWorkouts);
      
      // Ensure we have an array
      const workoutsArray = Array.isArray(apiWorkouts) ? apiWorkouts : (apiWorkouts?.workouts || []);
      console.log('Processed workouts array length:', workoutsArray.length);
      
      if (reset) {
        setWorkouts(workoutsArray);
        setPage(pageNumber);
      } else {
        setWorkouts(prev => [...(prev || []), ...workoutsArray]);
        setPage(pageNumber);
      }
      
      // If we get less than 10 workouts, assume no more pages
      setHasMorePages(workoutsArray.length === 10);
    } catch (error) {
      console.error('Error loading API workouts:', error);
      if (reset) {
        setWorkouts([]);
      }
    }
  };

  const loadLocalWorkouts = async () => {
    try {
      const loadedWorkouts = await getLocalWorkouts();
      if (loadedWorkouts) {
        // Sort workouts by date, most recent first
        const sortedWorkouts = loadedWorkouts.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setLocalWorkouts(sortedWorkouts);
      }
    } catch (error) {
      console.error('Error loading local workouts:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Try to refresh from API first
      await loadApiWorkouts(1, true);
      console.log('Workouts refreshed from server');
    } catch (error) {
      console.error('Error refreshing from API, using local data:', error);
      // If API fails during refresh, fall back to local data
      await loadLocalWorkouts();
      Alert.alert('Offline Mode', 'Showing local workout data. Pull to refresh when online.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (!hasMorePages || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      await loadApiWorkouts(page + 1, false);
    } catch (error) {
      console.error('Error loading more workouts:', error);
    } finally {
      setIsLoadingMore(false);
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

  const renderApiWorkout = ({ item }: { item: any }) => (
    <View style={styles.workoutCard}>
      <Text style={styles.date}>
        {new Date(item.date || item.created_at).toLocaleDateString()} at {new Date(item.date || item.created_at).toLocaleTimeString()}
      </Text>
      
      <View style={styles.workoutContent}>
        <Text style={styles.workoutTitle}>Workout:</Text>
        <Text style={styles.description}>{item.description || item.workout}</Text>
        
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
        
        {renderWeights(item.weights || {})}
        
        <View style={styles.resultContainer}>
          <Text style={styles.sectionTitle}>Result:</Text>
          <Text style={styles.result}>{item.result}</Text>
        </View>

        {item.userFeedback && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Feedback:</Text>
            <Text style={styles.feedback}>{item.userFeedback}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderLocalWorkout = ({ item }: { item: Workout }) => (
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

        {item.userFeedback && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Feedback:</Text>
            <Text style={styles.feedback}>{item.userFeedback}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2196F3" />
        <Text style={styles.loadingText}>Loading more workouts...</Text>
      </View>
    );
  };



  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading workout history...</Text>
      </View>
    );
  }

  // Show either API workouts (preferred) or local workouts (fallback)
  const displayWorkouts = workouts.length > 0 ? workouts : localWorkouts;
  const isShowingLocal = workouts.length === 0 && localWorkouts.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout History</Text>
        {isShowingLocal && (
          <Text style={styles.offlineIndicator}>Offline Mode</Text>
        )}
      </View>
      <FlatList
        data={displayWorkouts}
        renderItem={({ item }) => 
          isShowingLocal ? renderLocalWorkout({ item }) : renderApiWorkout({ item })
        }
        keyExtractor={(item, index) => 
          item.id || index.toString()
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2196F3']}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  offlineIndicator: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
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
  apiIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  apiLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  localIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  localLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
  feedback: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  separator: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 8,
    borderRadius: 4,
  },
  separatorText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 