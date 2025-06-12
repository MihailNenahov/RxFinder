import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, Workout } from '../types';

const USER_PROFILE_KEY = '@user_profile';
const WORKOUTS_KEY = '@workouts';

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