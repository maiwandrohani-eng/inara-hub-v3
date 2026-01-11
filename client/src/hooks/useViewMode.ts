// Custom hook for managing view mode with localStorage persistence
import { useState, useEffect } from 'react';

export function useViewMode(pageKey: string, defaultMode: 'grid' | 'list' = 'grid') {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultMode);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`viewMode_${pageKey}`);
    if (saved === 'grid' || saved === 'list') {
      setViewMode(saved);
    }
  }, [pageKey]);

  // Save to localStorage when viewMode changes
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem(`viewMode_${pageKey}`, mode);
  };

  return [viewMode, handleViewModeChange] as const;
}
