import { Achievement, StreakData } from '../types';
import { Trophy, Flame, Lock } from 'lucide-react';
import { cn } from '../utils';

interface AchievementsProps {
  achievements: Achievement[];
  streakData: StreakData;
}

const getGrade = (points: number) => {
  if (points >= 1000) return { letter: 'S', name: 'Legend', color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' };
  if (points >= 500) return { letter: 'A', name: 'Expert', color: 'text-rose-600', bg: 'bg-rose-100', border: 'border-rose-200' };
  if (points >= 250) return { letter: 'B', name: 'Pro', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' };
  if (points >= 100) return { letter: 'C', name: 'Advanced', color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' };
  if (points >= 50) return { letter: 'D', name: 'Intermediate', color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' };
  return { letter: 'E', name: 'Novice', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' };
};

export function Achievements({ achievements, streakData }: AchievementsProps) {
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalPoints = achievements.reduce((acc, ach) => ach.isUnlocked ? acc + (ach.points || 0) : acc, 0);
  const grade = getGrade(totalPoints);
  
  return (
    <div className="p-6 h-full overflow-y-auto pb-24 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">Awards</h2>
          <p className="text-gray-500 font-medium mt-1">
            {unlockedCount} of {achievements.length} unlocked
          </p>
        </div>
        <div className="flex gap-2">
          <div className={cn("p-3 rounded-2xl flex flex-col items-center border shadow-sm", grade.bg, grade.border)}>
            <div className={cn("font-black text-2xl leading-none mb-1", grade.color)}>{grade.letter}</div>
            <span className={cn("text-[10px] font-bold uppercase tracking-wider", grade.color)}>Rank</span>
          </div>
          <div className="bg-orange-50 p-3 rounded-2xl flex flex-col items-center border border-orange-100 shadow-sm">
            <Flame className="w-8 h-8 text-orange-500 mb-1" />
            <span className="font-black text-xl text-orange-600 leading-none">{streakData.currentStreak}</span>
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mt-1">Day Streak</span>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-6 mb-8 border border-emerald-100 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-emerald-900">Total Score</h3>
          <p className="text-sm font-medium text-emerald-700 mt-1">Rank: {grade.name}</p>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-emerald-600">{totalPoints}</span>
          <span className="text-sm font-bold text-emerald-500">pts</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-emerald-500" />
          Your Milestones
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          {achievements.map((ach) => (
            <div 
              key={ach.id} 
              className={cn(
                "relative p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center",
                ach.isUnlocked 
                  ? "bg-gradient-to-b from-emerald-50 to-white border-emerald-200 shadow-sm" 
                  : "bg-gray-50 border-gray-100 opacity-60 grayscale"
              )}
            >
              <div className="absolute top-2 right-2 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                +{ach.points || 0}
              </div>
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-3 shadow-inner mt-2",
                ach.isUnlocked ? "bg-white" : "bg-gray-200"
              )}>
                {ach.isUnlocked ? ach.icon : <Lock className="w-5 h-5 text-gray-400" />}
              </div>
              <h4 className={cn(
                "font-bold text-sm leading-tight mb-1",
                ach.isUnlocked ? "text-gray-900" : "text-gray-500"
              )}>
                {ach.title}
              </h4>
              <p className="text-xs text-gray-500 font-medium line-clamp-2">
                {ach.description}
              </p>
              
              {ach.isUnlocked && ach.unlockedAt && (
                <div className="mt-3 text-[10px] font-semibold text-emerald-600 bg-emerald-100/50 px-2 py-1 rounded-md w-full">
                  Unlocked {new Date(ach.unlockedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
