import { FoodItem } from '../types';

const MOCK_FOODS = [
  {
    name: "Grilled Salmon Salad",
    calories: 450,
    macros: { protein: 35, carbs: 12, fat: 28, fiber: 5, sugar: 4 },
  },
  {
    name: "Avocado Toast with Egg",
    calories: 320,
    macros: { protein: 14, carbs: 30, fat: 16, fiber: 8, sugar: 2 },
  },
  {
    name: "Double Cheeseburger",
    calories: 850,
    macros: { protein: 40, carbs: 55, fat: 50, fiber: 2, sugar: 10 },
  },
  {
    name: "Berry Smoothie Bowl",
    calories: 280,
    macros: { protein: 8, carbs: 45, fat: 5, fiber: 10, sugar: 25 },
  },
  {
    name: "Chicken Teriyaki & Rice",
    calories: 600,
    macros: { protein: 45, carbs: 80, fat: 12, fiber: 3, sugar: 15 },
  }
];

export const analyzeImage = async (imageUrl: string): Promise<FoodItem> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Pick a random food item to simulate AI recognition
  const randomFood = MOCK_FOODS[Math.floor(Math.random() * MOCK_FOODS.length)];

  return {
    id: Math.random().toString(36).substr(2, 9),
    name: randomFood.name,
    calories: randomFood.calories,
    macros: randomFood.macros,
    imageUrl,
    timestamp: Date.now(),
    isVerified: true,
  };
};
