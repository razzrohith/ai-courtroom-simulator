import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageMode, getStoredLanguageMode, setStoredLanguageMode } from '../utils/languageMode';

interface LanguageContextProps {
  mode: LanguageMode;
  setMode: (mode: LanguageMode) => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<LanguageMode>(LanguageMode.EN_IN);

  useEffect(() => {
    const stored = getStoredLanguageMode();
    setModeState(stored);
  }, []);

  const setMode = (newMode: LanguageMode) => {
    setModeState(newMode);
    setStoredLanguageMode(newMode);
  };

  return (
    <LanguageContext.Provider value={{ mode, setMode }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextProps => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
