import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
export default function SurveysTab() {
    const [activeSubTab, setActiveSubTab] = useState('all');
    const [selectedSurvey, setSelectedSurvey] = useState(null);
    const [submission, setSubmission] = useState(null);
    const [responses, setResponses] = useState({});
    const [startTime, setStartTime] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery('surveys', async () => {
        const res = await api.get('/surveys');
        return res.data;
    });
    const { data: surveyDetail } = useQuery(['survey-detail', selectedSurvey?.id], async () => {
        if (!selectedSurvey)
            return null;
        const res = await api.get(`/surveys/${selectedSurvey.id}`);
        return res.data;
    }, { enabled: !!selectedSurvey });
    const startMutation = useMutation(async (surveyId) => {
        const res = await api.post(`/surveys/${surveyId}/start`);
        return res.data;
    }, {
        onSuccess: (data) => {
            console.log('✅ Survey started successfully!');
            console.log('📋 Submission data:', data.submission);
            console.log('📝 Selected survey:', selectedSurvey?.title);
            console.log('📝 Questions count:', selectedSurvey?.questions?.length || 0);
            if (!data.submission) {
                console.error('❌ No submission data received!');
                alert('Failed to start survey. No submission data received.');
                return;
            }
            setSubmission(data.submission);
            setStartTime(new Date());
            if (selectedSurvey?.hasTimeLimit && selectedSurvey?.timeLimitMinutes) {
                setTimeRemaining(selectedSurvey.timeLimitMinutes * 60);
            }
            // Invalidate queries to refresh data
            queryClient.invalidateQueries(['survey-detail', selectedSurvey?.id]);
            queryClient.invalidateQueries('surveys');
        },
        onError: (error) => {
            console.error('❌ Error starting survey:', error);
            alert(error.response?.data?.message || error.message || 'Failed to start survey. Please try again.');
        },
    });
    const submitMutation = useMutation(async ({ surveyId, submissionId, responses, notes, timeSpentSeconds }) => {
        const res = await api.post(`/surveys/${surveyId}/submit`, {
            submissionId,
            responses,
            notes,
            timeSpentSeconds,
        });
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('surveys');
            queryClient.invalidateQueries(['survey-detail', selectedSurvey?.id]);
            alert('Survey submitted successfully!');
            setSelectedSurvey(null);
            setSubmission(null);
            setResponses({});
        },
    });
    // Timer effect
    useEffect(() => {
        if (timeRemaining !== null && timeRemaining > 0) {
            const timer = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev === null || prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
        else if (timeRemaining === 0 && submission) {
            // Auto-submit when time runs out
            handleSubmit();
        }
    }, [timeRemaining, submission]);
    const handleStart = async (survey) => {
        console.log('🚀 Starting survey:', survey.id, survey.title);
        console.log('📋 Initial survey data:', survey);
        // First fetch the full survey details to ensure we have questions
        try {
            const detailRes = await api.get(`/surveys/${survey.id}`);
            const surveyDetail = detailRes.data;
            console.log('📋 Survey details fetched:', surveyDetail);
            // Update selectedSurvey with full details (including questions)
            const fullSurvey = surveyDetail.survey || survey;
            const questions = fullSurvey.questions || [];
            console.log('📝 Questions loaded:', questions.length);
            if (questions.length === 0) {
                alert('⚠️ This survey has no questions. Please contact the administrator.');
                return;
            }
            setSelectedSurvey(fullSurvey);
            // Then start the survey
            console.log('▶️ Calling start mutation...');
            startMutation.mutate(survey.id);
        }
        catch (error) {
            console.error('❌ Error fetching survey details:', error);
            alert(error.response?.data?.message || 'Failed to load survey details. Please try again.');
        }
    };
    const handleResponseChange = (questionId, answer) => {
        setResponses((prev) => ({
            ...prev,
            [questionId]: answer,
        }));
    };
    const handleSubmit = () => {
        if (!selectedSurvey || !submission)
            return;
        const questions = selectedSurvey.questions;
        const responseArray = questions.map((q) => ({
            questionId: q.id,
            answer: responses[q.id] || (q.type === 'checkbox' ? [] : ''),
        }));
        const timeSpent = startTime
            ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
            : null;
        submitMutation.mutate({
            surveyId: selectedSurvey.id,
            submissionId: submission.id,
            responses: responseArray,
            timeSpentSeconds: timeSpent,
        });
    };
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    // Render survey questions view
    if (selectedSurvey && submission) {
        const questions = selectedSurvey.questions || [];
        console.log('📝 Rendering survey view:', {
            surveyId: selectedSurvey.id,
            submissionId: submission.id,
            questionsCount: questions.length,
            hasQuestions: questions.length > 0,
        });
        if (questions.length === 0) {
            return (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: selectedSurvey.title }), _jsx("p", { className: "text-red-400 mb-4", children: "\u26A0\uFE0F This survey has no questions. Please contact the administrator." }), _jsx("button", { onClick: () => {
                                setSelectedSurvey(null);
                                setSubmission(null);
                                setResponses({});
                            }, className: "px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600", children: "Back to Surveys" })] }) }));
        }
        const allRequiredAnswered = questions
            .filter((q) => q.required)
            .every((q) => {
            const answer = responses[q.id];
            return answer !== undefined && answer !== '' && answer !== null && (Array.isArray(answer) ? answer.length > 0 : true);
        });
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: selectedSurvey.title }), selectedSurvey.description && (_jsx("p", { className: "text-gray-400 mt-1", children: selectedSurvey.description }))] }), timeRemaining !== null && (_jsxs("div", { className: `text-lg font-bold ${timeRemaining < 60 ? 'text-red-400' : 'text-yellow-400'}`, children: ["Time: ", formatTime(timeRemaining)] }))] }), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6 space-y-6", children: [questions.map((question, index) => (_jsxs("div", { className: "bg-gray-700 rounded-lg p-5", children: [_jsxs("label", { className: "block text-white font-medium mb-3", children: [index + 1, ". ", question.question, question.required && _jsx("span", { className: "text-red-400 ml-1", children: "*" }), selectedSurvey.type !== 'survey' && question.points && (_jsxs("span", { className: "text-gray-400 ml-2", children: ["(", question.points, " points)"] }))] }), question.type === 'multiple_choice' && (_jsx("div", { className: "space-y-2", children: question.options?.map((option) => (_jsxs("label", { className: "flex items-center space-x-2 cursor-pointer", children: [_jsx("input", { type: "radio", name: question.id, value: option, checked: responses[question.id] === option, onChange: (e) => handleResponseChange(question.id, e.target.value), className: "text-primary-500" }), _jsx("span", { className: "text-gray-200", children: option })] }, option))) })), question.type === 'checkbox' && (_jsx("div", { className: "space-y-2", children: question.options?.map((option) => (_jsxs("label", { className: "flex items-center space-x-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: (responses[question.id] || []).includes(option), onChange: (e) => {
                                                    const current = responses[question.id] || [];
                                                    const updated = e.target.checked
                                                        ? [...current, option]
                                                        : current.filter((o) => o !== option);
                                                    handleResponseChange(question.id, updated);
                                                }, className: "text-primary-500" }), _jsx("span", { className: "text-gray-200", children: option })] }, option))) })), question.type === 'text' && (_jsx("textarea", { value: responses[question.id] || '', onChange: (e) => handleResponseChange(question.id, e.target.value), rows: 4, className: "w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg" })), question.type === 'rating' && (_jsx("div", { className: "flex space-x-2", children: [1, 2, 3, 4, 5].map((rating) => (_jsx("button", { type: "button", onClick: () => handleResponseChange(question.id, rating), className: `w-12 h-12 rounded-lg font-bold ${responses[question.id] === rating
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`, children: rating }, rating))) })), question.type === 'yes_no' && (_jsxs("div", { className: "flex space-x-4", children: [_jsxs("label", { className: "flex items-center space-x-2 cursor-pointer", children: [_jsx("input", { type: "radio", name: question.id, value: "yes", checked: responses[question.id] === 'yes', onChange: (e) => handleResponseChange(question.id, e.target.value), className: "text-primary-500" }), _jsx("span", { className: "text-gray-200", children: "Yes" })] }), _jsxs("label", { className: "flex items-center space-x-2 cursor-pointer", children: [_jsx("input", { type: "radio", name: question.id, value: "no", checked: responses[question.id] === 'no', onChange: (e) => handleResponseChange(question.id, e.target.value), className: "text-primary-500" }), _jsx("span", { className: "text-gray-200", children: "No" })] })] }))] }, question.id))), _jsxs("div", { className: "flex space-x-4 pt-4 border-t border-gray-700", children: [_jsx("button", { onClick: handleSubmit, disabled: !allRequiredAnswered || submitMutation.isLoading, className: "flex-1 bg-primary-500 text-white py-3 px-6 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold", children: submitMutation.isLoading ? 'Submitting...' : 'Submit Survey' }), _jsx("button", { onClick: () => {
                                        setSelectedSurvey(null);
                                        setSubmission(null);
                                        setResponses({});
                                        setStartTime(null);
                                        setTimeRemaining(null);
                                    }, className: "px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600", children: "Cancel" })] })] })] }));
    }
    if (selectedSurvey && surveyDetail?.latestSubmission?.status === 'submitted') {
        const questions = selectedSurvey.questions;
        const latestSubmission = surveyDetail.latestSubmission;
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: selectedSurvey.title }), _jsx("button", { onClick: () => setSelectedSurvey(null), className: "px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600", children: "Back to Surveys" })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: "Results" }), selectedSurvey.type !== 'survey' && (_jsx("div", { className: "mb-6 p-4 bg-gray-700 rounded-lg", children: _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Score" }), _jsxs("p", { className: "text-2xl font-bold text-white", children: [latestSubmission.totalScore, " / ", latestSubmission.maxScore] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Percentage" }), _jsxs("p", { className: "text-2xl font-bold text-white", children: [latestSubmission.percentageScore?.toFixed(1), "%"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Status" }), _jsx("p", { className: `text-2xl font-bold ${latestSubmission.passed ? 'text-green-400' : 'text-red-400'}`, children: latestSubmission.passed ? 'PASSED' : 'FAILED' })] })] }) })), _jsxs("p", { className: "text-gray-400 mb-4", children: ["You have already completed this ", selectedSurvey.type, "."] }), selectedSurvey.type === 'test' && latestSubmission.passed && (_jsxs("div", { className: "mb-4 p-4 bg-green-900/20 border border-green-700 rounded-lg", children: [_jsx("p", { className: "text-green-300 font-semibold mb-2", children: "\uD83C\uDF89 Congratulations! You passed the test." }), _jsx("button", { onClick: async () => {
                                        try {
                                            const { user } = useAuthStore.getState();
                                            const res = await api.get(`/surveys/${selectedSurvey.id}/certificate/${user?.id}`, {
                                                responseType: 'blob',
                                            });
                                            // Create download link
                                            const url = window.URL.createObjectURL(new Blob([res.data]));
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.setAttribute('download', `INARA_Test_Certificate_${user?.firstName}_${user?.lastName}.pdf`);
                                            document.body.appendChild(link);
                                            link.click();
                                            link.remove();
                                            window.URL.revokeObjectURL(url);
                                        }
                                        catch (error) {
                                            alert(error.response?.data?.message || 'Failed to download certificate');
                                        }
                                    }, className: "bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold", children: "\uD83D\uDCDC Download Certificate" })] })), selectedSurvey.maxAttempts && surveyDetail.canTakeMore && (_jsxs("button", { onClick: () => handleStart(selectedSurvey), className: "mt-4 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600", children: ["Take Again (Attempt ", latestSubmission.attemptNumber + 1, " of ", selectedSurvey.maxAttempts, ")"] }))] })] }));
    }
    const allSurveys = data?.surveys || [];
    // Filter surveys based on active sub-tab
    const getFilteredSurveys = () => {
        switch (activeSubTab) {
            case 'surveys':
                return allSurveys.filter((s) => s.type === 'survey');
            case 'assessments':
                return allSurveys.filter((s) => s.type === 'assessment');
            case 'tests':
                return allSurveys.filter((s) => s.type === 'test');
            case 'hr':
                return allSurveys.filter((s) => {
                    const cat = (s.category || '').toLowerCase().trim();
                    const tags = (s.tags || []).map((t) => t.toLowerCase());
                    return cat === 'hr' ||
                        cat === 'human resources' ||
                        cat.includes('human resources') ||
                        tags.some((tag) => tag.includes('hr') || tag.includes('employee') || tag.includes('human resources'));
                });
            case 'program':
                return allSurveys.filter((s) => {
                    const cat = s.category?.toLowerCase() || '';
                    return cat === 'm&e' ||
                        cat.includes('monitoring') ||
                        cat.includes('evaluation') ||
                        cat.includes('program management') ||
                        s.tags?.some((tag) => tag.toLowerCase().includes('m&e') || tag.toLowerCase().includes('monitoring') || tag.toLowerCase().includes('evaluation') || tag.toLowerCase().includes('beneficiary'));
                });
            case 'general':
                return allSurveys.filter((s) => {
                    if (!s.category)
                        return true;
                    const cat = s.category.toLowerCase();
                    return cat === 'general' ||
                        (cat !== 'hr' &&
                            cat !== 'm&e' &&
                            !cat.includes('human resources') &&
                            !cat.includes('monitoring') &&
                            !cat.includes('evaluation') &&
                            !cat.includes('program management'));
                });
            default:
                return allSurveys;
        }
    };
    const surveys = getFilteredSurveys();
    const subTabs = [
        { id: 'all', label: 'All' },
        { id: 'surveys', label: 'Surveys' },
        { id: 'assessments', label: 'Assessments' },
        { id: 'tests', label: 'Tests' },
        { id: 'hr', label: 'HR' },
        { id: 'program', label: 'M&E' },
        { id: 'general', label: 'General' },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Surveys, Assessments & Tests" }), _jsx("p", { className: "text-gray-400 mt-2", children: "Complete assigned surveys, assessments, and tests" })] }), _jsx("div", { className: "border-b border-gray-700", children: _jsx("nav", { className: "flex justify-center space-x-1 overflow-x-auto", children: subTabs.map((tab) => {
                        // Calculate count for each tab
                        let count = 0;
                        if (tab.id === 'all') {
                            count = allSurveys.length;
                        }
                        else if (tab.id === 'surveys') {
                            count = allSurveys.filter((s) => s.type === 'survey').length;
                        }
                        else if (tab.id === 'assessments') {
                            count = allSurveys.filter((s) => s.type === 'assessment').length;
                        }
                        else if (tab.id === 'tests') {
                            count = allSurveys.filter((s) => s.type === 'test').length;
                        }
                        else if (tab.id === 'hr') {
                            count = allSurveys.filter((s) => s.category?.toLowerCase().includes('hr') ||
                                s.category?.toLowerCase().includes('human resources') ||
                                s.tags?.some((tag) => tag.toLowerCase().includes('hr') || tag.toLowerCase().includes('employee'))).length;
                        }
                        else if (tab.id === 'program') {
                            count = allSurveys.filter((s) => s.category?.toLowerCase().includes('program') ||
                                s.tags?.some((tag) => tag.toLowerCase().includes('program') || tag.toLowerCase().includes('beneficiary'))).length;
                        }
                        else if (tab.id === 'general') {
                            count = allSurveys.filter((s) => !s.category ||
                                (!s.category.toLowerCase().includes('hr') &&
                                    !s.category.toLowerCase().includes('program') &&
                                    !s.category.toLowerCase().includes('human resources'))).length;
                        }
                        return (_jsxs("button", { onClick: () => setActiveSubTab(tab.id), className: `px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeSubTab === tab.id
                                ? 'border-primary-500 text-primary-500'
                                : 'border-transparent text-gray-500 hover:text-gray-200 hover:border-gray-600'}`, children: [tab.label, _jsx("span", { className: "ml-2 text-xs bg-gray-700 px-2 py-0.5 rounded", children: count })] }, tab.id));
                    }) }) }), isLoading ? (_jsx("div", { className: "text-center py-12 text-gray-400", children: "Loading..." })) : surveys.length === 0 ? (_jsx("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-12 text-center", children: _jsx("p", { className: "text-gray-400 text-lg", children: "No surveys, assessments, or tests assigned to you." }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: surveys.map((survey) => (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6 hover:border-primary-500 transition-colors", children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsx("h3", { className: "text-xl font-bold text-white", children: survey.title }), _jsx("span", { className: `text-xs px-2 py-1 rounded ${survey.type === 'survey'
                                        ? 'bg-blue-900/30 text-blue-300'
                                        : survey.type === 'assessment'
                                            ? 'bg-green-900/30 text-green-300'
                                            : 'bg-purple-900/30 text-purple-300'}`, children: survey.type.toUpperCase() })] }), survey.description && (_jsx("p", { className: "text-gray-400 text-sm mb-4", children: survey.description })), _jsxs("div", { className: "space-y-2 mb-4", children: [survey.isMandatory && (_jsx("span", { className: "inline-block text-xs px-2 py-1 rounded bg-red-900/30 text-red-300", children: "Mandatory" })), survey.hasTimeLimit && (_jsxs("span", { className: "inline-block text-xs px-2 py-1 rounded bg-yellow-900/30 text-yellow-300", children: [survey.timeLimitMinutes, " min limit"] })), survey.dueDate && (_jsxs("span", { className: "inline-block text-xs px-2 py-1 rounded bg-gray-700 text-gray-300", children: ["Due: ", new Date(survey.dueDate).toLocaleDateString()] }))] }), _jsxs("div", { className: "mb-4", children: [_jsx("p", { className: "text-sm text-gray-400", children: "Status:" }), _jsx("p", { className: `font-semibold ${survey.userStatus === 'submitted'
                                        ? 'text-green-400'
                                        : survey.userStatus === 'in_progress'
                                            ? 'text-yellow-400'
                                            : 'text-gray-400'}`, children: survey.userStatus === 'submitted'
                                        ? `Completed ${survey.userScore !== undefined ? `(${survey.userScore.toFixed(1)}%)` : ''}`
                                        : survey.userStatus === 'in_progress'
                                            ? 'In Progress'
                                            : 'Not Started' })] }), _jsx("button", { onClick: () => {
                                if (survey.userStatus === 'submitted' && !surveyDetail?.canTakeMore) {
                                    setSelectedSurvey(survey);
                                }
                                else {
                                    handleStart(survey);
                                }
                            }, className: "w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600", children: survey.userStatus === 'submitted'
                                ? 'View Results'
                                : survey.userStatus === 'in_progress'
                                    ? 'Continue'
                                    : 'Start' })] }, survey.id))) }))] }));
}
