import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useState } from 'react';
import api from '../../api/client';
export default function MarketManagement() {
    const queryClient = useQueryClient();
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const { data: submissions } = useQuery('admin-market', async () => {
        const res = await api.get('/market/all');
        return res.data;
    });
    const reviewMutation = useMutation(async ({ id, data }) => {
        const res = await api.post(`/market/${id}/review`, data);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-market');
            setSelectedSubmission(null);
            alert('Review submitted successfully!');
        },
    });
    const deleteMutation = useMutation(async (id) => {
        const res = await api.delete(`/market/${id}`);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-market');
            alert('Market submission deleted successfully!');
        },
        onError: (error) => {
            alert(error.response?.data?.message || 'Failed to delete submission');
        },
    });
    const allSubmissions = submissions?.submissions || [];
    const filteredSubmissions = allSubmissions.filter((s) => {
        if (statusFilter === 'all')
            return true;
        return s.status === statusFilter.toUpperCase();
    });
    const statuses = ['NEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "Market Management" }), _jsx("button", { onClick: async () => {
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
                        }, className: "bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors", children: "Export CSV" })] }), _jsx("div", { className: "bg-gray-800 rounded-lg shadow p-4", children: _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "text-sm text-gray-400", children: "Filter by Status:" }), _jsxs("button", { onClick: () => setStatusFilter('all'), className: `px-3 py-1 rounded-full text-sm transition-colors ${statusFilter === 'all'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: ["All (", allSubmissions.length, ")"] }), statuses.map((status) => {
                            const count = allSubmissions.filter((s) => s.status === status).length;
                            return (_jsxs("button", { onClick: () => setStatusFilter(status.toLowerCase()), className: `px-3 py-1 rounded-full text-sm transition-colors ${statusFilter === status.toLowerCase()
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: [status.replace('_', ' '), " (", count, ")"] }, status));
                        })] }) }), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsxs("h3", { className: "text-lg font-bold text-white mb-4", children: ["All Proposals (", filteredSubmissions.length, ")"] }), _jsxs("div", { className: "space-y-4", children: [filteredSubmissions.map((submission) => (_jsxs("div", { className: "bg-gray-700 p-6 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer", onClick: () => setSelectedSubmission(submission), children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "text-white font-semibold text-lg mb-2", children: submission.title }), _jsxs("div", { className: "flex flex-wrap gap-2 mb-2", children: [_jsx("span", { className: "text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded", children: submission.ideaType || 'N/A' }), submission.beneficiaries?.length > 0 && (_jsxs("span", { className: "text-xs bg-primary-500/20 text-primary-300 px-2 py-1 rounded", children: [submission.beneficiaries.length, " beneficiaries"] })), _jsxs("span", { className: "text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded", children: ["Impact: ", submission.estimatedImpact || 'N/A'] }), _jsxs("span", { className: "text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded", children: ["Cost: ", submission.estimatedCost || 'N/A'] })] }), _jsxs("p", { className: "text-gray-400 text-sm mb-2", children: ["By: ", submission.fullName || `${submission.user?.firstName} ${submission.user?.lastName}`, ' ', "(", submission.email || submission.user?.email, ")"] }), _jsxs("p", { className: "text-gray-400 text-sm", children: [submission.department || submission.user?.department, " \u2022 ", submission.countryOffice || submission.user?.country] })] }), _jsx("span", { className: `text-xs font-medium px-3 py-1 rounded ml-4 ${submission.status === 'APPROVED'
                                                    ? 'bg-green-900/30 text-green-300'
                                                    : submission.status === 'REJECTED'
                                                        ? 'bg-red-900/30 text-red-300'
                                                        : submission.status === 'UNDER_REVIEW'
                                                            ? 'bg-blue-900/30 text-blue-300'
                                                            : 'bg-yellow-900/30 text-yellow-300'}`, children: submission.status?.replace('_', ' ') || 'NEW' })] }), _jsx("div", { className: "text-sm text-gray-300 line-clamp-2 mb-2", children: submission.problemNeed || submission.problemStatement || 'No problem statement provided' }), _jsxs("div", { className: "flex items-center justify-between text-xs text-gray-400", children: [_jsxs("span", { children: ["Submitted: ", new Date(submission.createdAt).toLocaleDateString()] }), submission.bonusApproved && submission.bonusAmount && (_jsxs("span", { className: "text-green-400 font-medium", children: ["Bonus: $", submission.bonusAmount] })), submission.reviewScore !== null && submission.reviewScore !== undefined && (_jsxs("span", { className: "text-primary-400", children: ["Score: ", submission.reviewScore, "/100"] }))] }), _jsx("button", { onClick: (e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`Are you sure you want to delete "${submission.title}"? This action cannot be undone.`)) {
                                                deleteMutation.mutate(submission.id);
                                            }
                                        }, disabled: deleteMutation.isLoading, className: "mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors", children: "Delete" })] }, submission.id))), filteredSubmissions.length === 0 && (_jsx("div", { className: "text-center py-8 text-gray-400", children: "No submissions found" }))] })] }), selectedSubmission && (_jsx(ReviewModal, { submission: selectedSubmission, onClose: () => setSelectedSubmission(null), onReview: (data) => reviewMutation.mutate({ id: selectedSubmission.id, data }) }))] }));
}
function ReviewModal({ submission, onClose, onReview }) {
    const [reviewData, setReviewData] = useState({
        status: submission.status || 'NEW',
        reviewScore: submission.reviewScore || '',
        bonusApproved: submission.bonusApproved || false,
        bonusAmount: submission.bonusAmount || '',
        internalNotes: submission.internalNotes || '',
        assignedReviewer: submission.assignedReviewer || '',
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        onReview(reviewData);
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75", onClick: onClose, children: _jsx("div", { className: "bg-gray-900 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto m-4", onClick: (e) => e.stopPropagation(), children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-start mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "Review Proposal" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-white", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsxs("div", { className: "space-y-6 mb-6 border-b border-gray-700 pb-6", children: [_jsx(Section, { title: "Staff Information", children: _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("strong", { className: "text-gray-400", children: "Name:" }), " ", _jsx("span", { className: "text-white", children: submission.fullName || `${submission.user?.firstName} ${submission.user?.lastName}` })] }), _jsxs("div", { children: [_jsx("strong", { className: "text-gray-400", children: "Job Title:" }), " ", _jsx("span", { className: "text-white", children: submission.jobTitle || 'N/A' })] }), _jsxs("div", { children: [_jsx("strong", { className: "text-gray-400", children: "Country/Office:" }), " ", _jsx("span", { className: "text-white", children: submission.countryOffice || submission.user?.country || 'N/A' })] }), _jsxs("div", { children: [_jsx("strong", { className: "text-gray-400", children: "Department:" }), " ", _jsx("span", { className: "text-white", children: submission.department || submission.user?.department || 'N/A' })] }), _jsxs("div", { children: [_jsx("strong", { className: "text-gray-400", children: "Email:" }), " ", _jsx("span", { className: "text-white", children: submission.email || submission.user?.email || 'N/A' })] }), _jsxs("div", { children: [_jsx("strong", { className: "text-gray-400", children: "Phone:" }), " ", _jsx("span", { className: "text-white", children: submission.phone || submission.user?.phone || 'N/A' })] })] }) }), _jsx(Section, { title: "Idea Title", children: _jsx("p", { className: "text-white text-lg font-semibold", children: submission.title }) }), _jsx(Section, { title: "Idea Type", children: _jsx("p", { className: "text-white", children: submission.ideaType || 'N/A' }) }), _jsx(Section, { title: "Problem / Need Identified", children: _jsx("p", { className: "text-gray-200 whitespace-pre-wrap", children: submission.problemNeed || submission.problemStatement || 'N/A' }) }), _jsx(Section, { title: "Proposed Solution", children: _jsx("p", { className: "text-gray-200 whitespace-pre-wrap", children: submission.proposedSolution || 'N/A' }) }), _jsx(Section, { title: "Beneficiaries", children: _jsxs("div", { className: "flex flex-wrap gap-2", children: [submission.beneficiaries?.map((b, idx) => (_jsx("span", { className: "bg-primary-500/20 text-primary-300 px-2 py-1 rounded text-sm", children: b }, idx))), (!submission.beneficiaries || submission.beneficiaries.length === 0) && (_jsx("span", { className: "text-gray-400", children: "N/A" }))] }) }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsx("strong", { className: "text-gray-400 block mb-1", children: "Estimated Impact" }), _jsx("p", { className: "text-white", children: submission.estimatedImpact || 'N/A' })] }), _jsxs("div", { children: [_jsx("strong", { className: "text-gray-400 block mb-1", children: "Estimated Cost" }), _jsx("p", { className: "text-white", children: submission.estimatedCost || 'N/A' })] }), _jsxs("div", { children: [_jsx("strong", { className: "text-gray-400 block mb-1", children: "Funding Potential" }), _jsx("p", { className: "text-white", children: submission.fundingPotential || 'N/A' })] }), _jsxs("div", { children: [_jsx("strong", { className: "text-gray-400 block mb-1", children: "Urgency" }), _jsx("p", { className: "text-white", children: submission.urgency || 'N/A' })] })] }), _jsx(Section, { title: "Leadership Interest", children: _jsx("p", { className: "text-white", children: submission.leadershipInterest || 'N/A' }) }), submission.attachments && submission.attachments.length > 0 && (_jsx(Section, { title: "Attachments", children: _jsx("div", { className: "space-y-2", children: submission.attachments.map((att, idx) => (_jsxs("a", { href: att, target: "_blank", rel: "noopener noreferrer", className: "text-primary-500 hover:text-primary-400 underline block", children: ["Attachment ", idx + 1, " \u2192"] }, idx))) }) }))] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: "Admin Review" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Review Status *" }), _jsxs("select", { value: reviewData.status, onChange: (e) => setReviewData({ ...reviewData, status: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500", children: [_jsx("option", { value: "NEW", children: "New" }), _jsx("option", { value: "UNDER_REVIEW", children: "Under Review" }), _jsx("option", { value: "APPROVED", children: "Approved" }), _jsx("option", { value: "REJECTED", children: "Rejected" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Assigned Reviewer" }), _jsx("input", { type: "text", value: reviewData.assignedReviewer, onChange: (e) => setReviewData({ ...reviewData, assignedReviewer: e.target.value }), placeholder: "Reviewer name or email", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Review Score (0-100)" }), _jsx("input", { type: "number", min: "0", max: "100", value: reviewData.reviewScore, onChange: (e) => setReviewData({ ...reviewData, reviewScore: parseInt(e.target.value) || '' }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Bonus Approved" }), _jsxs("select", { value: reviewData.bonusApproved ? 'Yes' : 'No', onChange: (e) => setReviewData({ ...reviewData, bonusApproved: e.target.value === 'Yes' }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500", children: [_jsx("option", { value: "No", children: "No" }), _jsx("option", { value: "Yes", children: "Yes" })] })] }), reviewData.bonusApproved && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Bonus Amount ($)" }), _jsx("input", { type: "number", min: "0", step: "0.01", value: reviewData.bonusAmount, onChange: (e) => setReviewData({ ...reviewData, bonusAmount: parseFloat(e.target.value) || '' }), required: reviewData.bonusApproved, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500" })] }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Internal Notes" }), _jsx("textarea", { value: reviewData.internalNotes, onChange: (e) => setReviewData({ ...reviewData, internalNotes: e.target.value }), rows: 4, placeholder: "Internal notes for this proposal...", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500" })] }), _jsxs("div", { className: "flex justify-end space-x-4 pt-4 border-t border-gray-700", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-800 text-gray-200", children: "Cancel" }), _jsx("button", { type: "submit", className: "px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600", children: "Submit Review" })] })] })] }) }) }));
}
function Section({ title, children }) {
    return (_jsxs("div", { className: "border-b border-gray-700 pb-4 mb-4", children: [_jsx("h4", { className: "text-lg font-semibold text-white mb-2", children: title }), children] }));
}
