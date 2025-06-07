import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, Workout } from '../types';

const USER_PROFILE_KEY = '@user_profile';
const WORKOUTS_KEY = '@workouts';

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const profile = await AsyncStorage.getItem(USER_PROFILE_KEY);
    return profile ? JSON.parse(profile) : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const saveWorkout = async (workout: Workout): Promise<void> => {
  try {
    const existingWorkouts = await getWorkouts();
    const updatedWorkouts = [...(existingWorkouts || []), workout];
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(updatedWorkouts));
  } catch (error) {
    console.error('Error saving workout:', error);
  }
};

export const getWorkouts = async (): Promise<Workout[] | null> => {
  try {
    const workouts = await AsyncStorage.getItem(WORKOUTS_KEY);
    return workouts ? JSON.parse(workouts) : [];
  } catch (error) {
    console.error('Error getting workouts:', error);
    return null;
  }
}; 