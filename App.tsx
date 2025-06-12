import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ScanWorkoutScreen } from './src/screens/ScanWorkoutScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile, saveUserProfile } from './src/utils/storage';
import { UserProfile } from './src/types';

const Tab = createBottomTabNavigator();

const NavigationContainerComponent = NavigationContainer as any;

export default function App() {
  return (
    <NavigationContainerComponent>
      <Tab.Navigator
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
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainerComponent>
  );
} 