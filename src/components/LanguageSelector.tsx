/**
 * LanguageSelector — courtroom role-label language mode.
 * Phase 24: surfaced in the sidebar (previously unrendered).
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSelector: React.FC = () => {
  const { mode, setMode } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value as any;
    setMode(newMode);
  };

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2">
      <label htmlFor="language-select" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        🌐 Labels
      </label>
      <select
        id="language-select"
        value={mode}
        onChange={handleChange}
        className="bg-ink-800 border border-white/10 text-gray-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-brass-500 font-medium"
      >
        <option value="en_in">Indian English</option>
        <option value="telugu">Telugu</option>
        <option value="hindi">Hindi</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
