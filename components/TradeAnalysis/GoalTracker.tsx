
import React, { useState, useEffect } from 'react';
import { Translation } from '../../types';
import { Target, Pencil, Trophy, TrendingUp } from 'lucide-react';

interface GoalTrackerProps {
  currentProfit: number;
  currencySymbol: string;
  t: Translation['analysis']['goalTracker'];
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({ currentProfit, currencySymbol, t }) => {
  const [goal, setGoal] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const savedGoal = localStorage.getItem('p2p_monthly_goal');
    if (savedGoal) {
      setGoal(parseFloat(savedGoal));
      setInputValue(savedGoal);
    }
  }, []);

  const handleSave = () => {
    const val = parseFloat(inputValue);
    if (!isNaN(val) && val > 0) {
      setGoal(val);
      localStorage.setItem('p2p_monthly_goal', val.toString());
      setIsEditing(false);
    }
  };

  if (goal === null || isEditing) {
    return (
      <div className="bg-card p-6 rounded-2xl border border-card-border shadow-lg flex flex-col items-center justify-center text-center space-y-4">
        <div className="bg-primary/10 p-3 rounded-full">
            <Target size={32} className="text-primary" />
        </div>
        <h3 className="text-lg font-bold text-text-main">{t.setGoal}</h3>
        <div className="flex gap-2 w-full max-w-xs">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="1000"
            className="flex-1 bg-background border border-card-border rounded-lg px-4 py-2 text-text-main outline-none focus:border-primary"
          />
          <button 
            onClick={handleSave}
            className="bg-primary hover:bg-primary-hover text-text-inverted px-4 py-2 rounded-lg font-bold transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  const percentage = Math.min((currentProfit / goal) * 100, 100);
  const isCompleted = currentProfit >= goal;

  return (
    <div className="bg-gradient-to-r from-card to-background p-6 rounded-2xl border border-card-border shadow-lg relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>

        <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
                <h3 className="text-text-main font-bold flex items-center gap-2">
                    <Target size={18} className="text-primary"/> 
                    {t.title}
                </h3>
                <p className="text-xs text-text-muted mt-1">Target: <span className="font-mono text-text-main">{goal.toLocaleString()} {currencySymbol}</span></p>
            </div>
            <button 
                onClick={() => setIsEditing(true)} 
                className="text-text-muted hover:text-primary transition-colors p-1"
                title={t.editGoal}
            >
                <Pencil size={16} />
            </button>
        </div>

        <div className="relative z-10">
            <div className="flex justify-between text-sm mb-2 font-medium">
                <span className={`${isCompleted ? 'text-green-400' : 'text-text-main'}`}>
                    {percentage.toFixed(1)}%
                </span>
                <span className="text-text-muted">
                    {currentProfit.toFixed(2)} / {goal.toLocaleString()} {currencySymbol}
                </span>
            </div>
            
            <div className="w-full bg-background rounded-full h-4 overflow-hidden border border-card-border">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-primary to-orange-400'}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>

            <div className="mt-4 flex items-center gap-2">
                {isCompleted ? (
                    <>
                        <Trophy size={20} className="text-yellow-400 animate-bounce" />
                        <span className="text-sm font-bold text-yellow-400 animate-pulse">{t.congratulations}</span>
                    </>
                ) : (
                    <>
                        <TrendingUp size={20} className="text-blue-400" />
                        <span className="text-sm text-text-muted">
                            {t.remaining}: <span className="text-text-main font-mono">{(goal - currentProfit).toFixed(2)} {currencySymbol}</span> - {t.keepGoing}
                        </span>
                    </>
                )}
            </div>
        </div>
    </div>
  );
};
