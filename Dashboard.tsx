import { useState, useEffect } from 'react';
import { FoodItem } from '../types';
import { Target, HeartPulse, Droplets, Plus, Minus, BrainCircuit, Timer, Play, Square, Loader2, BadgeCheck } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateMealSuggestionWithGemini } from '../api/geminiAi';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DashboardProps {
  history: FoodItem[];
  dailyGoals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  waterGlasses: number;
  onUpdateWater: (water: number) => void;
  currentStreak?: number;
  onDeleteFood: (id: string) => void;
}

import { Trash2 } from 'lucide-react';
export function Dashboard({ history, dailyGoals, waterGlasses, onUpdateWater, currentStreak = 0, onDeleteFood }: DashboardProps) {
  const [fastingStartTime, setFastingStartTime] = useState<number | null>(null);
  const [fastingElapsed, setFastingElapsed] = useState(0);
  const [suggestion, setSuggestion] = useState<{ title: string; description: string; ingredients: string[] } | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [aiError, setAiError] = useState('');

  const totals = history.reduce(
    (acc, curr) => ({
      calories: acc.calories + curr.calories,
      protein: acc.protein + curr.macros.protein,
      carbs: acc.carbs + curr.macros.carbs,
      fat: acc.fat + curr.macros.fat,
      fiber: acc.fiber + (curr.macros.fiber || 0),
      sugar: acc.sugar + (curr.macros.sugar || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 }
  );

  const calcPercentage = (current: number, goal: number) => {
    return Math.min(100, Math.round((current / goal) * 100));
  };

  useEffect(() => {
    const savedFastingStart = localStorage.getItem('diet_app_fasting_start');
    if (savedFastingStart) {
      setFastingStartTime(Number(savedFastingStart));
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (fastingStartTime) {
      interval = setInterval(() => {
        setFastingElapsed(Date.now() - fastingStartTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [fastingStartTime]);

  const toggleFasting = () => {
    if (fastingStartTime) {
      setFastingStartTime(null);
      localStorage.removeItem('diet_app_fasting_start');
      setFastingElapsed(0);
    } else {
      const now = Date.now();
      setFastingStartTime(now);
      localStorage.setItem('diet_app_fasting_start', now.toString());
    }
  };

  const getAiSuggestion = async () => {
    const apiKey = localStorage.getItem('diet_app_gemini_key');
    if (!apiKey) {
      setAiError('Please add your Gemini API Key in Settings to use the AI Coach.');
      return;
    }
    setAiError('');
    setLoadingSuggestion(true);
    try {
      const remainingCals = Math.max(0, dailyGoals.calories - totals.calories);
      const remainingP = Math.max(0, dailyGoals.protein - totals.protein);
      const remainingC = Math.max(0, dailyGoals.carbs - totals.carbs);
      const remainingF = Math.max(0, dailyGoals.fat - totals.fat);
      
      const result = await generateMealSuggestionWithGemini(remainingCals, remainingP, remainingC, remainingF, apiKey);
      setSuggestion(result);
    } catch (err) {
      setAiError('Failed to get suggestion. Try again.');
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const formatFastingTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto p-6 space-y-6 overflow-y-auto pb-24">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Today</h1>
          <p className="text-gray-500 font-medium mt-1">Your daily overview</p>
        </div>
        <div className="flex items-center gap-3">
          {currentStreak > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full border border-orange-100 shadow-sm overflow-visible">
              <span 
                className="leading-none transition-all duration-500 origin-bottom" 
                style={{ 
                  transform: `scale(${Math.min(2.5, 1 + (currentStreak * 0.1))})`, 
                  filter: `drop-shadow(0 ${Math.min(10, currentStreak)}px ${Math.min(15, currentStreak * 2)}px rgba(239, 68, 68, ${Math.min(0.8, currentStreak * 0.05)}))` 
                }}
              >
                🔥
              </span>
              <span className="font-extrabold text-orange-600 text-lg">{currentStreak}</span>
            </div>
          )}
          <div className="bg-emerald-100 p-3 rounded-full shadow-sm">
            <Target className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Main Calories Card */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 bg-emerald-500 h-full"></div>
        <div className="flex justify-between items-end mb-4 ml-4">
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Calories Consumed</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-gray-900">{totals.calories}</span>
              <span className="text-lg font-medium text-gray-500">/ {dailyGoals.calories} kcal</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-4 mt-6 ml-4 relative overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-out",
              totals.calories > dailyGoals.calories ? "bg-indigo-500" : "bg-emerald-500"
            )}
            style={{ width: `${calcPercentage(totals.calories, dailyGoals.calories)}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2 ml-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            {totals.calories > dailyGoals.calories ? "Adherence Neutral" : "On Track"}
          </p>
          <p className="text-right text-sm font-medium">
            {totals.calories > dailyGoals.calories ? (
              <span className="text-indigo-600">{totals.calories - dailyGoals.calories} kcal over target</span>
            ) : (
              <span className="text-gray-500">{dailyGoals.calories - totals.calories} kcal remaining</span>
            )}
          </p>
        </div>
      </div>

      {/* Macros Grid */}
      <h3 className="text-xl font-bold text-gray-800 pt-4">Macros Breakdown</h3>
      <div className="grid grid-cols-3 gap-4">
        <MacroCard
          title="Protein"
          current={totals.protein}
          goal={dailyGoals.protein}
          color="bg-blue-500"
          lightColor="bg-blue-100"
          textColor="text-blue-600"
          unit="g"
        />
        <MacroCard
          title="Carbs"
          current={totals.carbs}
          goal={dailyGoals.carbs}
          color="bg-amber-500"
          lightColor="bg-amber-100"
          textColor="text-amber-600"
          unit="g"
        />
        <MacroCard
          title="Fat"
          current={totals.fat}
          goal={dailyGoals.fat}
          color="bg-purple-500"
          lightColor="bg-purple-100"
          textColor="text-purple-600"
          unit="g"
        />
      </div>

      <h3 className="text-xl font-bold text-gray-800 pt-4">Micronutrients</h3>
      <div className="grid grid-cols-2 gap-4">
        <MacroCard
          title="Fiber"
          current={totals.fiber}
          goal={30} // default goal
          color="bg-emerald-500"
          lightColor="bg-emerald-100"
          textColor="text-emerald-600"
          unit="g"
        />
        <MacroCard
          title="Sugar"
          current={totals.sugar}
          goal={50} // default max
          color="bg-pink-500"
          lightColor="bg-pink-100"
          textColor="text-pink-600"
          unit="g"
        />
      </div>

      {/* Intermittent Fasting Tracker */}
      <div className="pt-4">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-5 border border-indigo-100 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
              <Timer className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Fasting Timer</h3>
              <p className={cn("text-sm font-medium", fastingStartTime ? "text-indigo-600" : "text-gray-500")}>
                {fastingStartTime ? formatFastingTime(fastingElapsed) : "Not fasting"}
              </p>
            </div>
          </div>
          <button 
            onClick={toggleFasting}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm",
              fastingStartTime 
                ? "bg-white border-2 border-indigo-100 text-indigo-500 hover:bg-indigo-50" 
                : "bg-indigo-500 text-white hover:bg-indigo-600 shadow-indigo-500/30"
            )}
          >
            {fastingStartTime ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          </button>
        </div>
      </div>

      {/* AI Nutrition Coach */}
      <div className="pt-4">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-5 border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BrainCircuit className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-800 text-lg">AI Coach</h3>
            </div>
            
            {!suggestion && !loadingSuggestion ? (
              <div className="bg-white/60 rounded-2xl p-4 backdrop-blur-sm border border-emerald-50">
                <p className="text-sm text-gray-600 font-medium mb-4">
                  Not sure what to eat? Ask the AI Coach for a meal suggestion that perfectly matches your remaining calories and macros.
                </p>
                <button 
                  onClick={getAiSuggestion}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-emerald-500/30 flex justify-center items-center gap-2"
                >
                  <BrainCircuit className="w-5 h-5" />
                  Suggest a Meal
                </button>
                {aiError && <p className="text-xs text-red-500 mt-2 font-medium text-center">{aiError}</p>}
              </div>
            ) : loadingSuggestion ? (
              <div className="bg-white/60 rounded-2xl p-8 backdrop-blur-sm border border-emerald-50 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
                <p className="text-sm font-bold text-gray-600">Crafting the perfect meal...</p>
              </div>
            ) : suggestion && (
              <div className="bg-white/80 rounded-2xl p-5 backdrop-blur-sm border border-emerald-100 shadow-sm">
                <h4 className="font-extrabold text-gray-900 text-lg leading-tight mb-2">{suggestion.title}</h4>
                <p className="text-sm text-gray-600 font-medium mb-4 leading-relaxed">{suggestion.description}</p>
                
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ingredients</h5>
                <ul className="space-y-1.5 mb-4">
                  {suggestion.ingredients.map((ing, i) => (
                    <li key={i} className="text-sm font-medium text-gray-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      {ing}
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={() => setSuggestion(null)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2.5 rounded-xl transition-colors text-sm"
                >
                  Get Another Suggestion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Water Tracker */}
      <div className="pt-4">
        <div className="bg-cyan-50 rounded-3xl p-5 border border-cyan-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-cyan-100 p-3 rounded-2xl text-cyan-500">
              <Droplets className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Water Intake</h3>
              <p className="text-sm font-medium text-cyan-600">{waterGlasses} / 8 glasses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onUpdateWater(Math.max(0, waterGlasses - 1))}
              className="w-10 h-10 bg-white border border-cyan-100 rounded-xl flex items-center justify-center text-cyan-600 hover:bg-cyan-50 transition-colors shadow-sm"
            >
              <Minus className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onUpdateWater(waterGlasses + 1)}
              className="w-10 h-10 bg-cyan-500 text-white rounded-xl flex items-center justify-center hover:bg-cyan-600 transition-colors shadow-sm shadow-cyan-500/30"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Today's Log */}
      <div className="pt-6 pb-20">
        <h3 className="text-2xl font-black text-gray-800 mb-6">Today's Log</h3>
        
        {history.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <HeartPulse className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No meals or activities logged yet today.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {(['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Supplements'] as const).map(category => {
              const categoryItems = history.filter(item => item.category === category && !item.isBurn);
              if (categoryItems.length === 0) return null;
              
              const catCalories = categoryItems.reduce((acc, curr) => acc + curr.calories, 0);
              
              return (
                <div key={category} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-lg text-gray-800">{category}</h4>
                    <span className="text-sm font-bold text-emerald-600">{catCalories} kcal</span>
                  </div>
                  <div className="space-y-3">
                    {categoryItems.map(item => (
                      <div key={item.id} className="group flex items-center bg-gray-50 p-3 rounded-2xl relative overflow-hidden">
                        <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover z-10" />
                        <div className="ml-3 flex-1 z-10">
                          <h5 className="font-semibold text-gray-900 text-sm flex items-center gap-1 line-clamp-1 pr-2">
                            {item.name}
                            {item.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                          </h5>
                          <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="text-right z-10 mr-8 transition-transform group-hover:-translate-x-2">
                          <span className="font-bold text-gray-700 text-sm">{item.calories}</span>
                          <span className="text-[10px] text-gray-400 block -mt-1">kcal</span>
                        </div>
                        <button 
                          onClick={() => onDeleteFood(item.id)}
                          className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-500 hover:bg-red-50 rounded-lg z-20"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Activities Section */}
            {history.filter(item => item.isBurn).length > 0 && (
              <div className="bg-orange-50 rounded-3xl p-5 shadow-sm border border-orange-100">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-lg text-orange-800">Activities</h4>
                  <span className="text-sm font-bold text-orange-600">
                    {Math.abs(history.filter(item => item.isBurn).reduce((acc, curr) => acc + curr.calories, 0))} kcal burned
                  </span>
                </div>
                <div className="space-y-3">
                  {history.filter(item => item.isBurn).map(item => (
                    <div key={item.id} className="group flex items-center bg-white/60 p-3 rounded-2xl relative overflow-hidden">
                      <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 z-10">
                        <HeartPulse className="w-6 h-6" />
                      </div>
                      <div className="ml-3 flex-1 z-10">
                        <h5 className="font-semibold text-gray-900 text-sm line-clamp-1 pr-2">{item.name.replace('Activity: ', '')}</h5>
                        <p className="text-xs text-orange-600/70">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="text-right z-10 mr-8 transition-transform group-hover:-translate-x-2">
                        <span className="font-bold text-orange-600 text-sm">{Math.abs(item.calories)}</span>
                        <span className="text-[10px] text-orange-400 block -mt-1">kcal</span>
                      </div>
                      <button 
                        onClick={() => onDeleteFood(item.id)}
                        className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-500 hover:bg-red-50 rounded-lg z-20"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Uncategorized Fallback (for older data) */}
            {history.filter(item => !item.category && !item.isBurn).length > 0 && (
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-lg text-gray-800">Other Logs</h4>
                </div>
                <div className="space-y-3">
                  {history.filter(item => !item.category && !item.isBurn).map(item => (
                    <div key={item.id} className="group flex items-center bg-gray-50 p-3 rounded-2xl relative overflow-hidden">
                      <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover z-10" />
                      <div className="ml-3 flex-1 z-10">
                        <h5 className="font-semibold text-gray-900 text-sm flex items-center gap-1 line-clamp-1 pr-2">
                          {item.name}
                          {item.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                        </h5>
                      </div>
                      <div className="text-right z-10 mr-8 transition-transform group-hover:-translate-x-2">
                        <span className="font-bold text-gray-700 text-sm">{item.calories}</span>
                        <span className="text-[10px] text-gray-400 block -mt-1">kcal</span>
                      </div>
                      <button 
                        onClick={() => onDeleteFood(item.id)}
                        className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-500 hover:bg-red-50 rounded-lg z-20"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MacroCard({ title, current, goal, color, lightColor, textColor, unit }: any) {
  const percentage = Math.min(100, Math.round((current / goal) * 100));

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
      <div className={cn("absolute top-0 w-full h-1", color)} />
      
      {/* Circular Progress (simplified with CSS) */}
      <div className="relative w-16 h-16 flex items-center justify-center mb-3">
        <svg className="w-16 h-16 transform -rotate-90">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className={lightColor} />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 28}
            strokeDashoffset={2 * Math.PI * 28 * (1 - percentage / 100)}
            className={cn("transition-all duration-1000 ease-out", textColor)}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-gray-800">{current}</span>
        </div>
      </div>
      
      <p className="text-sm font-semibold text-gray-600 mb-0.5">{title}</p>
      <p className="text-xs text-gray-400 font-medium">/ {goal}{unit}</p>
    </div>
  );
}
