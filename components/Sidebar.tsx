import React from 'react';
import { LayoutDashboard, History, PieChart, Settings, X, Calculator } from 'lucide-react';
import { Translation, AppLanguage } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  t: Translation['nav'];
  lang: AppLanguage;
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, t, lang, currentView, onNavigate }) => {
  const isRtl = lang === 'ar';

  // Determine transform based on direction
  // LTR: Sidebar on Left. Hidden = -translate-x-full. Visible = 0.
  // RTL: Sidebar on Right. Hidden = translate-x-full. Visible = 0.
  const positionClass = isRtl ? 'right-0 border-l' : 'left-0 border-r';
  const transformClass = isOpen 
    ? 'translate-x-0' 
    : (isRtl ? 'translate-x-full' : '-translate-x-full');

  const handleNav = (view: string) => {
    onNavigate(view);
    onClose();
  };

  const getItemClass = (view: string) => `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all w-full text-start ${currentView === view ? 'bg-primary text-text-inverted' : 'text-text-muted hover:bg-card-border/50 hover:text-text-main'}`;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 ${positionClass} h-full w-64 bg-card border-card-border z-[100] transform transition-transform duration-300 shadow-2xl ${transformClass}`}>
        <div className="p-6 flex items-center justify-between border-b border-card-border">
          <div className="flex items-center gap-2 text-primary">
            <Calculator size={24} />
            <h2 className="font-bold text-lg">P2P Pro</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-main transition-colors">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          <button 
            onClick={() => handleNav('calculator')} 
            className={getItemClass('calculator')}
          >
            <LayoutDashboard size={20} />
            {t.calculator}
          </button>
          
          <button 
            onClick={() => handleNav('history')} 
            className={getItemClass('history')}
          >
            <History size={20} />
            {t.history}
          </button>
          
          <button 
            onClick={() => handleNav('analysis')} 
            className={getItemClass('analysis')}
          >
            <PieChart size={20} />
            {t.analysis}
          </button>
          
          <button 
            onClick={() => handleNav('settings')} 
            className={getItemClass('settings')}
          >
            <Settings size={20} />
            {t.settings}
          </button>
        </nav>

        {/* Footer info */}
        <div className="absolute bottom-0 w-full p-6 border-t border-card-border text-center">
            <p className="text-xs text-text-muted">v1.0.0 Pro Edition</p>
        </div>
      </div>
    </>
  );
};