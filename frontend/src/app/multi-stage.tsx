'use client';

import React, { useState, useEffect } from 'react';
import CategoryNavigation from '@/components/CategoryNavigation';
import CategorySection from '@/components/CategorySection';
import MaturityLevelMatrix from '@/components/MaturityLevelMatrix';
import OlimpQuestionnaire from '@/components/OlimpQuestionnaire';
import PrioritySelection from '@/components/PrioritySelection';
import { QuestionnaireData, AnswerData, CategoryProgress, OlimpAnswerData, LetterAnswer } from '@/types/questionnaire';
import { getAllTechnicalNames, getAllDisplayNames, getDisplayName, getTechnicalName } from '@/utils/categoryTranslations';

type WorkflowStage = 'climb2-questionnaire' | 'olimp-questionnaire' | 'olimp-priorities' | 'olimp-analysis' | 'final-reports';

export default function MultiStageWorkflow() {
  // Workflow state
  const [currentStage, setCurrentStage] = useState<WorkflowStage>('climb2-questionnaire');
  const [stageProgress, setStageProgress] = useState({
    'climb2-questionnaire': false,
    'olimp-questionnaire': false,
    'olimp-priorities': false,
    'olimp-analysis': false,
    'final-reports': false
  });

  // CLIMB2 state
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData | null>(null);
  const [answerData, setAnswerData] = useState<AnswerData>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [progress, setProgress] = useState<CategoryProgress>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingSampleAnswers, setIsLoadingSampleAnswers] = useState(false);
  const [sampleAnswersLoaded, setSampleAnswersLoaded] = useState(false);

  // CLIMB2 strategic goals state
  const [maturityLevels, setMaturityLevels] = useState<Record<string, string>>({});
  const [strategicGoals, setStrategicGoals] = useState<Record<string, string>>({});
  const [, setClimb2Status] = useState<string>('idle');
  const [climb2ReportPath, setClimb2ReportPath] = useState<string | null>(null);
  
  // Enhanced progress monitoring state
  const [climb2ProgressSteps, setClimb2ProgressSteps] = useState<Array<{
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'active' | 'completed';
    progress: number;
  }>>([]);
  const [climb2DetailedStatus, setClimb2DetailedStatus] = useState<any>(null);

  // OLIMP state
  const [olimpAnswers, setOlimpAnswers] = useState<OlimpAnswerData | null>(null);

  // Analysis state
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('idle');
  const [reportPath, setReportPath] = useState<string | null>(null);
  
  // OLIMP progress state
  const [olimpProgress, setOlimpProgress] = useState<{
    currentStep: string;
    stepsCompleted: number;
    totalSteps: number;
    currentBranch: string | null;
    branches: any;
    elapsedTime: number;
    stepStatus?: 'active' | 'generating' | 'completed';
    error?: string;
  } | null>(null);

  // Fetch CLIMB2 questionnaire data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/questionnaire');
        
        if (!response.ok) {
          throw new Error('Failed to fetch questionnaire data');
        }
        
        const data: QuestionnaireData = await response.json();
        setQuestionnaireData(data);
        
        // Set categories and default active category
        const categoryList = Object.keys(data);
        setCategories(categoryList);
        if (categoryList.length > 0) {
          setActiveCategory(categoryList[0]);
        }
        
        // Initialize progress tracking
        const initialProgress: CategoryProgress = {};
        categoryList.forEach(category => {
          initialProgress[category] = {
            total: Object.keys(data[category]).length,
            answered: 0
          };
        });
        setProgress(initialProgress);
        
        // Initialize empty answer data structure
        const initialAnswerData: AnswerData = {};
        categoryList.forEach(category => {
          initialAnswerData[category] = {};
        });
        setAnswerData(initialAnswerData);
        
      } catch (err) {
        console.error('Error fetching questionnaire data:', err);
        setError('Nie udało się załadować kwestionariusza. Spróbuj ponownie później.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update progress when answers change
  useEffect(() => {
    if (!questionnaireData) return;
    
    const newProgress: CategoryProgress = {};
    
    Object.keys(questionnaireData).forEach(category => {
      const totalQuestions = Object.keys(questionnaireData[category]).length;
      const answeredQuestions = Object.keys(answerData[category] || {}).length;
      
      newProgress[category] = {
        total: totalQuestions,
        answered: answeredQuestions
      };
    });
    
    setProgress(newProgress);
  }, [answerData, questionnaireData]);

  // Handle answer selection
  const handleAnswerSelected = (category: string, questionText: string, answer: string) => {
    setAnswerData(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [questionText]: answer
      }
    }));
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load sample answers and start analysis
  const handleAnalyzeSampleData = async () => {
    try {
      setIsLoadingSampleAnswers(true);
      console.log('Loading sample data and starting analysis...');
      
      // Step 1: Load sample answers
      const response = await fetch('/api/sample-answers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch sample answers');
      }
      
      const sampleAnswers: AnswerData = await response.json();
      setAnswerData(sampleAnswers);
      setSampleAnswersLoaded(true);
      
      // Step 2: Submit CLIMB2 questionnaire
      console.log('Submitting sample CLIMB2 answers...');
      
      const submitResponse = await fetch('/api/questionnaire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sampleAnswers),
      });
      
      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(`Failed to submit questionnaire: ${errorData.error || submitResponse.statusText}`);
      }

      // Step 3: Get maturity levels
      const maturityResponse = await fetch('/api/get-maturity-levels');
      if (maturityResponse.ok) {
        const maturityData = await maturityResponse.json();
        setMaturityLevels(maturityData.maturityLevels || {});
      }
      
      // Step 4: Move directly to OLIMP questionnaire
      console.log('Moving directly to OLIMP questionnaire...');
      setStageProgress(prev => ({ ...prev, 'climb2-questionnaire': true }));
      setCurrentStage('olimp-questionnaire');
      
    } catch (err) {
      console.error('Error analyzing sample data:', err);
      setError(err instanceof Error ? err.message : 'Nie udało się przeanalizować przykładowych danych. Spróbuj ponownie.');
    } finally {
      setIsLoadingSampleAnswers(false);
    }
  };

  // Handle CLIMB2 questionnaire completion
  const handleClimb2QuestionnaireComplete = async () => {
    try {
      setIsSubmitting(true);
      console.log('Starting CLIMB2 questionnaire submission...');
      
      // Check if all questions are answered
      const totalQuestions = Object.values(progress).reduce((sum, cat) => sum + cat.total, 0);
      const answeredQuestions = Object.values(progress).reduce((sum, cat) => sum + cat.answered, 0);
      
      console.log(`Progress: ${answeredQuestions}/${totalQuestions} questions answered`);
      
      if (answeredQuestions < totalQuestions) {
        if (!confirm('Nie wszystkie pytania zostały udzielone. Czy chcesz kontynuować mimo to?')) {
          setIsSubmitting(false);
          return;
        }
      }
      
      console.log('Submitting CLIMB2 answers...');
      
      // Submit CLIMB2 answers
      const response = await fetch('/api/questionnaire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answerData),
      });
      
      console.log('Questionnaire response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Questionnaire submission error:', errorData);
        throw new Error(`Nie udało się przesłać kwestionariusza: ${errorData.error || response.statusText}`);
      }

      // Get maturity levels
      const maturityResponse = await fetch('/api/get-maturity-levels');
      if (maturityResponse.ok) {
        const maturityData = await maturityResponse.json();
        setMaturityLevels(maturityData.maturityLevels || {});
      }
      
      console.log('CLIMB2 questionnaire completed, moving directly to OLIMP');
      
      // Go directly to OLIMP questionnaire
      setStageProgress(prev => ({ 
        ...prev, 
        'climb2-questionnaire': true
      }));
      setCurrentStage('olimp-questionnaire');
      setSubmitSuccess(true);
      
      setTimeout(() => {
        setSubmitSuccess(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error completing CLIMB2 questionnaire:', err);
      setError(err instanceof Error ? err.message : 'Nie udało się przesłać kwestionariusza. Spróbuj ponownie.');
      setSubmitSuccess(false);
      setTimeout(() => {
        setSubmitSuccess(null);
        setError(null);
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };


  // Handle OLIMP questionnaire completion
  const handleOlimpComplete = async (answers: OlimpAnswerData) => {
    try {
      setOlimpAnswers(answers);
      
      // Submit OLIMP answers
      const response = await fetch('/api/olimp-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answers),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit OLIMP answers');
      }

      // Transform CLIMB2 data to A_1.json format for OLIMP integration
      const transformResponse = await fetch('/api/transform-climb2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answerData, questionnaireData }),
      });

      if (!transformResponse.ok) {
        const errorData = await transformResponse.json();
        console.error('Transform error:', errorData);
        throw new Error(`Failed to transform CLIMB2 data: ${errorData.error || transformResponse.statusText}`);
      }
      
      setStageProgress(prev => ({ ...prev, 'olimp-questionnaire': true }));
      setCurrentStage('olimp-priorities');
      
    } catch (err) {
      console.error('Error completing OLIMP:', err);
      setError('Nie udało się przesłać odpowiedzi OLIMP. Spróbuj ponownie.');
    }
  };

  // Handle OLIMP priority selection completion
  const handlePriorityComplete = async (selectedAreas: string[]) => {
    try {
      // Compute gaps
      const response = await fetch('/api/compute-gaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedAreas }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to compute gaps');
      }
      
      setStageProgress(prev => ({ ...prev, 'olimp-priorities': true }));
      setCurrentStage('olimp-analysis');
      
      // Start OLIMP analysis
      await startOlimpAnalysis();
      
    } catch (err) {
      console.error('Error completing priority selection:', err);
      setError('Nie udało się obliczyć luk. Spróbuj ponownie.');
    }
  };

  // Start OLIMP analysis
  const startOlimpAnalysis = async () => {
    try {
      setIsRunningAnalysis(true);
      setAnalysisStatus('starting');
      
      const response = await fetch('/api/run-olimp-analysis', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to start OLIMP analysis');
      }
      
      setAnalysisStatus('running');
      
      // Poll for status
      const pollStatus = setInterval(async () => {
        try {
          const statusResponse = await fetch('/api/olimp-status');
          const statusData = await statusResponse.json();
          
          setAnalysisStatus(statusData.status);
          
          // Update progress data if available
          if (statusData.progress) {
            setOlimpProgress(statusData.progress);
          }
          
          if (statusData.status === 'completed') {
            clearInterval(pollStatus);
            setIsRunningAnalysis(false);
            setStageProgress(prev => ({ ...prev, 'olimp-analysis': true, 'final-reports': true }));
            setCurrentStage('final-reports');
            
            if (statusData.reports.final) {
              setReportPath(statusData.reports.final);
            }
          } else if (statusData.status === 'error' || statusData.status === 'stopped') {
            clearInterval(pollStatus);
            setIsRunningAnalysis(false);
            
            if (statusData.status === 'error' && statusData.progress?.error) {
              setError(`Analiza OLIMP nie powiodła się: ${statusData.progress.error}`);
            } else {
              setError('Analiza OLIMP nie powiodła się lub została zatrzymana');
            }
          }
        } catch (err) {
          console.error('Error polling OLIMP status:', err);
        }
      }, 2000); // Poll every 2 seconds (reduced from 5)
      
    } catch (err) {
      console.error('Error starting OLIMP analysis:', err);
      setError('Nie udało się uruchomić analizy OLIMP. Spróbuj ponownie.');
      setIsRunningAnalysis(false);
    }
  };

  // Navigate to next category
  const handleNextCategory = () => {
    const currentIndex = categories.indexOf(activeCategory);
    if (currentIndex < categories.length - 1) {
      setActiveCategory(categories[currentIndex + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Navigate to previous category
  const handlePrevCategory = () => {
    const currentIndex = categories.indexOf(activeCategory);
    if (currentIndex > 0) {
      setActiveCategory(categories[currentIndex - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle back navigation
  const handleBackToClimb2 = () => {
    setCurrentStage('climb2-questionnaire');
  };

  const handleBackToOlimp = () => {
    setCurrentStage('olimp-questionnaire');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Błąd!</strong>
          <span className="block sm:inline"> {error}</span>
          <button 
            onClick={() => setError(null)}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  if (currentStage === 'olimp-questionnaire') {
    return <OlimpQuestionnaire onComplete={handleOlimpComplete} onBack={handleBackToClimb2} />;
  }

  if (currentStage === 'olimp-priorities') {
    return <PrioritySelection onComplete={handlePriorityComplete} onBack={handleBackToOlimp} />;
  }

  if (currentStage === 'olimp-analysis') {
    const getStepDisplayName = (step: string) => {
      const stepMap: { [key: string]: string } = {
        'setup': 'Inicjalizacja',
        'processing': 'Analiza Luk',
        'extract_answers': 'Ekstrakcja odpowiedzi',
        'identify_gaps': 'Identyfikacja luk',
        'parallel_recommendations': 'Rekomendacje agentów OpenAI, Anthropic i Google',
        'evaluation': 'Rekomendacje agentów OpenAI, Anthropic i Google',
        'evaluation_branches': 'Analiza Wielogałęziowa',
        'recommend': 'Synteza rekomendacji',
        'recommend_branches': 'Rekomendacje Gałęzi',
        'consensus': 'Ustalanie konsensusu',
        'generating_final_report': 'Generowanie Raportu Końcowego',
        'final_report': 'Generowanie Raportu Końcowego',
        'completed': 'Analiza Zakończona'
      };
      return stepMap[step] || step;
    };

    const getProgressPercentage = () => {
      if (!olimpProgress) return 0;
      if (olimpProgress.stepsCompleted && olimpProgress.totalSteps) {
        return Math.round((olimpProgress.stepsCompleted / olimpProgress.totalSteps) * 100);
      }
      return 50; // Default progress for running state
    };

    const formatElapsedTime = (seconds: number) => {
      if (!seconds || isNaN(seconds)) return '0s';
      if (seconds < 60) return `${Math.round(seconds)}s`;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return `${minutes}m ${remainingSeconds}s`;
    };

    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Analiza OLIMP</h1>
            <p className="text-gray-600 mb-6">
              System OLIMP przeprowadza kompleksową analizę luk i generuje szczegółowe rekomendacje.
            </p>
          </div>

          {/* Progress Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Postęp</h2>
              <span className="text-blue-600 font-medium text-lg">{getProgressPercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-in-out" 
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Aktualny Krok</p>
                <p className="font-medium text-gray-900">
                  {olimpProgress ? 
                    (olimpProgress.currentStep ? getStepDisplayName(olimpProgress.currentStep) : 
                     'Przetwarzanie analizy...') : 
                    'Inicjalizacja...'}
                  {olimpProgress?.stepStatus === 'generating' && (
                    <span className="ml-2 text-orange-600">
                      <svg className="inline-block animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  )}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Krok</p>
                <p className="font-medium text-gray-900">
                  {olimpProgress && olimpProgress.stepsCompleted && olimpProgress.totalSteps ? 
                    `${olimpProgress.stepsCompleted}/${olimpProgress.totalSteps}` : 
                    (analysisStatus === 'running' ? 'W Toku' : '0/8')}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Szacowany czas</p>
                <p className="font-medium text-gray-900">
                  {olimpProgress && olimpProgress.elapsedTime ? 
                    formatElapsedTime(olimpProgress.elapsedTime) : 
                    (analysisStatus === 'running' ? 'Działa...' : '0s')}
                </p>
              </div>
            </div>
          </div>

          {/* Branch Analysis Progress */}
          {olimpProgress?.branches && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Analiza Wielogałęziowa</h2>
              <div className="space-y-3">
                {Object.entries(olimpProgress.branches).map(([branchName, branchData]: [string, any]) => (
                  <div key={branchName} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 mr-3">
                      <div className={`w-3 h-3 rounded-full ${
                        branchData.status === 'completed' ? 'bg-green-500' :
                        branchData.status === 'running' ? 'bg-blue-500 animate-pulse' :
                        branchData.status === 'skipped' ? 'bg-yellow-500' :
                        'bg-gray-300'
                      }`}></div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">{branchName.replace('branch_', 'Branch ')}</span>
                        <span className="text-sm text-gray-600">
                          {branchData.status === 'skipped' ? 'Pominięto' : `${branchData.iterations}/${branchData.max_iterations} iteracji`}
                        </span>
                      </div>
                      {branchData.details && (
                        <p className="text-xs text-gray-500 mt-1">{branchData.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Steps */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Etap analizy</h2>
            <div className="space-y-4">
              {['setup', 'extract_answers', 'identify_gaps', 'parallel_recommendations', 'recommend', 'consensus', 'generating_final_report', 'completed'].map((step, index) => {
                const isCompleted = olimpProgress && olimpProgress.stepsCompleted ? olimpProgress.stepsCompleted > index : false;
                const isActive = olimpProgress && olimpProgress.currentStep === step;
                const stepStatus = olimpProgress?.stepStatus;
                const isGenerating = isActive && stepStatus === 'generating';
                
                return (
                  <div key={step} className={`flex items-start transition-all duration-300 ${
                    isActive ? 'transform scale-105' : ''
                  }`}>
                    <div className="flex-shrink-0 mr-4 mt-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isActive
                            ? isGenerating
                              ? 'bg-orange-500 text-white animate-pulse shadow-lg ring-2 ring-orange-300'
                              : 'bg-blue-600 text-white animate-pulse shadow-lg ring-2 ring-blue-300'
                            : 'bg-gray-200 text-gray-600'
                      }`}>
                        {isCompleted ? '✓' : index + 1}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className={`p-2 rounded-lg transition-all duration-300 ${
                        isActive
                          ? isGenerating 
                            ? 'bg-orange-50 border border-orange-200'
                            : 'bg-blue-50 border border-blue-200'
                          : ''
                      }`}>
                        <p className={`font-medium ${
                          isActive 
                            ? isGenerating 
                              ? 'text-orange-900' 
                              : 'text-blue-900' 
                            : 'text-gray-900'
                        }`}>
                          {getStepDisplayName(step)}
                          {isGenerating && (
                            <span className="ml-2 inline-flex items-center text-orange-600">
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </span>
                          )}
                        </p>
                        {isGenerating && step === 'generating_final_report' && (
                          <p className="text-xs text-orange-700 mt-1">
                            Kompilowanie raportu końcowego. Może potrwać ok. 10 minut...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
          </div>

          {/* Error Display */}
          {analysisStatus === 'error' && olimpProgress?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-red-900 mb-3">Błąd Analizy</h2>
              <p className="text-red-800 text-sm mb-4">{olimpProgress.error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Uruchom Ponownie Analizę
              </button>
            </div>
          )}

          {/* Back Navigation */}
          <div className="text-center">
            <button
              onClick={() => setCurrentStage('olimp-priorities')}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Powrót do Wyboru Priorytetów
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (currentStage === 'final-reports') {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Analiza zakończona!</h1>
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              <strong className="font-bold">Sukces!</strong>
              <span className="block sm:inline"> Twoja kompleksowa analiza gotowości na AI została zakończona.</span>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Dostępne Raporty</h2>
              {reportPath && (
                <div className="border border-gray-200 rounded-lg p-4 max-w-md mx-auto">
                  <h3 className="font-semibold mb-2">Raport końcowy OLIMP</h3>
                  <p className="text-sm text-gray-600 mb-3">Kompleksowa analiza gotowości na AI z analizą luk i mapą drogową wdrożenia</p>
                  <a
                    href={`/report?path=${encodeURIComponent(reportPath)}`}
                    className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 text-sm"
                  >
                    Zobacz Raport Końcowy
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setCurrentStage('climb2-questionnaire');
                setStageProgress({
                  'climb2-questionnaire': false,
                  'olimp-questionnaire': false,
                  'olimp-priorities': false,
                  'olimp-analysis': false,
                  'final-reports': false
                });
              }}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
            >
              Rozpocznij nową analizę
            </button>
          </div>
        </div>
      </main>
    );
  }

  // CLIMB2 Stage
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">System oceny dojrzałości AI</h1>
              <p className="text-gray-600">
                Uzupełnij tę wieloetapową ocenę, aby otrzymać kompleksowe rekomendacje gotowości na AI.
              </p>
              
              {/* Progress indicator */}
              <div className="mt-4 flex items-center space-x-2 text-xs">
                <div className={`flex items-center ${stageProgress['climb2-questionnaire'] ? 'text-green-600' : 'text-blue-600'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${stageProgress['climb2-questionnaire'] ? 'bg-green-600' : 'bg-blue-600'}`}></div>
                  <span className="font-medium">1. Kwestionariusz CLIMB2</span>
                </div>
                <div className={`flex items-center ${stageProgress['olimp-questionnaire'] ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${stageProgress['olimp-questionnaire'] ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                  <span>2. Ocena gotowości na GenAI</span>
                </div>
                <div className={`flex items-center ${stageProgress['olimp-priorities'] ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${stageProgress['olimp-priorities'] ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                  <span>3. Priorytety</span>
                </div>
                <div className={`flex items-center ${stageProgress['olimp-analysis'] ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${stageProgress['olimp-analysis'] ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                  <span>4. Analiza Końcowa</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={handleAnalyzeSampleData}
                disabled={isLoadingSampleAnswers || sampleAnswersLoaded}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  isLoadingSampleAnswers || sampleAnswersLoaded
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isLoadingSampleAnswers 
                  ? 'Wypełnianie...' 
                  : sampleAnswersLoaded 
                    ? 'Wypełniono przykładowymi danymi' 
                    : 'Wypełnij przykładowymi danymi'}
              </button>
            </div>
          </div>
        </header>

        {questionnaireData && (
          <>
            <CategoryNavigation
              categories={categories.map(cat => getDisplayName(cat))}
              activeCategory={getDisplayName(activeCategory)}
              progress={Object.fromEntries(
                Object.entries(progress).map(([cat, prog]) => [getDisplayName(cat), prog])
              )}
              onCategoryChange={(displayCategory) => {
                const technicalCategory = getTechnicalName(displayCategory);
                handleCategoryChange(technicalCategory);
              }}
            />

            {activeCategory && (
              <CategorySection
                categoryName={getDisplayName(activeCategory)}
                questions={questionnaireData[activeCategory]}
                answers={answerData[activeCategory] || {}}
                onAnswerSelected={(questionText, answer) => 
                  handleAnswerSelected(activeCategory, questionText, answer)
                }
              />
            )}

            <div className="flex justify-between mt-8 mb-16">
              <button
                onClick={handlePrevCategory}
                disabled={categories.indexOf(activeCategory) === 0}
                className={`px-6 py-2 rounded-md font-medium ${
                  categories.indexOf(activeCategory) === 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Poprzednia Sekcja
              </button>
              
              {categories.indexOf(activeCategory) < categories.length - 1 ? (
                <button
                  onClick={handleNextCategory}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
                >
                  Następna Sekcja
                </button>
              ) : (
                <button
                  onClick={handleClimb2QuestionnaireComplete}
                  disabled={isSubmitting}
                  className={`px-6 py-2 rounded-md font-medium ${
                    isSubmitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? 'Przetwarzanie...' : 'Kontynuuj do Oceny OLIMP'}
                </button>
              )}
            </div>

            {submitSuccess !== null && (
              <div
                className={`fixed bottom-4 right-4 px-6 py-3 rounded-md shadow-lg ${
                  submitSuccess
                    ? 'bg-green-100 border border-green-400 text-green-700'
                    : 'bg-red-100 border border-red-400 text-red-700'
                }`}
              >
                {submitSuccess
                  ? 'Kwestionariusz CLIMB2 zakończony! Przechodzenie do celów strategicznych...'
                  : 'Nie udało się przesłać kwestionariusza. Spróbuj ponownie.'}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
