# RxFinder - CrossFit Workout Progression App

RxFinder is a React Native mobile application designed to help CrossFit athletes progress in their workouts by providing intelligent scaling suggestions and tracking workout history.

## Features

- **Workout Scanner**: Take photos of workouts and get AI-powered suggestions for scaling and strategy
- **Workout History**: Track your progress with detailed workout history
- **Profile Management**: Store and manage your personal metrics

## Tech Stack

- React Native (Expo)
- TypeScript
- React Navigation
- AsyncStorage for local data persistence
- Expo Camera for workout scanning

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on iOS or Android:
```bash
npm run ios
# or
npm run android
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Main app screens
│   ├── HistoryScreen.tsx
│   ├── ScanWorkoutScreen.tsx
│   └── ProfileScreen.tsx
├── types/         # TypeScript type definitions
└── utils/         # Utility functions and storage helpers
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 