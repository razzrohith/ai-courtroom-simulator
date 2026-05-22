export enum LanguageMode {
  EN_IN = 'en_in',
  TELUGU = 'telugu',
  HINDI = 'hindi'
}

export const LANGUAGE_STORAGE_KEY = 'judgebench.languageMode.v1';

export const getStoredLanguageMode = (): LanguageMode => {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === LanguageMode.TELUGU) return LanguageMode.TELUGU;
  if (stored === LanguageMode.HINDI) return LanguageMode.HINDI;
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
      judge: 'న్యాయమూర్తి / Judge',
      prosecutor: 'వాది న్యాయవాది / Prosecutor',
      defense: 'ప్రత్యర్థి న్యాయవాది / Defense'
    },
    [LanguageMode.HINDI]: {
      judge: 'न्यायाधीश / Judge',
      prosecutor: 'वादी पक्ष के वकील / Prosecutor',
      defense: 'बचाव पक्ष के वकील / Defense'
    }
  };
  return map[mode][role] ?? role;
};
