export type MealCategory = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' | 'Supplements';

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
  };
  imageUrl?: string;
  timestamp: number;
  category?: MealCategory;
  isBurn?: boolean;
  isVerified?: boolean;
}

export interface WeightEntry {
  id: string;
  weight: number;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface UserProfile {
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  goal: 'lose' | 'maintain' | 'gain';
  targetRate: number; // kg per week (e.g. 0.5)
  macroPlan: 'balanced' | 'high_protein' | 'low_carb' | 'keto';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  unlockedAt?: number;
  points: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string; // ISO date string without time
}
