/**
 * JudgeBench — AI Courtroom Simulator
 * Main Application Component
 *
 * Phase 5.6: Visible typewriter streaming
 */

import { useState, useCallback, useRef } from 'react';
import { CourtroomLayout } from './components/CourtroomLayout';
import { createInitialState, startSimulation, processNextTurnAsync, resetSimulation, skipToNextPhase } from './orchestration/courtControllerAsync';
import type { CourtState, TranscriptEntry } from './types/courtroom';

function App() {
  const [state, setState] = useState<CourtState>(() => createInitialState());
  const [isGenerating, setIsGenerating] = useState(false);
  // Track streaming state for typewriter effect
  const streamRef = useRef<{ abort: boolean }>({ abort: false });

  const handleStart = useCallback(() => {
    streamRef.current.abort = false;
    setState(startSimulation(state));
  }, [state]);

  const handleNextTurn = useCallback(async () => {
    if (isGenerating) return; // Prevent duplicate
    streamRef.current.abort = false;
    setIsGenerating(true);
    
    try {
      // Get current speaker info before async
      const speakerRole = state.currentSpeaker;
      const speakerName = state.participants.find(p => p.role === speakerRole)?.name || 'Unknown';
      
      // Create empty entry for streaming
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
        isComplete: false
      };
      
      // Add partial entry immediately
      setState(prev => ({
        ...prev,
        transcript: [...prev.transcript, tempEntry]
      }));
      
      // Process turn (await full generation)
      const newState = await processNextTurnAsync(state);
      
      // Check if aborted mid-stream
      if (streamRef.current.abort) return;
      
      // Replace partial with complete entry
      const finalEntry: TranscriptEntry = {
        ...newState.transcript[newState.transcript.length - 1],
        isComplete: true
      };
      
      setState(prev => ({
        ...newState,
        transcript: [...prev.transcript.slice(0, -1), finalEntry]
      }));
    } catch (err) {
      console.error('Generation error:', err);
      // On error, remove partial entry
      setState(prev => ({
        ...prev,
        transcript: prev.transcript.filter((_, i) => i < prev.transcript.length - 1)
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
  }, []);

  return (
    <CourtroomLayout
      state={state}
      onStart={handleStart}
      onNextTurn={handleNextTurn}
      onReset={handleReset}
      onSkip={handleSkip}
      isGenerating={isGenerating}
    />
  );
}

export default App;
