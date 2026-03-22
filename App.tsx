import { useState, useEffect } from 'react';
import { Home, Camera, History, Utensils, Settings as SettingsIcon, Trophy, BadgeCheck, Trash2 } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Scanner } from './components/Scanner';
import { Settings } from './components/Settings';
import { Achievements } from './components/Achievements';
import { FoodItem, UserProfile } from './types';
import { cn } from './utils';
import { useAchievements } from './hooks/useAchievements';

// Default mock goals
const DEFAULT_GOALS = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65,
};

const DEFAULT_PROFILE: UserProfile = {
  weight: 70,
  height: 175,
  age: 30,
  gender: 'male',
  goal: 'maintain',
  targetRate: 0,
  macroPlan: 'balanced',
  activityLevel: 'moderate'
};

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scanner' | 'history' | 'settings' | 'awards'>('dashboard');
  const [history, setHistory] = useState<FoodItem[]>([]);
  const [scannedItem, setScannedItem] = useState<FoodItem | null>(null);
  const { streakData, achievements, checkAchievements, showNotification, clearNotification } = useAchievements();
  const [dailyGoals, setDailyGoals] = useState(DEFAULT_GOALS);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [waterGlasses, setWaterGlasses] = useState(0);

  // Load from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('diet_app_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }

    const savedGoals = localStorage.getItem('diet_app_goals');
    if (savedGoals) {
      try {
        setDailyGoals(JSON.parse(savedGoals));
      } catch (e) {
        console.error("Failed to parse goals");
      }
    }
  }, []);

  // Save to local storage when history changes
  useEffect(() => {
    localStorage.setItem('diet_app_history', JSON.stringify(history));
    checkAchievements({ mealsCount: history.length });
  }, [history]);

  // Load profile and water from local storage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('diet_app_profile');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Failed to parse profile");
      }
    }
    
    // Check if water is from today
    const savedWaterData = localStorage.getItem('diet_app_water');
    if (savedWaterData) {
      try {
        const parsed = JSON.parse(savedWaterData);
        if (new Date(parsed.date).toDateString() === new Date().toDateString()) {
          setWaterGlasses(parsed.amount);
        }
      } catch (e) {
        console.error("Failed to parse water");
      }
    }

    const apiKey = localStorage.getItem('diet_app_gemini_key');
    if (apiKey) {
      checkAchievements({ hasApiKey: true });
    }
  }, []);

  // Save to local storage when goals change
  useEffect(() => {
    localStorage.setItem('diet_app_goals', JSON.stringify(dailyGoals));
  }, [dailyGoals]);

  useEffect(() => {
    localStorage.setItem('diet_app_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('diet_app_water', JSON.stringify({ amount: waterGlasses, date: new Date().getTime() }));
    checkAchievements({ waterCount: waterGlasses });
  }, [waterGlasses]);

  const handleScanComplete = (item: FoodItem) => {
    setScannedItem(item);
  };

  const handleAcceptScan = () => {
    if (scannedItem) {
      setHistory(prev => [scannedItem, ...prev]);
      setScannedItem(null);
      setActiveTab('dashboard');
    }
  };

  const handleDiscardScan = () => {
    setScannedItem(null);
  };

  const handleSaveGoals = (newGoals: typeof DEFAULT_GOALS, newProfile: UserProfile) => {
    setDailyGoals(newGoals);
    setProfile(newProfile);
    setActiveTab('dashboard');
  };

  const handleDeleteFood = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans selection:bg-emerald-200">
      {/* Header - Simple generic app header */}
      <header className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 text-emerald-600">
          <div className="bg-emerald-100 p-2 rounded-xl">
            <Utensils className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-xl tracking-tight">NutriScan</span>
        </div>
        <div className="w-10 h-10 bg-gray-100 rounded-full border-2 border-white shadow-sm overflow-hidden">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User Avatar" />
        </div>
      </header>
      
      {/* Achievement Notification Overlay */}
      {showNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-500">
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-4 flex items-center gap-4 max-w-sm w-[90vw]">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-2xl shrink-0">
              {showNotification.icon}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-0.5">Achievement Unlocked!</p>
              <h4 className="font-extrabold text-gray-900 leading-tight">{showNotification.title}</h4>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{showNotification.description}</p>
            </div>
            <button onClick={clearNotification} className="text-gray-400 hover:text-gray-600 p-2">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {scannedItem ? (
          // Scan Results Overlay
          <div className="absolute inset-0 bg-white z-20 flex flex-col p-6 animate-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Scan Results</h2>
            <div className="flex-1 overflow-y-auto pb-24">
              <div className="relative rounded-3xl overflow-hidden shadow-xl mb-8 border-4 border-emerald-50 max-w-sm mx-auto">
                <img src={scannedItem.imageUrl} alt="Scanned food" className="w-full aspect-square object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-white font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    AI Identified Match
                  </p>
                  <h3 className="text-white text-2xl font-bold">{scannedItem.name}</h3>
                  {scannedItem.category && !scannedItem.isBurn && (
                    <span className="text-xs font-bold text-white bg-emerald-500/80 px-2 py-0.5 rounded-md mt-2 inline-block backdrop-blur-sm border border-emerald-400/50">
                      {scannedItem.category}
                    </span>
                  )}
                  {scannedItem.isBurn && (
                    <span className="text-xs font-bold text-white bg-orange-500/80 px-2 py-0.5 rounded-md mt-2 inline-block backdrop-blur-sm border border-orange-400/50">
                      Activity
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-emerald-50 rounded-3xl p-6 mb-6">
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-black text-emerald-900">{scannedItem.calories}</span>
                  <span className="text-emerald-700 font-medium mb-1">kcal</span>
                </div>
                <p className="text-sm text-emerald-600 font-medium">Estimated calories based on portion size</p>
              </div>

              <h4 className="font-bold text-gray-800 mb-4 text-lg">Macros Overview</h4>
              <div className="space-y-4">
                <MacroRow label="Protein" value={scannedItem.macros.protein} color="bg-blue-500" max={100} />
                <MacroRow label="Carbs" value={scannedItem.macros.carbs} color="bg-amber-500" max={100} />
                <MacroRow label="Fat" value={scannedItem.macros.fat} color="bg-purple-500" max={100} />
                {scannedItem.macros.fiber !== undefined && (
                  <MacroRow label="Fiber" value={scannedItem.macros.fiber} color="bg-emerald-500" max={50} />
                )}
                {scannedItem.macros.sugar !== undefined && (
                  <MacroRow label="Sugar" value={scannedItem.macros.sugar} color="bg-pink-500" max={50} />
                )}
              </div>
            </div>

            <div className="pt-4 flex gap-4 mt-auto border-t border-gray-100 bg-white">
              <button
                onClick={handleDiscardScan}
                className="flex-1 py-4 font-bold rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleAcceptScan}
                className="flex-1 py-4 font-bold rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all"
              >
                Log Meal
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard history={history} dailyGoals={dailyGoals} waterGlasses={waterGlasses} onUpdateWater={setWaterGlasses} currentStreak={streakData.currentStreak} onDeleteFood={handleDeleteFood} />}
            {activeTab === 'scanner' && <Scanner onScanComplete={handleScanComplete} />}
            {activeTab === 'settings' && <Settings goals={dailyGoals} profile={profile} onSave={handleSaveGoals} />}
            {activeTab === 'awards' && <Achievements achievements={achievements} streakData={streakData} />}
            {activeTab === 'history' && (
              <div className="p-6 h-full overflow-y-auto pb-24 max-w-md mx-auto">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Meal History</h2>
                {history.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <History className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium text-lg">Your history is empty.</p>
                    <p className="text-gray-400 text-sm mt-2">Go to the scanner to log your first meal!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div key={item.id} className="flex flex-col bg-white rounded-3xl p-5 shadow-sm border border-gray-100 relative group">
                        <button
                          onClick={() => handleDeleteFood(item.id)}
                          className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="flex items-center mb-3">
                          <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-2xl object-cover" />
                          <div className="ml-4 flex-1">
                            <div className="flex items-center justify-between pr-8">
                              <h4 className="font-bold text-lg text-gray-900 leading-tight flex items-center gap-1">
                                {item.name}
                                {item.isVerified && <BadgeCheck className="w-4 h-4 text-emerald-500 ml-1" />}
                              </h4>
                            </div>
                            <p className="text-sm text-gray-500 font-medium mt-1">
                              {new Date(item.timestamp).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {item.category && !item.isBurn && (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md mt-1.5 inline-block">
                                {item.category}
                              </span>
                            )}
                            {item.isBurn && (
                              <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-md mt-1.5 inline-block">
                                Activity
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-50">
                          <div className="flex gap-4 text-sm font-medium">
                            {item.calories > 0 && (
                              <>
                                <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">P: {item.macros.protein}g</span>
                                <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">C: {item.macros.carbs}g</span>
                                <span className="text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">F: {item.macros.fat}g</span>
                              </>
                            )}
                          </div>
                          <span className={cn("font-black text-lg", item.calories < 0 ? "text-orange-500" : "text-emerald-600")}>
                            {item.calories > 0 ? "+" : ""}{item.calories} <span className={cn("text-xs font-semibold", item.calories < 0 ? "text-orange-400" : "text-emerald-400")}>kcal</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      {!scannedItem && (
        <nav className="bg-white border-t border-gray-100 pb-safe fixed bottom-0 w-full z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
          <div className="flex justify-around items-center h-20 px-2 max-w-md mx-auto">
            <NavItem
              icon={<Home className="w-6 h-6" />}
              label="Dashboard"
              isActive={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
            />
            <NavItem
              icon={<History className="w-6 h-6" />}
              label="History"
              isActive={activeTab === 'history'}
              onClick={() => setActiveTab('history')}
            />
            <button
              onClick={() => setActiveTab('scanner')}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transform -translate-y-4 shadow-xl transition-all duration-300 shrink-0",
                activeTab === 'scanner' 
                  ? "bg-emerald-600 shadow-emerald-600/40 text-white scale-110" 
                  : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30 text-white"
              )}
            >
              <Camera className="w-8 h-8" />
            </button>
            <NavItem
              icon={<Trophy className="w-6 h-6" />}
              label="Awards"
              isActive={activeTab === 'awards'}
              onClick={() => setActiveTab('awards')}
            />
            <NavItem
              icon={<SettingsIcon className="w-6 h-6" />}
              label="Settings"
              isActive={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
            />
          </div>
        </nav>
      )}
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300",
        isActive ? "text-emerald-600 bg-emerald-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
      )}
    >
      {icon}
      <span className={cn("text-[10px] mt-1 font-semibold tracking-wide", isActive ? "opacity-100" : "opacity-0 h-0 overflow-hidden transition-all duration-200")}>{label}</span>
    </button>
  );
}

function MacroRow({ label, value, color, max }: { label: string; value: number; color: string; max: number }) {
  const percentage = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-4">
      <span className="w-16 font-semibold text-gray-700">{label}</span>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${percentage}%` }} />
      </div>
      <span className="w-12 text-right font-bold text-gray-900">{value}g</span>
    </div>
  );
}

export default App;
