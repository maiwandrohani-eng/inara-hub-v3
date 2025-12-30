import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';

type SubTabType = 'all' | 'surveys' | 'assessments' | 'tests' | 'hr' | 'program' | 'general';

export default function SurveysTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('all');
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery('surveys', async () => {
    const res = await api.get('/surveys');
    return res.data;
  });

  const { data: surveyDetail } = useQuery(
    ['survey-detail', selectedSurvey?.id],
    async () => {
      if (!selectedSurvey) return null;
      const res = await api.get(`/surveys/${selectedSurvey.id}`);
      return res.data;
    },
    { enabled: !!selectedSurvey }
  );

  const startMutation = useMutation(
    async (surveyId: string) => {
      const res = await api.post(`/surveys/${surveyId}/start`);
      return res.data;
    },
    {
      onSuccess: (data) => {
        console.log('✅ Survey started successfully!');
        console.log('📋 Submission data:', data.submission);
        console.log('📝 Selected survey:', selectedSurvey?.title);
        console.log('📝 Questions count:', (selectedSurvey?.questions as any[])?.length || 0);
        
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
      onError: (error: any) => {
        console.error('❌ Error starting survey:', error);
        alert(error.response?.data?.message || error.message || 'Failed to start survey. Please try again.');
      },
    }
  );

  const submitMutation = useMutation(
    async ({ surveyId, submissionId, responses, notes, timeSpentSeconds }: any) => {
      const res = await api.post(`/surveys/${surveyId}/submit`, {
        submissionId,
        responses,
        notes,
        timeSpentSeconds,
      });
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('surveys');
        queryClient.invalidateQueries(['survey-detail', selectedSurvey?.id]);
        alert('Survey submitted successfully!');
        setSelectedSurvey(null);
        setSubmission(null);
        setResponses({});
      },
    }
  );

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
    } else if (timeRemaining === 0 && submission) {
      // Auto-submit when time runs out
      handleSubmit();
    }
  }, [timeRemaining, submission]);

  const handleStart = async (survey: any) => {
    console.log('🚀 Starting survey:', survey.id, survey.title);
    console.log('📋 Initial survey data:', survey);
    
    // First fetch the full survey details to ensure we have questions
    try {
      const detailRes = await api.get(`/surveys/${survey.id}`);
      const surveyDetail = detailRes.data;
      console.log('📋 Survey details fetched:', surveyDetail);
      
      // Update selectedSurvey with full details (including questions)
      const fullSurvey = surveyDetail.survey || survey;
      const questions = (fullSurvey.questions as any[]) || [];
      console.log('📝 Questions loaded:', questions.length);
      
      if (questions.length === 0) {
        alert('⚠️ This survey has no questions. Please contact the administrator.');
        return;
      }
      
      setSelectedSurvey(fullSurvey);
      
      // Then start the survey
      console.log('▶️ Calling start mutation...');
      startMutation.mutate(survey.id);
    } catch (error: any) {
      console.error('❌ Error fetching survey details:', error);
      alert(error.response?.data?.message || 'Failed to load survey details. Please try again.');
    }
  };

  const handleResponseChange = (questionId: string, answer: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = () => {
    if (!selectedSurvey || !submission) return;

    const questions = selectedSurvey.questions as any[];
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render survey questions view
  if (selectedSurvey && submission) {
    const questions = (selectedSurvey.questions as any[]) || [];
    
    console.log('📝 Rendering survey view:', {
      surveyId: selectedSurvey.id,
      submissionId: submission.id,
      questionsCount: questions.length,
      hasQuestions: questions.length > 0,
    });
    
    if (questions.length === 0) {
      return (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4">{selectedSurvey.title}</h2>
            <p className="text-red-400 mb-4">⚠️ This survey has no questions. Please contact the administrator.</p>
            <button
              onClick={() => {
                setSelectedSurvey(null);
                setSubmission(null);
                setResponses({});
              }}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Back to Surveys
            </button>
          </div>
        </div>
      );
    }
    
    const allRequiredAnswered = questions
      .filter((q) => q.required)
      .every((q) => {
        const answer = responses[q.id];
        return answer !== undefined && answer !== '' && answer !== null && (Array.isArray(answer) ? answer.length > 0 : true);
      });

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">{selectedSurvey.title}</h2>
            {selectedSurvey.description && (
              <p className="text-gray-400 mt-1">{selectedSurvey.description}</p>
            )}
          </div>
          {timeRemaining !== null && (
            <div className={`text-lg font-bold ${timeRemaining < 60 ? 'text-red-400' : 'text-yellow-400'}`}>
              Time: {formatTime(timeRemaining)}
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6 space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-gray-700 rounded-lg p-5">
              <label className="block text-white font-medium mb-3">
                {index + 1}. {question.question}
                {question.required && <span className="text-red-400 ml-1">*</span>}
                {selectedSurvey.type !== 'survey' && question.points && (
                  <span className="text-gray-400 ml-2">({question.points} points)</span>
                )}
              </label>

              {question.type === 'multiple_choice' && (
                <div className="space-y-2">
                  {question.options?.map((option: string) => (
                    <label key={option} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={responses[question.id] === option}
                        onChange={(e) => handleResponseChange(question.id, e.target.value)}
                        className="text-primary-500"
                      />
                      <span className="text-gray-200">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'checkbox' && (
                <div className="space-y-2">
                  {question.options?.map((option: string) => (
                    <label key={option} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(responses[question.id] || []).includes(option)}
                        onChange={(e) => {
                          const current = responses[question.id] || [];
                          const updated = e.target.checked
                            ? [...current, option]
                            : current.filter((o: string) => o !== option);
                          handleResponseChange(question.id, updated);
                        }}
                        className="text-primary-500"
                      />
                      <span className="text-gray-200">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'text' && (
                <textarea
                  value={responses[question.id] || ''}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg"
                />
              )}

              {question.type === 'rating' && (
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleResponseChange(question.id, rating)}
                      className={`w-12 h-12 rounded-lg font-bold ${
                        responses[question.id] === rating
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              )}

              {question.type === 'yes_no' && (
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name={question.id}
                      value="yes"
                      checked={responses[question.id] === 'yes'}
                      onChange={(e) => handleResponseChange(question.id, e.target.value)}
                      className="text-primary-500"
                    />
                    <span className="text-gray-200">Yes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name={question.id}
                      value="no"
                      checked={responses[question.id] === 'no'}
                      onChange={(e) => handleResponseChange(question.id, e.target.value)}
                      className="text-primary-500"
                    />
                    <span className="text-gray-200">No</span>
                  </label>
                </div>
              )}
            </div>
          ))}

          <div className="flex space-x-4 pt-4 border-t border-gray-700">
            <button
              onClick={handleSubmit}
              disabled={!allRequiredAnswered || submitMutation.isLoading}
              className="flex-1 bg-primary-500 text-white py-3 px-6 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {submitMutation.isLoading ? 'Submitting...' : 'Submit Survey'}
            </button>
            <button
              onClick={() => {
                setSelectedSurvey(null);
                setSubmission(null);
                setResponses({});
                setStartTime(null);
                setTimeRemaining(null);
              }}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedSurvey && surveyDetail?.latestSubmission?.status === 'submitted') {
    const questions = selectedSurvey.questions as any[];
    const latestSubmission = surveyDetail.latestSubmission;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">{selectedSurvey.title}</h2>
          <button
            onClick={() => setSelectedSurvey(null)}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Back to Surveys
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Results</h3>
          {selectedSurvey.type !== 'survey' && (
            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Score</p>
                  <p className="text-2xl font-bold text-white">
                    {latestSubmission.totalScore} / {latestSubmission.maxScore}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Percentage</p>
                  <p className="text-2xl font-bold text-white">
                    {latestSubmission.percentageScore?.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <p className={`text-2xl font-bold ${latestSubmission.passed ? 'text-green-400' : 'text-red-400'}`}>
                    {latestSubmission.passed ? 'PASSED' : 'FAILED'}
                  </p>
                </div>
              </div>
            </div>
          )}
          <p className="text-gray-400 mb-4">You have already completed this {selectedSurvey.type}.</p>
          
          {/* Certificate Download for Tests */}
          {selectedSurvey.type === 'test' && latestSubmission.passed && (
            <div className="mb-4 p-4 bg-green-900/20 border border-green-700 rounded-lg">
              <p className="text-green-300 font-semibold mb-2">🎉 Congratulations! You passed the test.</p>
              <button
                onClick={async () => {
                  try {
                    const { user } = useAuthStore.getState();
                    const res = await api.get(
                      `/surveys/${selectedSurvey.id}/certificate/${user?.id}`,
                      {
                        responseType: 'blob',
                      }
                    );

                    // Create download link
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `INARA_Test_Certificate_${user?.firstName}_${user?.lastName}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (error: any) {
                    alert(error.response?.data?.message || 'Failed to download certificate');
                  }
                }}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
              >
                📜 Download Certificate
              </button>
            </div>
          )}

          {selectedSurvey.maxAttempts && surveyDetail.canTakeMore && (
            <button
              onClick={() => handleStart(selectedSurvey)}
              className="mt-4 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
            >
              Take Again (Attempt {latestSubmission.attemptNumber + 1} of {selectedSurvey.maxAttempts})
            </button>
          )}
        </div>
      </div>
    );
  }

  const allSurveys = data?.surveys || [];

  // Filter surveys based on active sub-tab
  const getFilteredSurveys = () => {
    switch (activeSubTab) {
      case 'surveys':
        return allSurveys.filter((s: any) => s.type === 'survey');
      case 'assessments':
        return allSurveys.filter((s: any) => s.type === 'assessment');
      case 'tests':
        return allSurveys.filter((s: any) => s.type === 'test');
      case 'hr':
        return allSurveys.filter((s: any) => {
          const cat = (s.category || '').toLowerCase().trim();
          const tags = (s.tags || []).map((t: string) => t.toLowerCase());
          return cat === 'hr' || 
                 cat === 'human resources' ||
                 cat.includes('human resources') ||
                 tags.some((tag: string) => tag.includes('hr') || tag.includes('employee') || tag.includes('human resources'));
        });
      case 'program':
        return allSurveys.filter((s: any) => {
          const cat = s.category?.toLowerCase() || '';
          return cat === 'm&e' || 
                 cat.includes('monitoring') || 
                 cat.includes('evaluation') ||
                 cat.includes('program management') ||
                 s.tags?.some((tag: string) => tag.toLowerCase().includes('m&e') || tag.toLowerCase().includes('monitoring') || tag.toLowerCase().includes('evaluation') || tag.toLowerCase().includes('beneficiary'));
        });
      case 'general':
        return allSurveys.filter((s: any) => {
          if (!s.category) return true;
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
    { id: 'all' as SubTabType, label: 'All' },
    { id: 'surveys' as SubTabType, label: 'Surveys' },
    { id: 'assessments' as SubTabType, label: 'Assessments' },
    { id: 'tests' as SubTabType, label: 'Tests' },
    { id: 'hr' as SubTabType, label: 'HR' },
    { id: 'program' as SubTabType, label: 'M&E' },
    { id: 'general' as SubTabType, label: 'General' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Surveys, Assessments & Tests</h1>
        <p className="text-gray-400 mt-2">Complete assigned surveys, assessments, and tests</p>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="border-b border-gray-700">
        <nav className="flex justify-center space-x-1 overflow-x-auto">
          {subTabs.map((tab) => {
            // Calculate count for each tab
            let count = 0;
            if (tab.id === 'all') {
              count = allSurveys.length;
            } else if (tab.id === 'surveys') {
              count = allSurveys.filter((s: any) => s.type === 'survey').length;
            } else if (tab.id === 'assessments') {
              count = allSurveys.filter((s: any) => s.type === 'assessment').length;
            } else if (tab.id === 'tests') {
              count = allSurveys.filter((s: any) => s.type === 'test').length;
            } else if (tab.id === 'hr') {
              count = allSurveys.filter((s: any) => 
                s.category?.toLowerCase().includes('hr') || 
                s.category?.toLowerCase().includes('human resources') ||
                s.tags?.some((tag: string) => tag.toLowerCase().includes('hr') || tag.toLowerCase().includes('employee'))
              ).length;
            } else if (tab.id === 'program') {
              count = allSurveys.filter((s: any) => 
                s.category?.toLowerCase().includes('program') || 
                s.tags?.some((tag: string) => tag.toLowerCase().includes('program') || tag.toLowerCase().includes('beneficiary'))
              ).length;
            } else if (tab.id === 'general') {
              count = allSurveys.filter((s: any) => 
                !s.category || 
                (!s.category.toLowerCase().includes('hr') && 
                 !s.category.toLowerCase().includes('program') &&
                 !s.category.toLowerCase().includes('human resources'))
              ).length;
            }
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeSubTab === tab.id
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-gray-500 hover:text-gray-200 hover:border-gray-600'
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs bg-gray-700 px-2 py-0.5 rounded">
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : surveys.length === 0 ? (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-12 text-center">
          <p className="text-gray-400 text-lg">No surveys, assessments, or tests assigned to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey: any) => (
            <div
              key={survey.id}
              className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6 hover:border-primary-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold text-white">{survey.title}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    survey.type === 'survey'
                      ? 'bg-blue-900/30 text-blue-300'
                      : survey.type === 'assessment'
                      ? 'bg-green-900/30 text-green-300'
                      : 'bg-purple-900/30 text-purple-300'
                  }`}
                >
                  {survey.type.toUpperCase()}
                </span>
              </div>

              {survey.description && (
                <p className="text-gray-400 text-sm mb-4">{survey.description}</p>
              )}

              <div className="space-y-2 mb-4">
                {survey.isMandatory && (
                  <span className="inline-block text-xs px-2 py-1 rounded bg-red-900/30 text-red-300">
                    Mandatory
                  </span>
                )}
                {survey.hasTimeLimit && (
                  <span className="inline-block text-xs px-2 py-1 rounded bg-yellow-900/30 text-yellow-300">
                    {survey.timeLimitMinutes} min limit
                  </span>
                )}
                {survey.dueDate && (
                  <span className="inline-block text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                    Due: {new Date(survey.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-400">Status:</p>
                <p
                  className={`font-semibold ${
                    survey.userStatus === 'submitted'
                      ? 'text-green-400'
                      : survey.userStatus === 'in_progress'
                      ? 'text-yellow-400'
                      : 'text-gray-400'
                  }`}
                >
                  {survey.userStatus === 'submitted'
                    ? `Completed ${survey.userScore !== undefined ? `(${survey.userScore.toFixed(1)}%)` : ''}`
                    : survey.userStatus === 'in_progress'
                    ? 'In Progress'
                    : 'Not Started'}
                </p>
              </div>

              <button
                onClick={() => {
                  if (survey.userStatus === 'submitted' && !surveyDetail?.canTakeMore) {
                    setSelectedSurvey(survey);
                  } else {
                    handleStart(survey);
                  }
                }}
                className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600"
              >
                {survey.userStatus === 'submitted'
                  ? 'View Results'
                  : survey.userStatus === 'in_progress'
                  ? 'Continue'
                  : 'Start'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

