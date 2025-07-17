import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Screens
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ScanWorkoutScreen } from './src/screens/ScanWorkoutScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignupScreen } from './src/screens/SignupScreen';


// Utils
import { isLoggedIn, getJWTToken, logout } from './src/utils/auth';
import { getUserProfile as getLocalUserProfile, saveUserProfile } from './src/utils/storage';
import { getUserProfile as getRemoteUserProfile } from './src/utils/ai';
import { AuthState } from './src/types';

const Tab = createBottomTabNavigator();
const NavigationContainerComponent = NavigationContainer as any;

type AuthFlow = 'login' | 'signup' | 'onboarding';

export default function App() {
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    isLoading: true,
  });
  const [authFlow, setAuthFlow] = useState<AuthFlow>('login');
  const [prefilledEmail, setPrefilledEmail] = useState<string>('');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('Checking auth status...');
      const loggedIn = await isLoggedIn();
      console.log('User logged in:', loggedIn);
      
      setAuthState({
        isLoggedIn: loggedIn,
        isLoading: false,
      });
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({
        isLoggedIn: false,
        isLoading: false,
      });
    }
  };

  const handleLoginSuccess = async () => {
    console.log('=== handleLoginSuccess started ===');
    setPrefilledEmail(''); // Clear prefilled email after successful login
    
    // Set loading state while we fetch profile
    setAuthState({
      isLoggedIn: true,
      isLoading: true,
    });

    try {
      // Fetch user profile from API and save it locally
      console.log('Fetching user profile after login/signup...');
      const remoteProfile = await getRemoteUserProfile();
      console.log('Remote profile fetched:', remoteProfile);
      
      if (remoteProfile && remoteProfile.profile) {
        // Save the profile data to local storage
        const profileData = remoteProfile.profile;
        
        // Ensure we have the required fields
        if (profileData.name && profileData.email && profileData.sex) {
          await saveUserProfile({
            name: profileData.name,
            email: profileData.email,
            sex: profileData.sex,
            age: profileData.age || calculateAgeFromBirthday(profileData.birthday),
            weight: profileData.weight || 0,
            birthday: profileData.birthday,
            capacities: profileData.capacities,
          });
          console.log('Profile saved to local storage successfully');
        } else {
          console.warn('Profile data missing required fields:', profileData);
        }
      } else {
        console.warn('No profile data received from API');
      }
    } catch (error) {
      console.error('Error fetching/saving profile after login:', error);
      // Don't fail the login process if profile fetch fails
    }

    // Complete login regardless of profile fetch result
    setAuthState({
      isLoggedIn: true,
      isLoading: false,
    });
    console.log('=== handleLoginSuccess completed ===');
  };

  // Helper function to calculate age from birthday
  const calculateAgeFromBirthday = (birthday: string): number => {
    if (!birthday) return 0;
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSignupSuccess = async (email?: string, autoLoggedIn?: boolean) => {
    console.log('handleSignupSuccess called with:', { email, autoLoggedIn });
    
    if (autoLoggedIn) {
      console.log('User was auto-logged in after signup, calling handleLoginSuccess...');
      // User was automatically logged in, redirect to main app
      await handleLoginSuccess();
      console.log('handleLoginSuccess completed, current auth state should be updated');
    } else {
      console.log('User needs to log in manually, showing login screen with email:', email);
      // Store email to pre-fill login form
      setPrefilledEmail(email || '');
      // User needs to log in manually, show login screen
      setAuthFlow('login');
    }
  };

  const handleLogout = async () => {
    try {
      await logout(); // Clear token and data
    } catch (error) {
      console.error('Logout error:', error);
    }
    setAuthState({
      isLoggedIn: false,
      isLoading: false,
    });
    setAuthFlow('login');
  };

  const handleAuthenticationFailure = async () => {
    console.log('Handling authentication failure - redirecting to login');
    await handleLogout();
  };

  // Loading screen
  if (authState.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  // Not logged in - show auth flow
  if (!authState.isLoggedIn) {
    if (authFlow === 'signup') {
      return (
        <SignupScreen
          onSignupSuccess={handleSignupSuccess}
          onNavigateToLogin={() => setAuthFlow('login')}
        />
      );
    }
    
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        onNavigateToSignup={() => {
          setPrefilledEmail(''); // Clear prefilled email when going to signup
          setAuthFlow('signup');
        }}
        prefilledEmail={prefilledEmail}
      />
    );
  }

  // Fully authenticated - show main app
  return (
    <NavigationContainerComponent>
      <Tab.Navigator
        id={undefined}
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'History') {
              iconName = focused ? 'time' : 'time-outline';
            } else if (route.name === 'Scan') {
              iconName = focused ? 'camera' : 'camera-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2196F3',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Scan" component={ScanWorkoutScreen} />
        <Tab.Screen name="Profile">
          {(props) => <ProfileScreen {...props} onLogout={handleLogout} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainerComponent>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
}); 