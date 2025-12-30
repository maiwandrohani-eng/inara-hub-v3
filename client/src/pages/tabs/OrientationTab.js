import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import PDFViewer from '../../components/PDFViewer';
export default function OrientationTab() {
    console.log('🎓 NEW OrientationTab component loaded - version with onboarding checklist!');
    const [currentStep, setCurrentStep] = useState(0);
    const [checklist, setChecklist] = useState([
        // Orientation received from
        { id: 'orientation-communication', label: 'Received orientation from Communication team', checked: false, category: 'orientation' },
        { id: 'orientation-programs', label: 'Received orientation from Programs team', checked: false, category: 'orientation' },
        { id: 'orientation-hr', label: 'Received orientation from HR', checked: false, category: 'orientation' },
        { id: 'orientation-finance', label: 'Received orientation from Finance', checked: false, category: 'orientation' },
        { id: 'orientation-supervisor', label: 'Received orientation from your Supervisor', checked: false, category: 'orientation' },
        { id: 'orientation-colleagues', label: 'Met with your colleagues', checked: false, category: 'orientation' },
        // Equipment
        { id: 'equipment-computer', label: 'I have a computer/laptop', checked: false, category: 'equipment' },
        { id: 'equipment-email', label: 'I have an email account', checked: false, category: 'equipment' },
        { id: 'equipment-phone', label: 'I have a work phone', checked: false, category: 'equipment' },
        { id: 'equipment-workspace', label: 'I have a workspace/desk', checked: false, category: 'equipment' },
    ]);
    const [policyConfirmations, setPolicyConfirmations] = useState(new Set());
    const [showOnboardingFlow, setShowOnboardingFlow] = useState(false); // Allow viewing onboarding even if completed
    const [questionResponses, setQuestionResponses] = useState({}); // stepId -> questionId -> answer
    const [answerFeedback, setAnswerFeedback] = useState({}); // stepId -> questionId -> feedback
    const [showCertificateForm, setShowCertificateForm] = useState(false); // Show certificate form modal
    const [certificateData, setCertificateData] = useState({
        passportId: '',
        country: '',
        department: '',
        role: '',
    });
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    // Initialize certificate data from user profile when user is available
    useEffect(() => {
        if (user) {
            setCertificateData({
                passportId: '',
                country: user.country || '',
                department: user.department || '',
                role: user.role || '',
            });
        }
    }, [user]);
    const { data, isLoading, refetch } = useQuery('orientation', async () => {
        console.log('🔄 Fetching orientation data from API...');
        const res = await api.get('/orientation');
        console.log('✅ Orientation data received:', {
            hasSteps: !!res.data.orientation?.steps,
            policiesCount: res.data.policies?.length || 0,
            completed: res.data.completed,
        });
        return res.data;
    }, {
        staleTime: 0, // Always consider data stale
        cacheTime: 0, // Don't cache
        refetchOnMount: 'always', // Always refetch on mount
        refetchOnWindowFocus: false, // Don't refetch on window focus
    });
    // Force refetch on component mount to ensure fresh data
    useEffect(() => {
        console.log('🔄 OrientationTab mounted - forcing data refetch...');
        refetch();
    }, [refetch]);
    const confirmStepMutation = useMutation(async ({ stepId, responses }) => {
        const res = await api.post(`/orientation/steps/${stepId}/confirm`, {
            responses
        });
        return res.data;
    }, {
        onSuccess: (data) => {
            // Store answer feedback if provided
            if (data.answerValidation && currentStepData?.id) {
                const feedback = {};
                data.answerValidation.forEach((validation) => {
                    feedback[validation.questionId] = {
                        isCorrect: validation.isCorrect,
                        correctAnswer: validation.correctAnswer,
                        message: validation.isCorrect
                            ? 'Correct!'
                            : `Incorrect. The correct answer is: ${Array.isArray(validation.correctAnswer) ? validation.correctAnswer.join(', ') : validation.correctAnswer}`,
                    };
                });
                setAnswerFeedback(prev => ({
                    ...prev,
                    [currentStepData.id]: feedback,
                }));
            }
            queryClient.invalidateQueries('orientation');
        },
    });
    const completeMutation = useMutation(async (checklistData) => {
        const res = await api.post('/orientation/complete', {
            score: 100,
            checklistData
        });
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('orientation');
        },
    });
    const toggleChecklistItem = (id) => {
        setChecklist(items => items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
    };
    const handlePolicyConfirm = (policyId) => {
        setPolicyConfirmations(prev => {
            const newSet = new Set(prev);
            if (newSet.has(policyId)) {
                newSet.delete(policyId);
            }
            else {
                newSet.add(policyId);
            }
            return newSet;
        });
    };
    const handleComplete = async () => {
        const allChecklistChecked = checklist.every(item => item.checked);
        if (!allChecklistChecked) {
            alert('Please complete all checklist items before finishing orientation.');
            return;
        }
        const checklistData = {
            orientation: checklist.filter(c => c.category === 'orientation').map(c => ({
                id: c.id,
                label: c.label,
                checked: c.checked,
            })),
            equipment: checklist.filter(c => c.category === 'equipment').map(c => ({
                id: c.id,
                label: c.label,
                checked: c.checked,
            })),
            completedAt: new Date().toISOString(),
        };
        try {
            const result = await completeMutation.mutateAsync(checklistData);
            // Automatically download certificate using the API client (which includes auth)
            if (result.certificateUrl && user?.id) {
                try {
                    // Get the token from auth store
                    const { token } = useAuthStore.getState();
                    if (!token) {
                        throw new Error('No authentication token found');
                    }
                    // Extract the certificate path from the URL
                    let certificatePath = result.certificateUrl;
                    if (certificatePath.startsWith('http')) {
                        // Extract path from full URL
                        const url = new URL(certificatePath);
                        certificatePath = url.pathname;
                    }
                    // Ensure it starts with /api
                    if (!certificatePath.startsWith('/api')) {
                        certificatePath = `/api${certificatePath}`;
                    }
                    // Use axios with responseType: 'blob' and explicit auth header
                    const response = await api.get(certificatePath, {
                        responseType: 'blob', // Important: tell axios to handle as blob
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    // Create blob and download
                    const blob = new Blob([response.data], { type: 'application/pdf' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `INARA_Orientation_Certificate_${user?.firstName}_${user?.lastName}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    alert('🎉 Orientation completed successfully! Your certificate has been downloaded.');
                }
                catch (fetchError) {
                    console.error('Error downloading certificate:', fetchError);
                    console.error('Error details:', fetchError.response?.data);
                    // Fallback: try with direct fetch and explicit token
                    try {
                        const { token } = useAuthStore.getState();
                        if (token && user?.id) {
                            let certUrl = result.certificateUrl;
                            if (!certUrl.startsWith('http')) {
                                // Use environment variable or fallback to relative path
                                const apiBase = import.meta.env?.VITE_API_URL || window.location.origin;
                                certUrl = `${apiBase}${certUrl}`;
                            }
                            const response = await fetch(certUrl, {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                },
                            });
                            if (response.ok) {
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `INARA_Orientation_Certificate_${user?.firstName}_${user?.lastName}.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(url);
                                alert('🎉 Orientation completed successfully! Your certificate has been downloaded.');
                            }
                            else {
                                throw new Error('Failed to fetch certificate');
                            }
                        }
                        else {
                            throw new Error('No authentication token');
                        }
                    }
                    catch (fallbackError) {
                        console.error('Fallback download also failed:', fallbackError);
                        alert('🎉 Orientation completed successfully! Please download your certificate from the completion page.');
                    }
                }
            }
            else {
                alert('🎉 Orientation completed successfully! Please refresh to see your certificate.');
            }
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to complete orientation');
        }
    };
    if (isLoading) {
        return _jsx("div", { className: "text-center py-12 text-gray-400", children: "Loading orientation..." });
    }
    const orientation = data?.orientation;
    const orientationSteps = orientation?.steps || [];
    const policies = data?.policies || [];
    const completed = data?.completed;
    const certificateUrl = data?.certificateUrl;
    const checklistData = data?.checklistData;
    const stepConfirmations = data?.stepConfirmations || new Set();
    console.log('OrientationTab: Data loaded', {
        hasSteps: orientationSteps.length > 0,
        hasPolicies: policies.length > 0,
        completed,
        currentStep,
        checklistItems: checklist.length,
        stepConfirmations: stepConfirmations.size,
    });
    // Use orientation steps if available (with PDFs and questions), otherwise fall back to policies
    const useSteps = orientationSteps.length > 0;
    // Group policies by category (for fallback)
    const policiesByCategory = policies.reduce((acc, policy) => {
        const category = policy.category || 'Other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(policy);
        return acc;
    }, {});
    let totalSteps = 1; // Step 0 is always checklist
    let currentStepData = null;
    let currentCategory = '';
    let currentPolicies = [];
    if (useSteps) {
        // Use orientation steps (which can have PDFs and questions)
        totalSteps = 1 + orientationSteps.length;
        if (currentStep > 0 && currentStep <= orientationSteps.length) {
            currentStepData = orientationSteps[currentStep - 1];
        }
    }
    else {
        // Fallback to old behavior: policies grouped by category
        totalSteps = 1 + Object.keys(policiesByCategory).length;
        currentCategory = Object.keys(policiesByCategory)[currentStep - 1] || '';
        currentPolicies = currentStep > 0 ? policiesByCategory[currentCategory] || [] : [];
        currentStepData = { type: 'policies', policies: currentPolicies, category: currentCategory };
    }
    // If completed and user wants to see onboarding flow, show it
    if (completed && !showOnboardingFlow) {
        return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/50 rounded-lg p-8 text-center", children: _jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83C\uDF93" }), _jsx("h2", { className: "text-3xl font-bold text-white mb-2", children: "Orientation Completed!" }), _jsxs("p", { className: "text-gray-300 mb-6", children: ["You completed orientation on ", new Date(data.completionDate).toLocaleDateString()] }), certificateUrl && (_jsxs("div", { className: "space-y-4", children: [_jsx("p", { className: "text-gray-300", children: "Your certificate is ready!" }), _jsxs("button", { onClick: () => setShowCertificateForm(true), className: "px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold flex items-center space-x-2 mx-auto", children: [_jsx("span", { children: "\uD83D\uDCC4" }), _jsx("span", { children: "Download Certificate" })] })] })), _jsx("div", { className: "mt-6", children: _jsxs("button", { onClick: () => setShowOnboardingFlow(true), className: "px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium flex items-center space-x-2 mx-auto", children: [_jsx("span", { children: "\uD83D\uDC41\uFE0F" }), _jsx("span", { children: "Let's Start My Orientation" })] }) })] }) }), checklistData && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: "Your Onboarding Checklist" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-semibold text-gray-400 mb-2", children: "Orientations Received" }), _jsx("ul", { className: "space-y-2", children: checklistData.orientation?.map((item) => (_jsxs("li", { className: "flex items-center space-x-2", children: [item.checked ? (_jsx("span", { className: "text-green-500", children: "\u2705" })) : (_jsx("span", { className: "text-gray-500", children: "\u274C" })), _jsx("span", { className: "text-gray-300 text-sm", children: item.label })] }, item.id))) })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-semibold text-gray-400 mb-2", children: "Equipment & Resources" }), _jsx("ul", { className: "space-y-2", children: checklistData.equipment?.map((item) => (_jsxs("li", { className: "flex items-center space-x-2", children: [item.checked ? (_jsx("span", { className: "text-green-500", children: "\u2705" })) : (_jsx("span", { className: "text-gray-500", children: "\u274C" })), _jsx("span", { className: "text-gray-300 text-sm", children: item.label })] }, item.id))) })] })] })] })), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-2xl font-bold text-white mb-4", children: "Key Policies & Guidelines" }), _jsx("p", { className: "text-gray-400 mb-6", children: "Review these essential policies and guidelines that guide INARA's work." }), Object.entries(policiesByCategory).map(([category, categoryPolicies]) => (_jsxs("div", { className: "mb-6", children: [_jsx("h4", { className: "text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2", children: category }), _jsx("div", { className: "space-y-3", children: categoryPolicies.map((policy) => (_jsx("div", { className: "bg-gray-700/50 rounded-lg p-4 border border-gray-600", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [_jsx("h5", { className: "font-semibold text-white", children: policy.title }), policy.isMandatory && (_jsx("span", { className: "px-2 py-0.5 text-xs bg-red-500/20 text-red-300 rounded", children: "Mandatory" }))] }), _jsx("p", { className: "text-gray-300 text-sm leading-relaxed", children: policy.brief })] }), _jsx("button", { onClick: () => navigate(`/policies?policy=${policy.id}`), className: "ml-4 px-3 py-1 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors", children: "View Full" })] }) }, policy.id))) })] }, category)))] })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [completed && (_jsxs("div", { className: "bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { children: "\u2705" }), _jsx("span", { className: "text-white", children: "You've completed orientation. This is a review of the onboarding flow." })] }), _jsx("button", { onClick: () => setShowOnboardingFlow(false), className: "px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm", children: "Back to Completion" })] })), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Welcome to INARA!" }), _jsx("p", { className: "text-gray-400 mt-2", children: completed ? 'Review your onboarding process' : 'Complete your onboarding to get started. This is a step-by-step process.' })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("span", { className: "text-sm text-gray-400", children: ["Step ", currentStep + 1, " of ", totalSteps] }), _jsxs("span", { className: "text-sm text-gray-400", children: [Math.round(((currentStep + 1) / totalSteps) * 100), "% Complete"] })] }), _jsx("div", { className: "w-full bg-gray-700 rounded-full h-2", children: _jsx("div", { className: "bg-primary-500 h-2 rounded-full transition-all duration-300", style: { width: `${((currentStep + 1) / totalSteps) * 100}%` } }) })] }), currentStep === 0 && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-2", children: "Step 1: Onboarding Checklist" }), _jsx("p", { className: "text-gray-400 mb-6", children: "Please confirm that you have completed the following onboarding activities and have the necessary equipment." }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-lg font-semibold text-white mb-4 flex items-center", children: [_jsx("span", { className: "mr-2", children: "\uD83D\uDC65" }), "Orientations Received"] }), _jsx("div", { className: "space-y-3", children: checklist.filter(c => c.category === 'orientation').map((item) => (_jsxs("label", { className: "flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors", children: [_jsx("input", { type: "checkbox", checked: item.checked, onChange: () => toggleChecklistItem(item.id), className: "w-5 h-5 text-primary-500 rounded focus:ring-primary-500" }), _jsx("span", { className: "text-gray-300 flex-1", children: item.label })] }, item.id))) })] }), _jsxs("div", { children: [_jsxs("h3", { className: "text-lg font-semibold text-white mb-4 flex items-center", children: [_jsx("span", { className: "mr-2", children: "\uD83D\uDCBB" }), "Equipment & Resources"] }), _jsx("div", { className: "space-y-3", children: checklist.filter(c => c.category === 'equipment').map((item) => (_jsxs("label", { className: "flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors", children: [_jsx("input", { type: "checkbox", checked: item.checked, onChange: () => toggleChecklistItem(item.id), className: "w-5 h-5 text-primary-500 rounded focus:ring-primary-500" }), _jsx("span", { className: "text-gray-300 flex-1", children: item.label })] }, item.id))) })] })] }), _jsx("div", { className: "mt-6 flex justify-end", children: _jsx("button", { onClick: () => {
                                const allChecked = checklist.every(item => item.checked);
                                if (!allChecked) {
                                    alert('Please complete all checklist items before proceeding.');
                                    return;
                                }
                                setCurrentStep(1);
                            }, className: "px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors", children: "Continue to Policies \u2192" }) })] })), currentStep > 0 && useSteps && currentStepData && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-6", children: [_jsxs("h2", { className: "text-2xl font-bold text-white mb-2", children: ["Step ", currentStep + 1, ": ", currentStepData.title] }), currentStepData.description && (_jsx("p", { className: "text-gray-400 mb-6", children: currentStepData.description })), currentStepData.pdfUrl && (_jsx("div", { className: "mb-6", children: _jsx(PDFViewer, { pdfUrl: currentStepData.pdfUrl, title: currentStepData.title }) })), currentStepData.questions && Array.isArray(currentStepData.questions) && currentStepData.questions.length > 0 && (_jsxs("div", { className: "mt-6 space-y-6", children: [_jsx("h3", { className: "text-xl font-semibold text-white mb-4", children: "Questions" }), currentStepData.questions.map((question, qIndex) => {
                                const questionId = question.id || `q-${currentStepData.id}-${qIndex}`;
                                const stepResponses = questionResponses[currentStepData.id] || {};
                                const currentAnswer = stepResponses[questionId];
                                const stepFeedback = answerFeedback[currentStepData.id] || {};
                                const feedback = stepFeedback[questionId];
                                const hasAnswer = currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== '';
                                return (_jsxs("div", { className: `bg-gray-700/50 rounded-lg p-5 border-2 ${feedback
                                        ? feedback.isCorrect
                                            ? 'border-green-500/50 bg-green-500/10'
                                            : 'border-red-500/50 bg-red-500/10'
                                        : 'border-gray-600'}`, children: [_jsxs("label", { className: "block text-white font-medium mb-3", children: [question.question || question.text, question.required !== false && _jsx("span", { className: "text-red-400 ml-1", children: "*" })] }), feedback && hasAnswer && (_jsx("div", { className: `mb-3 p-3 rounded-lg ${feedback.isCorrect
                                                ? 'bg-green-500/20 border border-green-500/50'
                                                : 'bg-red-500/20 border border-red-500/50'}`, children: _jsxs("div", { className: "flex items-start space-x-2", children: [feedback.isCorrect ? (_jsx("span", { className: "text-green-400 text-xl", children: "\u2713" })) : (_jsx("span", { className: "text-red-400 text-xl", children: "\u2717" })), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: `font-medium ${feedback.isCorrect ? 'text-green-300' : 'text-red-300'}`, children: feedback.isCorrect ? 'Correct!' : 'Incorrect' }), !feedback.isCorrect && feedback.correctAnswer && (_jsxs("p", { className: "text-gray-300 text-sm mt-1", children: [_jsx("span", { className: "font-semibold", children: "Correct answer:" }), ' ', Array.isArray(feedback.correctAnswer)
                                                                        ? feedback.correctAnswer.join(', ')
                                                                        : feedback.correctAnswer] }))] })] }) })), question.type === 'multiple_choice' && question.options && (_jsx("div", { className: "space-y-2", children: question.options.map((option, optIndex) => (_jsxs("label", { className: "flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-600/50 rounded", children: [_jsx("input", { type: "radio", name: questionId, value: option, checked: currentAnswer === option, onChange: (e) => {
                                                            setQuestionResponses(prev => ({
                                                                ...prev,
                                                                [currentStepData.id]: {
                                                                    ...(prev[currentStepData.id] || {}),
                                                                    [questionId]: e.target.value,
                                                                },
                                                            }));
                                                        }, className: "w-4 h-4 text-primary-500" }), _jsx("span", { className: "text-gray-300", children: option })] }, optIndex))) })), question.type === 'checkbox' && question.options && (_jsx("div", { className: "space-y-2", children: question.options.map((option, optIndex) => {
                                                const checkedAnswers = Array.isArray(currentAnswer) ? currentAnswer : [];
                                                return (_jsxs("label", { className: "flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-600/50 rounded", children: [_jsx("input", { type: "checkbox", value: option, checked: checkedAnswers.includes(option), onChange: (e) => {
                                                                const newAnswers = e.target.checked
                                                                    ? [...checkedAnswers, option]
                                                                    : checkedAnswers.filter((a) => a !== option);
                                                                setQuestionResponses(prev => ({
                                                                    ...prev,
                                                                    [currentStepData.id]: {
                                                                        ...(prev[currentStepData.id] || {}),
                                                                        [questionId]: newAnswers,
                                                                    },
                                                                }));
                                                            }, className: "w-4 h-4 text-primary-500 rounded" }), _jsx("span", { className: "text-gray-300", children: option })] }, optIndex));
                                            }) })), (!question.type || question.type === 'text') && (_jsx("textarea", { value: typeof currentAnswer === 'string' ? currentAnswer : '', onChange: (e) => {
                                                setQuestionResponses(prev => ({
                                                    ...prev,
                                                    [currentStepData.id]: {
                                                        ...(prev[currentStepData.id] || {}),
                                                        [questionId]: e.target.value,
                                                    },
                                                }));
                                            }, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500", rows: 4, placeholder: "Type your answer here..." }))] }, questionId));
                            })] })), _jsxs("div", { className: "mt-6 flex justify-between", children: [_jsx("button", { onClick: () => setCurrentStep(currentStep - 1), className: "px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors", children: "\u2190 Previous" }), _jsx("button", { onClick: async () => {
                                    // Validate required questions
                                    if (currentStepData.questions && Array.isArray(currentStepData.questions)) {
                                        const requiredQuestions = currentStepData.questions.filter((q) => q.required !== false);
                                        const stepResponses = questionResponses[currentStepData.id] || {};
                                        const missingQuestions = requiredQuestions.filter((q) => {
                                            const questionId = q.id || `q-${currentStepData.id}-${currentStepData.questions.indexOf(q)}`;
                                            const answer = stepResponses[questionId];
                                            return !answer || (Array.isArray(answer) && answer.length === 0);
                                        });
                                        if (missingQuestions.length > 0) {
                                            alert(`Please answer all required questions before proceeding.`);
                                            return;
                                        }
                                        // Confirm step with responses
                                        const responses = requiredQuestions.map((q) => {
                                            const questionId = q.id || `q-${currentStepData.id}-${currentStepData.questions.indexOf(q)}`;
                                            return {
                                                questionId,
                                                answer: stepResponses[questionId],
                                            };
                                        });
                                        try {
                                            const result = await confirmStepMutation.mutateAsync({
                                                stepId: currentStepData.id,
                                                responses,
                                            });
                                            // Store answer feedback
                                            if (result.answerValidation && result.answerValidation.length > 0) {
                                                const feedback = {};
                                                result.answerValidation.forEach((validation) => {
                                                    feedback[validation.questionId] = {
                                                        isCorrect: validation.isCorrect,
                                                        correctAnswer: validation.correctAnswer,
                                                        message: validation.isCorrect
                                                            ? 'Correct!'
                                                            : `Incorrect. The correct answer is: ${Array.isArray(validation.correctAnswer) ? validation.correctAnswer.join(', ') : validation.correctAnswer}`,
                                                    };
                                                });
                                                setAnswerFeedback(prev => ({
                                                    ...prev,
                                                    [currentStepData.id]: feedback,
                                                }));
                                                // Check if all answers are correct
                                                const allCorrect = result.answerValidation.every((v) => v.isCorrect);
                                                if (!allCorrect) {
                                                    alert('Some answers are incorrect. Please review the feedback below each question and correct your answers before proceeding.');
                                                    return; // Don't proceed if answers are incorrect
                                                }
                                            }
                                        }
                                        catch (error) {
                                            alert(error.response?.data?.message || 'Failed to confirm step');
                                            return;
                                        }
                                    }
                                    else {
                                        // No questions, just confirm
                                        try {
                                            await confirmStepMutation.mutateAsync({
                                                stepId: currentStepData.id,
                                            });
                                        }
                                        catch (error) {
                                            alert(error.response?.data?.message || 'Failed to confirm step');
                                            return;
                                        }
                                    }
                                    // Move to next step or complete
                                    if (currentStep < totalSteps - 1) {
                                        setCurrentStep(currentStep + 1);
                                    }
                                    else {
                                        // All steps done, complete orientation
                                        const allChecklistChecked = checklist.every(item => item.checked);
                                        if (!allChecklistChecked) {
                                            alert('Please complete all checklist items before finishing orientation.');
                                            return;
                                        }
                                        await handleComplete();
                                    }
                                }, disabled: confirmStepMutation.isLoading, className: "px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: confirmStepMutation.isLoading
                                    ? 'Saving...'
                                    : currentStep < totalSteps - 1
                                        ? 'Next Step →'
                                        : 'Complete Orientation ✓' })] })] })), currentStep > 0 && !useSteps && currentStepData?.type === 'policies' && currentStepData.policies.length > 0 && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-6", children: [_jsxs("h2", { className: "text-2xl font-bold text-white mb-2", children: ["Step ", currentStep + 1, ": ", currentCategory, " Policies"] }), _jsx("p", { className: "text-gray-400 mb-6", children: "Please read and confirm each policy below. Click \"I have read and understood\" for each policy." }), _jsx("div", { className: "space-y-4", children: currentPolicies.map((policy) => (_jsxs("div", { className: `bg-gray-700/50 rounded-lg p-5 border-2 transition-colors ${policyConfirmations.has(policy.id)
                                ? 'border-green-500/50 bg-green-500/10'
                                : 'border-gray-600'}`, children: [_jsx("div", { className: "flex items-start justify-between mb-3", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: policy.title }), policy.isMandatory && (_jsx("span", { className: "px-2 py-0.5 text-xs bg-red-500/20 text-red-300 rounded", children: "Mandatory" }))] }), _jsx("p", { className: "text-gray-300 leading-relaxed mb-3", children: policy.brief }), _jsxs("p", { className: "text-gray-400 text-xs", children: ["Effective Date: ", new Date(policy.effectiveDate).toLocaleDateString()] })] }) }), _jsxs("div", { className: "flex items-center space-x-4 flex-wrap gap-2", children: [_jsxs("button", { onClick: () => navigate(`/policies?policy=${policy.id}`), className: "px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors flex items-center space-x-1", children: [_jsx("span", { children: "\uD83D\uDCC4" }), _jsx("span", { children: "Read Full Policy" })] }), _jsxs("label", { className: "flex items-center space-x-2 cursor-pointer bg-gray-600/50 px-3 py-2 rounded hover:bg-gray-600 transition-colors", children: [_jsx("input", { type: "checkbox", checked: policyConfirmations.has(policy.id), onChange: () => handlePolicyConfirm(policy.id), className: "w-5 h-5 text-primary-500 rounded focus:ring-primary-500" }), _jsx("span", { className: "text-gray-300 text-sm font-medium", children: "\u2713 I have read and understood" })] })] })] }, policy.id))) }), _jsxs("div", { className: "mt-6 flex justify-between", children: [_jsx("button", { onClick: () => setCurrentStep(currentStep - 1), className: "px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors", children: "\u2190 Previous" }), currentStep < totalSteps - 1 ? (_jsx("button", { onClick: () => {
                                    if (currentPolicies.length > 0 && !currentPolicies.every((p) => policyConfirmations.has(p.id))) {
                                        alert('Please confirm all policies in this category before proceeding.');
                                        return;
                                    }
                                    setCurrentStep(currentStep + 1);
                                }, className: "px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors", children: "Next Category \u2192" })) : (_jsx("button", { onClick: handleComplete, disabled: completeMutation.isLoading, className: "px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold", children: completeMutation.isLoading ? 'Completing...' : '✓ I am Fully Ready - Complete Orientation' }))] })] })), showCertificateForm && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsx("div", { className: "bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "Certificate Information" }), _jsx("button", { onClick: () => setShowCertificateForm(false), className: "text-gray-400 hover:text-white", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsx("p", { className: "text-gray-300 mb-6", children: "Please provide the following information to generate your certificate. Fields marked with * are required." }), _jsxs("form", { onSubmit: async (e) => {
                                    e.preventDefault();
                                    if (!certificateData.passportId.trim()) {
                                        alert('Please enter your Passport/National ID number.');
                                        return;
                                    }
                                    try {
                                        // Get the token from auth store
                                        const { token } = useAuthStore.getState();
                                        if (!token || !user?.id) {
                                            throw new Error('No authentication token or user ID found');
                                        }
                                        // Build the certificate URL directly using the user ID
                                        const certificatePath = `/orientation/certificate/${user.id}`;
                                        // Add certificate data as query parameters
                                        const params = new URLSearchParams({
                                            passportId: certificateData.passportId,
                                            country: certificateData.country || '',
                                            department: certificateData.department || '',
                                            role: certificateData.role || '',
                                        });
                                        const finalUrl = `${certificatePath}?${params.toString()}`;
                                        // Fetch certificate with the additional data using the api client
                                        const response = await api.get(finalUrl, {
                                            responseType: 'blob',
                                        });
                                        // Check if response is actually a PDF (not an error JSON)
                                        const contentType = response.headers['content-type'] || '';
                                        if (!contentType.includes('application/pdf')) {
                                            // Try to parse as JSON error
                                            const text = await new Promise((resolve) => {
                                                const reader = new FileReader();
                                                reader.onload = () => resolve(reader.result);
                                                reader.readAsText(response.data);
                                            });
                                            let errorMessage = 'Failed to download certificate.';
                                            try {
                                                const errorData = JSON.parse(text);
                                                errorMessage = errorData.message || errorMessage;
                                            }
                                            catch {
                                                errorMessage = 'Server returned an invalid response.';
                                            }
                                            throw new Error(errorMessage);
                                        }
                                        // Create blob and download
                                        const blob = new Blob([response.data], { type: 'application/pdf' });
                                        const url = window.URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.download = `INARA_Orientation_Certificate_${user?.firstName}_${user?.lastName}.pdf`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        window.URL.revokeObjectURL(url);
                                        setShowCertificateForm(false);
                                        alert('✅ Certificate downloaded successfully!');
                                    }
                                    catch (error) {
                                        console.error('Error downloading certificate:', error);
                                        const errorMessage = error.message || error.response?.data?.message || 'Failed to download certificate. Please try again.';
                                        alert(errorMessage);
                                    }
                                }, className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: ["Passport / National ID Number ", _jsx("span", { className: "text-red-400", children: "*" })] }), _jsx("input", { type: "text", value: certificateData.passportId, onChange: (e) => setCertificateData({ ...certificateData, passportId: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500", placeholder: "Enter your passport or national ID number" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Country Office" }), _jsx("input", { type: "text", value: certificateData.country, onChange: (e) => setCertificateData({ ...certificateData, country: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500", placeholder: "Enter your country office" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Department / Role" }), _jsx("input", { type: "text", value: certificateData.department || '', onChange: (e) => setCertificateData({ ...certificateData, department: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500", placeholder: "Enter your department and role (e.g., Programs Department - Staff Member)" })] }), _jsxs("div", { className: "flex justify-end space-x-4 pt-4", children: [_jsx("button", { type: "button", onClick: () => setShowCertificateForm(false), className: "px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors", children: "Cancel" }), _jsx("button", { type: "submit", className: "px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold", children: "Generate & Download Certificate" })] })] })] }) }) }))] }));
}
