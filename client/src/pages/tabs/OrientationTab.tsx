import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import PDFViewer from '../../components/PDFViewer';
import CertificateViewer from '../../components/CertificateViewer';

type ChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
  category: 'orientation' | 'equipment';
};

export default function OrientationTab() {
  console.log('🎓 NEW OrientationTab component loaded - version with onboarding checklist!');
  
  const [currentStep, setCurrentStep] = useState(0);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
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
  const [policyConfirmations, setPolicyConfirmations] = useState<Set<string>>(new Set());
  const [showOnboardingFlow, setShowOnboardingFlow] = useState(false); // Allow viewing onboarding even if completed
  const [questionResponses, setQuestionResponses] = useState<Record<string, Record<string, string | string[]>>>({}); // stepId -> questionId -> answer
  const [answerFeedback, setAnswerFeedback] = useState<Record<string, Record<string, { isCorrect: boolean; correctAnswer?: string | string[]; message?: string }>>>({}); // stepId -> questionId -> feedback
  const [showCertificateViewer, setShowCertificateViewer] = useState(false); // Show certificate viewer
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();


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

  // Extract data - must be before useEffect hooks that use this data
  const orientation = data?.orientation;
  const orientationSteps = orientation?.steps || [];
  const policies = data?.policies || [];
  const completed = data?.completed;
  const certificateUrl = data?.certificateUrl;
  const checklistData = data?.checklistData;
  const stepConfirmations = data?.stepConfirmations || new Set();

  // Pre-calculate values needed by useEffect hooks
  const useSteps = orientationSteps.length > 0;
  
  // Group policies by category (for fallback)
  const policiesByCategory = policies.reduce((acc: any, policy: any) => {
    const category = policy.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(policy);
    return acc;
  }, {});
  
  let totalSteps = 1; // Step 0 is always checklist
  let currentStepData: any = null;
  let currentCategory = '';
  let currentPolicies: any[] = [];
  
  if (useSteps) {
    // Use orientation steps (which can have PDFs and questions)
    totalSteps = 1 + orientationSteps.length;
    if (currentStep > 0 && currentStep <= orientationSteps.length) {
      currentStepData = orientationSteps[currentStep - 1];
    }
  } else {
    // Fallback to old behavior: policies grouped by category
    totalSteps = 1 + Object.keys(policiesByCategory).length;
    currentCategory = Object.keys(policiesByCategory)[currentStep - 1] || '';
    currentPolicies = currentStep > 0 ? policiesByCategory[currentCategory] || [] : [];
    currentStepData = { type: 'policies', policies: currentPolicies, category: currentCategory };
  }

  // Force refetch on component mount to ensure fresh data
  useEffect(() => {
    console.log('🔄 OrientationTab mounted - forcing data refetch...');
    refetch();
  }, [refetch]);

  const confirmStepMutation = useMutation(
    async ({ stepId, responses }: { stepId: string; responses?: any[] }) => {
      const res = await api.post(`/orientation/steps/${stepId}/confirm`, { 
        responses 
      });
      return res.data;
    },
    {
      onSuccess: (data) => {
        // Store answer feedback if provided
        if (data.answerValidation && currentStepData?.id) {
          const feedback: Record<string, { isCorrect: boolean; correctAnswer?: string | string[]; message?: string }> = {};
          data.answerValidation.forEach((validation: any) => {
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
    }
  );

  const completeMutation = useMutation(
    async (checklistData: any) => {
      const res = await api.post('/orientation/complete', { 
        score: 100,
        checklistData 
      });
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('orientation');
      },
    }
  );

  const toggleChecklistItem = (id: string) => {
    setChecklist(items => 
      items.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const acknowledgePolicyMutation = useMutation(
    async (policyId: string) => {
      const res = await api.post(`/policies/${policyId}/acknowledge`);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('orientation');
        queryClient.invalidateQueries('policies');
      },
    }
  );

  const handlePolicyConfirm = async (policyId: string) => {
    try {
      await acknowledgePolicyMutation.mutateAsync(policyId);
      setPolicyConfirmations(prev => {
        const newSet = new Set(prev);
        if (newSet.has(policyId)) {
          newSet.delete(policyId);
        } else {
          newSet.add(policyId);
        }
        return newSet;
      });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to acknowledge policy');
    }
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
        } catch (fetchError: any) {
          console.error('Error downloading certificate:', fetchError);
          console.error('Error details:', fetchError.response?.data);
          
          // Fallback: try with direct fetch and explicit token
          try {
            const { token } = useAuthStore.getState();
            if (token && user?.id) {
              let certUrl = result.certificateUrl;
              if (!certUrl.startsWith('http')) {
                // Use environment variable or fallback to relative path
                const apiBase = (import.meta as any).env?.VITE_API_URL || window.location.origin;
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
              } else {
                throw new Error('Failed to fetch certificate');
              }
            } else {
              throw new Error('No authentication token');
            }
          } catch (fallbackError) {
            console.error('Fallback download also failed:', fallbackError);
            alert('🎉 Orientation completed successfully! Please download your certificate from the completion page.');
          }
        }
      } else {
        alert('🎉 Orientation completed successfully! Please refresh to see your certificate.');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to complete orientation');
    }
  };

  // Initialize policy confirmations from policies data (check if they're already acknowledged)
  useEffect(() => {
    if (policies && policies.length > 0) {
      const acknowledgedPolicies = new Set<string>();
      policies.forEach((policy: any) => {
        // Check if policy has a certification with ACKNOWLEDGED status
        if (policy.certifications && policy.certifications.length > 0) {
          const cert = policy.certifications[0];
          if (cert.status === 'ACKNOWLEDGED') {
            acknowledgedPolicies.add(policy.id);
          }
        }
      });
      setPolicyConfirmations(acknowledgedPolicies);
    }
  }, [policies]);

  // Safety check: ensure currentStep doesn't exceed totalSteps - 1
  // This prevents "Step 2 of 1" and "200% Complete" when there are no steps
  useEffect(() => {
    if (currentStep >= totalSteps) {
      // Reset to last valid step (checklist only if no other steps)
      if (totalSteps === 1) {
        setCurrentStep(0);
      } else {
        setCurrentStep(totalSteps - 1);
      }
    }
  }, [currentStep, totalSteps]);

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">Loading orientation...</div>;
  }

  // If completed and user wants to see onboarding flow, show it
  if (completed && !showOnboardingFlow) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/50 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center">
            <div className="text-6xl mb-4">🎓</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Orientation Completed!
            </h2>
            <p className="text-gray-300 mb-6">
              You completed orientation on {new Date(data.completionDate).toLocaleDateString()}
            </p>
            {certificateUrl && (
              <div className="space-y-4">
                <p className="text-gray-300">Your certificate is ready!</p>
                <button
                  onClick={() => setShowCertificateForm(true)}
                  className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold flex items-center space-x-2 mx-auto"
                >
                  <span>📄</span>
                  <span>Download Certificate</span>
                </button>
              </div>
            )}
            <div className="mt-6">
              <button
                onClick={() => setShowOnboardingFlow(true)}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium flex items-center space-x-2 mx-auto"
              >
                <span>👁️</span>
                <span>Let's Start My Orientation</span>
              </button>
            </div>
          </div>
        </div>

        {checklistData && (
          <div className="bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-white mb-4">Your Onboarding Checklist</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Orientations Received</h4>
                <ul className="space-y-2">
                  {checklistData.orientation?.map((item: any) => (
                    <li key={item.id} className="flex items-center space-x-2">
                      {item.checked ? (
                        <span className="text-green-500">✅</span>
                      ) : (
                        <span className="text-gray-500">❌</span>
                      )}
                      <span className="text-gray-300 text-sm">{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Equipment & Resources</h4>
                <ul className="space-y-2">
                  {checklistData.equipment?.map((item: any) => (
                    <li key={item.id} className="flex items-center space-x-2">
                      {item.checked ? (
                        <span className="text-green-500">✅</span>
                      ) : (
                        <span className="text-gray-500">❌</span>
                      )}
                      <span className="text-gray-300 text-sm">{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Show all policies for reference */}
        <div className="bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-2xl font-bold text-white mb-4">Key Policies & Guidelines</h3>
          <p className="text-gray-400 mb-6">
            Review these essential policies and guidelines that guide INARA's work.
          </p>

          {Object.entries(policiesByCategory).map(([category, categoryPolicies]: [string, any]) => (
            <div key={category} className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">
                {category}
              </h4>
              <div className="space-y-3">
                {categoryPolicies.map((policy: any) => (
                  <div
                    key={policy.id}
                    className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h5 className="font-semibold text-white">{policy.title}</h5>
                          {policy.isMandatory && (
                            <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-300 rounded">
                              Mandatory
                            </span>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">{policy.brief}</p>
                      </div>
                      <button
                        onClick={() => navigate(`/policies?policy=${policy.id}`)}
                        className="ml-4 px-3 py-1 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
                      >
                        View Full
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {completed && (
        <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>✅</span>
            <span className="text-white">You've completed orientation. This is a review of the onboarding flow.</span>
          </div>
          <button
            onClick={() => setShowOnboardingFlow(false)}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            Back to Completion
          </button>
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold text-white">Welcome to INARA!</h1>
        <p className="text-gray-400 mt-2">
          {completed ? 'Review your onboarding process' : 'Complete your onboarding to get started. This is a step-by-step process.'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">
            Step {Math.min(currentStep + 1, totalSteps)} of {totalSteps}
          </span>
          <span className="text-sm text-gray-400">
            {Math.min(Math.round(((currentStep + 1) / totalSteps) * 100), 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(((currentStep + 1) / totalSteps) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Step 0: Onboarding Checklist */}
      {currentStep === 0 && (
        <div className="bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-white mb-2">Step 1: Onboarding Checklist</h2>
          <p className="text-gray-400 mb-6">
            Please confirm that you have completed the following onboarding activities and have the necessary equipment.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Orientations Received */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">👥</span>
                Orientations Received
              </h3>
              <div className="space-y-3">
                {checklist.filter(c => c.category === 'orientation').map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleChecklistItem(item.id)}
                      className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                    />
                    <span className="text-gray-300 flex-1">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Equipment & Resources */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">💻</span>
                Equipment & Resources
              </h3>
              <div className="space-y-3">
                {checklist.filter(c => c.category === 'equipment').map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleChecklistItem(item.id)}
                      className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                    />
                    <span className="text-gray-300 flex-1">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                const allChecked = checklist.every(item => item.checked);
                if (!allChecked) {
                  alert('Please complete all checklist items before proceeding.');
                  return;
                }
                setCurrentStep(1);
              }}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Continue to Policies →
            </button>
          </div>
        </div>
      )}

      {/* Steps 1+: Orientation Steps with PDFs and Questions */}
      {currentStep > 0 && useSteps && currentStepData && (
        <div className="bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Step {currentStep + 1}: {currentStepData.title}
          </h2>
          {currentStepData.description && (
            <p className="text-gray-400 mb-6">{currentStepData.description}</p>
          )}

          {/* PDF Viewer */}
          {currentStepData.pdfUrl && (
            <div className="mb-6">
              <PDFViewer 
                pdfUrl={currentStepData.pdfUrl} 
                title={currentStepData.title}
              />
            </div>
          )}

          {/* Questions */}
          {currentStepData.questions && Array.isArray(currentStepData.questions) && currentStepData.questions.length > 0 && (
            <div className="mt-6 space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">Questions</h3>
              {currentStepData.questions.map((question: any, qIndex: number) => {
                const questionId = question.id || `q-${currentStepData.id}-${qIndex}`;
                const stepResponses = questionResponses[currentStepData.id] || {};
                const currentAnswer = stepResponses[questionId];
                const stepFeedback = answerFeedback[currentStepData.id] || {};
                const feedback = stepFeedback[questionId];
                const hasAnswer = currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== '';

                return (
                  <div key={questionId} className={`bg-gray-700/50 rounded-lg p-5 border-2 ${
                    feedback 
                      ? feedback.isCorrect 
                        ? 'border-green-500/50 bg-green-500/10' 
                        : 'border-red-500/50 bg-red-500/10'
                      : 'border-gray-600'
                  }`}>
                    <label className="block text-white font-medium mb-3">
                      {question.question || question.text}
                      {question.required !== false && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    
                    {/* Show feedback if available */}
                    {feedback && hasAnswer && (
                      <div className={`mb-3 p-3 rounded-lg ${
                        feedback.isCorrect 
                          ? 'bg-green-500/20 border border-green-500/50' 
                          : 'bg-red-500/20 border border-red-500/50'
                      }`}>
                        <div className="flex items-start space-x-2">
                          {feedback.isCorrect ? (
                            <span className="text-green-400 text-xl">✓</span>
                          ) : (
                            <span className="text-red-400 text-xl">✗</span>
                          )}
                          <div className="flex-1">
                            <p className={`font-medium ${feedback.isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                              {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
                            </p>
                            {!feedback.isCorrect && feedback.correctAnswer && (
                              <p className="text-gray-300 text-sm mt-1">
                                <span className="font-semibold">Correct answer:</span>{' '}
                                {Array.isArray(feedback.correctAnswer) 
                                  ? feedback.correctAnswer.join(', ') 
                                  : feedback.correctAnswer}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {question.type === 'multiple_choice' && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option: string, optIndex: number) => (
                          <label key={optIndex} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-600/50 rounded">
                            <input
                              type="radio"
                              name={questionId}
                              value={option}
                              checked={currentAnswer === option}
                              onChange={(e) => {
                                setQuestionResponses(prev => ({
                                  ...prev,
                                  [currentStepData.id]: {
                                    ...(prev[currentStepData.id] || {}),
                                    [questionId]: e.target.value,
                                  },
                                }));
                              }}
                              className="w-4 h-4 text-primary-500"
                            />
                            <span className="text-gray-300">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {question.type === 'checkbox' && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option: string, optIndex: number) => {
                          const checkedAnswers = Array.isArray(currentAnswer) ? currentAnswer : [];
                          return (
                            <label key={optIndex} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-600/50 rounded">
                              <input
                                type="checkbox"
                                value={option}
                                checked={checkedAnswers.includes(option)}
                                onChange={(e) => {
                                  const newAnswers = e.target.checked
                                    ? [...checkedAnswers, option]
                                    : checkedAnswers.filter((a: string) => a !== option);
                                  setQuestionResponses(prev => ({
                                    ...prev,
                                    [currentStepData.id]: {
                                      ...(prev[currentStepData.id] || {}),
                                      [questionId]: newAnswers,
                                    },
                                  }));
                                }}
                                className="w-4 h-4 text-primary-500 rounded"
                              />
                              <span className="text-gray-300">{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {(!question.type || question.type === 'text') && (
                      <textarea
                        value={typeof currentAnswer === 'string' ? currentAnswer : ''}
                        onChange={(e) => {
                          setQuestionResponses(prev => ({
                            ...prev,
                            [currentStepData.id]: {
                              ...(prev[currentStepData.id] || {}),
                              [questionId]: e.target.value,
                            },
                          }));
                        }}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        rows={4}
                        placeholder="Type your answer here..."
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={async () => {
                // Validate required questions
                if (currentStepData.questions && Array.isArray(currentStepData.questions)) {
                  const requiredQuestions = currentStepData.questions.filter((q: any) => q.required !== false);
                  const stepResponses = questionResponses[currentStepData.id] || {};
                  
                  const missingQuestions = requiredQuestions.filter((q: any) => {
                    const questionId = q.id || `q-${currentStepData.id}-${currentStepData.questions.indexOf(q)}`;
                    const answer = stepResponses[questionId];
                    return !answer || (Array.isArray(answer) && answer.length === 0);
                  });

                  if (missingQuestions.length > 0) {
                    alert(`Please answer all required questions before proceeding.`);
                    return;
                  }

                  // Confirm step with responses
                  const responses = requiredQuestions.map((q: any) => {
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
                      const feedback: Record<string, { isCorrect: boolean; correctAnswer?: string | string[]; message?: string }> = {};
                      result.answerValidation.forEach((validation: any) => {
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
                      const allCorrect = result.answerValidation.every((v: any) => v.isCorrect);
                      if (!allCorrect) {
                        alert('Some answers are incorrect. Please review the feedback below each question and correct your answers before proceeding.');
                        return; // Don't proceed if answers are incorrect
                      }
                    }
                  } catch (error: any) {
                    const errorMessage = error.response?.data?.message || 'Failed to confirm step';
                    const errorData = error.response?.data;
                    
                    // If there are validation errors, show feedback
                    if (errorData?.answerValidation && errorData.answerValidation.length > 0) {
                      const feedback: Record<string, { isCorrect: boolean; correctAnswer?: string | string[]; message?: string }> = {};
                      errorData.answerValidation.forEach((validation: any) => {
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
                    
                    alert(errorMessage);
                    return;
                  }
                } else {
                  // No questions, just confirm
                  try {
                    await confirmStepMutation.mutateAsync({
                      stepId: currentStepData.id,
                    });
                  } catch (error: any) {
                    alert(error.response?.data?.message || 'Failed to confirm step');
                    return;
                  }
                }

                // Move to next step or show certificate form
                if (currentStep < totalSteps - 1) {
                  setCurrentStep(currentStep + 1);
                } else {
                  // Last step completed - show certificate viewer
                  const allChecklistChecked = checklist.every(item => item.checked);
                  if (!allChecklistChecked) {
                    alert('Please complete all checklist items before finishing orientation.');
                    return;
                  }
                  // Show certificate viewer instead of completing immediately
                  setShowCertificateViewer(true);
                }
              }}
              disabled={confirmStepMutation.isLoading}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirmStepMutation.isLoading 
                ? 'Saving...' 
                : currentStep < totalSteps - 1 
                  ? 'Next Step →' 
                  : 'Complete Orientation ✓'}
            </button>
          </div>
        </div>
      )}

      {/* Steps 1+: Policy Reading (Fallback) */}
      {currentStep > 0 && !useSteps && currentStepData?.type === 'policies' && currentStepData.policies.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Step {currentStep + 1}: {currentCategory} Policies
          </h2>
          <p className="text-gray-400 mb-6">
            Please read and confirm each policy below. Click "I have read and understood" for each policy.
          </p>

          <div className="space-y-4">
            {currentPolicies.map((policy: any) => (
              <div
                key={policy.id}
                className={`bg-gray-700/50 rounded-lg p-5 border-2 transition-colors ${
                  policyConfirmations.has(policy.id)
                    ? 'border-green-500/50 bg-green-500/10'
                    : 'border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">{policy.title}</h3>
                      {policy.isMandatory && (
                        <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-300 rounded">
                          Mandatory
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 leading-relaxed mb-3">{policy.brief}</p>
                    <p className="text-gray-400 text-xs">
                      Effective Date: {new Date(policy.effectiveDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 flex-wrap gap-2">
                  <button
                    onClick={() => navigate(`/policies?policy=${policy.id}`)}
                    className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors flex items-center space-x-1"
                  >
                    <span>📄</span>
                    <span>Read Full Policy</span>
                  </button>
                  <button
                    onClick={() => handlePolicyConfirm(policy.id)}
                    disabled={acknowledgePolicyMutation.isLoading}
                    className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors text-sm font-medium ${
                      policyConfirmations.has(policy.id)
                        ? 'bg-green-600/50 text-green-300 hover:bg-green-600/70'
                        : 'bg-gray-600/50 text-gray-300 hover:bg-gray-600'
                    } disabled:opacity-50`}
                  >
                    <input
                      type="checkbox"
                      checked={policyConfirmations.has(policy.id)}
                      readOnly
                      className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500 pointer-events-none"
                    />
                    <span>
                      {acknowledgePolicyMutation.isLoading ? 'Processing...' : '✓ I have read and understood'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              ← Previous
            </button>
            {currentStep < totalSteps - 1 ? (
              <button
                onClick={() => {
                  if (currentPolicies.length > 0 && !currentPolicies.every((p: any) => policyConfirmations.has(p.id))) {
                    alert('Please confirm all policies in this category before proceeding.');
                    return;
                  }
                  setCurrentStep(currentStep + 1);
                }}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Next Category →
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={completeMutation.isLoading}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {completeMutation.isLoading ? 'Completing...' : '✓ I am Fully Ready - Complete Orientation'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Certificate Viewer */}
      {showCertificateViewer && (
        <CertificateViewer
          isOpen={showCertificateViewer}
          onClose={() => setShowCertificateViewer(false)}
          onComplete={async (certData) => {
            try {
              // Complete the orientation
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

              await completeMutation.mutateAsync({
                score: 100,
                checklistData,
                certificateData: {
                  passportId: certData.passportId,
                  country: certData.country || '',
                  department: certData.department || '',
                  role: '',
                },
              });

              setShowCertificateViewer(false);
              alert('🎉 Orientation completed successfully! You can print your certificate using the Print button.');
              
              // Refresh orientation data
              await refetch();
            } catch (error: any) {
              console.error('Error completing orientation:', error);
              const errorMessage = error.message || error.response?.data?.message || 'Failed to complete orientation. Please try again.';
              alert(errorMessage);
              throw error;
            }
          }}
          completionDate={new Date()}
        />
      )}
    </div>
  );
}
