export interface UserProfile {
  name: string;
  email: string;
  sex: 'male' | 'female';
  age: number;
  weight: number;
  birthday?: string; // For onboarding
  capacities?: {
    strength: number;
    power: number;
    muscularEndurance: number;
    aerobicCapacity: number;
    anaerobicCapacity: number;
    gymnasticsSkill: number;
  };
}

// Authentication related types
export interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  sex: 'male' | 'female';
  birthday: string; // YYYY-MM-DD format
  weight: number;
}

export interface LoginData {
  email: string;
  password: string;
}



export interface Workout {
  id: string;
  date: string;
  description: string;
  weights: {
    [key: string]: string;
  };
  result: string;
  goal?: string;
  strategy?: string;
  userFeedback?: string;
}

export interface WorkoutSuggestion {
  workout: string;
  goal: string;
  suggestedWeights: {
    [key: string]: string;
  };
  strategy: string;
  workoutId?: string; // Optional for backward compatibility
} 