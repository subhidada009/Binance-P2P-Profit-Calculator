
import React, { useState, useEffect } from 'react';
import { Translation } from '../types';
import { ChevronRight, ChevronLeft, X, Check } from 'lucide-react';

interface OnboardingTourProps {
  t: Translation['tour'];
  onClose?: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ t, onClose }) => {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; position: 'bottom' | 'top' } | null>(null);

  // Steps definition: targetId corresponds to an ID in the DOM
  const steps = [
    {
      targetId: 'welcome-center', // Virtual ID for center screen
      title: t.welcomeTitle,
      desc: t.welcomeDesc,
    },
    {
      targetId: 'nav-calculator',
      title: t.calcTitle,
      desc: t.calcDesc,
    },
    {
      targetId: 'nav-history',
      title: t.historyTitle,
      desc: t.historyDesc,
    },
    {
      targetId: 'nav-analysis',
      title: t.analysisTitle,
      desc: t.analysisDesc,
    },
    {
      targetId: 'nav-settings',
      title: t.settingsTitle,
      desc: t.settingsDesc,
    }
  ];

  useEffect(() => {
    // Check local storage to see if tour was already completed
    const hasSeenTour = localStorage.getItem('p2p_tour_seen');
    if (!hasSeenTour) {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    if (step === 0) {
      setPosition(null); // Center screen
      return;
    }

    const updatePosition = () => {
        const targetId = steps[step].targetId;
        const element = document.getElementById(targetId);
        
        if (element) {
        const rect = element.getBoundingClientRect();
        // Determine if we should show below or above
        const spaceBelow = window.innerHeight - rect.bottom;
        const showAbove = spaceBelow < 200; // If less than 200px space below, show above

        setPosition({
            top: showAbove ? rect.top - 10 : rect.bottom + 10,
            left: rect.left + (rect.width / 2),
            position: showAbove ? 'top' : 'bottom'
        });
        
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);

  }, [step, isVisible]);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('p2p_tour_seen', 'true');
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  const currentStep = steps[step];
  const isCenter = step === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={handleFinish} />

      {/* Center Welcome Card */}
      {isCenter && (
        <div className="relative z-[101] bg-card border-2 border-primary p-8 rounded-2xl shadow-2xl max-w-md text-center animate-fadeIn mx-4">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold text-text-main mb-3">{currentStep.title}</h2>
          <p className="text-text-muted mb-8 leading-relaxed">{currentStep.desc}</p>
          <div className="flex justify-center gap-4">
            <button 
                onClick={handleFinish}
                className="text-text-muted hover:text-text-main font-medium px-4 py-2"
            >
                {t.skip}
            </button>
            <button 
                onClick={handleNext}
                className="bg-primary hover:bg-primary-hover text-text-inverted font-bold px-8 py-2 rounded-full transition-colors flex items-center gap-2"
            >
                {t.next} <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Tooltip Card */}
      {!isCenter && position && (
        <div 
            className="absolute z-[101] transition-all duration-300 ease-out"
            style={{ 
                top: position.top, 
                left: position.left,
                transform: position.position === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)'
            }}
        >
            {/* Arrow */}
            <div 
                className={`w-4 h-4 bg-card border-l border-t border-primary absolute left-1/2 -translate-x-1/2 rotate-45 
                ${position.position === 'top' ? '-bottom-2 border-b border-r border-t-0 border-l-0 bg-card' : '-top-2 bg-card'}`}
            ></div>

            <div className="bg-card border border-primary p-5 rounded-xl shadow-2xl w-80 relative mt-2">
                <button onClick={handleFinish} className="absolute top-2 right-2 text-text-muted hover:text-text-main">
                    <X size={16} />
                </button>
                
                <h3 className="text-lg font-bold text-primary mb-2">{currentStep.title}</h3>
                <p className="text-sm text-text-muted mb-4">{currentStep.desc}</p>
                
                <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-1">
                        {steps.map((_, i) => (
                            <div 
                                key={i} 
                                className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-gray-600'}`}
                            />
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={handlePrev}
                            className="p-1.5 rounded-full hover:bg-gray-700 text-text-muted transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        {step === steps.length - 1 ? (
                            <button 
                                onClick={handleFinish}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                            >
                                {t.finish} <Check size={14} />
                            </button>
                        ) : (
                            <button 
                                onClick={handleNext}
                                className="bg-primary hover:bg-primary-hover text-text-inverted px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                            >
                                {t.next} <ChevronRight size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
