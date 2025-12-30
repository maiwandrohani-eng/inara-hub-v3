import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';

export default function UserManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
    } catch {
      return { configs: [] };
    }
  });

  const { data: countriesData } = useQuery('config-countries-admin', async () => {
    try {
      const res = await api.get('/config/country');
      return res.data;
    } catch {
      return { configs: [] };
    }
  });

  const { data: citiesData } = useQuery('config-cities-admin', async () => {
    try {
      const res = await api.get('/config/city');
      return res.data;
    } catch {
      return { configs: [] };
    }
  });

  const configuredDepartments = departmentsData?.configs || [];
  const configuredCountries = countriesData?.configs || [];
  const configuredCities = citiesData?.configs || [];

  // Fallback to enum if no config
  const departments = configuredDepartments.length > 0 
    ? configuredDepartments.map((d: any) => d.key || d.value)
    : ['HR', 'FINANCE', 'PROCUREMENT', 'PROGRAMS', 'MEAL', 'IT', 'OPERATIONS'];

  const { data, isLoading } = useQuery('admin-users', async () => {
    const res = await api.get('/admin/users');
    return res.data;
  });

  const users = data?.users || [];

  const filteredUsers = users.filter((user: any) => {
    const matchesSearch =
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'pending' && !user.isActive);
    return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
  });

  const createMutation = useMutation(
    async (data: any) => {
      const res = await api.post('/auth/register', data);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-users');
        setShowForm(false);
        resetForm();
        alert('User created successfully!');
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to create user');
      },
    }
  );

  const updateMutation = useMutation(
    async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/admin/users/${id}`, data);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-users');
        setEditingUser(null);
        resetForm();
        alert('User updated successfully!');
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to update user');
      },
    }
  );

  const deleteMutation = useMutation(
    async (id: string) => {
      // Deactivate instead of delete
      const res = await api.put(`/admin/users/${id}`, { isActive: false });
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-users');
        alert('User deactivated successfully!');
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to deactivate user');
      },
    }
  );

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

  const handleEdit = (user: any) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = { ...formData };
    
    // Remove password if empty (for updates)
    if (editingUser && !submitData.password) {
      delete submitData.password;
    }

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: submitData });
    } else {
      if (!submitData.password) {
        alert('Password is required for new users');
        return;
      }
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (user: any) => {
    if (window.confirm(`⚠️ WARNING: Are you sure you want to PERMANENTLY DELETE ${user.firstName} ${user.lastName}? This action cannot be undone and will remove all their data.`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const handleDeactivate = (user: any) => {
    if (window.confirm(`Are you sure you want to deactivate ${user.firstName} ${user.lastName}? They will not be able to access the platform.`)) {
      deactivateMutation.mutate(user.id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    resetForm();
  };

  const roles = ['ADMIN', 'COUNTRY_DIRECTOR', 'DEPARTMENT_HEAD', 'MANAGER', 'STAFF'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <button
          onClick={() => {
            setEditingUser(null);
            resetForm();
            setShowForm(true);
          }}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
        >
          + Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role.replace('_', ' ')}
              </option>
            ))}
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Departments</option>
            {departments.map((dept: string) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending Approval</option>
          </select>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            {editingUser ? 'Edit User' : 'Create New User'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={!!editingUser}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  placeholder="+1234567890"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Password {editingUser ? '(leave blank to keep current)' : '*'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                >
                  <option value="">Select Department</option>
                  {configuredDepartments.length > 0 ? (
                    configuredDepartments.map((dept: any) => (
                      <option key={dept.key || dept.value} value={dept.key || dept.value}>
                        {dept.value}
                      </option>
                    ))
                  ) : (
                    departments.map((dept: string) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Country</label>
                {configuredCountries.length > 0 ? (
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value, city: '' })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  >
                    <option value="">Select Country</option>
                    {configuredCountries.map((country: any) => (
                      <option key={country.key || country.value} value={country.key || country.value}>
                        {country.value}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g., Afghanistan"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">City/Province</label>
                {configuredCities.filter((c: any) => !formData.country || c.metadata?.country === formData.country).length > 0 ? (
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  >
                    <option value="">Select City</option>
                    {configuredCities
                      .filter((city: any) => !formData.country || city.metadata?.country === formData.country)
                      .map((city: any) => (
                        <option key={city.key || city.value} value={city.key || city.value}>
                          {city.value}
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g., Kabul"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                placeholder="Street address, building, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Clearance Level</label>
              <input
                type="text"
                value={formData.clearance}
                onChange={(e) => setFormData({ ...formData, clearance: e.target.value })}
                placeholder="Optional clearance level"
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
                  : editingUser
                  ? 'Update User'
                  : 'Create User'}
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

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg shadow border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-400">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {user.firstName} {user.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{user.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-primary-900/30 text-primary-300">
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{user.department || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{user.country || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          user.isActive
                            ? 'bg-green-900/30 text-green-300'
                            : 'bg-yellow-900/30 text-yellow-300'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Pending Approval'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
                          title="Edit user"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        {user.isActive ? (
                          <>
                            <button
                              onClick={() => handleDeactivate(user)}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
                              title="Deactivate user"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                              Deactivate
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
                              title="Permanently delete user"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              if (window.confirm(`Approve ${user.firstName} ${user.lastName}? They will be able to access the platform.`)) {
                                updateMutation.mutate({ id: user.id, data: { isActive: true } });
                              }
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
                            title="Approve user"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-4">
          <p className="text-sm text-gray-400">Total Users</p>
          <p className="text-2xl font-bold text-white">{users.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-4">
          <p className="text-sm text-gray-400">Active Users</p>
          <p className="text-2xl font-bold text-green-500">
            {users.filter((u: any) => u.isActive).length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-4">
          <p className="text-sm text-gray-400">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-500">
            {users.filter((u: any) => !u.isActive).length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-4">
          <p className="text-sm text-gray-400">Admins</p>
          <p className="text-2xl font-bold text-primary-500">
            {users.filter((u: any) => u.role === 'ADMIN').length}
          </p>
        </div>
      </div>
    </div>
  );
}

