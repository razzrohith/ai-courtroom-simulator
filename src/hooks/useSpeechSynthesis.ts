import { useState, useEffect, useCallback, useRef } from 'react';
import type { TranscriptEntry, AgentRole } from '../types/courtroom';

export interface VoiceSettings {
  enabled: boolean;
  autoRead: boolean;
  voiceName: string;
  speed: 'slow' | 'normal' | 'fast';
  volume: number;
  pitch: number;
}

const STORAGE_KEY = 'judgebench.voiceSettings.v1';

const DEFAULT_SETTINGS: VoiceSettings = {
  enabled: false,
  autoRead: false,
  voiceName: '',
  speed: 'slow',
  volume: 1.0,
  pitch: 1.0,
};

const SPEED_RATES = {
  slow: 0.85,
  normal: 1.0,
  fast: 1.25,
};

export function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  let cleaned = text;
  
  // Remove markdown headers
  cleaned = cleaned.replace(/^#+\s+/gm, '');
  // Remove markdown bold/italic indicators
  cleaned = cleaned.replace(/\*\*|__/g, '');
  cleaned = cleaned.replace(/\*|_/g, '');
  // Remove bullet points
  cleaned = cleaned.replace(/^[-*+]\s+/gm, '');
  // Remove number listing prefix
  cleaned = cleaned.replace(/^\d+\.\s+/gm, '');
  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

export function useSpeechSynthesis() {
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [settings, setSettings] = useState<VoiceSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load voice settings from localStorage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save voice settings to localStorage:', e);
    }
  }, [settings]);

  // Load voices and check support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
      
      const loadVoices = () => {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);
      };
      
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // Update speaking state periodically
  useEffect(() => {
    if (!supported) return;
    const interval = setInterval(() => {
      setSpeaking(window.speechSynthesis.speaking);
    }, 200);
    return () => clearInterval(interval);
  }, [supported]);

  const stopSpeaking = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback((entry: TranscriptEntry) => {
    if (!supported || !settingsRef.current.enabled) return;
    
    // Stop any ongoing speech first
    window.speechSynthesis.cancel();

    const rolePrefixes: Record<AgentRole, string> = {
      judge: 'The Judge says: ',
      prosecutor: 'The Prosecutor says: ',
      defense: 'The Defense says: ',
    };

    const cleanMsg = cleanTextForSpeech(entry.message || '');
    if (!cleanMsg) return;

    const prefix = rolePrefixes[entry.speakerRole] || '';
    const textToSpeak = `${prefix}${cleanMsg}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Load fresh voices list
    const voiceList = window.speechSynthesis.getVoices();
    const englishVoices = voiceList.filter(v => v.lang.toLowerCase().startsWith('en'));

    // Resolve voice per speaker role
    let selectedVoice: SpeechSynthesisVoice | null = null;
    
    if (settingsRef.current.voiceName) {
      // User selected a specific voice
      selectedVoice = voiceList.find(v => v.name === settingsRef.current.voiceName) || null;
    } else if (englishVoices.length > 0) {
      // Auto-assign distinct voices for Judge, Prosecutor, and Defense
      if (entry.speakerRole === 'judge') {
        selectedVoice = englishVoices[0] || null;
      } else if (entry.speakerRole === 'prosecutor') {
        selectedVoice = englishVoices[1] || englishVoices[0] || null;
      } else if (entry.speakerRole === 'defense') {
        // Try to get a third distinct voice if possible
        selectedVoice = englishVoices[2] || englishVoices[0] || null;
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = SPEED_RATES[settingsRef.current.speed] || 1.0;
    utterance.volume = settingsRef.current.volume;
    utterance.pitch = settingsRef.current.pitch;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [supported]);

  const updateSetting = useCallback(<K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  return {
    supported,
    voices,
    speaking,
    settings,
    updateSetting,
    speak,
    stopSpeaking,
  };
}
