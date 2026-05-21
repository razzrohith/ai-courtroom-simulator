/**
 * JudgeBench — AI Courtroom Simulator
 * Main Application Component
 *
 * Phase 6: Courtroom logic and session persistence
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { CourtroomLayout } from './components/CourtroomLayout';
import { createInitialState, startSimulation, processNextTurnAsync, resetSimulation, skipToNextPhase } from './orchestration/courtControllerAsync';
import { saveSession, loadSession, clearSession, hasSavedSession } from './data/sessionPersistence';
import type { CourtState, TranscriptEntry } from './types/courtroom';

function App() {
  const [state, setState] = useState<CourtState>(() => createInitialState());
  const [isGenerating, setIsGenerating] = useState(false);
  const streamRef = useRef<{ abort: boolean }>({ abort: false });
  const [hasSession, setHasSession] = useState(false);

  // Check for saved session on mount
  useEffect(() => {
    setHasSession(hasSavedSession());
  }, []);

  const handleStart = useCallback(() => {
    streamRef.current.abort = false;
    setState(startSimulation(state));
  }, [state]);

  const handleNextTurn = useCallback(async () => {
    if (isGenerating) return;
    streamRef.current.abort = false;
    setIsGenerating(true);

    try {
      const speakerRole = state.currentSpeaker;
      const speakerName = state.participants.find(p => p.role === speakerRole)?.name || 'Unknown';
      
      const tempEntry: TranscriptEntry = {
        id: `trans-${Date.now()}-${speakerRole}`,
        speakerRole: speakerRole!,
        speakerName,
        message: '',
        phase: state.currentPhase,
        sequenceNumber: state.transcript.length + 1,
        timestamp: new Date().toISOString(),
        providerUsed: 'mock',
        modelUsed: 'streaming...',
        responseSource: 'mock',
        isComplete: false,
      };

      setState(prev => ({
        ...prev,
        transcript: [...prev.transcript, tempEntry],
      }));

      const newState = await processNextTurnAsync(state);
      if (streamRef.current.abort) return;

      const finalEntry: TranscriptEntry = {
        ...newState.transcript[newState.transcript.length - 1],
        isComplete: true,
      };

      setState(prev => ({
        ...newState,
        transcript: [...prev.transcript.slice(0, -1), finalEntry],
      }));
    } catch (err) {
      console.error('Generation error:', err);
      setState(prev => ({
        ...prev,
        transcript: prev.transcript.filter((_, i) => i < prev.transcript.length - 1),
      }));
    } finally {
      if (!streamRef.current.abort) {
        setIsGenerating(false);
      }
    }
  }, [state, isGenerating]);

  const handleSkip = useCallback(() => {
    streamRef.current.abort = true;
    setState(skipToNextPhase(state));
  }, [state]);

  const handleReset = useCallback(() => {
    streamRef.current.abort = true;
    setIsGenerating(false);
    setState(resetSimulation());
    setHasSession(false);
  }, []);

  // Session controls
  const handleSave = useCallback(() => {
    saveSession(state);
    setHasSession(true);
  }, [state]);

  const handleLoad = useCallback(() => {
    const saved = loadSession();
    if (saved) {
      setState(prev => ({
        ...prev,
        currentPhase: saved.currentPhase || prev.currentPhase,
        currentSpeaker: saved.currentSpeaker || prev.currentSpeaker,
        transcript: saved.transcript || prev.transcript,
        evidence: saved.evidence || prev.evidence,
        verdict: saved.verdict || prev.verdict,
        isActive: saved.isActive ?? prev.isActive,
        case: saved.case || prev.case,
        objectionHistory: saved.objectionHistory || [],
      }));
      setHasSession(true);
    }
  }, []);

  const handleClear = useCallback(() => {
    clearSession();
    setHasSession(false);
  }, []);

  return (
    <CourtroomLayout
      state={state}
      onStart={handleStart}
      onNextTurn={handleNextTurn}
      onReset={handleReset}
      onSkip={handleSkip}
      onSave={handleSave}
      onLoad={handleLoad}
      onClear={handleClear}
      hasSavedSession={hasSession}
      isGenerating={isGenerating}
    />
  );
}

export default App;
