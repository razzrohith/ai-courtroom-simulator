/**
 * JudgeBench — AI Courtroom Simulator
 * Main Application Component
 * 
 * Phase 4: Connected to provider runtime
 */

import { useState, useCallback } from 'react';
import { CourtroomLayout } from './components/CourtroomLayout';
import { createInitialState, startSimulation, processNextTurnAsync, resetSimulation, skipToNextPhase } from './orchestration/courtControllerAsync';
import type { CourtState } from './types/courtroom';

function App() {
  const [state, setState] = useState<CourtState>(() => createInitialState());
  const [isGenerating, setIsGenerating] = useState(false);

  const handleStart = useCallback(() => {
    setState(startSimulation(state));
  }, [state]);

  const handleNextTurn = useCallback(async () => {
    setIsGenerating(true);
    try {
      const newState = await processNextTurnAsync(state);
      setState(newState);
    } finally {
      setIsGenerating(false);
    }
  }, [state]);

  const handleSkip = useCallback(() => {
    setState(skipToNextPhase(state));
  }, [state]);

  const handleReset = useCallback(() => {
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
