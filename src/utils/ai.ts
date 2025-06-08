import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { WorkoutSuggestion } from "../types";

console.log('Initializing Google Generative AI...');
console.log('API Key present:', !!process.env.EXPO_PUBLIC_GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');
console.log('Google Generative AI initialized');

interface AthleteProfile {
  sex: string;
  age: number;
  bodyWeight: number;
  capacities: {
    strength: number;
    power: number;
    muscularEndurance: number;
    aerobicCapacity: number;
    anaerobicCapacity: number;
    gymnasticsSkill: number;
  };
}

const createPrompt = (profile: AthleteProfile) => `
You are a fitness AI assistant helping CrossFit athletes optimize their performance in daily workouts.

Here is the athlete's profile:
- Sex: ${profile.sex}
- Age: ${profile.age}
- Body weight: ${profile.bodyWeight} kg

Athlete's current capacities (scale 1 to 10):
- Strength: ${profile.capacities.strength}
- Power: ${profile.capacities.power}
- Muscular endurance: ${profile.capacities.muscularEndurance}
- Aerobic capacity: ${profile.capacities.aerobicCapacity}
- Anaerobic capacity: ${profile.capacities.anaerobicCapacity}
- Gymnastics skill: ${profile.capacities.gymnasticsSkill}

The image contains a photo of today's workout.

Your task:
1. Analyze the photo and extract the workout. Write it clearly in one line of text (e.g., "3 rounds for time: 400m run, 21 kettlebell swings, 12 pull-ups").
2. Then generate 3 things:

"recommendedWeights": A mapping of each movement to the specific weight the user should use, based on their level and the workout structure.
"goal": A clear performance target — either number of rounds, time to finish, or reps — that this athlete should aim for in this workout.
"strategy": A concise and actionable pacing plan. DO NOT write generic advice like "keep good form" or "breathe consistently." Instead, give specific tactical instructions for this workout. For example:
- "Aim to complete 1 round every 2 minutes."
- "Break 16 thrusters into 8-8, then go unbroken for 12 and 8."
- "If pull-ups are a weakness, use 6-6 or 4-4-4 sets."
- "Keep rest under 10 seconds between sets."

Use your understanding of CrossFit pacing and performance demands. The goal is to guide the athlete with a **clear plan** they can apply mid-workout.

Return the result in this strict format:
{
  "parsedWorkout": "AMRAP 8 min: 16-12-8-4 Thrusters, Pull-ups",
  "recommendedWeights": {
    "thruster": "42.5kg"
  },
  "goal": "Aim for 3+ rounds in 8 minutes",
  "strategy": "Complete each round in 2–2.5 minutes. Break 16 thrusters into 8-8, 12 into 7-5, go unbroken on 8 and 4. Do pull-ups in 6-6 or 4-4-4 depending on grip. Rest max 10s between movements."
}

IMPORTANT: Return ONLY the JSON object itself — no markdown, no formatting, no explanation, no extra text.
`;

export async function analyzeWorkoutWithPhoto(
  imageUri: string,
  profile: AthleteProfile
): Promise<WorkoutSuggestion> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imageResponse = await fetch(imageUri);
    const blob = await imageResponse.blob();

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const imagePart = {
      inlineData: {
        data: base64,
        mimeType: "image/jpeg"
      }
    };

    const result = await model.generateContent([
      imagePart,
      createPrompt(profile)
    ]);

    const geminiResponse = await result.response;
    const text = geminiResponse.text();
    console.log('Raw text content:', text);

    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    const parsedResponse = JSON.parse(cleanedText);

    console.log('Parsed response:', parsedResponse);

    return {
      workout: parsedResponse.parsedWorkout,
      goal: parsedResponse.goal,
      suggestedWeights: parsedResponse.recommendedWeights,
      strategy: parsedResponse.strategy,
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