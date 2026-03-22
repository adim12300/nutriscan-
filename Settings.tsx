import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Calculator } from 'lucide-react';
import { UserProfile } from '../types';

interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface SettingsProps {
  goals: DailyGoals;
  profile: UserProfile;
  onSave: (goals: DailyGoals, profile: UserProfile) => void;
}

export function Settings({ goals, profile, onSave }: SettingsProps) {
  const [formData, setFormData] = useState(goals);
  const [profileData, setProfileData] = useState<UserProfile>(profile);
  const [activeTab, setActiveTab] = useState<'goals' | 'profile' | 'ai'>('goals');
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');

  const saveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    alert('API Key Saved Successfully!');
  };

  const calculateGoals = () => {
    // Basic Mifflin-St Jeor Equation
    let bmr = 10 * profileData.weight + 6.25 * profileData.height - 5 * profileData.age;
    bmr += profileData.gender === 'male' ? 5 : -161;

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    
    let tdee = bmr * activityMultipliers[profileData.activityLevel];

    // Adjust for goal
    // 1 kg of fat is roughly 7700 calories. So 0.5kg/week = 3850 cal/week = 550 cal/day deficit/surplus
    const targetRate = parseFloat(profileData.targetRate as any) || 0;
    const dailyAdjustment = (targetRate * 7700) / 7;

    if (profileData.goal === 'lose') tdee -= dailyAdjustment;
    if (profileData.goal === 'gain') tdee += dailyAdjustment;

    const calories = Math.round(tdee);
    
    // Macro Plans
    let pRatio = 0.3, cRatio = 0.4, fRatio = 0.3;
    switch (profileData.macroPlan) {
      case 'high_protein':
        pRatio = 0.4; cRatio = 0.3; fRatio = 0.3;
        break;
      case 'low_carb':
        pRatio = 0.35; cRatio = 0.25; fRatio = 0.4;
        break;
      case 'keto':
        pRatio = 0.2; cRatio = 0.05; fRatio = 0.75;
        break;
      default: // balanced
        pRatio = 0.3; cRatio = 0.4; fRatio = 0.3;
    }

    const protein = Math.round((calories * pRatio) / 4);
    const carbs = Math.round((calories * cRatio) / 4);
    const fat = Math.round((calories * fRatio) / 9);

    setFormData({ calories, protein, carbs, fat });
    setActiveTab('goals');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseInt(value) || 0,
    }));
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: ['weight', 'height', 'age'].includes(name) ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, profileData);
  };

  return (
    <div className="p-6 h-full overflow-y-auto pb-32 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gray-100 p-3 rounded-2xl">
          <SettingsIcon className="w-8 h-8 text-gray-700" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900">Settings</h2>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'goals' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Goals
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'ai' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          AI Config
        </button>
      </div>

      {activeTab === 'goals' && (
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            Daily Goals
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Target Calories (kcal)</label>
              <input
                type="number"
                name="calories"
                value={formData.calories}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                min="500"
                max="10000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Protein Goal (g)</label>
              <input
                type="number"
                name="protein"
                value={formData.protein}
                onChange={handleChange}
                className="w-full bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                min="0"
                max="500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Carbs Goal (g)</label>
              <input
                type="number"
                name="carbs"
                value={formData.carbs}
                onChange={handleChange}
                className="w-full bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                min="0"
                max="1000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Fat Goal (g)</label>
              <input
                type="number"
                name="fat"
                value={formData.fat}
                onChange={handleChange}
                className="w-full bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                min="0"
                max="500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl py-4 transition-all shadow-lg shadow-emerald-500/30 active:scale-[0.98]"
        >
          <Save className="w-5 h-5" />
          Save Goals
        </button>
      </form>
      )}
      
      {activeTab === 'profile' && (
      <div className="space-y-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Body Profile</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Weight (kg)</label>
            <input type="number" name="weight" value={profileData.weight} onChange={handleProfileChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Height (cm)</label>
            <input type="number" name="height" value={profileData.height} onChange={handleProfileChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Age</label>
            <input type="number" name="age" value={profileData.age} onChange={handleProfileChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Gender</label>
            <select name="gender" value={profileData.gender} onChange={handleProfileChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mt-6 mb-4">Lifestyle & Goal</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Activity Level</label>
            <select name="activityLevel" value={profileData.activityLevel} onChange={handleProfileChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="sedentary">Sedentary (Office job)</option>
              <option value="light">Lightly Active</option>
              <option value="moderate">Moderately Active</option>
              <option value="active">Active</option>
              <option value="very_active">Very Active</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Goal</label>
            <select name="goal" value={profileData.goal} onChange={handleProfileChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="lose">Lose Weight</option>
              <option value="maintain">Maintain Weight</option>
              <option value="gain">Build Muscle / Gain</option>
            </select>
          </div>
          
          {(profileData.goal === 'lose' || profileData.goal === 'gain') && (
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Target Rate (kg/week)</label>
              <select name="targetRate" value={profileData.targetRate || 0} onChange={handleProfileChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none">
                <option value="0.25">0.25 kg / week</option>
                <option value="0.5">0.5 kg / week</option>
                <option value="0.75">0.75 kg / week</option>
                <option value="1">1.0 kg / week</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Macro Program</label>
            <select name="macroPlan" value={profileData.macroPlan || 'balanced'} onChange={handleProfileChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="balanced">Balanced (30P / 40C / 30F)</option>
              <option value="high_protein">High Protein (40P / 30C / 30F)</option>
              <option value="low_carb">Low Carb (35P / 25C / 40F)</option>
              <option value="keto">Keto (20P / 5C / 75F)</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={calculateGoals}
          className="w-full mt-6 flex items-center justify-center gap-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold rounded-xl py-4 transition-all"
        >
          <Calculator className="w-5 h-5" />
          Calculate My Goals
        </button>
      </div>
      )}

      {activeTab === 'ai' && (
      <div className="space-y-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Gemini AI Configuration</h3>
        <p className="text-sm text-gray-500 mb-6">
          To use the real AI camera scanner, enter your free Google Gemini API Key.
        </p>
        
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
        </div>

        <button
          onClick={saveApiKey}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl py-4 transition-all shadow-lg shadow-emerald-500/30 active:scale-[0.98]"
        >
          <Save className="w-5 h-5" />
          Save API Key
        </button>
      </div>
      )}
    </div>
  );
}
