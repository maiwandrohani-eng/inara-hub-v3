// Reusable View Toggle Component
// Provides grid/list view switching with localStorage persistence

interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export default function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => onViewModeChange('grid')}
        className={`p-2 rounded transition-colors ${
          viewMode === 'grid'
            ? 'bg-primary-500 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
        title="Grid View"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={`p-2 rounded transition-colors ${
          viewMode === 'list'
            ? 'bg-primary-500 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
        title="List View"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
}
