import { useState } from 'react';

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

interface AdvancedFiltersProps {
  categories: FilterOption[];
  types: FilterOption[];
  tags: string[];
  onFilterChange: (filters: any) => void;
  onSavePreset?: (name: string, filters: any) => void;
  savedPresets?: Array<{ name: string; filters: any }>;
}

export default function AdvancedFilters({
  categories,
  types,
  tags,
  onFilterChange,
  onSavePreset,
  savedPresets = [],
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  const handleCategoryToggle = (value: string) => {
    const newCategories = selectedCategories.includes(value)
      ? selectedCategories.filter((c) => c !== value)
      : [...selectedCategories, value];
    setSelectedCategories(newCategories);
    updateFilters({ categories: newCategories, types: selectedTypes, tags: selectedTags });
  };

  const handleTypeToggle = (value: string) => {
    const newTypes = selectedTypes.includes(value)
      ? selectedTypes.filter((t) => t !== value)
      : [...selectedTypes, value];
    setSelectedTypes(newTypes);
    updateFilters({ categories: selectedCategories, types: newTypes, tags: selectedTags });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    updateFilters({ categories: selectedCategories, types: selectedTypes, tags: newTags });
  };

  const updateFilters = (filters: any) => {
    onFilterChange(filters);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedTypes([]);
    setSelectedTags([]);
    onFilterChange({ categories: [], types: [], tags: [] });
  };

  const loadPreset = (preset: any) => {
    setSelectedCategories(preset.filters.categories || []);
    setSelectedTypes(preset.filters.types || []);
    setSelectedTags(preset.filters.tags || []);
    onFilterChange(preset.filters);
  };

  const handleSavePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName, {
        categories: selectedCategories,
        types: selectedTypes,
        tags: selectedTags,
      });
      setPresetName('');
      setShowSavePreset(false);
    }
  };

  const hasActiveFilters =
    selectedCategories.length > 0 || selectedTypes.length > 0 || selectedTags.length > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          hasActiveFilters
            ? 'bg-primary-500 text-white'
            : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
        }`}
      >
        Filters {hasActiveFilters && `(${selectedCategories.length + selectedTypes.length + selectedTags.length})`}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 z-50 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Advanced Filters</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Saved Presets */}
          {savedPresets.length > 0 && (
            <div className="mb-4 pb-4 border-b border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-2">Saved Presets</label>
              <div className="space-y-1">
                {savedPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadPreset(preset)}
                    className="w-full text-left px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded text-gray-200"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Categories</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center space-x-2 text-sm text-gray-200 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.value)}
                      onChange={() => handleCategoryToggle(category.value)}
                      className="rounded"
                    />
                    <span>{category.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Types */}
          {types.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Types</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {types.map((type) => (
                  <label
                    key={type.id}
                    className="flex items-center space-x-2 text-sm text-gray-200 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type.value)}
                      onChange={() => handleTypeToggle(type.value)}
                      className="rounded"
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-700">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-400 hover:text-white"
            >
              Clear All
            </button>
            <div className="flex space-x-2">
              {onSavePreset && (
                <button
                  onClick={() => setShowSavePreset(!showSavePreset)}
                  className="text-sm text-primary-400 hover:text-primary-300"
                >
                  Save Preset
                </button>
              )}
            </div>
          </div>

          {/* Save Preset Form */}
          {showSavePreset && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg text-sm mb-2"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowSavePreset(false);
                    setPresetName('');
                  }}
                  className="px-3 py-1 text-sm text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePreset}
                  disabled={!presetName.trim()}
                  className="px-3 py-1 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

