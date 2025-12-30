import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';
export default function UserManagement() {
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        whatsapp: '',
        role: 'STAFF',
        department: '',
        country: '',
        city: '',
        address: '',
        clearance: '',
    });
    const queryClient = useQueryClient();
    // Fetch configured dropdowns
    const { data: departmentsData } = useQuery('config-departments-admin', async () => {
        try {
            const res = await api.get('/config/department');
            return res.data;
        }
        catch {
            return { configs: [] };
        }
    });
    const { data: countriesData } = useQuery('config-countries-admin', async () => {
        try {
            const res = await api.get('/config/country');
            return res.data;
        }
        catch {
            return { configs: [] };
        }
    });
    const { data: citiesData } = useQuery('config-cities-admin', async () => {
        try {
            const res = await api.get('/config/city');
            return res.data;
        }
        catch {
            return { configs: [] };
        }
    });
    const configuredDepartments = departmentsData?.configs || [];
    const configuredCountries = countriesData?.configs || [];
    const configuredCities = citiesData?.configs || [];
    // Fallback to enum if no config
    const departments = configuredDepartments.length > 0
        ? configuredDepartments.map((d) => d.key || d.value)
        : ['HR', 'FINANCE', 'PROCUREMENT', 'PROGRAMS', 'MEAL', 'IT', 'OPERATIONS'];
    const { data, isLoading } = useQuery('admin-users', async () => {
        const res = await api.get('/admin/users');
        return res.data;
    });
    const users = data?.users || [];
    const filteredUsers = users.filter((user) => {
        const matchesSearch = user.email.toLowerCase().includes(search.toLowerCase()) ||
            user.firstName.toLowerCase().includes(search.toLowerCase()) ||
            user.lastName.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && user.isActive) ||
            (statusFilter === 'pending' && !user.isActive);
        return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
    });
    const createMutation = useMutation(async (data) => {
        const res = await api.post('/auth/register', data);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-users');
            setShowForm(false);
            resetForm();
            alert('User created successfully!');
        },
        onError: (error) => {
            alert(error.response?.data?.message || 'Failed to create user');
        },
    });
    const updateMutation = useMutation(async ({ id, data }) => {
        const res = await api.put(`/admin/users/${id}`, data);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-users');
            setEditingUser(null);
            resetForm();
            alert('User updated successfully!');
        },
        onError: (error) => {
            alert(error.response?.data?.message || 'Failed to update user');
        },
    });
    const deleteMutation = useMutation(async (id) => {
        // Deactivate instead of delete
        const res = await api.put(`/admin/users/${id}`, { isActive: false });
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-users');
            alert('User deactivated successfully!');
        },
        onError: (error) => {
            alert(error.response?.data?.message || 'Failed to deactivate user');
        },
    });
    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            phone: '',
            whatsapp: '',
            role: 'STAFF',
            department: '',
            country: '',
            city: '',
            address: '',
            clearance: '',
        });
    };
    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            password: '', // Don't pre-fill password
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone || '',
            whatsapp: user.whatsapp || '',
            role: user.role,
            department: user.department || '',
            country: user.country || '',
            city: user.city || '',
            address: user.address || '',
            clearance: user.clearance || '',
        });
        setShowForm(true);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        const submitData = { ...formData };
        // Remove password if empty (for updates)
        if (editingUser && !submitData.password) {
            delete submitData.password;
        }
        if (editingUser) {
            updateMutation.mutate({ id: editingUser.id, data: submitData });
        }
        else {
            if (!submitData.password) {
                alert('Password is required for new users');
                return;
            }
            createMutation.mutate(submitData);
        }
    };
    const handleDelete = (user) => {
        if (window.confirm(`Are you sure you want to deactivate ${user.firstName} ${user.lastName}?`)) {
            deleteMutation.mutate(user.id);
        }
    };
    const handleCancel = () => {
        setShowForm(false);
        setEditingUser(null);
        resetForm();
    };
    const roles = ['ADMIN', 'COUNTRY_DIRECTOR', 'DEPARTMENT_HEAD', 'MANAGER', 'STAFF'];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "User Management" }), _jsx("button", { onClick: () => {
                            setEditingUser(null);
                            resetForm();
                            setShowForm(true);
                        }, className: "bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600", children: "+ Add User" })] }), _jsx("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-4", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsx("input", { type: "text", value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search by name or email...", className: "px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400" }), _jsxs("select", { value: roleFilter, onChange: (e) => setRoleFilter(e.target.value), className: "px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500", children: [_jsx("option", { value: "all", children: "All Roles" }), roles.map((role) => (_jsx("option", { value: role, children: role.replace('_', ' ') }, role)))] }), _jsxs("select", { value: departmentFilter, onChange: (e) => setDepartmentFilter(e.target.value), className: "px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500", children: [_jsx("option", { value: "all", children: "All Departments" }), departments.map((dept) => (_jsx("option", { value: dept, children: dept }, dept)))] }), _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500", children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "pending", children: "Pending Approval" })] })] }) }), showForm && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: editingUser ? 'Edit User' : 'Create New User' }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "First Name *" }), _jsx("input", { type: "text", value: formData.firstName, onChange: (e) => setFormData({ ...formData, firstName: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Last Name *" }), _jsx("input", { type: "text", value: formData.lastName, onChange: (e) => setFormData({ ...formData, lastName: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Email *" }), _jsx("input", { type: "email", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), required: true, disabled: !!editingUser, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Phone Number" }), _jsx("input", { type: "tel", value: formData.phone, onChange: (e) => setFormData({ ...formData, phone: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", placeholder: "+1234567890" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "WhatsApp Number" }), _jsx("input", { type: "tel", value: formData.whatsapp, onChange: (e) => setFormData({ ...formData, whatsapp: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", placeholder: "+1234567890" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: ["Password ", editingUser ? '(leave blank to keep current)' : '*'] }), _jsx("input", { type: "password", value: formData.password, onChange: (e) => setFormData({ ...formData, password: e.target.value }), required: !editingUser, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Role *" }), _jsx("select", { value: formData.role, onChange: (e) => setFormData({ ...formData, role: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: roles.map((role) => (_jsx("option", { value: role, children: role.replace('_', ' ') }, role))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Department" }), _jsxs("select", { value: formData.department, onChange: (e) => setFormData({ ...formData, department: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "", children: "Select Department" }), configuredDepartments.length > 0 ? (configuredDepartments.map((dept) => (_jsx("option", { value: dept.key || dept.value, children: dept.value }, dept.key || dept.value)))) : (departments.map((dept) => (_jsx("option", { value: dept, children: dept }, dept))))] })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Country" }), configuredCountries.length > 0 ? (_jsxs("select", { value: formData.country, onChange: (e) => setFormData({ ...formData, country: e.target.value, city: '' }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "", children: "Select Country" }), configuredCountries.map((country) => (_jsx("option", { value: country.key || country.value, children: country.value }, country.key || country.value)))] })) : (_jsx("input", { type: "text", value: formData.country, onChange: (e) => setFormData({ ...formData, country: e.target.value }), placeholder: "e.g., Afghanistan", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "City/Province" }), configuredCities.filter((c) => !formData.country || c.metadata?.country === formData.country).length > 0 ? (_jsxs("select", { value: formData.city, onChange: (e) => setFormData({ ...formData, city: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "", children: "Select City" }), configuredCities
                                                        .filter((city) => !formData.country || city.metadata?.country === formData.country)
                                                        .map((city) => (_jsx("option", { value: city.key || city.value, children: city.value }, city.key || city.value)))] })) : (_jsx("input", { type: "text", value: formData.city, onChange: (e) => setFormData({ ...formData, city: e.target.value }), placeholder: "e.g., Kabul", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" }))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Address" }), _jsx("textarea", { value: formData.address, onChange: (e) => setFormData({ ...formData, address: e.target.value }), rows: 2, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", placeholder: "Street address, building, etc." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Clearance Level" }), _jsx("input", { type: "text", value: formData.clearance, onChange: (e) => setFormData({ ...formData, clearance: e.target.value }), placeholder: "Optional clearance level", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { type: "submit", disabled: createMutation.isLoading || updateMutation.isLoading, className: "flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50", children: createMutation.isLoading || updateMutation.isLoading
                                            ? 'Saving...'
                                            : editingUser
                                                ? 'Update User'
                                                : 'Create User' }), _jsx("button", { type: "button", onClick: handleCancel, className: "px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600", children: "Cancel" })] })] })] })), _jsx("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-700", children: [_jsx("thead", { className: "bg-gray-700", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider", children: "Name" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider", children: "Email" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider", children: "Phone" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider", children: "Role" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider", children: "Department" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider", children: "Country" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-gray-800 divide-y divide-gray-700", children: isLoading ? (_jsx("tr", { children: _jsx("td", { colSpan: 8, className: "px-6 py-4 text-center text-gray-400", children: "Loading users..." }) })) : filteredUsers.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 8, className: "px-6 py-4 text-center text-gray-400", children: "No users found" }) })) : (filteredUsers.map((user) => (_jsxs("tr", { className: "hover:bg-gray-700", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "text-sm font-medium text-white", children: [user.firstName, " ", user.lastName] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm text-gray-300", children: user.email }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm text-gray-300", children: user.phone || '-' }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: "px-2 py-1 text-xs font-medium rounded bg-primary-900/30 text-primary-300", children: user.role.replace('_', ' ') }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm text-gray-300", children: user.department || '-' }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm text-gray-300", children: user.country || '-' }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `px-2 py-1 text-xs font-medium rounded ${user.isActive
                                                    ? 'bg-green-900/30 text-green-300'
                                                    : 'bg-yellow-900/30 text-yellow-300'}`, children: user.isActive ? 'Active' : 'Pending Approval' }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => handleEdit(user), className: "text-primary-500 hover:text-primary-700", children: "Edit" }), user.isActive ? (_jsx("button", { onClick: () => handleDelete(user), className: "text-red-500 hover:text-red-700", children: "Deactivate" })) : (_jsx("button", { onClick: () => {
                                                            if (window.confirm(`Approve ${user.firstName} ${user.lastName}? They will be able to access the platform.`)) {
                                                                updateMutation.mutate({ id: user.id, data: { isActive: true } });
                                                            }
                                                        }, className: "text-green-500 hover:text-green-700 font-medium", children: "Approve" }))] }) })] }, user.id)))) })] }) }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-4", children: [_jsx("p", { className: "text-sm text-gray-400", children: "Total Users" }), _jsx("p", { className: "text-2xl font-bold text-white", children: users.length })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-4", children: [_jsx("p", { className: "text-sm text-gray-400", children: "Active Users" }), _jsx("p", { className: "text-2xl font-bold text-green-500", children: users.filter((u) => u.isActive).length })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-4", children: [_jsx("p", { className: "text-sm text-gray-400", children: "Pending Approval" }), _jsx("p", { className: "text-2xl font-bold text-yellow-500", children: users.filter((u) => !u.isActive).length })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-4", children: [_jsx("p", { className: "text-sm text-gray-400", children: "Admins" }), _jsx("p", { className: "text-2xl font-bold text-primary-500", children: users.filter((u) => u.role === 'ADMIN').length })] })] })] }));
}
