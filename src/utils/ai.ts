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
🧠 Athlete Capacity Parameters — System Overview
You are a fitness AI assistant helping CrossFit athletes optimize their performance in daily workouts.

The athlete profile uses 6 numeric capacity scores (1–10) to describe physical development:
- Strength: Maximal force production (1–3 reps @ high weight)
- Power: Explosive output and barbell cycling speed
- Muscular Endurance: Fatigue resistance in high-rep sets
- Aerobic Capacity: Cardiovascular endurance over long periods (12+ min)
- Anaerobic Capacity: Explosive effort under fatigue in <10 min WODs
- Gymnastics Skill: Bodyweight control and movement efficiency

**Use these definitions and the following rules for all recommendations and calculations.**

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

**Your task:**
1. Analyze the photo and extract the workout. Write it clearly in one line of text (e.g., "3 rounds for time: 400m run, 21 kettlebell swings, 12 pull-ups").
2. Then generate 3 things, all of which MUST be personalized to the athlete's current capacities, age, sex, and weight, using the above definitions:
   - "recommendedWeights": A mapping of each movement to the specific weight the user should use, based on their level and the workout structure. DO NOT use generic RX weights—use the user's capacities and demographics.
   - "goal": A clear performance target — either number of rounds, time to finish, or reps — that this athlete should realistically aim for in this workout, given their current capacities. DO NOT use generic goals; make it specific to this athlete.
   - "strategy": A concise and actionable pacing plan. DO NOT write generic advice like "keep good form" or "breathe consistently." Instead, give specific tactical instructions for this workout, tailored to the user's strengths and weaknesses.

**IMPORTANT:**  
- All recommendations must be based on the user's current capacities and demographics, using the same logic as the update system.
- Do NOT use generic or default values.
- Make the suggestions realistic and challenging for this specific athlete.

Return the result in this strict format:
{
  "parsedWorkout": "AMRAP 8 min: 16-12-8-4 Thrusters, Pull-ups",
  "recommendedWeights": {
    "thruster": "42.5kg"
  },
  "goal": "Aim for 3+ rounds in 8 minutes",
  "strategy": "Complete each round in 2–2.5 minutes. Break 16 thrusters into 8-8, 12 into 7-5, go unbroken on 8 and 4. Do pull-ups in 6-6 or 4-4-4 depending on grip. Rest max 10s between movements."
}

**MANDATORY:** Return ONLY valid JSON. Do NOT include any markdown, explanation, or extra text. The response must be a single JSON object and nothing else.
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

export const createUpdatePrompt = (data: {
  user: AthleteProfile,
  workout: {
    parsedWorkout: string,
    recommendedWeights: { [key: string]: string },
    goal: string
  },
  performance: {
    result: string,
    userFeedback: string
  }
}) => `
🧠 Athlete Capacity Parameters — Update Logic
You are helping maintain an athlete profile in the form of 6 numeric capacity scores (1–10). These describe the athlete's physical development and should be updated after each CrossFit-style workout.

Each parameter reflects a specific quality and is updated only if taxed during the workout.

🧩 Input You'll Receive:
{
  user: {
    sex: "male" | "female",
    age: number,
    bodyWeight: number,
    capacities: {
      strength: number,
      power: number,
      muscularEndurance: number,
      aerobicCapacity: number,
      anaerobicCapacity: number,
      gymnasticsSkill: number
    }
  },
  workout: {
    parsedWorkout: string,
    recommendedWeights: { [key: string]: string },
    goal: string
  },
  performance: {
    result: string,
    userFeedback: string
  }
}

🧠 Update Rules for Each Parameter
1. strength
Represents maximal force production (1–3 reps @ high weight)
Update if:
- Workout includes heavy barbell movements (thrusters, deadlifts, squats)
- Weights are ≥ 70% of bodyweight
- Reps per set ≤ 8
Boost if:
- User moved such weight repeatedly and met or exceeded the goal
Example: Thrusters @ 42.5kg with clean movement under fatigue → +0.2 to strength

2. power
Explosive output and barbell cycling speed
Update if:
- Workout involves dynamic Olympic lifts, fast transitions, or KB swings
- Reps are mid-volume (5–15) with moderate weight
- Movements done at high tempo with minimal rest
Boost if:
- User completes fast rounds with controlled explosiveness (e.g. unbroken thrusters)

3. muscularEndurance
Fatigue resistance in high-rep sets
Update if:
- Workout includes >10 reps per set of moderate load
- Repeated bodyweight or barbell reps without full rest
- Muscle fatigue described in feedback
Boost if:
- User completed multiple big sets (e.g. 16, 12 thrusters or pull-ups)
- Strategy worked as intended with minimal breakdown

4. aerobicCapacity
Cardiovascular endurance over long periods (12+ minutes)
Update if:
- Workout lasts ≥12 minutes or includes sustained pacing (e.g. running, rowing, AMRAP 20)
- User maintained stable effort
No change if:
- Short workout (under 8 min) or sprint-heavy WOD

5. anaerobicCapacity
Explosive effort under fatigue in <10 min WODs
Update if:
- Short high-output workouts (e.g. Fran, 8-min AMRAPs)
- High heart rate sustained
- Little rest between explosive movements
Boost if:
- User held pace close to time cap with controlled breathing

6. gymnasticsSkill
Bodyweight control and movement efficiency
Update if:
- Workout includes pull-ups, HSPU, TTB, dips, muscle-ups
- Strategy uses scaling or grip changes
- User improves unbroken reps or breaks effectively
Boost if:
- Pull-ups executed in sets (e.g. 6-6 or unbroken)

🔄 Performance-Based Adjustment
Compared to goal	Result	Effect on trained qualities
Significantly above	Exceeded	+0.2 to +0.3
Met exactly	On target	+0.1 to +0.2
Slightly below	Underperformed	0 or −0.1
Far below	Poor result	−0.2 to most taxed metrics

Cap all values to 1 decimal. No parameter can exceed 10 or fall below 1.

✅ Final Output Format
Only return updated capacities:
{
  "strength": 6.7,
  "power": 6.1,
  "muscularEndurance": 5.8,
  "aerobicCapacity": 5.0,
  "anaerobicCapacity": 6.7,
  "gymnasticsSkill": 5.7
}

**MANDATORY:** Return ONLY valid JSON. Do NOT include any markdown, explanation, or extra text. The response must be a single JSON object and nothing else.
`;

export async function updateAthleteProfileWithAI(data: {
  user: AthleteProfile,
  workout: {
    parsedWorkout: string,
    recommendedWeights: { [key: string]: string },
    goal: string
  },
  performance: {
    result: string,
    userFeedback: string
  }
}): Promise<Partial<AthleteProfile['capacities']>> {
  const prompt = createUpdatePrompt(data);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent([prompt]);
  const geminiResponse = await result.response;
  const text = geminiResponse.text();

  // Sanitize: extract the first valid JSON object from the response
  const jsonMatch = text.match(/{[\s\S]*}/);
  if (!jsonMatch) {
    throw new Error("AI did not return valid JSON: " + text);
  }
  const cleanedText = jsonMatch[0];

  return JSON.parse(cleanedText);
} 