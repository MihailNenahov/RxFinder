import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, Workout } from '../types';

const USER_PROFILE_KEY = '@user_profile';
const WORKOUTS_KEY = '@workouts';
const WORKOUT_CACHE_KEY = '@workout_cache';

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    // Always store age and weight as numbers
    const normalizedProfile = {
      ...profile,
      age: Number(profile.age),
      weight: Number(profile.weight),
    };
    console.log('Saving user profile:', normalizedProfile);
    const profileString = JSON.stringify(normalizedProfile);
    console.log('Serialized profile:', profileString);
    await AsyncStorage.setItem(USER_PROFILE_KEY, profileString);
    console.log('Profile saved successfully');
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error; // Re-throw to handle in the calling code
  }
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    console.log('Getting user profile...');
    const profile = await AsyncStorage.getItem(USER_PROFILE_KEY);
    console.log('Raw profile from storage:', profile);
    
    if (!profile) {
      console.log('No profile found in storage');
      return null;
    }
    
    const parsedProfile = JSON.parse(profile);
    console.log('Parsed profile:', parsedProfile);
    return parsedProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error; // Re-throw to handle in the calling code
  }
};

export const saveWorkout = async (workout: Workout): Promise<void> => {
  try {
    const existingWorkouts = await getWorkouts();
    const updatedWorkouts = [...(existingWorkouts || []), workout];
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(updatedWorkouts));
  } catch (error) {
    console.error('Error saving workout:', error);
    throw error;
  }
};

export const getWorkouts = async (): Promise<Workout[] | null> => {
  try {
    const workouts = await AsyncStorage.getItem(WORKOUTS_KEY);
    return workouts ? JSON.parse(workouts) : [];
  } catch (error) {
    console.error('Error getting workouts:', error);
    throw error;
  }
};

// Workout cache for API responses (first 2-3 pages)
export const saveWorkoutCache = async (workouts: any[], page: number = 1): Promise<void> => {
  try {
    const cacheKey = `${WORKOUT_CACHE_KEY}_page_${page}`;
    await AsyncStorage.setItem(cacheKey, JSON.stringify({
      workouts,
      timestamp: Date.now(),
      page
    }));
  } catch (error) {
    console.error('Error saving workout cache:', error);
    throw error;
  }
};

export const getWorkoutCache = async (page: number = 1): Promise<any[] | null> => {
  try {
    const cacheKey = `${WORKOUT_CACHE_KEY}_page_${page}`;
    const cached = await AsyncStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const parsedCache = JSON.parse(cached);
    const cacheAge = Date.now() - parsedCache.timestamp;
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    if (cacheAge > maxAge) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }
    
    return parsedCache.workouts;
  } catch (error) {
    console.error('Error getting workout cache:', error);
    return null;
  }
};

// Profile cache for API responses
const PROFILE_CACHE_KEY = '@profile_cache';

export const saveProfileCache = async (profile: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
      profile,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Error saving profile cache:', error);
    throw error;
  }
};

export const getProfileCache = async (): Promise<any | null> => {
  try {
    const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
    
    if (!cached) return null;
    
    const parsedCache = JSON.parse(cached);
    const cacheAge = Date.now() - parsedCache.timestamp;
    const maxAge = 10 * 60 * 1000; // 10 minutes
    
    if (cacheAge > maxAge) {
      await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }
    
    return parsedCache.profile;
  } catch (error) {
    console.error('Error getting profile cache:', error);
    return null;
  }
}; 