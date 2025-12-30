import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';
export default function OrientationManagement() {
    const [showForm, setShowForm] = useState(false);
    const [showStepForm, setShowStepForm] = useState(false);
    const [selectedOrientation, setSelectedOrientation] = useState(null);
    const [editingStep, setEditingStep] = useState(null);
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        sections: {},
        isActive: true,
    });
    const [stepFormData, setStepFormData] = useState({
        stepNumber: 1,
        title: '',
        description: '',
        content: '',
        pdfUrl: '',
        policyId: '',
        questions: null,
        isRequired: true,
        order: 0,
    });
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [stepPdfFile, setStepPdfFile] = useState(null);
    const { data, isLoading } = useQuery('admin-orientations', async () => {
        const res = await api.get('/admin/orientations');
        return res.data;
    });
    const { data: policies } = useQuery('policies', async () => {
        const res = await api.get('/policies');
        return res.data;
    });
    const orientations = data?.orientations || [];
    const availablePolicies = policies?.policies || [];
    const createMutation = useMutation(async (data) => {
        const res = await api.post('/admin/orientations', data);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-orientations');
            setShowForm(false);
            setFormData({ title: '', content: '', sections: {}, isActive: true });
            alert('Orientation created successfully!');
        },
    });
    const updateMutation = useMutation(async ({ id, data }) => {
        const res = await api.put(`/admin/orientations/${id}`, data);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-orientations');
            alert('Orientation updated successfully!');
        },
    });
    const deleteMutation = useMutation(async (id) => {
        const res = await api.delete(`/admin/orientations/${id}`);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-orientations');
            alert('Orientation deleted successfully!');
        },
        onError: (error) => {
            alert(error.response?.data?.message || 'Failed to delete orientation');
        },
    });
    const createStepMutation = useMutation(async ({ orientationId, stepData, pdfFile }) => {
        const formData = new FormData();
        formData.append('stepNumber', stepData.stepNumber.toString());
        formData.append('title', stepData.title);
        if (stepData.description)
            formData.append('description', stepData.description);
        if (stepData.content)
            formData.append('content', stepData.content);
        if (stepData.policyId)
            formData.append('policyId', stepData.policyId);
        if (stepData.questions)
            formData.append('questions', JSON.stringify(stepData.questions));
        formData.append('isRequired', stepData.isRequired.toString());
        formData.append('order', stepData.order.toString());
        if (pdfFile)
            formData.append('pdf', pdfFile);
        const res = await api.post(`/admin/orientations/${orientationId}/steps`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-orientations');
            setShowStepForm(false);
            setEditingStep(null);
            setStepFormData({
                stepNumber: 1,
                title: '',
                description: '',
                content: '',
                pdfUrl: '',
                policyId: '',
                questions: null,
                isRequired: true,
                order: 0,
            });
            setStepPdfFile(null);
            alert('Step created successfully!');
        },
    });
    const updateStepMutation = useMutation(async ({ orientationId, stepId, stepData, pdfFile, removePdf }) => {
        const formData = new FormData();
        formData.append('stepNumber', stepData.stepNumber.toString());
        formData.append('title', stepData.title);
        if (stepData.description !== undefined)
            formData.append('description', stepData.description);
        if (stepData.content !== undefined)
            formData.append('content', stepData.content);
        if (stepData.policyId !== undefined)
            formData.append('policyId', stepData.policyId || '');
        if (stepData.questions !== undefined)
            formData.append('questions', JSON.stringify(stepData.questions));
        formData.append('isRequired', stepData.isRequired.toString());
        formData.append('order', stepData.order.toString());
        if (pdfFile)
            formData.append('pdf', pdfFile);
        if (removePdf)
            formData.append('removePdf', 'true');
        const res = await api.put(`/admin/orientations/${orientationId}/steps/${stepId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-orientations');
            setShowStepForm(false);
            setEditingStep(null);
            setStepFormData({
                stepNumber: 1,
                title: '',
                description: '',
                content: '',
                pdfUrl: '',
                policyId: '',
                questions: null,
                isRequired: true,
                order: 0,
            });
            setStepPdfFile(null);
            alert('Step updated successfully!');
        },
    });
    const deleteStepMutation = useMutation(async ({ orientationId, stepId }) => {
        const res = await api.delete(`/admin/orientations/${orientationId}/steps/${stepId}`);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-orientations');
            alert('Step deleted successfully!');
        },
    });
    const uploadResourcesMutation = useMutation(async ({ orientationId, files }) => {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files', file);
        });
        const res = await api.post(`/admin/orientations/${orientationId}/resources`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-orientations');
            setUploadedFiles([]);
            alert('Resources uploaded successfully!');
        },
    });
    const deleteResourceMutation = useMutation(async ({ orientationId, filename }) => {
        const res = await api.delete(`/admin/orientations/${orientationId}/resources`, {
            data: { filename },
        });
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-orientations');
            alert('Resource deleted successfully!');
        },
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };
    const handleStepSubmit = (e) => {
        e.preventDefault();
        if (!selectedOrientation)
            return;
        if (editingStep?.id) {
            updateStepMutation.mutate({
                orientationId: selectedOrientation,
                stepId: editingStep.id,
                stepData: stepFormData,
                pdfFile: stepPdfFile,
            });
        }
        else {
            createStepMutation.mutate({
                orientationId: selectedOrientation,
                stepData: stepFormData,
                pdfFile: stepPdfFile,
            });
        }
    };
    const handleEditStep = (step, orientationId) => {
        setEditingStep(step);
        setSelectedOrientation(orientationId);
        setStepFormData({
            stepNumber: step.stepNumber,
            title: step.title,
            description: step.description || '',
            content: step.content || '',
            pdfUrl: step.pdfUrl || '',
            policyId: step.policyId || '',
            questions: step.questions || null,
            isRequired: step.isRequired,
            order: step.order,
        });
        setShowStepForm(true);
    };
    const selectedOrientationData = orientations.find((o) => o.id === selectedOrientation);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "Orientation Management" }), _jsx("p", { className: "text-gray-400 mt-1", children: "Create and manage staff orientation content" })] }), _jsx("button", { onClick: () => setShowForm(!showForm), className: "bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors", children: showForm ? 'Cancel' : '+ Create Orientation' })] }), showForm && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: "Create New Orientation" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Title *" }), _jsx("input", { type: "text", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Content (Markdown)" }), _jsx("textarea", { value: formData.content, onChange: (e) => setFormData({ ...formData, content: e.target.value }), rows: 8, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", placeholder: "Enter orientation content in Markdown format..." })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", id: "isActive", checked: formData.isActive, onChange: (e) => setFormData({ ...formData, isActive: e.target.checked }), className: "mr-2" }), _jsx("label", { htmlFor: "isActive", className: "text-sm text-gray-200", children: "Active" })] }), _jsxs("div", { className: "flex justify-end space-x-4", children: [_jsx("button", { type: "button", onClick: () => setShowForm(false), className: "px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-200", children: "Cancel" }), _jsx("button", { type: "submit", disabled: createMutation.isLoading, className: "px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50", children: createMutation.isLoading ? 'Creating...' : 'Create Orientation' })] })] })] })), _jsx("div", { className: "space-y-4", children: orientations.map((orientation) => (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-6", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h3", { className: "text-xl font-bold text-white", children: orientation.title }), _jsx("span", { className: `px-2 py-1 rounded text-xs ${orientation.isActive ? 'bg-green-900/30 text-green-300' : 'bg-gray-700 text-gray-300'}`, children: orientation.isActive ? 'Active' : 'Inactive' }), _jsxs("span", { className: "text-sm text-gray-400", children: ["v", orientation.version] })] }), _jsxs("p", { className: "text-sm text-gray-400 mt-1", children: [orientation.steps?.length || 0, " steps \u2022 ", orientation._count?.completions || 0, " completions"] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => {
                                                setSelectedOrientation(orientation.id);
                                                setShowStepForm(false);
                                                setEditingStep(null);
                                            }, className: "px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm", children: selectedOrientation === orientation.id ? 'Hide Steps' : 'Manage Steps' }), _jsx("button", { onClick: () => {
                                                if (confirm('Are you sure you want to delete this orientation?')) {
                                                    deleteMutation.mutate(orientation.id);
                                                }
                                            }, className: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm", children: "Delete" })] })] }), selectedOrientation === orientation.id && (_jsxs("div", { className: "mt-6 space-y-4 border-t border-gray-700 pt-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h4", { className: "text-lg font-semibold text-white", children: "Steps" }), _jsx("button", { onClick: () => {
                                                setEditingStep(null);
                                                setStepFormData({
                                                    stepNumber: (orientation.steps?.length || 0) + 1,
                                                    title: '',
                                                    description: '',
                                                    content: '',
                                                    pdfUrl: '',
                                                    policyId: '',
                                                    questions: null,
                                                    isRequired: true,
                                                    order: orientation.steps?.length || 0,
                                                });
                                                setStepPdfFile(null);
                                                setShowStepForm(true);
                                            }, className: "px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm", children: "+ Add Step" })] }), showStepForm && (_jsxs("div", { className: "bg-gray-700 rounded-lg p-4 space-y-4", children: [_jsx("h5", { className: "text-md font-semibold text-white", children: editingStep ? 'Edit Step' : 'Create New Step' }), _jsxs("form", { onSubmit: handleStepSubmit, className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Step Number *" }), _jsx("input", { type: "number", value: stepFormData.stepNumber, onChange: (e) => setStepFormData({ ...stepFormData, stepNumber: parseInt(e.target.value) }), required: true, min: "1", className: "w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Order *" }), _jsx("input", { type: "number", value: stepFormData.order, onChange: (e) => setStepFormData({ ...stepFormData, order: parseInt(e.target.value) }), required: true, min: "0", className: "w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Title *" }), _jsx("input", { type: "text", value: stepFormData.title, onChange: (e) => setStepFormData({ ...stepFormData, title: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Description" }), _jsx("textarea", { value: stepFormData.description, onChange: (e) => setStepFormData({ ...stepFormData, description: e.target.value }), rows: 2, className: "w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Content (Markdown)" }), _jsx("textarea", { value: stepFormData.content, onChange: (e) => setStepFormData({ ...stepFormData, content: e.target.value }), rows: 4, className: "w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg", placeholder: "Step content in Markdown format..." })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Link to Policy" }), _jsxs("select", { value: stepFormData.policyId, onChange: (e) => setStepFormData({ ...stepFormData, policyId: e.target.value }), className: "w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg", children: [_jsx("option", { value: "", children: "None" }), availablePolicies.map((policy) => (_jsx("option", { value: policy.id, children: policy.title }, policy.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "PDF Document" }), _jsx("input", { type: "file", accept: ".pdf", onChange: (e) => setStepPdfFile(e.target.files?.[0] || null), className: "w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg" }), stepFormData.pdfUrl && !stepPdfFile && (_jsxs("p", { className: "text-xs text-gray-400 mt-1", children: ["Current: ", stepFormData.pdfUrl] })), stepFormData.pdfUrl && (_jsx("button", { type: "button", onClick: () => {
                                                                        setStepFormData({ ...stepFormData, pdfUrl: '' });
                                                                        if (editingStep) {
                                                                            updateStepMutation.mutate({
                                                                                orientationId: selectedOrientation,
                                                                                stepId: editingStep.id,
                                                                                stepData: { ...stepFormData, pdfUrl: '' },
                                                                                removePdf: true,
                                                                            });
                                                                        }
                                                                    }, className: "mt-2 text-xs text-red-400 hover:text-red-300", children: "Remove PDF" }))] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", id: "isRequired", checked: stepFormData.isRequired, onChange: (e) => setStepFormData({ ...stepFormData, isRequired: e.target.checked }), className: "mr-2" }), _jsx("label", { htmlFor: "isRequired", className: "text-sm text-gray-200", children: "Required Step" })] }), _jsxs("div", { className: "flex justify-end space-x-4", children: [_jsx("button", { type: "button", onClick: () => {
                                                                setShowStepForm(false);
                                                                setEditingStep(null);
                                                            }, className: "px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-600 text-gray-200 text-sm", children: "Cancel" }), _jsx("button", { type: "submit", disabled: createStepMutation.isLoading || updateStepMutation.isLoading, className: "px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 text-sm", children: editingStep ? (updateStepMutation.isLoading ? 'Updating...' : 'Update Step') : (createStepMutation.isLoading ? 'Creating...' : 'Create Step') })] })] })] })), orientation.steps && orientation.steps.length > 0 && (_jsx("div", { className: "space-y-2 mt-4", children: orientation.steps.map((step) => (_jsxs("div", { className: "bg-gray-700 rounded-lg p-4 flex justify-between items-start", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-sm font-semibold text-primary-400", children: ["Step ", step.stepNumber] }), _jsx("h5", { className: "text-md font-medium text-white", children: step.title }), step.isRequired && (_jsx("span", { className: "text-xs bg-red-900/30 text-red-300 px-2 py-0.5 rounded", children: "Required" }))] }), step.description && (_jsx("p", { className: "text-sm text-gray-400 mt-1", children: step.description })), step.pdfUrl && (_jsxs("p", { className: "text-xs text-gray-500 mt-1", children: ["\uD83D\uDCC4 PDF: ", step.pdfUrl.split('/').pop()] })), step.policyId && (_jsx("p", { className: "text-xs text-gray-500 mt-1", children: "\uD83D\uDCCB Linked to Policy" }))] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => handleEditStep(step, orientation.id), className: "px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm", children: "Edit" }), _jsx("button", { onClick: () => {
                                                            if (confirm('Are you sure you want to delete this step?')) {
                                                                deleteStepMutation.mutate({ orientationId: orientation.id, stepId: step.id });
                                                            }
                                                        }, className: "px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm", children: "Delete" })] })] }, step.id))) })), _jsxs("div", { className: "mt-6 border-t border-gray-700 pt-4", children: [_jsx("h4", { className: "text-lg font-semibold text-white mb-4", children: "Orientation Resources" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-2", children: "Upload Documents (PDFs, etc.)" }), _jsx("input", { type: "file", multiple: true, accept: ".pdf,.doc,.docx", onChange: (e) => setUploadedFiles(Array.from(e.target.files || [])), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" }), uploadedFiles.length > 0 && (_jsxs("div", { className: "mt-2", children: [_jsxs("p", { className: "text-sm text-gray-400", children: ["Selected: ", uploadedFiles.length, " file(s)"] }), _jsx("button", { onClick: () => {
                                                                        if (uploadedFiles.length > 0) {
                                                                            uploadResourcesMutation.mutate({ orientationId: orientation.id, files: uploadedFiles });
                                                                        }
                                                                    }, disabled: uploadResourcesMutation.isLoading, className: "mt-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 text-sm", children: uploadResourcesMutation.isLoading ? 'Uploading...' : 'Upload Files' })] }))] }), orientation.pdfFiles && Array.isArray(orientation.pdfFiles) && orientation.pdfFiles.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm font-medium text-gray-300", children: "Uploaded Resources:" }), orientation.pdfFiles.map((file, index) => (_jsxs("div", { className: "bg-gray-700 rounded-lg p-3 flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-white", children: file.filename }), _jsxs("p", { className: "text-xs text-gray-400", children: [file.size ? `${(file.size / 1024).toFixed(2)} KB` : '', " \u2022 ", file.type || 'PDF'] })] }), _jsx("button", { onClick: () => {
                                                                        if (confirm('Are you sure you want to delete this resource?')) {
                                                                            deleteResourceMutation.mutate({ orientationId: orientation.id, filename: file.filename });
                                                                        }
                                                                    }, className: "px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm", children: "Delete" })] }, index)))] }))] })] })] }))] }, orientation.id))) }), isLoading && (_jsx("div", { className: "text-center text-gray-400 py-8", children: "Loading orientations..." })), !isLoading && orientations.length === 0 && (_jsx("div", { className: "text-center text-gray-400 py-8", children: "No orientations found. Create your first orientation to get started." }))] }));
}
