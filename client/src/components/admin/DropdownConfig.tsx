import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';
import { countries } from '../../data/countries';
import { getCitiesByCountry } from '../../data/cities';

export default function DropdownConfig() {
  const [activeType, setActiveType] = useState('department');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
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

  const { data, isLoading } = useQuery(
    ['config', activeType],
    async () => {
      const res = await api.get(`/config/${activeType}`);
      return res.data;
    },
    { enabled: true }
  );

  const configs = data?.configs || [];

  const createMutation = useMutation(
    async (data: any) => {
      const submitData: any = {
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
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['config', activeType] });
        setShowForm(false);
        resetForm();
        alert('Item added successfully!');
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to add item');
      },
    }
  );

  const updateMutation = useMutation(
    async ({ id, data }: { id: string; data: any }) => {
      const updateData: any = { ...data };
      
      // Add metadata for cities (country code)
      if (activeType === 'city' && formData.selectedCountry) {
        updateData.metadata = { country: formData.selectedCountry };
      }
      
      // Remove temporary fields before submission
      delete updateData.selectedCountry;
      delete updateData.selectedCity;
      
      const res = await api.put(`/config/${id}`, updateData);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['config', activeType] });
        setEditingItem(null);
        resetForm();
        alert('Item updated successfully!');
      },
    }
  );

  const deleteMutation = useMutation(
    async (id: string) => {
      const res = await api.delete(`/config/${id}`);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['config', activeType] });
        alert('Item deleted successfully!');
      },
    }
  );

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
    } else if (activeType === 'city' && formData.selectedCountry && formData.selectedCity) {
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

  const handleEdit = (item: any) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
    resetForm();
  };

  const handleDelete = (item: any) => {
    if (window.confirm(`Are you sure you want to delete "${item.value}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Dropdown Configuration</h2>
        <button
          onClick={() => {
            setEditingItem(null);
            resetForm();
            setShowForm(true);
          }}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
        >
          + Add Item
        </button>
      </div>

      {/* Type Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {configTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => {
                setActiveType(type.value);
                setShowForm(false);
                setEditingItem(null);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeType === type.value
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-gray-500 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              {type.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            {editingItem ? 'Edit Item' : `Add ${configTypes.find((t) => t.value === activeType)?.label} Item`}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Country Selection - Show dropdown for countries */}
            {activeType === 'country' && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Select Country *</label>
                <select
                  value={formData.value}
                  onChange={(e) => {
                    const country = countries.find(c => c.name === e.target.value);
                    setFormData({
                      ...formData,
                      value: e.target.value,
                      key: country?.code || '',
                      description: country ? `Country: ${country.name} (ISO: ${country.code}, ${country.iso2})` : '',
                    });
                  }}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                >
                  <option value="">-- Select a Country --</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* City Selection - Show country dropdown first, then city dropdown */}
            {activeType === 'city' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Select Country *</label>
                  <select
                    value={formData.selectedCountry}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        selectedCountry: e.target.value,
                        selectedCity: '', // Reset city when country changes
                        key: '',
                        value: '',
                        description: '',
                      });
                    }}
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  >
                    <option value="">-- Select a Country First --</option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name} ({country.code})
                      </option>
                    ))}
                  </select>
                </div>
                {formData.selectedCountry && (
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Select City *</label>
                    <select
                      value={formData.selectedCity}
                      onChange={(e) => {
                        const cities = getCitiesByCountry(formData.selectedCountry);
                        const city = cities.find(c => c.name === e.target.value);
                        setFormData({
                          ...formData,
                          selectedCity: e.target.value,
                          value: e.target.value,
                          key: city?.code || e.target.value.substring(0, 3).toUpperCase(),
                          description: city ? `City: ${city.name}, ${countries.find(c => c.code === formData.selectedCountry)?.name || ''}` : '',
                        });
                      }}
                      required
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                    >
                      <option value="">-- Select a City --</option>
                      {getCitiesByCountry(formData.selectedCountry).map((city) => (
                        <option key={city.name} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                    {getCitiesByCountry(formData.selectedCountry).length === 0 && (
                      <p className="mt-2 text-sm text-yellow-400">
                        No cities found for this country. You can manually enter the city below.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Manual entry fields for non-country/city types or as fallback */}
            {(activeType !== 'country' && activeType !== 'city') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Key/Code *</label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                    placeholder="e.g., HR, FINANCE"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Display Value *</label>
                  <input
                    type="text"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                    placeholder="e.g., Human Resources, Finance"
                  />
                </div>
              </div>
            )}

            {/* Show key and value fields for country/city (read-only or editable) */}
            {(activeType === 'country' || activeType === 'city') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Key/Code *</label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                    placeholder="Auto-generated"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Display Value *</label>
                  <input
                    type="text"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                    placeholder="Auto-generated"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Display Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={createMutation.isLoading || updateMutation.isLoading}
                className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {createMutation.isLoading || updateMutation.isLoading
                  ? 'Saving...'
                  : editingItem
                  ? 'Update Item'
                  : 'Add Item'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      <div className="bg-gray-800 rounded-lg shadow border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white">
            {configTypes.find((t) => t.value === activeType)?.label} ({configs.length})
          </h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : configs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No items found. Add one to get started.</div>
        ) : (
          <div className="divide-y divide-gray-700">
            {configs.map((item: any) => (
              <div key={item.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="text-sm font-medium text-gray-400">{item.key}</span>
                      <span className="text-lg font-semibold text-white">{item.value}</span>
                      <span className="text-xs text-gray-500">Order: {item.order}</span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-400">{item.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-3 py-1 bg-primary-900/30 text-primary-300 rounded hover:bg-primary-900/50 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="px-3 py-1 bg-red-900/30 text-red-300 rounded hover:bg-red-900/50 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

