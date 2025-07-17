import AsyncStorage from '@react-native-async-storage/async-storage';

const JWT_TOKEN_KEY = '@jwt_token';
const BASE_URL = 'https://yorx-backend.onrender.com';

interface SignupRequest {
  email: string;
  password: string;
  name: string;
  sex: 'male' | 'female';
  birthday: string; // YYYY-MM-DD format
  weight: number;
}

interface LoginRequest {
  email: string;
  password: string;
}



interface AuthResponse {
  token?: string;
  id_token?: string;
  access_token?: string;
  user?: any;
}

// JWT Token Management
export const saveJWTToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(JWT_TOKEN_KEY, token);
    console.log('Token saved to storage, length:', token.length);
  } catch (error) {
    console.error('Error saving JWT token:', error);
    throw error;
  }
};

export const getJWTToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(JWT_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting JWT token:', error);
    return null;
  }
};

export const removeJWTToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(JWT_TOKEN_KEY);
  } catch (error) {
    console.error('Error removing JWT token:', error);
    throw error;
  }
};

export const isLoggedIn = async (): Promise<boolean> => {
  const token = await getJWTToken();
  console.log('Token check - token exists:', !!token);
  return token !== null;
};

// Authentication API calls
export const signup = async (data: SignupRequest): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Signup failed: ${response.status} ${response.statusText}`);
    }

    const signupResponse = await response.json();
    console.log('Signup response:', signupResponse);

    // Check if signup returns a token (auto-login)
    const token = signupResponse.idToken || signupResponse.token || signupResponse.id_token || signupResponse.access_token;
    if (token) {
      console.log('Signup returned token, auto-logging in user');
      await saveJWTToken(token);
      
      // Clear any cached profile data to ensure fresh data for this new user
      await AsyncStorage.removeItem('@profile_cache');
      console.log('Cleared profile cache for new signup');
    }

    return signupResponse;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Login failed: ${response.status} ${response.statusText}`);
    }

    const authResponse = await response.json();
    console.log('Login response:', authResponse);
    
    // Save the JWT token - backend returns 'idToken'
    const token = authResponse.idToken || authResponse.token || authResponse.id_token || authResponse.access_token;
    console.log('Extracted token:', !!token);
    if (token) {
      await saveJWTToken(token);
      console.log('Token saved successfully');
      
      // Clear any cached profile data to ensure fresh data for this user
      await AsyncStorage.removeItem('@profile_cache');
      console.log('Cleared profile cache for fresh login');
    } else {
      console.log('No token found in response');
    }

    return authResponse;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};



export const logout = async (): Promise<void> => {
  try {
    console.log('Logging out and clearing all user data...');
    
    // Clear JWT token
    await removeJWTToken();
    
    // Clear all user-related data
    await AsyncStorage.removeItem('@user_profile');
    await AsyncStorage.removeItem('@workouts');
    await AsyncStorage.removeItem('@profile_cache'); // This is the key one that was missing!
    
    // Clear all workout cache pages
    const allKeys = await AsyncStorage.getAllKeys();
    const workoutCacheKeys = allKeys.filter(key => key.startsWith('@workout_cache'));
    if (workoutCacheKeys.length > 0) {
      await AsyncStorage.multiRemove(workoutCacheKeys);
      console.log('Cleared workout cache keys:', workoutCacheKeys);
    }
    
    console.log('All user data cleared successfully');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Helper function to make authenticated API calls
export const makeAuthenticatedRequest = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getJWTToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  console.log('Making authenticated request to:', url, 'with token length:', token.length);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle token expiration/invalid token
  if (response.status === 401 || response.status === 403) {
    console.log('Token expired or invalid, clearing auth data...');
    await logout(); // This will clear the token and user data
    throw new Error('Authentication failed - token expired');
  }

  return response;
}; 