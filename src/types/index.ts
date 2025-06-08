export interface UserProfile {
  name: string;
  email: string;
  sex: 'male' | 'female';
  age: number;
  weight: number;
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
} 