import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useState, useMemo, useEffect } from 'react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
export default function MarketTab() {
    const [showForm, setShowForm] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedSubmission, setSelectedSubmission] = useState(null);
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
        beneficiaries: [],
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
        attachments: [],
        // SECTION 13 - Declaration
        declarationConfirmed: false,
    });
    const { data: mySubmissions } = useQuery('my-market-submissions', async () => {
        const res = await api.get('/market/my-submissions');
        return res.data;
    });
    const { data: allSubmissions } = useQuery('all-market-submissions', async () => {
        const res = await api.get('/market/all');
        return res.data;
    }, { enabled: isAdmin });
    const submitMutation = useMutation(async (data) => {
        const res = await api.post('/market/submit', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('my-market-submissions');
            if (isAdmin)
                queryClient.invalidateQueries('all-market-submissions');
            setShowForm(false);
            resetForm();
            alert('Innovation & Improvement Proposal submitted successfully!');
        },
    });
    const reviewMutation = useMutation(async ({ id, data }) => {
        const res = await api.post(`/market/${id}/review`, data);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('my-market-submissions');
            queryClient.invalidateQueries('all-market-submissions');
            setSelectedSubmission(null);
            alert('Review submitted successfully!');
        },
    });
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
    const handleSubmit = async (e) => {
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
            }
            else if (key === 'beneficiaries') {
                formData.beneficiaries.forEach((beneficiary, index) => {
                    formDataToSend.append(`beneficiaries[${index}]`, beneficiary);
                });
            }
            else if (key === 'declarationConfirmed') {
                formDataToSend.append(key, value.toString());
            }
            else {
                formDataToSend.append(key, value);
            }
        });
        submitMutation.mutate(formDataToSend);
    };
    const handleFileChange = (e) => {
        if (e.target.files) {
            setFormData({
                ...formData,
                attachments: Array.from(e.target.files),
            });
        }
    };
    const toggleBeneficiary = (beneficiary) => {
        setFormData({
            ...formData,
            beneficiaries: formData.beneficiaries.includes(beneficiary)
                ? formData.beneficiaries.filter((b) => b !== beneficiary)
                : [...formData.beneficiaries, beneficiary],
        });
    };
    const submissions = isAdmin ? (allSubmissions?.submissions || []) : (mySubmissions?.submissions || []);
    const filteredSubmissions = useMemo(() => {
        if (statusFilter === 'all')
            return submissions;
        return submissions.filter((s) => s.status === statusFilter.toUpperCase());
    }, [submissions, statusFilter]);
    const statuses = useMemo(() => {
        const statusSet = new Set();
        submissions.forEach((s) => {
            if (s.status)
                statusSet.add(s.status.toLowerCase());
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "INARA Staff Innovation & Improvement Proposal" }), _jsx("p", { className: "text-gray-400 mt-2", children: "Submit your ideas to improve INARA's humanitarian work" })] }), _jsxs("div", { className: "flex space-x-2", children: [isAdmin && (_jsx("button", { onClick: async () => {
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
                                    }
                                    catch (error) {
                                        console.error('Export error:', error);
                                        alert('Failed to export submissions');
                                    }
                                }, className: "bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors", children: "Export CSV" })), _jsx("button", { onClick: () => {
                                    resetForm();
                                    setShowForm(!showForm);
                                }, className: "bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors", children: showForm ? 'Cancel' : '+ Submit Proposal' })] })] }), showForm && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-6 max-h-[90vh] overflow-y-auto", children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-6", children: "INARA Staff Innovation & Improvement Proposal" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-8", children: [_jsxs("div", { className: "border-b border-gray-700 pb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "SECTION 1 \u2013 Staff Information" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Full Name *" }), _jsx("input", { type: "text", value: formData.fullName, onChange: (e) => setFormData({ ...formData, fullName: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Job Title / Role *" }), _jsx("input", { type: "text", value: formData.jobTitle, onChange: (e) => setFormData({ ...formData, jobTitle: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Country / Office *" }), _jsx("input", { type: "text", value: formData.countryOffice, onChange: (e) => setFormData({ ...formData, countryOffice: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Department *" }), _jsx("input", { type: "text", value: formData.department, onChange: (e) => setFormData({ ...formData, department: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Email *" }), _jsx("input", { type: "email", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Phone / WhatsApp" }), _jsx("input", { type: "text", value: formData.phone, onChange: (e) => setFormData({ ...formData, phone: e.target.value }), placeholder: "Phone or WhatsApp", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500" })] })] })] }), _jsxs("div", { className: "border-b border-gray-700 pb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "SECTION 2 \u2013 Idea Title" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Short clear idea name *" }), _jsx("input", { type: "text", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), required: true, placeholder: "Enter a clear, concise title for your idea", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500" })] })] }), _jsxs("div", { className: "border-b border-gray-700 pb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "SECTION 3 \u2013 Idea Type" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-2", children: "Select idea type *" }), _jsxs("select", { value: formData.ideaType, onChange: (e) => setFormData({ ...formData, ideaType: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500", children: [_jsx("option", { value: "", children: "Select an option" }), ideaTypeOptions.map((option) => (_jsx("option", { value: option, children: option }, option)))] })] })] }), _jsxs("div", { className: "border-b border-gray-700 pb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "SECTION 4 \u2013 Problem / Need Identified" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "What problem or gap exists and who is affected? *" }), _jsx("textarea", { value: formData.problemNeed, onChange: (e) => setFormData({ ...formData, problemNeed: e.target.value }), required: true, rows: 6, placeholder: "Describe the problem, gap, or need you have identified. Explain who is affected and why this matters.", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500" })] })] }), _jsxs("div", { className: "border-b border-gray-700 pb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "SECTION 5 \u2013 Proposed Solution" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Describe your idea and what INARA should do *" }), _jsx("textarea", { value: formData.proposedSolution, onChange: (e) => setFormData({ ...formData, proposedSolution: e.target.value }), required: true, rows: 6, placeholder: "Describe your proposed solution in detail. What should INARA do? How should it be implemented?", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500" })] })] }), _jsxs("div", { className: "border-b border-gray-700 pb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "SECTION 6 \u2013 Beneficiaries" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-2", children: "Who will benefit? (Select all that apply) *" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: beneficiaryOptions.map((option) => (_jsxs("label", { className: "flex items-center space-x-2 p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600", children: [_jsx("input", { type: "checkbox", checked: formData.beneficiaries.includes(option), onChange: () => toggleBeneficiary(option), className: "w-4 h-4 text-primary-500 rounded focus:ring-primary-500" }), _jsx("span", { className: "text-sm text-gray-200", children: option })] }, option))) }), formData.beneficiaries.length === 0 && (_jsx("p", { className: "text-xs text-red-400 mt-2", children: "Please select at least one beneficiary" }))] })] }), _jsxs("div", { className: "border-b border-gray-700 pb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "SECTION 7 \u2013 Estimated Impact" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-2", children: "What is the estimated impact? *" }), _jsxs("select", { value: formData.estimatedImpact, onChange: (e) => setFormData({ ...formData, estimatedImpact: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500", children: [_jsx("option", { value: "", children: "Select an option" }), _jsx("option", { value: "Low", children: "Low" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "High", children: "High" })] })] })] }), _jsxs("div", { className: "border-b border-gray-700 pb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "SECTION 8 \u2013 Estimated Cost" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-2", children: "What is the estimated cost? *" }), _jsxs("select", { value: formData.estimatedCost, onChange: (e) => setFormData({ ...formData, estimatedCost: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500", children: [_jsx("option", { value: "", children: "Select an option" }), _jsx("option", { value: "Very low / Free", children: "Very low / Free" }), _jsx("option", { value: "Low (under $500)", children: "Low (under $500)" }), _jsx("option", { value: "Medium ($500\u2013$5,000)", children: "Medium ($500\u2013$5,000)" }), _jsx("option", { value: "High (over $5,000)", children: "High (over $5,000)" }), _jsx("option", { value: "Not sure", children: "Not sure" })] })] })] }), _jsxs("div", { className: "border-b border-gray-700 pb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "SECTION 9 \u2013 Funding Potential" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-2", children: "Is there funding potential? *" }), _jsxs("select", { value: formData.fundingPotential, onChange: (e) => setFormData({ ...formData, fundingPotential: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500", children: [_jsx("option", { value: "", children: "Select an option" }), _jsx("option", { value: "Yes", children: "Yes" }), _jsx("option", { value: "Maybe", children: "Maybe" }), _jsx("option", { value: "Not sure", children: "Not sure" })] })] })] }), _jsxs("div", { className: "border-b border-gray-700 pb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "SECTION 10 \u2013 Urgency" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-2", children: "How urgent is this? *" }), _jsxs("select", { value: formData.urgency, onChange: (e) => setFormData({ ...formData, urgency: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500", children: [_jsx("option", { value: "", children: "Select an option" }), _jsx("option", { value: "Immediate", children: "Immediate" }), _jsx("option", { value: "Within 3 months", children: "Within 3 months" }), _jsx("option", { value: "Within 6 months", children: "Within 6 months" }), _jsx("option", { value: "Not urgent", children: "Not urgent" })] })] })] }), _jsxs("div", { className: "border-b border-gray-700 pb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "SECTION 11 \u2013 Leadership Interest" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-2", children: "What is your interest in leading this? *" }), _jsxs("select", { value: formData.leadershipInterest, onChange: (e) => setFormData({ ...formData, leadershipInterest: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500", children: [_jsx("option", { value: "", children: "Select an option" }), _jsx("option", { value: "I want to lead implementation", children: "I want to lead implementation" }), _jsx("option", { value: "I want to support as advisor", children: "I want to support as advisor" }), _jsx("option", { value: "I only submit the idea", children: "I only submit the idea" })] })] })] }), _jsxs("div", { className: "border-b border-gray-700 pb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "SECTION 12 \u2013 Attachments" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-2", children: "Upload files (photos, documents, budgets, concept notes)" }), _jsx("input", { type: "file", multiple: true, onChange: handleFileChange, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-500 file:text-white hover:file:bg-primary-600" }), formData.attachments.length > 0 && (_jsxs("div", { className: "mt-2 text-sm text-gray-400", children: [formData.attachments.length, " file(s) selected"] }))] })] }), _jsxs("div", { className: "pb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "SECTION 13 \u2013 Declaration" }), _jsxs("label", { className: "flex items-start space-x-3 p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600", children: [_jsx("input", { type: "checkbox", checked: formData.declarationConfirmed, onChange: (e) => setFormData({ ...formData, declarationConfirmed: e.target.checked }), className: "mt-1 w-4 h-4 text-primary-500 rounded focus:ring-primary-500" }), _jsx("span", { className: "text-sm text-gray-200", children: "I confirm this idea is my original contribution and submitted in good faith to improve INARA's work. *" })] })] }), _jsxs("div", { className: "flex justify-end space-x-4 pt-4 border-t border-gray-700", children: [_jsx("button", { type: "button", onClick: () => {
                                            setShowForm(false);
                                            resetForm();
                                        }, className: "px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-900 text-gray-200", children: "Cancel" }), _jsx("button", { type: "submit", disabled: submitMutation.isLoading || !formData.declarationConfirmed, className: "px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed", children: submitMutation.isLoading ? 'Submitting...' : 'Submit Proposal' })] })] })] })), submissions.length > 0 && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-4 space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "text-sm text-gray-400", children: "Status:" }), _jsxs("button", { onClick: () => setStatusFilter('all'), className: `px-3 py-1 rounded-full text-sm transition-colors ${statusFilter === 'all'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: ["All (", submissions.length, ")"] }), statuses.map((status) => {
                                const count = submissions.filter((s) => s.status?.toLowerCase() === status).length;
                                return (_jsxs("button", { onClick: () => setStatusFilter(status), className: `px-3 py-1 rounded-full text-sm transition-colors capitalize ${statusFilter === status
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: [status.replace('_', ' '), " (", count, ")"] }, status));
                            })] }), _jsxs("div", { className: "text-sm text-gray-400", children: ["Showing ", _jsx("strong", { className: "text-white", children: filteredSubmissions.length }), " of", ' ', _jsx("strong", { className: "text-white", children: submissions.length }), " proposals"] })] })), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: isAdmin ? 'All Proposals' : 'My Proposals' }), _jsx("div", { className: "space-y-4", children: filteredSubmissions.map((submission) => (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer", onClick: () => setSelectedSubmission(submission), children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-2", children: submission.title }), _jsxs("div", { className: "flex flex-wrap gap-2 mb-2", children: [_jsx("span", { className: "text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded", children: submission.ideaType || 'N/A' }), submission.beneficiaries?.length > 0 && (_jsxs("span", { className: "text-xs bg-primary-500/20 text-primary-300 px-2 py-1 rounded", children: [submission.beneficiaries.length, " beneficiaries"] })), _jsxs("span", { className: "text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded", children: ["Impact: ", submission.estimatedImpact || 'N/A'] })] }), _jsx("p", { className: "text-sm text-gray-400 line-clamp-2 mb-2", children: submission.problemNeed || submission.problemStatement })] }), _jsx("span", { className: `text-xs font-medium px-3 py-1 rounded ml-4 ${submission.status === 'APPROVED'
                                                ? 'bg-green-900/30 text-green-300'
                                                : submission.status === 'REJECTED'
                                                    ? 'bg-red-900/30 text-red-300'
                                                    : submission.status === 'UNDER_REVIEW'
                                                        ? 'bg-blue-900/30 text-blue-300'
                                                        : 'bg-yellow-900/30 text-yellow-300'}`, children: submission.status?.replace('_', ' ') || 'NEW' })] }), _jsxs("div", { className: "flex items-center justify-between text-xs text-gray-500", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("span", { children: ["By: ", submission.user?.firstName, " ", submission.user?.lastName] }), _jsxs("span", { children: ["Submitted: ", new Date(submission.createdAt).toLocaleDateString()] })] }), submission.bonusApproved && submission.bonusAmount && (_jsxs("span", { className: "text-green-500 font-medium", children: ["Bonus: $", submission.bonusAmount] }))] })] }, submission.id))) }), submissions.length === 0 && (_jsx("div", { className: "bg-gray-900 border border-gray-700 rounded-lg p-8 text-center", children: _jsx("p", { className: "text-gray-400", children: "No proposals yet. Submit your first idea!" }) }))] }), selectedSubmission && (_jsx(SubmissionDetailModal, { submission: selectedSubmission, isAdmin: isAdmin, onClose: () => setSelectedSubmission(null), onReview: (data) => reviewMutation.mutate({ id: selectedSubmission.id, data }) }))] }));
}
// Submission Detail Modal Component
function SubmissionDetailModal({ submission, isAdmin, onClose, onReview }) {
    const [reviewData, setReviewData] = useState({
        status: submission.status || 'NEW',
        reviewScore: submission.reviewScore || '',
        bonusApproved: submission.bonusApproved || false,
        bonusAmount: submission.bonusAmount || '',
        internalNotes: submission.internalNotes || '',
        assignedReviewer: submission.assignedReviewer || '',
    });
    const handleReviewSubmit = (e) => {
        e.preventDefault();
        onReview(reviewData);
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75", onClick: onClose, children: _jsx("div", { className: "bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4", onClick: (e) => e.stopPropagation(), children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-start mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "Proposal Details" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-white", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsxs("div", { className: "space-y-6", children: [_jsx(Section, { title: "Staff Information", children: _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("strong", { className: "text-gray-400", children: "Name:" }), " ", _jsx("span", { className: "text-white", children: submission.fullName || `${submission.user?.firstName} ${submission.user?.lastName}` })] }), _jsxs("div", { children: [_jsx("strong", { className: "text-gray-400", children: "Job Title:" }), " ", _jsx("span", { className: "text-white", children: submission.jobTitle || 'N/A' })] }), _jsxs("div", { children: [_jsx("strong", { className: "text-gray-400", children: "Country/Office:" }), " ", _jsx("span", { className: "text-white", children: submission.countryOffice || submission.user?.country || 'N/A' })] }), _jsxs("div", { children: [_jsx("strong", { className: "text-gray-400", children: "Department:" }), " ", _jsx("span", { className: "text-white", children: submission.department || submission.user?.department || 'N/A' })] }), _jsxs("div", { children: [_jsx("strong", { className: "text-gray-400", children: "Email:" }), " ", _jsx("span", { className: "text-white", children: submission.email || submission.user?.email || 'N/A' })] }), _jsxs("div", { children: [_jsx("strong", { className: "text-gray-400", children: "Phone:" }), " ", _jsx("span", { className: "text-white", children: submission.phone || submission.user?.phone || 'N/A' })] })] }) }), _jsx(Section, { title: "Idea Title", children: _jsx("p", { className: "text-white text-lg font-semibold", children: submission.title }) }), _jsx(Section, { title: "Idea Type", children: _jsx("p", { className: "text-white", children: submission.ideaType || 'N/A' }) }), _jsx(Section, { title: "Problem / Need Identified", children: _jsx("p", { className: "text-gray-200 whitespace-pre-wrap", children: submission.problemNeed || submission.problemStatement || 'N/A' }) }), _jsx(Section, { title: "Proposed Solution", children: _jsx("p", { className: "text-gray-200 whitespace-pre-wrap", children: submission.proposedSolution || 'N/A' }) }), _jsx(Section, { title: "Beneficiaries", children: _jsxs("div", { className: "flex flex-wrap gap-2", children: [submission.beneficiaries?.map((b, idx) => (_jsx("span", { className: "bg-primary-500/20 text-primary-300 px-2 py-1 rounded text-sm", children: b }, idx))), (!submission.beneficiaries || submission.beneficiaries.length === 0) && (_jsx("span", { className: "text-gray-400", children: "N/A" }))] }) }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsx(Section, { title: "Estimated Impact", children: _jsx("p", { className: "text-white", children: submission.estimatedImpact || 'N/A' }) }), _jsx(Section, { title: "Estimated Cost", children: _jsx("p", { className: "text-white", children: submission.estimatedCost || 'N/A' }) }), _jsx(Section, { title: "Funding Potential", children: _jsx("p", { className: "text-white", children: submission.fundingPotential || 'N/A' }) }), _jsx(Section, { title: "Urgency", children: _jsx("p", { className: "text-white", children: submission.urgency || 'N/A' }) })] }), _jsx(Section, { title: "Leadership Interest", children: _jsx("p", { className: "text-white", children: submission.leadershipInterest || 'N/A' }) }), submission.attachments && submission.attachments.length > 0 && (_jsx(Section, { title: "Attachments", children: _jsx("div", { className: "space-y-2", children: submission.attachments.map((att, idx) => (_jsxs("a", { href: att, target: "_blank", rel: "noopener noreferrer", className: "text-primary-500 hover:text-primary-400 underline block", children: ["Attachment ", idx + 1] }, idx))) }) })), isAdmin && (_jsxs("div", { className: "border-t border-gray-700 pt-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: "Admin Review" }), _jsxs("form", { onSubmit: handleReviewSubmit, className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Review Status *" }), _jsxs("select", { value: reviewData.status, onChange: (e) => setReviewData({ ...reviewData, status: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "NEW", children: "New" }), _jsx("option", { value: "UNDER_REVIEW", children: "Under Review" }), _jsx("option", { value: "APPROVED", children: "Approved" }), _jsx("option", { value: "REJECTED", children: "Rejected" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Assigned Reviewer" }), _jsx("input", { type: "text", value: reviewData.assignedReviewer, onChange: (e) => setReviewData({ ...reviewData, assignedReviewer: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Review Score (0-100)" }), _jsx("input", { type: "number", min: "0", max: "100", value: reviewData.reviewScore, onChange: (e) => setReviewData({ ...reviewData, reviewScore: parseInt(e.target.value) || '' }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Bonus Approved" }), _jsxs("select", { value: reviewData.bonusApproved ? 'Yes' : 'No', onChange: (e) => setReviewData({ ...reviewData, bonusApproved: e.target.value === 'Yes' }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "No", children: "No" }), _jsx("option", { value: "Yes", children: "Yes" })] })] }), reviewData.bonusApproved && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Bonus Amount" }), _jsx("input", { type: "number", min: "0", step: "0.01", value: reviewData.bonusAmount, onChange: (e) => setReviewData({ ...reviewData, bonusAmount: parseFloat(e.target.value) || '' }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Internal Notes" }), _jsx("textarea", { value: reviewData.internalNotes, onChange: (e) => setReviewData({ ...reviewData, internalNotes: e.target.value }), rows: 4, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), _jsxs("div", { className: "flex justify-end space-x-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-800 text-gray-200", children: "Cancel" }), _jsx("button", { type: "submit", className: "px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600", children: "Submit Review" })] })] })] }))] })] }) }) }));
}
function Section({ title, children }) {
    return (_jsxs("div", { className: "border-b border-gray-700 pb-4", children: [_jsx("h4", { className: "text-lg font-semibold text-white mb-2", children: title }), children] }));
}
