import { WorkoutSuggestion } from "../types";
import { makeAuthenticatedRequest } from "./auth";
import { saveWorkoutCache, getWorkoutCache, saveProfileCache, getProfileCache } from "./storage";

// --------------------
// Types
// --------------------

interface WorkoutSuggestionResponse {
  workout_id: string;
  parsedWorkout: string;
  goal: string;
  recommendedWeights: { [key: string]: string };
  strategy: string;
}

// --------------------
// Helpers
// --------------------

// Convert image URI to base64 (for sending to backend)
async function imageUriToBase64(imageUri: string): Promise<string> {
  try {
    console.log('Fetching image from URI:', imageUri);
    const response = await fetch(imageUri);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    console.log('Image blob size:', blob.size, 'type:', blob.type);
    
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const base64String = reader.result as string;
          console.log('Full base64 string length:', base64String.length);
          console.log('Base64 string starts with:', base64String.substring(0, 50));
          
          // Extract just the base64 data (after data:image/jpeg;base64,)
          const base64Data = base64String.split(',')[1];
          
          if (!base64Data) {
            throw new Error('Failed to extract base64 data from result');
          }
          
          console.log('Extracted base64 data length:', base64Data.length);
          console.log('Base64 data starts with:', base64Data.substring(0, 20));
          
          // Validate base64
          if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
            throw new Error('Invalid base64 format');
          }
          
          resolve(base64Data);
        } catch (error) {
          console.error('Error processing base64:', error);
          reject(error);
        }
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error in imageUriToBase64:', error);
    throw error;
  }
}

// --------------------
// New API-driven functions
// --------------------

export async function analyzeWorkoutWithPhoto(
  imageUri: string
): Promise<WorkoutSuggestion & { workoutId: string }> {
  try {
    console.log('Converting image to base64...');
    const image_base64 = await imageUriToBase64(imageUri);
    console.log('Base64 conversion complete, length:', image_base64.length);
    
    console.log('Sending request to suggest-scale endpoint...');
    console.log('Sending base64 image data directly as JSON string');
    
    const response = await makeAuthenticatedRequest('https://yorx-backend.onrender.com/suggest-scale', {
      method: 'POST',
      body: JSON.stringify(image_base64),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response body:', errorText);
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }

    const apiResponse: WorkoutSuggestionResponse = await response.json();
    console.log('Successful API response:', apiResponse);
    
    return {
      workout: apiResponse.parsedWorkout,
      goal: apiResponse.goal,
      suggestedWeights: apiResponse.recommendedWeights,
      strategy: apiResponse.strategy,
      workoutId: apiResponse.workout_id, // Store this for later submission
    };
  } catch (error) {
    console.error("Error analyzing workout:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw error;
  }
}

export async function submitWorkoutResult(data: {
  workout_id: string;
  result: string;
  userFeedback: string;
}): Promise<void> {
  try {
    const response = await makeAuthenticatedRequest('https://yorx-backend.onrender.com/submit-result', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error submitting workout result:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw error;
  }
}

export async function getWorkoutHistory(page: number = 1, pageSize: number = 10) {
  try {
    // Check cache first for early pages
    if (page <= 3) {
      const cached = await getWorkoutCache(page);
      if (cached) {
        console.log(`Using cached workouts for page ${page}`);
        return cached;
      }
    }

    const url = `https://yorx-backend.onrender.com/workouts?page=${page}&page_size=${pageSize}`;
    const response = await makeAuthenticatedRequest(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }

    const workouts = await response.json();

    // Cache the first few pages
    if (page <= 3) {
      await saveWorkoutCache(workouts, page);
    }

    return workouts;
  } catch (error) {
    console.error('Error fetching workout history:', error);
    throw error;
  }
}

export async function getUserProfile() {
  try {
    // Check cache first
    const cached = await getProfileCache();
    if (cached) {
      console.log('Using cached profile');
      return cached;
    }

    const response = await makeAuthenticatedRequest('https://yorx-backend.onrender.com/profile', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }

    const profile = await response.json();
    
    // Cache the profile
    await saveProfileCache(profile);

    return profile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

// Legacy function kept for compatibility - now just calls submitWorkoutResult
export async function updateAthleteProfileWithAI(data: {
  user: any,
  workout: {
    parsedWorkout: string,
    recommendedWeights: { [key: string]: string },
    goal: string,
    workoutId?: string
  },
  performance: {
    result: string,
    userFeedback: string
  }
}): Promise<void> {
  console.warn('updateAthleteProfileWithAI is deprecated, use submitWorkoutResult instead');
  
  if (!data.workout.workoutId) {
    throw new Error('workoutId is required for submitting workout results');
  }

  return await submitWorkoutResult({
    workout_id: data.workout.workoutId,
    result: data.performance.result,
    userFeedback: data.performance.userFeedback,
  });
} 