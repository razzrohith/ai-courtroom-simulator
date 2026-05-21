/**
 * JudgeBench — AI Courtroom Simulator
 * Main Application Component
 */

import { useState, useCallback } from 'react';
import { CourtroomLayout } from './components/CourtroomLayout';
import { createInitialState, startSimulation, processNextTurn, resetSimulation } from './orchestration/courtController';
import type { CourtState } from './types/courtroom';

function App() {
  const [state, setState] = useState<CourtState>(() => createInitialState());

  const handleStart = useCallback(() => {
    setState(startSimulation(state));
  }, [state]);

  const handleNextTurn = useCallback(() => {
    setState(prev => processNextTurn(prev));
  }, []);

  const handleReset = useCallback(() => {
    setState(resetSimulation());
  }, []);

  return (
    <CourtroomLayout
      state={state}
      onStart={handleStart}
      onNextTurn={handleNextTurn}
      onReset={handleReset}
    />
  );
}

export default App;
