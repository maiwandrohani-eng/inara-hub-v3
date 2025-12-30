import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';

export default function WorkSystemsManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingSystem, setEditingSystem] = useState<any>(null);
  const [selectedSystem, setSelectedSystem] = useState<any>(null);
  const [showAccessRules, setShowAccessRules] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    icon: '',
    order: 0,
    isActive: true,
  });
  const queryClient = useQueryClient();

  const { data: systemsData, isLoading } = useQuery('admin-work-systems', async () => {
    const res = await api.get('/admin/work-systems');
    return res.data;
  });

  const { data: trainingsData } = useQuery('trainings-for-rules', async () => {
    const res = await api.get('/training');
    return res.data;
  });

  const { data: policiesData } = useQuery('policies-for-rules', async () => {
    const res = await api.get('/policies');
    return res.data;
  });

  const systems = systemsData?.systems || [];
  const trainings = trainingsData?.trainings || [];
  const policies = policiesData?.policies || [];

  const createMutation = useMutation(
    async (data: any) => {
      const res = await api.post('/admin/work-systems', data);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-work-systems');
        queryClient.invalidateQueries('work-systems');
        setShowForm(false);
        resetForm();
        alert('Work system created successfully!');
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to create work system');
      },
    }
  );

  const updateMutation = useMutation(
    async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/admin/work-systems/${id}`, data);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-work-systems');
        queryClient.invalidateQueries('work-systems');
        setEditingSystem(null);
        resetForm();
        alert('Work system updated successfully!');
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to update work system');
      },
    }
  );

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      description: '',
      icon: '',
      order: 0,
      isActive: true,
    });
  };

  const handleEdit = (system: any) => {
    setEditingSystem(system);
    setFormData({
      name: system.name,
      url: system.url,
      description: system.description || '',
      icon: system.icon || '',
      order: system.order,
      isActive: system.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSystem) {
      updateMutation.mutate({ id: editingSystem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSystem(null);
    resetForm();
  };

  const handleManageAccessRules = (system: any) => {
    setSelectedSystem(system);
    setShowAccessRules(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Work Systems Management</h2>
        <button
          onClick={() => {
            setEditingSystem(null);
            resetForm();
            setShowForm(true);
          }}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
        >
          + Add Work System
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            {editingSystem ? 'Edit Work System' : 'Create New Work System'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">System Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                placeholder="e.g., Human Resource Management"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">URL *</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                placeholder="https://hr.inara.org"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                placeholder="Brief description of the system"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Icon (optional)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  placeholder="Icon name or URL"
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
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="text-primary-500"
              />
              <label className="text-sm text-gray-200">Active</label>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={createMutation.isLoading || updateMutation.isLoading}
                className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {createMutation.isLoading || updateMutation.isLoading
                  ? 'Saving...'
                  : editingSystem
                  ? 'Update System'
                  : 'Create System'}
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

      {/* Access Rules Management */}
      {showAccessRules && selectedSystem && (
        <AccessRulesManager
          system={selectedSystem}
          trainings={trainings}
          policies={policies}
          onClose={() => {
            setShowAccessRules(false);
            setSelectedSystem(null);
          }}
        />
      )}

      {/* Systems List */}
      <div className="bg-gray-800 rounded-lg shadow border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white">All Work Systems ({systems.length})</h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading work systems...</div>
        ) : systems.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No work systems found</div>
        ) : (
          <div className="divide-y divide-gray-700">
            {systems.map((system: any) => (
              <div key={system.id} className="p-6 hover:bg-gray-700/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-white">{system.name}</h4>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          system.isActive
                            ? 'bg-green-900/30 text-green-300'
                            : 'bg-red-900/30 text-red-300'
                        }`}
                      >
                        {system.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-700 text-gray-300">
                        Order: {system.order}
                      </span>
                    </div>
                    {system.description && (
                      <p className="text-sm text-gray-400 mb-2">{system.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>URL: {system.url}</span>
                      <span>•</span>
                      <span>{system._count?.userAccess || 0} users have access</span>
                      <span>•</span>
                      <span>{system.accessRules?.length || 0} access rules</span>
                    </div>
                    {system.accessRules && system.accessRules.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-medium text-gray-400">Access Rules:</p>
                        {system.accessRules.map((rule: any, idx: number) => (
                          <div key={rule.id || idx} className="text-xs text-gray-500 ml-4">
                            {rule.allowedRoles?.length > 0 && (
                              <span>Roles: {rule.allowedRoles.join(', ')}</span>
                            )}
                            {rule.allowedDepartments?.length > 0 && (
                              <span className="ml-2">
                                Departments: {rule.allowedDepartments.join(', ')}
                              </span>
                            )}
                            {rule.requiredTrainingIds?.length > 0 && (
                              <span className="ml-2">
                                Requires {rule.requiredTrainingIds.length} training(s)
                              </span>
                            )}
                            {rule.requiredPolicyIds?.length > 0 && (
                              <span className="ml-2">
                                Requires {rule.requiredPolicyIds.length} policy/policies
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleManageAccessRules(system)}
                      className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded hover:bg-blue-900/50 text-sm"
                    >
                      Manage Rules
                    </button>
                    <button
                      onClick={() => handleEdit(system)}
                      className="px-3 py-1 bg-primary-900/30 text-primary-300 rounded hover:bg-primary-900/50 text-sm"
                    >
                      Edit
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

// Access Rules Manager Component
function AccessRulesManager({ system, trainings, policies, onClose }: any) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    requiredTrainingIds: [] as string[],
    requiredPolicyIds: [] as string[],
    allowedRoles: [] as string[],
    allowedDepartments: [] as string[],
    allowedCountries: [] as string[],
  });
  const queryClient = useQueryClient();

  const { data: rulesData, refetch } = useQuery(
    ['access-rules', system.id],
    async () => {
      const res = await api.get(`/admin/work-systems/${system.id}/access-rules`);
      return res.data;
    },
    { enabled: !!system.id }
  );

  const rules = rulesData?.rules || [];

  const createRuleMutation = useMutation(
    async (data: any) => {
      const res = await api.post(`/admin/work-systems/${system.id}/access-rules`, data);
      return res.data;
    },
    {
      onSuccess: () => {
        refetch();
        queryClient.invalidateQueries('work-systems');
        setShowForm(false);
        resetForm();
        alert('Access rule created successfully!');
      },
    }
  );

  const deleteRuleMutation = useMutation(
    async (ruleId: string) => {
      const res = await api.delete(`/admin/work-systems/${system.id}/access-rules/${ruleId}`);
      return res.data;
    },
    {
      onSuccess: () => {
        refetch();
        queryClient.invalidateQueries('work-systems');
        alert('Access rule deleted successfully!');
      },
    }
  );

  const resetForm = () => {
    setFormData({
      requiredTrainingIds: [],
      requiredPolicyIds: [],
      allowedRoles: [],
      allowedDepartments: [],
      allowedCountries: [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRuleMutation.mutate(formData);
  };

  const roles = ['ADMIN', 'COUNTRY_DIRECTOR', 'DEPARTMENT_HEAD', 'MANAGER', 'STAFF'];
  const departments = ['HR', 'FINANCE', 'PROCUREMENT', 'PROGRAMS', 'MEAL', 'IT', 'OPERATIONS'];

  return (
    <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">Access Rules: {system.name}</h3>
          <p className="text-sm text-gray-400 mt-1">
            Configure who can access this system and what prerequisites are required
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
        >
          Close
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <h4 className="text-lg font-semibold text-white mb-4">Create Access Rule</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Required Trainings
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-600 rounded p-2 bg-gray-700">
                {trainings.map((training: any) => (
                  <label key={training.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={formData.requiredTrainingIds.includes(training.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            requiredTrainingIds: [...formData.requiredTrainingIds, training.id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            requiredTrainingIds: formData.requiredTrainingIds.filter(
                              (id) => id !== training.id
                            ),
                          });
                        }
                      }}
                      className="text-primary-500"
                    />
                    <span className="text-sm text-gray-200">{training.title}</span>
                  </label>
                ))}
                {trainings.length === 0 && (
                  <p className="text-sm text-gray-400">No trainings available</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Required Policies
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-600 rounded p-2 bg-gray-700">
                {policies.map((policy: any) => (
                  <label key={policy.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={formData.requiredPolicyIds.includes(policy.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            requiredPolicyIds: [...formData.requiredPolicyIds, policy.id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            requiredPolicyIds: formData.requiredPolicyIds.filter(
                              (id) => id !== policy.id
                            ),
                          });
                        }
                      }}
                      className="text-primary-500"
                    />
                    <span className="text-sm text-gray-200">{policy.title}</span>
                  </label>
                ))}
                {policies.length === 0 && (
                  <p className="text-sm text-gray-400">No policies available</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Allowed Roles</label>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <label key={role} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.allowedRoles.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            allowedRoles: [...formData.allowedRoles, role],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            allowedRoles: formData.allowedRoles.filter((r) => r !== role),
                          });
                        }
                      }}
                      className="text-primary-500"
                    />
                    <span className="text-sm text-gray-200">{role.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Allowed Departments
              </label>
              <div className="flex flex-wrap gap-2">
                {departments.map((dept) => (
                  <label key={dept} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.allowedDepartments.includes(dept)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            allowedDepartments: [...formData.allowedDepartments, dept],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            allowedDepartments: formData.allowedDepartments.filter(
                              (d) => d !== dept
                            ),
                          });
                        }
                      }}
                      className="text-primary-500"
                    />
                    <span className="text-sm text-gray-200">{dept}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={createRuleMutation.isLoading}
                className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {createRuleMutation.isLoading ? 'Creating...' : 'Create Rule'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-4 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
        >
          + Add Access Rule
        </button>
      )}

      <div className="space-y-2">
        {rules.length === 0 ? (
          <p className="text-gray-400 text-sm">No access rules configured. Add one to restrict access.</p>
        ) : (
          rules.map((rule: any, idx: number) => (
            <div key={rule.id || idx} className="bg-gray-700 p-4 rounded border border-gray-600">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  {rule.allowedRoles?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-400">Roles: </span>
                      <span className="text-sm text-gray-200">
                        {rule.allowedRoles.map((r: string) => r.replace('_', ' ')).join(', ')}
                      </span>
                    </div>
                  )}
                  {rule.allowedDepartments?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-400">Departments: </span>
                      <span className="text-sm text-gray-200">
                        {rule.allowedDepartments.join(', ')}
                      </span>
                    </div>
                  )}
                  {rule.allowedCountries?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-400">Countries: </span>
                      <span className="text-sm text-gray-200">{rule.allowedCountries.join(', ')}</span>
                    </div>
                  )}
                  {rule.requiredTrainingIds?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-400">
                        Required Trainings ({rule.requiredTrainingIds.length}):
                      </span>
                      <span className="text-sm text-gray-200 ml-2">
                        {rule.requiredTrainingIds
                          .map(
                            (id: string) =>
                              trainings.find((t: any) => t.id === id)?.title || `Training ${id}`
                          )
                          .join(', ')}
                      </span>
                    </div>
                  )}
                  {rule.requiredPolicyIds?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-400">
                        Required Policies ({rule.requiredPolicyIds.length}):
                      </span>
                      <span className="text-sm text-gray-200 ml-2">
                        {rule.requiredPolicyIds
                          .map(
                            (id: string) =>
                              policies.find((p: any) => p.id === id)?.title || `Policy ${id}`
                          )
                          .join(', ')}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this access rule?')) {
                      deleteRuleMutation.mutate(rule.id);
                    }
                  }}
                  className="ml-4 text-red-500 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

