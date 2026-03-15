"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface AutosaveOptions {
  delay?: number;
  enabled?: boolean;
}

interface AutosaveReturn<T> {
  hasDraft: boolean;
  lastSaved: Date | null;
  loadDraft: () => T | null;
  clearDraft: () => void;
  saveDraft: () => void;
}

interface StoredDraft<T> {
  data: T;
  savedAt: string;
}

function getStorageKey(key: string): string {
  return `autosave_draft_${key}`;
}

export function useAutosave<T>(
  key: string,
  data: T,
  options?: AutosaveOptions
): AutosaveReturn<T> {
  const delay = options?.delay ?? 2000;
  const enabled = options?.enabled ?? true;

  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const storageKey = getStorageKey(key);

  // Check for existing draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: StoredDraft<T> = JSON.parse(raw);
        setHasDraft(true);
        setLastSaved(new Date(parsed.savedAt));
      }
    } catch {
      // Corrupted data — remove it
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const saveDraft = useCallback(() => {
    try {
      const draft: StoredDraft<T> = {
        data: dataRef.current,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(draft));
      setHasDraft(true);
      setLastSaved(new Date(draft.savedAt));
    } catch {
      // localStorage full or unavailable — fail silently
    }
  }, [storageKey]);

  const loadDraft = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed: StoredDraft<T> = JSON.parse(raw);
      return parsed.data;
    } catch {
      return null;
    }
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasDraft(false);
    setLastSaved(null);
  }, [storageKey]);

  // Debounced auto-save on data change
  useEffect(() => {
    if (!enabled) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      saveDraft();
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, delay, enabled, saveDraft]);

  return { hasDraft, lastSaved, loadDraft, clearDraft, saveDraft };
}
