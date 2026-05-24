export enum LanguageMode {
  EN_IN = 'en_in',
  TELUGU = 'telugu',
  HINDI = 'hindi'
}

export const LANGUAGE_STORAGE_KEY = 'judgebench.languageMode.v1';

export const getStoredLanguageMode = (): LanguageMode => {
  return LanguageMode.EN_IN;
};

export const setStoredLanguageMode = (mode: LanguageMode) => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, mode);
};

export const getRoleLabel = (role: 'judge' | 'prosecutor' | 'defense', mode: LanguageMode): string => {
  const map: Record<LanguageMode, Record<string, string>> = {
    [LanguageMode.EN_IN]: {
      judge: 'Judge',
      prosecutor: 'Prosecutor',
      defense: 'Defense'
    },
    [LanguageMode.TELUGU]: {
      // Telugu script with English fallback
      judge: 'న్యాయమూర్తి / Judge',
      prosecutor: 'ప్రాసిక్యూటర్ / Prosecutor',
      defense: 'డిఫెన్స్ / Defense'
    },
    [LanguageMode.HINDI]: {
      // Hindi script with English fallback
      judge: 'न्यायाधीश / Judge',
      prosecutor: 'प्रोसीक्यूटर / Prosecutor',
      defense: 'डिफेंस / Defense'
    }
  };
  return map[mode][role] ?? role;
};
