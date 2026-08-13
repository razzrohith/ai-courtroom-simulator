/**
 * useKeyboardShortcuts — Global courtroom hotkeys.
 *   Space / N  → next turn
 *   A          → toggle autoplay
 *   F          → toggle focus (theater) mode
 *   M          → toggle sound effects
 * Ignored while typing in inputs/textareas/selects or contenteditable.
 */

import { useEffect } from 'react';

export interface ShortcutHandlers {
  onNextTurn?: () => void;
  onToggleAutoplay?: () => void;
  onToggleFocusMode?: () => void;
  onToggleSound?: () => void;
  enabled?: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

export function useKeyboardShortcuts({
  onNextTurn,
  onToggleAutoplay,
  onToggleFocusMode,
  onToggleSound,
  enabled = true,
}: ShortcutHandlers) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'n':
          if (onNextTurn) {
            e.preventDefault();
            onNextTurn();
          }
          break;
        case 'a':
          onToggleAutoplay?.();
          break;
        case 'f':
          onToggleFocusMode?.();
          break;
        case 'm':
          onToggleSound?.();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, onNextTurn, onToggleAutoplay, onToggleFocusMode, onToggleSound]);
}
