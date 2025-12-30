import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
export default function AdvancedFilters({ categories, types, tags, onFilterChange, onSavePreset, savedPresets = [], }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [presetName, setPresetName] = useState('');
    const [showSavePreset, setShowSavePreset] = useState(false);
    const handleCategoryToggle = (value) => {
        const newCategories = selectedCategories.includes(value)
            ? selectedCategories.filter((c) => c !== value)
            : [...selectedCategories, value];
        setSelectedCategories(newCategories);
        updateFilters({ categories: newCategories, types: selectedTypes, tags: selectedTags });
    };
    const handleTypeToggle = (value) => {
        const newTypes = selectedTypes.includes(value)
            ? selectedTypes.filter((t) => t !== value)
            : [...selectedTypes, value];
        setSelectedTypes(newTypes);
        updateFilters({ categories: selectedCategories, types: newTypes, tags: selectedTags });
    };
    const handleTagToggle = (tag) => {
        const newTags = selectedTags.includes(tag)
            ? selectedTags.filter((t) => t !== tag)
            : [...selectedTags, tag];
        setSelectedTags(newTags);
        updateFilters({ categories: selectedCategories, types: selectedTypes, tags: newTags });
    };
    const updateFilters = (filters) => {
        onFilterChange(filters);
    };
    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedTypes([]);
        setSelectedTags([]);
        onFilterChange({ categories: [], types: [], tags: [] });
    };
    const loadPreset = (preset) => {
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
    const hasActiveFilters = selectedCategories.length > 0 || selectedTypes.length > 0 || selectedTags.length > 0;
    return (_jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setIsOpen(!isOpen), className: `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${hasActiveFilters
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-800 text-gray-200 hover:bg-gray-700'}`, children: ["Filters ", hasActiveFilters && `(${selectedCategories.length + selectedTypes.length + selectedTags.length})`] }), isOpen && (_jsxs("div", { className: "absolute top-full left-0 mt-2 w-96 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 z-50 p-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "text-lg font-bold text-white", children: "Advanced Filters" }), _jsx("button", { onClick: () => setIsOpen(false), className: "text-gray-400 hover:text-white", children: "\u2715" })] }), savedPresets.length > 0 && (_jsxs("div", { className: "mb-4 pb-4 border-b border-gray-700", children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Saved Presets" }), _jsx("div", { className: "space-y-1", children: savedPresets.map((preset, idx) => (_jsx("button", { onClick: () => loadPreset(preset), className: "w-full text-left px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded text-gray-200", children: preset.name }, idx))) })] })), categories.length > 0 && (_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Categories" }), _jsx("div", { className: "space-y-2 max-h-32 overflow-y-auto", children: categories.map((category) => (_jsxs("label", { className: "flex items-center space-x-2 text-sm text-gray-200 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: selectedCategories.includes(category.value), onChange: () => handleCategoryToggle(category.value), className: "rounded" }), _jsx("span", { children: category.label })] }, category.id))) })] })), types.length > 0 && (_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Types" }), _jsx("div", { className: "space-y-2 max-h-32 overflow-y-auto", children: types.map((type) => (_jsxs("label", { className: "flex items-center space-x-2 text-sm text-gray-200 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: selectedTypes.includes(type.value), onChange: () => handleTypeToggle(type.value), className: "rounded" }), _jsx("span", { children: type.label })] }, type.id))) })] })), tags.length > 0 && (_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Tags" }), _jsx("div", { className: "flex flex-wrap gap-2 max-h-32 overflow-y-auto", children: tags.map((tag) => (_jsx("button", { onClick: () => handleTagToggle(tag), className: `px-2 py-1 text-xs rounded transition-colors ${selectedTags.includes(tag)
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: tag }, tag))) })] })), _jsxs("div", { className: "flex justify-between items-center pt-4 border-t border-gray-700", children: [_jsx("button", { onClick: clearFilters, className: "text-sm text-gray-400 hover:text-white", children: "Clear All" }), _jsx("div", { className: "flex space-x-2", children: onSavePreset && (_jsx("button", { onClick: () => setShowSavePreset(!showSavePreset), className: "text-sm text-primary-400 hover:text-primary-300", children: "Save Preset" })) })] }), showSavePreset && (_jsxs("div", { className: "mt-4 pt-4 border-t border-gray-700", children: [_jsx("input", { type: "text", value: presetName, onChange: (e) => setPresetName(e.target.value), placeholder: "Preset name", className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg text-sm mb-2" }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx("button", { onClick: () => {
                                            setShowSavePreset(false);
                                            setPresetName('');
                                        }, className: "px-3 py-1 text-sm text-gray-400 hover:text-white", children: "Cancel" }), _jsx("button", { onClick: handleSavePreset, disabled: !presetName.trim(), className: "px-3 py-1 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50", children: "Save" })] })] }))] }))] }));
}
