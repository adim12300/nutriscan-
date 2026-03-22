import { useState, useEffect } from 'react';
import { Achievement, StreakData } from '../types';

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_login', title: 'First Step', description: 'Logged in for the first time.', icon: '🎯', isUnlocked: false, points: 10 },
  { id: 'streak_3', title: 'On a Roll', description: 'Reached a 3-day login streak.', icon: '🔥', isUnlocked: false, points: 20 },
  { id: 'streak_7', title: 'Weekly Warrior', description: 'Reached a 7-day login streak.', icon: '🏆', isUnlocked: false, points: 50 },
  { id: 'streak_14', title: 'Fortnight Fanatic', description: 'Reached a 14-day login streak.', icon: '📅', isUnlocked: false, points: 100 },
  { id: 'streak_30', title: 'Monthly Master', description: 'Reached a 30-day login streak.', icon: '👑', isUnlocked: false, points: 250 },
  { id: 'first_meal', title: 'Foodie', description: 'Logged your first meal.', icon: '🍔', isUnlocked: false, points: 15 },
  { id: 'meals_10', title: 'Nutrition Master', description: 'Logged 10 meals.', icon: '🥗', isUnlocked: false, points: 40 },
  { id: 'meals_50', title: 'Dietary Devotee', description: 'Logged 50 meals.', icon: '🍱', isUnlocked: false, points: 100 },
  { id: 'meals_100', title: 'Culinary Connoisseur', description: 'Logged 100 meals.', icon: '👨‍🍳', isUnlocked: false, points: 250 },
  { id: 'water_5', title: 'Hydrated', description: 'Drank 5 glasses of water in a single day.', icon: '💧', isUnlocked: false, points: 10 },
  { id: 'water_8', title: 'Hydro Homie', description: 'Drank 8 glasses of water in a single day.', icon: '🌊', isUnlocked: false, points: 25 },
  { id: 'water_20', title: 'Aquaman', description: 'Drank 8 glasses 5 days in a row.', icon: '🔱', isUnlocked: false, points: 150 },
  { id: 'gemini_unlocked', title: 'AI Powered', description: 'Added a Gemini API Key.', icon: '🧠', isUnlocked: false, points: 50 },
  { id: 'profile_complete', title: 'Fully Geared', description: 'Set your advanced body profile.', icon: '⚙️', isUnlocked: false, points: 30 },
  { id: 'goal_met', title: 'Perfect Day', description: 'Met your exact calorie goal.', icon: '🎯', isUnlocked: false, points: 50 },
];

export function useAchievements() {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastLoginDate: '',
  });

  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [showNotification, setShowNotification] = useState<Achievement | null>(null);

  // Initialize and check streak on mount
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Load from local storage
    const savedStreak = localStorage.getItem('diet_app_streak');
    let currentStreakData = { ...streakData };
    
    if (savedStreak) {
      currentStreakData = JSON.parse(savedStreak);
      const lastLogin = currentStreakData.lastLoginDate;
      
      if (lastLogin !== todayStr) {
        const lastLoginDate = new Date(lastLogin);
        const today = new Date(todayStr);
        const diffTime = Math.abs(today.getTime() - lastLoginDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Logged in yesterday
          currentStreakData.currentStreak += 1;
          currentStreakData.longestStreak = Math.max(currentStreakData.currentStreak, currentStreakData.longestStreak);
        } else if (diffDays > 1) {
          // Missed a day
          currentStreakData.currentStreak = 1;
        }
        currentStreakData.lastLoginDate = todayStr;
      }
    } else {
      // First time login
      currentStreakData = {
        currentStreak: 1,
        longestStreak: 1,
        lastLoginDate: todayStr,
      };
    }
    
    setStreakData(currentStreakData);
    localStorage.setItem('diet_app_streak', JSON.stringify(currentStreakData));

    // Load achievements
    const savedAchievements = localStorage.getItem('diet_app_achievements');
    let currentAchievements = DEFAULT_ACHIEVEMENTS;
    if (savedAchievements) {
      const parsed = JSON.parse(savedAchievements);
      // Merge saved with default to handle new achievements
      currentAchievements = DEFAULT_ACHIEVEMENTS.map(def => {
        const found = parsed.find((p: Achievement) => p.id === def.id);
        return found || def;
      });
    }
    setAchievements(currentAchievements);
    localStorage.setItem('diet_app_achievements', JSON.stringify(currentAchievements));
  }, []);

  // Generic function to unlock an achievement
  const unlockAchievement = (id: string) => {
    setAchievements(prev => {
      let unlocked = false;
      const updated = prev.map(ach => {
        if (ach.id === id && !ach.isUnlocked) {
          unlocked = true;
          const updatedAch = { ...ach, isUnlocked: true, unlockedAt: Date.now() };
          setShowNotification(updatedAch);
          return updatedAch;
        }
        return ach;
      });
      
      if (unlocked) {
        localStorage.setItem('diet_app_achievements', JSON.stringify(updated));
      }
      return updated;
    });
  };

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  // Check conditions whenever relevant data changes
  const checkAchievements = (data: { mealsCount?: number, waterCount?: number, hasApiKey?: boolean, profileComplete?: boolean, goalMet?: boolean }) => {
    // First login
    unlockAchievement('first_login');

    // Streaks
    if (streakData.currentStreak >= 3) unlockAchievement('streak_3');
    if (streakData.currentStreak >= 7) unlockAchievement('streak_7');
    if (streakData.currentStreak >= 14) unlockAchievement('streak_14');
    if (streakData.currentStreak >= 30) unlockAchievement('streak_30');

    // Meals
    if (data.mealsCount !== undefined) {
      if (data.mealsCount >= 1) unlockAchievement('first_meal');
      if (data.mealsCount >= 10) unlockAchievement('meals_10');
      if (data.mealsCount >= 50) unlockAchievement('meals_50');
      if (data.mealsCount >= 100) unlockAchievement('meals_100');
    }

    // Water
    if (data.waterCount !== undefined) {
      if (data.waterCount >= 5) unlockAchievement('water_5');
      if (data.waterCount >= 8) unlockAchievement('water_8');
      // simplified proxy for water_20 due to stateless check
      if (data.waterCount >= 20) unlockAchievement('water_20'); 
    }

    // AI
    if (data.hasApiKey) unlockAchievement('gemini_unlocked');

    // Profile
    if (data.profileComplete) unlockAchievement('profile_complete');

    // Goals
    if (data.goalMet) unlockAchievement('goal_met');
  };

  return {
    streakData,
    achievements,
    checkAchievements,
    showNotification,
    clearNotification: () => setShowNotification(null)
  };
}
