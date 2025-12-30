import { useState, useEffect, useRef } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchTypes, setSearchTypes] = useState<string[]>(['training', 'policy', 'library', 'template']);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery(
    ['search', query, searchTypes.join(',')],
    async () => {
      if (!query.trim()) return { results: [] };
      const res = await api.get(`/search?q=${encodeURIComponent(query)}&types=${searchTypes.join(',')}`);
      return res.data;
    },
    { enabled: query.trim().length > 0 }
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result: any) => {
    setIsOpen(false);
    setQuery('');
    const routes: Record<string, string> = {
      training: '/training',
      policy: '/policies',
      library: '/library',
      template: '/templates',
    };
    navigate(routes[result.type] || '/');
  };

  const results = data?.results || [];

  return (
    <div ref={searchRef} className="relative w-64">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search..."
          className="w-full px-3 py-1.5 pl-9 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-500 dark:placeholder-gray-400"
        />
        <svg
          className="absolute left-2.5 top-1.5 w-4 h-4 text-gray-500 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-600 dark:text-gray-400">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-600 dark:text-gray-400">No results found</div>
          ) : (
            <>
              <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex space-x-2">
                {['training', 'policy', 'library', 'template'].map((type) => (
                  <label key={type} className="flex items-center space-x-1 text-xs text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={searchTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSearchTypes([...searchTypes, type]);
                        } else {
                          setSearchTypes(searchTypes.filter(t => t !== type));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="capitalize">{type}</span>
                  </label>
                ))}
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.map((result: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => handleResultClick(result)}
                    className="p-4 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{result.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {result.description || result.brief}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded capitalize">
                            {result.type}
                          </span>
                          {result.category && (
                            <span className="text-xs text-gray-500">{result.category}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

