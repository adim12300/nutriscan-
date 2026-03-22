import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Loader2, Info, Edit3, PlusCircle, AlertCircle, Flame, Coffee, Pizza, Sun, Moon, Pill, Barcode, Search } from 'lucide-react';
import { analyzeImage } from '../api/mockAi';
import { analyzeImageWithGemini } from '../api/geminiAi';
import { FoodItem, MealCategory } from '../types';
import { searchFood, FoodSearchResult } from '../services/foodApi';

interface ScannerProps {
  onScanComplete: (item: FoodItem) => void;
}

export function Scanner({ onScanComplete }: ScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<'scan' | 'barcode' | 'manual' | 'activity' | 'search'>('scan');
  const [selectedCategory, setSelectedCategory] = useState<MealCategory>('Snacks');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [manualForm, setManualForm] = useState({
    name: '', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0
  });
  const [activityForm, setActivityForm] = useState({
    name: '', burned: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a local preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsScanning(true);

    try {
      const apiKey = localStorage.getItem('gemini_api_key');
      
      let result;
      if (apiKey) {
        // Convert to base64 for Gemini
        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        result = await analyzeImageWithGemini(base64Image, file.type, apiKey);
        result.imageUrl = url; // Use local preview URL for rendering
      } else {
        // Fallback to mock AI if no API key
        result = await analyzeImage(url);
      }

      result.category = selectedCategory;

      onScanComplete(result);
      setTimeout(() => setPreviewUrl(null), 500);
    } catch (error) {
      console.error("Failed to analyze image", error);
      alert(error instanceof Error ? error.message : "Failed to analyze image. Please check your API key.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.name) return;
    
    onScanComplete({
      id: Math.random().toString(36).substr(2, 9),
      name: manualForm.name,
      calories: manualForm.calories,
      macros: {
        protein: manualForm.protein,
        carbs: manualForm.carbs,
        fat: manualForm.fat,
        fiber: manualForm.fiber,
        sugar: manualForm.sugar
      },
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      timestamp: Date.now(),
      category: selectedCategory
    });
  };

  const handleActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityForm.name) return;
    
    onScanComplete({
      id: Math.random().toString(36).substr(2, 9),
      name: `Activity: ${activityForm.name}`,
      calories: -Math.abs(activityForm.burned), // Negative calories to offset intake
      macros: { protein: 0, carbs: 0, fat: 0 },
      imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      timestamp: Date.now(),
      isBurn: true
    });
  };

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchFood(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogSearchResult = (item: FoodSearchResult) => {
    onScanComplete({
      id: Math.random().toString(36).substr(2, 9),
      name: item.name,
      calories: item.calories,
      macros: {
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat
      },
      imageUrl: item.image,
      timestamp: Date.now(),
      category: selectedCategory,
      isVerified: true
    });
    setSearchQuery('');
    setSearchResults([]);
    setMode('search'); // stay on search tab but reset
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto max-w-md mx-auto p-6 pb-24">
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setMode('scan')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${mode === 'scan' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Camera className="w-4 h-4 hidden sm:block" /> Scan
        </button>
        <button
          onClick={() => setMode('barcode')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${mode === 'barcode' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Barcode className="w-4 h-4 hidden sm:block" /> Barcode
        </button>
        <button
          onClick={() => setMode('search')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${mode === 'search' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Search className="w-4 h-4 hidden sm:block" /> Search DB
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${mode === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Edit3 className="w-4 h-4 hidden sm:block" /> Manual
        </button>
        <button
          onClick={() => setMode('activity')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${mode === 'activity' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Flame className="w-4 h-4 hidden sm:block" /> Burn
        </button>
      </div>

      {(mode === 'scan' || mode === 'barcode' || mode === 'manual' || mode === 'search') && (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-600 mb-2">Select Category</label>
          <div className="flex flex-wrap gap-2">
            {(['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Supplements'] as MealCategory[]).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat === 'Breakfast' && <Sun className="w-3.5 h-3.5" />}
                {cat === 'Lunch' && <Pizza className="w-3.5 h-3.5" />}
                {cat === 'Dinner' && <Moon className="w-3.5 h-3.5" />}
                {cat === 'Snacks' && <Coffee className="w-3.5 h-3.5" />}
                {cat === 'Supplements' && <Pill className="w-3.5 h-3.5" />}
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'scan' ? (
      <>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Scan Your Meal</h2>
        <p className="text-gray-500 font-medium text-sm">Take a photo or upload an image to let AI calculate the calories and macros.</p>
      </div>

      <div className="relative w-full aspect-square bg-white rounded-3xl border-4 border-dashed border-gray-200 flex items-center justify-center overflow-hidden mb-6 shadow-sm">
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-50" />
            {isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white">
                <Loader2 className="w-12 h-12 animate-spin mb-4 text-emerald-400" />
                <p className="font-semibold text-lg tracking-wide">AI Analyzing Food...</p>
                <div className="w-48 h-1 bg-white/20 mt-4 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-400 animate-[scan_2s_ease-in-out_infinite]" style={{ width: '50%' }}></div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center text-gray-400 p-8 text-center">
            <Camera className="w-16 h-16 mb-4 text-gray-300" />
            <p className="font-medium">Waiting for image...</p>
          </div>
        )}
      </div>

      <div className="flex w-full gap-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30"
        >
          <Camera className="w-6 h-6" />
          Take Photo
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="flex-1 bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-6 h-6" />
          Upload
        </button>
      </div>
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageCapture}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {!localStorage.getItem('gemini_api_key') ? (
        <div className="mt-8 flex items-start gap-3 text-sm text-amber-800 bg-amber-50 p-4 rounded-xl border border-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="font-medium">
            Currently using Mock AI. Go to Settings &gt; AI Config and enter your Google Gemini API Key for real-world photo analysis!
          </p>
        </div>
      ) : (
        <div className="mt-8 flex items-start gap-3 text-sm text-emerald-800 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
          <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="font-medium">
            Gemini AI is active. Taking a photo will use your API Key to analyze nutritional content.
          </p>
        </div>
      )}
      </>
      ) : mode === 'barcode' ? (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100 mt-2 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <Barcode className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Scan Barcode</h2>
        <p className="text-gray-500 font-medium text-sm mb-8">Quickly add food by scanning the barcode on the package.</p>
        
        <div className="w-full h-48 bg-gray-900 rounded-2xl relative overflow-hidden mb-6 flex items-center justify-center border-4 border-gray-800">
          <div className="absolute inset-0 bg-black/40 z-10"></div>
          {/* Simulated scanning line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_2px_rgba(16,185,129,0.8)] z-20 animate-[scan_2s_ease-in-out_infinite]"></div>
          <Barcode className="w-32 h-32 text-gray-500/30" />
        </div>

        <button 
          onClick={() => {
            setIsScanning(true);
            setTimeout(() => {
              setIsScanning(false);
              onScanComplete({
                id: Math.random().toString(36).substr(2, 9),
                name: "Oatmeal (Scanned)",
                calories: 150,
                macros: { protein: 5, carbs: 27, fat: 3, fiber: 4, sugar: 1 },
                imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
                timestamp: Date.now(),
                category: selectedCategory,
                isVerified: true
              });
            }, 1500);
          }}
          disabled={isScanning}
          className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/30"
        >
          {isScanning ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
          {isScanning ? "Scanning..." : "Tap to Scan"}
        </button>
        <p className="mt-4 text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 
          100% Free & Unlimited
        </p>
      </div>
      ) : mode === 'search' ? (
      <div className="flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 mt-2 p-6 pb-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Search Database</h2>
          <p className="text-gray-500 font-medium text-sm">Find verified foods from a global database.</p>
        </div>
        
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-gray-900 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
            placeholder="Search for an apple, chicken..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 -mx-2 px-2">
          {searchQuery && searchResults.length === 0 && !isSearching && (
            <div className="text-center py-8 text-gray-500 font-medium">No foods found. Try a different search.</div>
          )}
          {searchResults.map((item) => (
            <button
              key={item.id}
              onClick={() => handleLogSearchResult(item)}
              className="w-full text-left bg-white border border-gray-100 p-4 rounded-2xl flex gap-4 hover:border-emerald-300 hover:shadow-md transition-all group active:scale-[0.98]"
            >
              <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-gray-100 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900 truncate pr-2 group-hover:text-emerald-700">{item.name}</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                    {item.calories} kcal
                  </span>
                </div>
                {item.brand && <p className="text-xs text-gray-500 font-medium mb-1.5 truncate">{item.brand}</p>}
                <div className="flex gap-3 text-xs font-semibold">
                  <span className="text-blue-600">P: {item.protein}g</span>
                  <span className="text-amber-600">C: {item.carbs}g</span>
                  <span className="text-purple-600">F: {item.fat}g</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      ) : mode === 'manual' ? (
      <form onSubmit={handleManualSubmit} className="space-y-5 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mt-2">
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Meal Name</label>
          <input required type="text" placeholder="e.g., Grilled Chicken Salad" value={manualForm.name} onChange={e => setManualForm({...manualForm, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Calories (kcal)</label>
          <input required type="number" min="0" value={manualForm.calories || ''} onChange={e => setManualForm({...manualForm, calories: parseInt(e.target.value) || 0})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-blue-600 mb-1">Protein (g)</label>
            <input required type="number" min="0" value={manualForm.protein || ''} onChange={e => setManualForm({...manualForm, protein: parseInt(e.target.value) || 0})} className="w-full bg-blue-50 border border-blue-100 rounded-xl px-3 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-amber-600 mb-1">Carbs (g)</label>
            <input required type="number" min="0" value={manualForm.carbs || ''} onChange={e => setManualForm({...manualForm, carbs: parseInt(e.target.value) || 0})} className="w-full bg-amber-50 border border-amber-100 rounded-xl px-3 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-600 mb-1">Fat (g)</label>
            <input required type="number" min="0" value={manualForm.fat || ''} onChange={e => setManualForm({...manualForm, fat: parseInt(e.target.value) || 0})} className="w-full bg-purple-50 border border-purple-100 rounded-xl px-3 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-xs font-semibold text-emerald-600 mb-1">Fiber (g)</label>
            <input type="number" min="0" value={manualForm.fiber || ''} onChange={e => setManualForm({...manualForm, fiber: parseInt(e.target.value) || 0})} className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-pink-600 mb-1">Sugar (g)</label>
            <input type="number" min="0" value={manualForm.sugar || ''} onChange={e => setManualForm({...manualForm, sugar: parseInt(e.target.value) || 0})} className="w-full bg-pink-50 border border-pink-100 rounded-xl px-3 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-pink-500 outline-none" />
          </div>
        </div>
        <button type="submit" className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl py-4 mt-4 transition-all shadow-lg shadow-emerald-500/30">
          <PlusCircle className="w-5 h-5" />
          Log Meal
        </button>
      </form>
      ) : (
      <form onSubmit={handleActivitySubmit} className="space-y-5 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mt-2">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Flame className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-1">Log Workout</h2>
          <p className="text-gray-500 font-medium text-sm">Burned calories will be subtracted from your daily intake total.</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Activity Name</label>
          <input required type="text" placeholder="e.g., Running, Cycling, Yoga" value={activityForm.name} onChange={e => setActivityForm({...activityForm, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Calories Burned</label>
          <input required type="number" min="1" value={activityForm.burned || ''} onChange={e => setActivityForm({...activityForm, burned: parseInt(e.target.value) || 0})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none" />
        </div>
        <button type="submit" className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl py-4 mt-6 transition-all shadow-lg shadow-orange-500/30">
          <Flame className="w-5 h-5 fill-current" />
          Log Burned Calories
        </button>
      </form>
      )}
    </div>
  );
}
