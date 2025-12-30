import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Ctrl/Cmd + / for help
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        // Could open help modal
      }

      // Escape to close modals/dropdowns
      if (e.key === 'Escape') {
        // Close any open dropdowns
        const dropdowns = document.querySelectorAll('[data-dropdown-open="true"]');
        dropdowns.forEach((dropdown) => {
          dropdown.setAttribute('data-dropdown-open', 'false');
        });
      }

      // Number keys for quick navigation (when not typing)
      if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        if (e.key === '1' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          navigate('/');
        } else if (e.key === '2' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          navigate('/work');
        } else if (e.key === '3' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          navigate('/training');
        } else if (e.key === '4' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          navigate('/policies');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
}

