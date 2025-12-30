import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useState, useMemo, useEffect } from 'react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';

export default function MarketTab() {
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'COUNTRY_DIRECTOR' || user?.role === 'DEPARTMENT_HEAD';

  // Form state with all 13 sections
  const [formData, setFormData] = useState({
    // SECTION 1 - Staff Information
    fullName: '',
    jobTitle: '',
    countryOffice: '',
    department: '',
    email: '',
    phone: '',
    whatsapp: '',
    // SECTION 2 - Idea Title
    title: '',
    // SECTION 3 - Idea Type
    ideaType: '',
    // SECTION 4 - Problem / Need Identified
    problemNeed: '',
    // SECTION 5 - Proposed Solution
    proposedSolution: '',
    // SECTION 6 - Beneficiaries (multi-select)
    beneficiaries: [] as string[],
    // SECTION 7 - Estimated Impact
    estimatedImpact: '',
    // SECTION 8 - Estimated Cost
    estimatedCost: '',
    // SECTION 9 - Funding Potential
    fundingPotential: '',
    // SECTION 10 - Urgency
    urgency: '',
    // SECTION 11 - Leadership Interest
    leadershipInterest: '',
    // SECTION 12 - Attachments
    attachments: [] as File[],
    // SECTION 13 - Declaration
    declarationConfirmed: false,
  });

  const { data: mySubmissions } = useQuery('my-market-submissions', async () => {
    const res = await api.get('/market/my-submissions');
    return res.data;
  });

  const { data: allSubmissions } = useQuery(
    'all-market-submissions',
    async () => {
      const res = await api.get('/market/all');
      return res.data;
    },
    { enabled: isAdmin }
  );

  const submitMutation = useMutation(
    async (data: FormData) => {
      const res = await api.post('/market/submit', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('my-market-submissions');
        if (isAdmin) queryClient.invalidateQueries('all-market-submissions');
        setShowForm(false);
        resetForm();
        alert('Innovation & Improvement Proposal submitted successfully!');
      },
    }
  );

  const reviewMutation = useMutation(
    async ({ id, data }: { id: string; data: any }) => {
      const res = await api.post(`/market/${id}/review`, data);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('my-market-submissions');
        queryClient.invalidateQueries('all-market-submissions');
        setSelectedSubmission(null);
        alert('Review submitted successfully!');
      },
    }
  );

  const resetForm = () => {
    setFormData({
      fullName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
      jobTitle: '',
      countryOffice: user?.country || '',
      department: user?.department || '',
      email: user?.email || '',
      phone: user?.phone || '',
      whatsapp: user?.whatsapp || '',
      title: '',
      ideaType: '',
      problemNeed: '',
      proposedSolution: '',
      beneficiaries: [],
      estimatedImpact: '',
      estimatedCost: '',
      fundingPotential: '',
      urgency: '',
      leadershipInterest: '',
      attachments: [],
      declarationConfirmed: false,
    });
  };

  // Initialize form when user data is available
  useEffect(() => {
    if (user) {
      resetForm();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.declarationConfirmed) {
      alert('Please confirm the declaration before submitting.');
      return;
    }

    const formDataToSend = new FormData();
    
    // Add all form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'attachments') {
        formData.attachments.forEach((file, index) => {
          formDataToSend.append(`attachments`, file);
        });
      } else if (key === 'beneficiaries') {
        formData.beneficiaries.forEach((beneficiary, index) => {
          formDataToSend.append(`beneficiaries[${index}]`, beneficiary);
        });
      } else if (key === 'declarationConfirmed') {
        formDataToSend.append(key, value.toString());
      } else {
        formDataToSend.append(key, value as string);
      }
    });

    submitMutation.mutate(formDataToSend);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({
        ...formData,
        attachments: Array.from(e.target.files),
      });
    }
  };

  const toggleBeneficiary = (beneficiary: string) => {
    setFormData({
      ...formData,
      beneficiaries: formData.beneficiaries.includes(beneficiary)
        ? formData.beneficiaries.filter((b) => b !== beneficiary)
        : [...formData.beneficiaries, beneficiary],
    });
  };

  const submissions = isAdmin ? (allSubmissions?.submissions || []) : (mySubmissions?.submissions || []);
  
  const filteredSubmissions = useMemo(() => {
    if (statusFilter === 'all') return submissions;
    return submissions.filter((s: any) => s.status === statusFilter.toUpperCase());
  }, [submissions, statusFilter]);

  const statuses = useMemo(() => {
    const statusSet = new Set<string>();
    submissions.forEach((s: any) => {
      if (s.status) statusSet.add(s.status.toLowerCase());
    });
    return Array.from(statusSet).sort();
  }, [submissions]);

  const beneficiaryOptions = [
    'Children',
    'Women',
    'Refugees',
    'Persons with disabilities',
    'Communities',
    'Staff',
    'Other',
  ];

  const ideaTypeOptions = [
    'New humanitarian project',
    'Improvement to existing program',
    'New service for beneficiaries',
    'Cost-saving / efficiency improvement',
    'New partnership / funding idea',
    'Staff wellbeing / safety improvement',
    'Other',
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">INARA Staff Innovation & Improvement Proposal</h1>
          <p className="text-gray-400 mt-2">Submit your ideas to improve INARA's humanitarian work</p>
        </div>
        <div className="flex space-x-2">
          {isAdmin && (
            <button
              onClick={async () => {
                try {
                  const res = await api.get('/market/export?format=csv', {
                    responseType: 'blob',
                  });
                  const blob = new Blob([res.data], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `market-submissions-${Date.now()}.csv`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                } catch (error) {
                  console.error('Export error:', error);
                  alert('Failed to export submissions');
                }
              }}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Export CSV
            </button>
          )}
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            {showForm ? 'Cancel' : '+ Submit Proposal'}
          </button>
        </div>
      </div>

      {/* Submission Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg shadow p-6 max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-white mb-6">INARA Staff Innovation & Improvement Proposal</h2>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* SECTION 1 - Staff Information */}
            <div className="border-b border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-4">SECTION 1 – Staff Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Job Title / Role *</label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Country / Office *</label>
                  <input
                    type="text"
                    value={formData.countryOffice}
                    onChange={(e) => setFormData({ ...formData, countryOffice: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Department *</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone or WhatsApp"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2 - Idea Title */}
            <div className="border-b border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-4">SECTION 2 – Idea Title</h3>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Short clear idea name *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Enter a clear, concise title for your idea"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* SECTION 3 - Idea Type */}
            <div className="border-b border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-4">SECTION 3 – Idea Type</h3>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Select idea type *</label>
                <select
                  value={formData.ideaType}
                  onChange={(e) => setFormData({ ...formData, ideaType: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select an option</option>
                  {ideaTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SECTION 4 - Problem / Need Identified */}
            <div className="border-b border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-4">SECTION 4 – Problem / Need Identified</h3>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  What problem or gap exists and who is affected? *
                </label>
                <textarea
                  value={formData.problemNeed}
                  onChange={(e) => setFormData({ ...formData, problemNeed: e.target.value })}
                  required
                  rows={6}
                  placeholder="Describe the problem, gap, or need you have identified. Explain who is affected and why this matters."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* SECTION 5 - Proposed Solution */}
            <div className="border-b border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-4">SECTION 5 – Proposed Solution</h3>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Describe your idea and what INARA should do *
                </label>
                <textarea
                  value={formData.proposedSolution}
                  onChange={(e) => setFormData({ ...formData, proposedSolution: e.target.value })}
                  required
                  rows={6}
                  placeholder="Describe your proposed solution in detail. What should INARA do? How should it be implemented?"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* SECTION 6 - Beneficiaries */}
            <div className="border-b border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-4">SECTION 6 – Beneficiaries</h3>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Who will benefit? (Select all that apply) *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {beneficiaryOptions.map((option) => (
                    <label
                      key={option}
                      className="flex items-center space-x-2 p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                    >
                      <input
                        type="checkbox"
                        checked={formData.beneficiaries.includes(option)}
                        onChange={() => toggleBeneficiary(option)}
                        className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-200">{option}</span>
                    </label>
                  ))}
                </div>
                {formData.beneficiaries.length === 0 && (
                  <p className="text-xs text-red-400 mt-2">Please select at least one beneficiary</p>
                )}
              </div>
            </div>

            {/* SECTION 7 - Estimated Impact */}
            <div className="border-b border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-4">SECTION 7 – Estimated Impact</h3>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">What is the estimated impact? *</label>
                <select
                  value={formData.estimatedImpact}
                  onChange={(e) => setFormData({ ...formData, estimatedImpact: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select an option</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            {/* SECTION 8 - Estimated Cost */}
            <div className="border-b border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-4">SECTION 8 – Estimated Cost</h3>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">What is the estimated cost? *</label>
                <select
                  value={formData.estimatedCost}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select an option</option>
                  <option value="Very low / Free">Very low / Free</option>
                  <option value="Low (under $500)">Low (under $500)</option>
                  <option value="Medium ($500–$5,000)">Medium ($500–$5,000)</option>
                  <option value="High (over $5,000)">High (over $5,000)</option>
                  <option value="Not sure">Not sure</option>
                </select>
              </div>
            </div>

            {/* SECTION 9 - Funding Potential */}
            <div className="border-b border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-4">SECTION 9 – Funding Potential</h3>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Is there funding potential? *</label>
                <select
                  value={formData.fundingPotential}
                  onChange={(e) => setFormData({ ...formData, fundingPotential: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select an option</option>
                  <option value="Yes">Yes</option>
                  <option value="Maybe">Maybe</option>
                  <option value="Not sure">Not sure</option>
                </select>
              </div>
            </div>

            {/* SECTION 10 - Urgency */}
            <div className="border-b border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-4">SECTION 10 – Urgency</h3>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">How urgent is this? *</label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select an option</option>
                  <option value="Immediate">Immediate</option>
                  <option value="Within 3 months">Within 3 months</option>
                  <option value="Within 6 months">Within 6 months</option>
                  <option value="Not urgent">Not urgent</option>
                </select>
              </div>
            </div>

            {/* SECTION 11 - Leadership Interest */}
            <div className="border-b border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-4">SECTION 11 – Leadership Interest</h3>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">What is your interest in leading this? *</label>
                <select
                  value={formData.leadershipInterest}
                  onChange={(e) => setFormData({ ...formData, leadershipInterest: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select an option</option>
                  <option value="I want to lead implementation">I want to lead implementation</option>
                  <option value="I want to support as advisor">I want to support as advisor</option>
                  <option value="I only submit the idea">I only submit the idea</option>
                </select>
              </div>
            </div>

            {/* SECTION 12 - Attachments */}
            <div className="border-b border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-4">SECTION 12 – Attachments</h3>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Upload files (photos, documents, budgets, concept notes)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-500 file:text-white hover:file:bg-primary-600"
                />
                {formData.attachments.length > 0 && (
                  <div className="mt-2 text-sm text-gray-400">
                    {formData.attachments.length} file(s) selected
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 13 - Declaration */}
            <div className="pb-6">
              <h3 className="text-lg font-semibold text-white mb-4">SECTION 13 – Declaration</h3>
              <label className="flex items-start space-x-3 p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
                <input
                  type="checkbox"
                  checked={formData.declarationConfirmed}
                  onChange={(e) => setFormData({ ...formData, declarationConfirmed: e.target.checked })}
                  className="mt-1 w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-200">
                  I confirm this idea is my original contribution and submitted in good faith to improve INARA's work. *
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-900 text-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitMutation.isLoading || !formData.declarationConfirmed}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitMutation.isLoading ? 'Submitting...' : 'Submit Proposal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      {submissions.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow p-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-400">Status:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All ({submissions.length})
            </button>
            {statuses.map((status) => {
              const count = submissions.filter((s: any) => s.status?.toLowerCase() === status).length;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors capitalize ${
                    statusFilter === status
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {status.replace('_', ' ')} ({count})
                </button>
              );
            })}
          </div>
          <div className="text-sm text-gray-400">
            Showing <strong className="text-white">{filteredSubmissions.length}</strong> of{' '}
            <strong className="text-white">{submissions.length}</strong> proposals
          </div>
        </div>
      )}

      {/* Submissions List */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">
          {isAdmin ? 'All Proposals' : 'My Proposals'}
        </h2>
        <div className="space-y-4">
          {filteredSubmissions.map((submission: any) => (
            <div
              key={submission.id}
              className="bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedSubmission(submission)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{submission.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                      {submission.ideaType || 'N/A'}
                    </span>
                    {submission.beneficiaries?.length > 0 && (
                      <span className="text-xs bg-primary-500/20 text-primary-300 px-2 py-1 rounded">
                        {submission.beneficiaries.length} beneficiaries
                      </span>
                    )}
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                      Impact: {submission.estimatedImpact || 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                    {submission.problemNeed || submission.problemStatement}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-3 py-1 rounded ml-4 ${
                    submission.status === 'APPROVED'
                      ? 'bg-green-900/30 text-green-300'
                      : submission.status === 'REJECTED'
                      ? 'bg-red-900/30 text-red-300'
                      : submission.status === 'UNDER_REVIEW'
                      ? 'bg-blue-900/30 text-blue-300'
                      : 'bg-yellow-900/30 text-yellow-300'
                  }`}
                >
                  {submission.status?.replace('_', ' ') || 'NEW'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>
                    By: {submission.user?.firstName} {submission.user?.lastName}
                  </span>
                  <span>Submitted: {new Date(submission.createdAt).toLocaleDateString()}</span>
                </div>
                {submission.bonusApproved && submission.bonusAmount && (
                  <span className="text-green-500 font-medium">
                    Bonus: ${submission.bonusAmount}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        {submissions.length === 0 && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-400">No proposals yet. Submit your first idea!</p>
          </div>
        )}
      </div>

      {/* Submission Detail Modal (for viewing and admin review) */}
      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          isAdmin={isAdmin}
          onClose={() => setSelectedSubmission(null)}
          onReview={(data) => reviewMutation.mutate({ id: selectedSubmission.id, data })}
        />
      )}
    </div>
  );
}

// Submission Detail Modal Component
function SubmissionDetailModal({ submission, isAdmin, onClose, onReview }: any) {
  const [reviewData, setReviewData] = useState({
    status: submission.status || 'NEW',
    reviewScore: submission.reviewScore || '',
    bonusApproved: submission.bonusApproved || false,
    bonusAmount: submission.bonusAmount || '',
    internalNotes: submission.internalNotes || '',
    assignedReviewer: submission.assignedReviewer || '',
  });

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReview(reviewData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-white">Proposal Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Display all sections */}
            <Section title="Staff Information">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong className="text-gray-400">Name:</strong> <span className="text-white">{submission.fullName || `${submission.user?.firstName} ${submission.user?.lastName}`}</span></div>
                <div><strong className="text-gray-400">Job Title:</strong> <span className="text-white">{submission.jobTitle || 'N/A'}</span></div>
                <div><strong className="text-gray-400">Country/Office:</strong> <span className="text-white">{submission.countryOffice || submission.user?.country || 'N/A'}</span></div>
                <div><strong className="text-gray-400">Department:</strong> <span className="text-white">{submission.department || submission.user?.department || 'N/A'}</span></div>
                <div><strong className="text-gray-400">Email:</strong> <span className="text-white">{submission.email || submission.user?.email || 'N/A'}</span></div>
                <div><strong className="text-gray-400">Phone:</strong> <span className="text-white">{submission.phone || submission.user?.phone || 'N/A'}</span></div>
              </div>
            </Section>

            <Section title="Idea Title">
              <p className="text-white text-lg font-semibold">{submission.title}</p>
            </Section>

            <Section title="Idea Type">
              <p className="text-white">{submission.ideaType || 'N/A'}</p>
            </Section>

            <Section title="Problem / Need Identified">
              <p className="text-gray-200 whitespace-pre-wrap">{submission.problemNeed || submission.problemStatement || 'N/A'}</p>
            </Section>

            <Section title="Proposed Solution">
              <p className="text-gray-200 whitespace-pre-wrap">{submission.proposedSolution || 'N/A'}</p>
            </Section>

            <Section title="Beneficiaries">
              <div className="flex flex-wrap gap-2">
                {submission.beneficiaries?.map((b: string, idx: number) => (
                  <span key={idx} className="bg-primary-500/20 text-primary-300 px-2 py-1 rounded text-sm">
                    {b}
                  </span>
                ))}
                {(!submission.beneficiaries || submission.beneficiaries.length === 0) && (
                  <span className="text-gray-400">N/A</span>
                )}
              </div>
            </Section>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Section title="Estimated Impact">
                <p className="text-white">{submission.estimatedImpact || 'N/A'}</p>
              </Section>
              <Section title="Estimated Cost">
                <p className="text-white">{submission.estimatedCost || 'N/A'}</p>
              </Section>
              <Section title="Funding Potential">
                <p className="text-white">{submission.fundingPotential || 'N/A'}</p>
              </Section>
              <Section title="Urgency">
                <p className="text-white">{submission.urgency || 'N/A'}</p>
              </Section>
            </div>

            <Section title="Leadership Interest">
              <p className="text-white">{submission.leadershipInterest || 'N/A'}</p>
            </Section>

            {submission.attachments && submission.attachments.length > 0 && (
              <Section title="Attachments">
                <div className="space-y-2">
                  {submission.attachments.map((att: string, idx: number) => (
                    <a
                      key={idx}
                      href={att}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:text-primary-400 underline block"
                    >
                      Attachment {idx + 1}
                    </a>
                  ))}
                </div>
              </Section>
            )}

            {/* Admin Review Section */}
            {isAdmin && (
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-xl font-bold text-white mb-4">Admin Review</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">Review Status *</label>
                      <select
                        value={reviewData.status}
                        onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                        required
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                      >
                        <option value="NEW">New</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">Assigned Reviewer</label>
                      <input
                        type="text"
                        value={reviewData.assignedReviewer}
                        onChange={(e) => setReviewData({ ...reviewData, assignedReviewer: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">Review Score (0-100)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={reviewData.reviewScore}
                        onChange={(e) => setReviewData({ ...reviewData, reviewScore: parseInt(e.target.value) || '' })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">Bonus Approved</label>
                      <select
                        value={reviewData.bonusApproved ? 'Yes' : 'No'}
                        onChange={(e) => setReviewData({ ...reviewData, bonusApproved: e.target.value === 'Yes' })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    {reviewData.bonusApproved && (
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Bonus Amount</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={reviewData.bonusAmount}
                          onChange={(e) => setReviewData({ ...reviewData, bonusAmount: parseFloat(e.target.value) || '' })}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Internal Notes</label>
                    <textarea
                      value={reviewData.internalNotes}
                      onChange={(e) => setReviewData({ ...reviewData, internalNotes: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-800 text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                    >
                      Submit Review
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-700 pb-4">
      <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
      {children}
    </div>
  );
}
