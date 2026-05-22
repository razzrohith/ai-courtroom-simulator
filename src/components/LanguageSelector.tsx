import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSelector: React.FC = () => {
  const { mode, setMode } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value as any;
    setMode(newMode);
  };

  return (
    <div className="flex items-center space-x-2 p-2 bg-gray-100 border-b">
      <label htmlFor="language-select" className="font-medium text-gray-700">
        Language:
      </label>
      <select
        id="language-select"
        value={mode}
        onChange={handleChange}
        className="rounded border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="en_in">Indian English</option>
        <option value="telugu">Telugu</option>
        <option value="hindi">Hindi</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
