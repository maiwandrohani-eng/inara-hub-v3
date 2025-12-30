import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';
export default function WorkSystemsManagement() {
    const [showForm, setShowForm] = useState(false);
    const [editingSystem, setEditingSystem] = useState(null);
    const [selectedSystem, setSelectedSystem] = useState(null);
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
    const createMutation = useMutation(async (data) => {
        const res = await api.post('/admin/work-systems', data);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-work-systems');
            queryClient.invalidateQueries('work-systems');
            setShowForm(false);
            resetForm();
            alert('Work system created successfully!');
        },
        onError: (error) => {
            alert(error.response?.data?.message || 'Failed to create work system');
        },
    });
    const updateMutation = useMutation(async ({ id, data }) => {
        const res = await api.put(`/admin/work-systems/${id}`, data);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-work-systems');
            queryClient.invalidateQueries('work-systems');
            setEditingSystem(null);
            resetForm();
            alert('Work system updated successfully!');
        },
        onError: (error) => {
            alert(error.response?.data?.message || 'Failed to update work system');
        },
    });
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
    const handleEdit = (system) => {
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
    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingSystem) {
            updateMutation.mutate({ id: editingSystem.id, data: formData });
        }
        else {
            createMutation.mutate(formData);
        }
    };
    const handleCancel = () => {
        setShowForm(false);
        setEditingSystem(null);
        resetForm();
    };
    const handleManageAccessRules = (system) => {
        setSelectedSystem(system);
        setShowAccessRules(true);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "Work Systems Management" }), _jsx("button", { onClick: () => {
                            setEditingSystem(null);
                            resetForm();
                            setShowForm(true);
                        }, className: "bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600", children: "+ Add Work System" })] }), showForm && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: editingSystem ? 'Edit Work System' : 'Create New Work System' }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "System Name *" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", placeholder: "e.g., Human Resource Management" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "URL *" }), _jsx("input", { type: "url", value: formData.url, onChange: (e) => setFormData({ ...formData, url: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", placeholder: "https://hr.inara.org" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Description" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), rows: 3, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", placeholder: "Brief description of the system" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Icon (optional)" }), _jsx("input", { type: "text", value: formData.icon, onChange: (e) => setFormData({ ...formData, icon: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", placeholder: "Icon name or URL" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Display Order" }), _jsx("input", { type: "number", value: formData.order, onChange: (e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: formData.isActive, onChange: (e) => setFormData({ ...formData, isActive: e.target.checked }), className: "text-primary-500" }), _jsx("label", { className: "text-sm text-gray-200", children: "Active" })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { type: "submit", disabled: createMutation.isLoading || updateMutation.isLoading, className: "flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50", children: createMutation.isLoading || updateMutation.isLoading
                                            ? 'Saving...'
                                            : editingSystem
                                                ? 'Update System'
                                                : 'Create System' }), _jsx("button", { type: "button", onClick: handleCancel, className: "px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600", children: "Cancel" })] })] })] })), showAccessRules && selectedSystem && (_jsx(AccessRulesManager, { system: selectedSystem, trainings: trainings, policies: policies, onClose: () => {
                    setShowAccessRules(false);
                    setSelectedSystem(null);
                } })), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 overflow-hidden", children: [_jsx("div", { className: "p-4 border-b border-gray-700", children: _jsxs("h3", { className: "text-lg font-bold text-white", children: ["All Work Systems (", systems.length, ")"] }) }), isLoading ? (_jsx("div", { className: "p-8 text-center text-gray-400", children: "Loading work systems..." })) : systems.length === 0 ? (_jsx("div", { className: "p-8 text-center text-gray-400", children: "No work systems found" })) : (_jsx("div", { className: "divide-y divide-gray-700", children: systems.map((system) => (_jsx("div", { className: "p-6 hover:bg-gray-700/50 transition-colors", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-2", children: [_jsx("h4", { className: "text-lg font-semibold text-white", children: system.name }), _jsx("span", { className: `px-2 py-1 text-xs font-medium rounded ${system.isActive
                                                            ? 'bg-green-900/30 text-green-300'
                                                            : 'bg-red-900/30 text-red-300'}`, children: system.isActive ? 'Active' : 'Inactive' }), _jsxs("span", { className: "px-2 py-1 text-xs font-medium rounded bg-gray-700 text-gray-300", children: ["Order: ", system.order] })] }), system.description && (_jsx("p", { className: "text-sm text-gray-400 mb-2", children: system.description })), _jsxs("div", { className: "flex items-center space-x-4 text-sm text-gray-400", children: [_jsxs("span", { children: ["URL: ", system.url] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: [system._count?.userAccess || 0, " users have access"] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: [system.accessRules?.length || 0, " access rules"] })] }), system.accessRules && system.accessRules.length > 0 && (_jsxs("div", { className: "mt-3 space-y-1", children: [_jsx("p", { className: "text-xs font-medium text-gray-400", children: "Access Rules:" }), system.accessRules.map((rule, idx) => (_jsxs("div", { className: "text-xs text-gray-500 ml-4", children: [rule.allowedRoles?.length > 0 && (_jsxs("span", { children: ["Roles: ", rule.allowedRoles.join(', ')] })), rule.allowedDepartments?.length > 0 && (_jsxs("span", { className: "ml-2", children: ["Departments: ", rule.allowedDepartments.join(', ')] })), rule.requiredTrainingIds?.length > 0 && (_jsxs("span", { className: "ml-2", children: ["Requires ", rule.requiredTrainingIds.length, " training(s)"] })), rule.requiredPolicyIds?.length > 0 && (_jsxs("span", { className: "ml-2", children: ["Requires ", rule.requiredPolicyIds.length, " policy/policies"] }))] }, rule.id || idx)))] }))] }), _jsxs("div", { className: "flex space-x-2 ml-4", children: [_jsx("button", { onClick: () => handleManageAccessRules(system), className: "px-3 py-1 bg-blue-900/30 text-blue-300 rounded hover:bg-blue-900/50 text-sm", children: "Manage Rules" }), _jsx("button", { onClick: () => handleEdit(system), className: "px-3 py-1 bg-primary-900/30 text-primary-300 rounded hover:bg-primary-900/50 text-sm", children: "Edit" })] })] }) }, system.id))) }))] })] }));
}
// Access Rules Manager Component
function AccessRulesManager({ system, trainings, policies, onClose }) {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        requiredTrainingIds: [],
        requiredPolicyIds: [],
        allowedRoles: [],
        allowedDepartments: [],
        allowedCountries: [],
    });
    const queryClient = useQueryClient();
    const { data: rulesData, refetch } = useQuery(['access-rules', system.id], async () => {
        const res = await api.get(`/admin/work-systems/${system.id}/access-rules`);
        return res.data;
    }, { enabled: !!system.id });
    const rules = rulesData?.rules || [];
    const createRuleMutation = useMutation(async (data) => {
        const res = await api.post(`/admin/work-systems/${system.id}/access-rules`, data);
        return res.data;
    }, {
        onSuccess: () => {
            refetch();
            queryClient.invalidateQueries('work-systems');
            setShowForm(false);
            resetForm();
            alert('Access rule created successfully!');
        },
    });
    const deleteRuleMutation = useMutation(async (ruleId) => {
        const res = await api.delete(`/admin/work-systems/${system.id}/access-rules/${ruleId}`);
        return res.data;
    }, {
        onSuccess: () => {
            refetch();
            queryClient.invalidateQueries('work-systems');
            alert('Access rule deleted successfully!');
        },
    });
    const resetForm = () => {
        setFormData({
            requiredTrainingIds: [],
            requiredPolicyIds: [],
            allowedRoles: [],
            allowedDepartments: [],
            allowedCountries: [],
        });
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        createRuleMutation.mutate(formData);
    };
    const roles = ['ADMIN', 'COUNTRY_DIRECTOR', 'DEPARTMENT_HEAD', 'MANAGER', 'STAFF'];
    const departments = ['HR', 'FINANCE', 'PROCUREMENT', 'PROGRAMS', 'MEAL', 'IT', 'OPERATIONS'];
    return (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-xl font-bold text-white", children: ["Access Rules: ", system.name] }), _jsx("p", { className: "text-sm text-gray-400 mt-1", children: "Configure who can access this system and what prerequisites are required" })] }), _jsx("button", { onClick: onClose, className: "px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600", children: "Close" })] }), showForm && (_jsxs("div", { className: "mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600", children: [_jsx("h4", { className: "text-lg font-semibold text-white mb-4", children: "Create Access Rule" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-2", children: "Required Trainings" }), _jsxs("div", { className: "max-h-40 overflow-y-auto border border-gray-600 rounded p-2 bg-gray-700", children: [trainings.map((training) => (_jsxs("label", { className: "flex items-center space-x-2 py-1", children: [_jsx("input", { type: "checkbox", checked: formData.requiredTrainingIds.includes(training.id), onChange: (e) => {
                                                            if (e.target.checked) {
                                                                setFormData({
                                                                    ...formData,
                                                                    requiredTrainingIds: [...formData.requiredTrainingIds, training.id],
                                                                });
                                                            }
                                                            else {
                                                                setFormData({
                                                                    ...formData,
                                                                    requiredTrainingIds: formData.requiredTrainingIds.filter((id) => id !== training.id),
                                                                });
                                                            }
                                                        }, className: "text-primary-500" }), _jsx("span", { className: "text-sm text-gray-200", children: training.title })] }, training.id))), trainings.length === 0 && (_jsx("p", { className: "text-sm text-gray-400", children: "No trainings available" }))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-2", children: "Required Policies" }), _jsxs("div", { className: "max-h-40 overflow-y-auto border border-gray-600 rounded p-2 bg-gray-700", children: [policies.map((policy) => (_jsxs("label", { className: "flex items-center space-x-2 py-1", children: [_jsx("input", { type: "checkbox", checked: formData.requiredPolicyIds.includes(policy.id), onChange: (e) => {
                                                            if (e.target.checked) {
                                                                setFormData({
                                                                    ...formData,
                                                                    requiredPolicyIds: [...formData.requiredPolicyIds, policy.id],
                                                                });
                                                            }
                                                            else {
                                                                setFormData({
                                                                    ...formData,
                                                                    requiredPolicyIds: formData.requiredPolicyIds.filter((id) => id !== policy.id),
                                                                });
                                                            }
                                                        }, className: "text-primary-500" }), _jsx("span", { className: "text-sm text-gray-200", children: policy.title })] }, policy.id))), policies.length === 0 && (_jsx("p", { className: "text-sm text-gray-400", children: "No policies available" }))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-2", children: "Allowed Roles" }), _jsx("div", { className: "flex flex-wrap gap-2", children: roles.map((role) => (_jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: formData.allowedRoles.includes(role), onChange: (e) => {
                                                        if (e.target.checked) {
                                                            setFormData({
                                                                ...formData,
                                                                allowedRoles: [...formData.allowedRoles, role],
                                                            });
                                                        }
                                                        else {
                                                            setFormData({
                                                                ...formData,
                                                                allowedRoles: formData.allowedRoles.filter((r) => r !== role),
                                                            });
                                                        }
                                                    }, className: "text-primary-500" }), _jsx("span", { className: "text-sm text-gray-200", children: role.replace('_', ' ') })] }, role))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-2", children: "Allowed Departments" }), _jsx("div", { className: "flex flex-wrap gap-2", children: departments.map((dept) => (_jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: formData.allowedDepartments.includes(dept), onChange: (e) => {
                                                        if (e.target.checked) {
                                                            setFormData({
                                                                ...formData,
                                                                allowedDepartments: [...formData.allowedDepartments, dept],
                                                            });
                                                        }
                                                        else {
                                                            setFormData({
                                                                ...formData,
                                                                allowedDepartments: formData.allowedDepartments.filter((d) => d !== dept),
                                                            });
                                                        }
                                                    }, className: "text-primary-500" }), _jsx("span", { className: "text-sm text-gray-200", children: dept })] }, dept))) })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { type: "submit", disabled: createRuleMutation.isLoading, className: "flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50", children: createRuleMutation.isLoading ? 'Creating...' : 'Create Rule' }), _jsx("button", { type: "button", onClick: () => {
                                            setShowForm(false);
                                            resetForm();
                                        }, className: "px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600", children: "Cancel" })] })] })] })), !showForm && (_jsx("button", { onClick: () => setShowForm(true), className: "mb-4 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600", children: "+ Add Access Rule" })), _jsx("div", { className: "space-y-2", children: rules.length === 0 ? (_jsx("p", { className: "text-gray-400 text-sm", children: "No access rules configured. Add one to restrict access." })) : (rules.map((rule, idx) => (_jsx("div", { className: "bg-gray-700 p-4 rounded border border-gray-600", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex-1 space-y-2", children: [rule.allowedRoles?.length > 0 && (_jsxs("div", { children: [_jsx("span", { className: "text-xs font-medium text-gray-400", children: "Roles: " }), _jsx("span", { className: "text-sm text-gray-200", children: rule.allowedRoles.map((r) => r.replace('_', ' ')).join(', ') })] })), rule.allowedDepartments?.length > 0 && (_jsxs("div", { children: [_jsx("span", { className: "text-xs font-medium text-gray-400", children: "Departments: " }), _jsx("span", { className: "text-sm text-gray-200", children: rule.allowedDepartments.join(', ') })] })), rule.allowedCountries?.length > 0 && (_jsxs("div", { children: [_jsx("span", { className: "text-xs font-medium text-gray-400", children: "Countries: " }), _jsx("span", { className: "text-sm text-gray-200", children: rule.allowedCountries.join(', ') })] })), rule.requiredTrainingIds?.length > 0 && (_jsxs("div", { children: [_jsxs("span", { className: "text-xs font-medium text-gray-400", children: ["Required Trainings (", rule.requiredTrainingIds.length, "):"] }), _jsx("span", { className: "text-sm text-gray-200 ml-2", children: rule.requiredTrainingIds
                                                    .map((id) => trainings.find((t) => t.id === id)?.title || `Training ${id}`)
                                                    .join(', ') })] })), rule.requiredPolicyIds?.length > 0 && (_jsxs("div", { children: [_jsxs("span", { className: "text-xs font-medium text-gray-400", children: ["Required Policies (", rule.requiredPolicyIds.length, "):"] }), _jsx("span", { className: "text-sm text-gray-200 ml-2", children: rule.requiredPolicyIds
                                                    .map((id) => policies.find((p) => p.id === id)?.title || `Policy ${id}`)
                                                    .join(', ') })] }))] }), _jsx("button", { onClick: () => {
                                    if (window.confirm('Are you sure you want to delete this access rule?')) {
                                        deleteRuleMutation.mutate(rule.id);
                                    }
                                }, className: "ml-4 text-red-500 hover:text-red-700 text-sm", children: "Delete" })] }) }, rule.id || idx)))) })] }));
}
