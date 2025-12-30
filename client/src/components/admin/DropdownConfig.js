import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';
import { countries } from '../../data/countries';
import { getCitiesByCountry } from '../../data/cities';
export default function DropdownConfig() {
    const [activeType, setActiveType] = useState('department');
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        key: '',
        value: '',
        description: '',
        order: 0,
        selectedCountry: '', // For city selection
        selectedCity: '', // For city selection
    });
    const queryClient = useQueryClient();
    const configTypes = [
        { value: 'department', label: 'Departments' },
        { value: 'country', label: 'Countries' },
        { value: 'city', label: 'Cities' },
        { value: 'role', label: 'Roles' },
    ];
    const { data, isLoading } = useQuery(['config', activeType], async () => {
        const res = await api.get(`/config/${activeType}`);
        return res.data;
    }, { enabled: true });
    const configs = data?.configs || [];
    const createMutation = useMutation(async (data) => {
        const submitData = {
            ...data,
            type: activeType,
        };
        // Add metadata for cities (country code)
        if (activeType === 'city' && formData.selectedCountry) {
            submitData.metadata = { country: formData.selectedCountry };
        }
        // Remove temporary fields before submission
        delete submitData.selectedCountry;
        delete submitData.selectedCity;
        const res = await api.post('/config', submitData);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['config', activeType] });
            setShowForm(false);
            resetForm();
            alert('Item added successfully!');
        },
        onError: (error) => {
            alert(error.response?.data?.message || 'Failed to add item');
        },
    });
    const updateMutation = useMutation(async ({ id, data }) => {
        const updateData = { ...data };
        // Add metadata for cities (country code)
        if (activeType === 'city' && formData.selectedCountry) {
            updateData.metadata = { country: formData.selectedCountry };
        }
        // Remove temporary fields before submission
        delete updateData.selectedCountry;
        delete updateData.selectedCity;
        const res = await api.put(`/config/${id}`, updateData);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['config', activeType] });
            setEditingItem(null);
            resetForm();
            alert('Item updated successfully!');
        },
    });
    const deleteMutation = useMutation(async (id) => {
        const res = await api.delete(`/config/${id}`);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['config', activeType] });
            alert('Item deleted successfully!');
        },
    });
    const resetForm = () => {
        setFormData({
            key: '',
            value: '',
            description: '',
            order: 0,
            selectedCountry: '',
            selectedCity: '',
        });
    };
    // Auto-generate fields when country or city is selected
    useEffect(() => {
        if (activeType === 'country' && formData.value) {
            // Find the selected country
            const country = countries.find(c => c.name === formData.value);
            if (country) {
                setFormData(prev => ({
                    ...prev,
                    key: country.code,
                    description: `Country: ${country.name} (ISO: ${country.code}, ${country.iso2})`,
                }));
            }
        }
        else if (activeType === 'city' && formData.selectedCountry && formData.selectedCity) {
            // Find the selected city
            const cities = getCitiesByCountry(formData.selectedCountry);
            const city = cities.find(c => c.name === formData.selectedCity);
            if (city) {
                setFormData(prev => ({
                    ...prev,
                    key: city.code || city.name.substring(0, 3).toUpperCase(),
                    value: city.name,
                    description: `City: ${city.name}, ${countries.find(c => c.code === formData.selectedCountry)?.name || ''}`,
                }));
            }
        }
    }, [formData.value, formData.selectedCountry, formData.selectedCity, activeType]);
    const handleEdit = (item) => {
        setEditingItem(item);
        const metadata = item.metadata || {};
        setFormData({
            key: item.key,
            value: item.value,
            description: item.description || '',
            order: item.order,
            selectedCountry: metadata.country || '',
            selectedCity: activeType === 'city' ? item.value : '',
        });
        setShowForm(true);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data: formData });
        }
        else {
            createMutation.mutate(formData);
        }
    };
    const handleCancel = () => {
        setShowForm(false);
        setEditingItem(null);
        resetForm();
    };
    const handleDelete = (item) => {
        if (window.confirm(`Are you sure you want to delete "${item.value}"?`)) {
            deleteMutation.mutate(item.id);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "Dropdown Configuration" }), _jsx("button", { onClick: () => {
                            setEditingItem(null);
                            resetForm();
                            setShowForm(true);
                        }, className: "bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600", children: "+ Add Item" })] }), _jsx("div", { className: "border-b border-gray-700", children: _jsx("nav", { className: "flex space-x-8", children: configTypes.map((type) => (_jsx("button", { onClick: () => {
                            setActiveType(type.value);
                            setShowForm(false);
                            setEditingItem(null);
                        }, className: `py-4 px-1 border-b-2 font-medium text-sm ${activeType === type.value
                            ? 'border-primary-500 text-primary-500'
                            : 'border-transparent text-gray-500 hover:text-gray-200 hover:border-gray-600'}`, children: type.label }, type.value))) }) }), showForm && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: editingItem ? 'Edit Item' : `Add ${configTypes.find((t) => t.value === activeType)?.label} Item` }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [activeType === 'country' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Select Country *" }), _jsxs("select", { value: formData.value, onChange: (e) => {
                                            const country = countries.find(c => c.name === e.target.value);
                                            setFormData({
                                                ...formData,
                                                value: e.target.value,
                                                key: country?.code || '',
                                                description: country ? `Country: ${country.name} (ISO: ${country.code}, ${country.iso2})` : '',
                                            });
                                        }, required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "", children: "-- Select a Country --" }), countries.map((country) => (_jsxs("option", { value: country.name, children: [country.name, " (", country.code, ")"] }, country.code)))] })] })), activeType === 'city' && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Select Country *" }), _jsxs("select", { value: formData.selectedCountry, onChange: (e) => {
                                                    setFormData({
                                                        ...formData,
                                                        selectedCountry: e.target.value,
                                                        selectedCity: '', // Reset city when country changes
                                                        key: '',
                                                        value: '',
                                                        description: '',
                                                    });
                                                }, required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "", children: "-- Select a Country First --" }), countries.map((country) => (_jsxs("option", { value: country.code, children: [country.name, " (", country.code, ")"] }, country.code)))] })] }), formData.selectedCountry && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Select City *" }), _jsxs("select", { value: formData.selectedCity, onChange: (e) => {
                                                    const cities = getCitiesByCountry(formData.selectedCountry);
                                                    const city = cities.find(c => c.name === e.target.value);
                                                    setFormData({
                                                        ...formData,
                                                        selectedCity: e.target.value,
                                                        value: e.target.value,
                                                        key: city?.code || e.target.value.substring(0, 3).toUpperCase(),
                                                        description: city ? `City: ${city.name}, ${countries.find(c => c.code === formData.selectedCountry)?.name || ''}` : '',
                                                    });
                                                }, required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "", children: "-- Select a City --" }), getCitiesByCountry(formData.selectedCountry).map((city) => (_jsx("option", { value: city.name, children: city.name }, city.name)))] }), getCitiesByCountry(formData.selectedCountry).length === 0 && (_jsx("p", { className: "mt-2 text-sm text-yellow-400", children: "No cities found for this country. You can manually enter the city below." }))] }))] })), (activeType !== 'country' && activeType !== 'city') && (_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Key/Code *" }), _jsx("input", { type: "text", value: formData.key, onChange: (e) => setFormData({ ...formData, key: e.target.value.toUpperCase() }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", placeholder: "e.g., HR, FINANCE" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Display Value *" }), _jsx("input", { type: "text", value: formData.value, onChange: (e) => setFormData({ ...formData, value: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", placeholder: "e.g., Human Resources, Finance" })] })] })), (activeType === 'country' || activeType === 'city') && (_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Key/Code *" }), _jsx("input", { type: "text", value: formData.key, onChange: (e) => setFormData({ ...formData, key: e.target.value.toUpperCase() }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", placeholder: "Auto-generated" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Display Value *" }), _jsx("input", { type: "text", value: formData.value, onChange: (e) => setFormData({ ...formData, value: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", placeholder: "Auto-generated" })] })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Description" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), rows: 2, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", placeholder: "Optional description" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Display Order" }), _jsx("input", { type: "number", value: formData.order, onChange: (e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { type: "submit", disabled: createMutation.isLoading || updateMutation.isLoading, className: "flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50", children: createMutation.isLoading || updateMutation.isLoading
                                            ? 'Saving...'
                                            : editingItem
                                                ? 'Update Item'
                                                : 'Add Item' }), _jsx("button", { type: "button", onClick: handleCancel, className: "px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600", children: "Cancel" })] })] })] })), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 overflow-hidden", children: [_jsx("div", { className: "p-4 border-b border-gray-700", children: _jsxs("h3", { className: "text-lg font-bold text-white", children: [configTypes.find((t) => t.value === activeType)?.label, " (", configs.length, ")"] }) }), isLoading ? (_jsx("div", { className: "p-8 text-center text-gray-400", children: "Loading..." })) : configs.length === 0 ? (_jsx("div", { className: "p-8 text-center text-gray-400", children: "No items found. Add one to get started." })) : (_jsx("div", { className: "divide-y divide-gray-700", children: configs.map((item) => (_jsx("div", { className: "p-4 hover:bg-gray-700/50 transition-colors", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-1", children: [_jsx("span", { className: "text-sm font-medium text-gray-400", children: item.key }), _jsx("span", { className: "text-lg font-semibold text-white", children: item.value }), _jsxs("span", { className: "text-xs text-gray-500", children: ["Order: ", item.order] })] }), item.description && (_jsx("p", { className: "text-sm text-gray-400", children: item.description }))] }), _jsxs("div", { className: "flex space-x-2 ml-4", children: [_jsx("button", { onClick: () => handleEdit(item), className: "px-3 py-1 bg-primary-900/30 text-primary-300 rounded hover:bg-primary-900/50 text-sm", children: "Edit" }), _jsx("button", { onClick: () => handleDelete(item), className: "px-3 py-1 bg-red-900/30 text-red-300 rounded hover:bg-red-900/50 text-sm", children: "Delete" })] })] }) }, item.id))) }))] })] }));
}
