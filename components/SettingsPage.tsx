
import React from 'react';
import { Trash2, Download, Palette, Settings, Check, Globe } from 'lucide-react';
import { AppLanguage, AppTheme, Translation } from '../types';

interface SettingsPageProps {
  onClearData: () => void;
  onExportData: () => void;
  currentTheme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  currentLang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  t: Translation['settings'];
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onClearData,
  onExportData,
  currentTheme,
  setTheme,
  currentLang,
  setLang,
  t
}) => {
  
  const themes: { id: AppTheme; name: string; color: string }[] = [
    { id: 'binance', name: 'Binance', color: '#F0B90B' },
    { id: 'darkBlue', name: 'Ocean', color: '#3B82F6' },
    { id: 'midnight', name: 'Midnight', color: '#8B5CF6' },
    { id: 'forest', name: 'Forest', color: '#10B981' },
    { id: 'purple', name: 'Royal', color: '#D946EF' },
    { id: 'sunset', name: 'Sunset', color: '#F97316' },
    { id: 'slate', name: 'Slate', color: '#94A3B8' },
    { id: 'neonCyber', name: 'Cyber', color: '#00f2ea' },
    { id: 'neonMatrix', name: 'Matrix', color: '#00ff41' },
    { id: 'neonFuture', name: 'Future', color: '#ff0055' }
  ];

  const languages: { id: AppLanguage; name: string; flag: string }[] = [
    { id: 'ar', name: 'العربية', flag: '🇸🇦' },
    { id: 'en', name: 'English', flag: '🇺🇸' },
    { id: 'fr', name: 'Français', flag: '🇫🇷' },
    { id: 'es', name: 'Español', flag: '🇪🇸' },
    { id: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { id: 'ru', name: 'Русский', flag: '🇷🇺' },
    { id: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { id: 'zh', name: '中文', flag: '🇨🇳' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-10">
      <div className="flex items-center gap-3 border-b border-card-border pb-6">
        <div className="bg-primary/10 p-3 rounded-xl">
          <Settings size={32} className="text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-text-main">{t.title}</h2>
          <p className="text-text-muted text-sm">{t.subtitle}</p>
        </div>
      </div>

      {/* Appearance Section */}
      <section className="bg-card rounded-2xl border border-card-border overflow-hidden">
        <div className="p-6 border-b border-card-border">
          <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
            <Palette size={20} className="text-purple-400" />
            {t.appearance}
          </h3>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Language Selection */}
          <div>
            <h4 className="text-text-main font-medium mb-1 flex items-center gap-2">
              <Globe size={16} /> {t.language}
            </h4>
            <p className="text-sm text-text-muted mb-4">{t.languageDesc}</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLang(lang.id)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                    currentLang === lang.id
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-background border-card-border text-text-muted hover:border-primary/50'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="w-full h-px bg-card-border"></div>

          {/* Theme Selection */}
          <div>
            <h4 className="text-text-main font-medium mb-1">{t.theme}</h4>
            <p className="text-sm text-text-muted mb-4">{t.themeDesc}</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  className={`group relative p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                    currentTheme === theme.id
                      ? 'bg-card border-primary shadow-lg ring-1 ring-primary'
                      : 'bg-background border-card-border hover:border-primary/50'
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-full shadow-sm" 
                    style={{ backgroundColor: theme.color }}
                  ></div>
                  <span className={`text-xs font-medium ${currentTheme === theme.id ? 'text-primary' : 'text-text-muted'}`}>
                    {theme.name}
                  </span>
                  {currentTheme === theme.id && (
                    <div className="absolute top-2 right-2 text-primary">
                      <Check size={12} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Data Management Section */}
      <section className="bg-card rounded-2xl border border-card-border overflow-hidden">
        <div className="p-6 border-b border-card-border">
          <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
            <Download size={20} className="text-blue-400" />
            {t.dataManagement}
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-text-main font-medium mb-1">{t.backup}</h4>
              <p className="text-sm text-text-muted">{t.backupDesc}</p>
            </div>
            <button 
              onClick={onExportData}
              className="flex items-center gap-2 bg-card-border hover:bg-gray-600 text-text-main px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <Download size={18} />
              {t.export}
            </button>
          </div>
          
          <div className="w-full h-px bg-card-border"></div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-red-400 font-medium mb-1">{t.dangerZone}</h4>
              <p className="text-sm text-text-muted">{t.clearAllDesc}</p>
            </div>
            <button 
              onClick={onClearData}
              className="flex items-center gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <Trash2 size={18} />
              {t.clearAll}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};