'use client';

import React, { useState, useEffect } from 'react';
import CategoryNavigation from '@/components/CategoryNavigation';
import CategorySection from '@/components/CategorySection';
import MaturityLevelMatrix from '@/components/MaturityLevelMatrix';
import OlimpQuestionnaire from '@/components/OlimpQuestionnaire';
import PrioritySelection from '@/components/PrioritySelection';
import { QuestionnaireData, AnswerData, CategoryProgress, OlimpAnswerData, LetterAnswer } from '@/types/questionnaire';
import { getAllTechnicalNames, getAllDisplayNames, getDisplayName, getTechnicalName } from '@/utils/categoryTranslations';

type WorkflowStage = 'climb2-questionnaire' | 'climb2-goals' | 'climb2-analysis' | 'climb2-results' | 'olimp-questionnaire' | 'olimp-priorities' | 'olimp-analysis' | 'final-reports';

export default function MultiStageWorkflow() {
  // Workflow state
  const [currentStage, setCurrentStage] = useState<WorkflowStage>('climb2-questionnaire');
  const [stageProgress, setStageProgress] = useState({
    'climb2-questionnaire': false,
    'climb2-goals': false,
    'climb2-analysis': false,
    'climb2-results': false,
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
      
      // Step 4: Move to strategic goals stage
      console.log('Moving to strategic goals stage...');
      setStageProgress(prev => ({ ...prev, 'climb2-questionnaire': true }));
      setCurrentStage('climb2-goals');
      
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
      
      console.log('CLIMB2 questionnaire completed, moving to strategic goals');
      
      setStageProgress(prev => ({ ...prev, 'climb2-questionnaire': true }));
      setCurrentStage('climb2-goals');
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

  // Handle CLIMB2 strategic goals completion
  const handleClimb2GoalsComplete = async (goals: Record<string, string>) => {
    try {
      setStrategicGoals(goals);
      
      // Submit strategic goals
      const response = await fetch('/api/set-strategic-goals-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goals }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit strategic goals');
      }
      
      setStageProgress(prev => ({ ...prev, 'climb2-goals': true }));
      setCurrentStage('climb2-analysis');
      
      // Start CLIMB2 analysis with pre-submitted goals
      await startClimb2Analysis(goals);
      
    } catch (err) {
      console.error('Error completing CLIMB2 goals:', err);
      setError('Nie udało się przesłać celów strategicznych. Spróbuj ponownie.');
    }
  };

  // Initialize CLIMB2 progress steps
  const initializeClimb2Progress = () => {
    const steps = [
      {
        id: 'calculate_maturity',
        name: 'Obliczanie Poziomów Dojrzałości',
        description: 'Analiza odpowiedzi kwestionariusza w celu określenia obecnych poziomów dojrzałości',
        status: 'pending' as const,
        progress: 0
      },
      {
        id: 'human_feedback',
        name: 'Przetwarzanie Celów Strategicznych',
        description: 'Przetwarzanie celów strategicznych i planowanie ulepszen',
        status: 'pending' as const,
        progress: 0
      },
      {
        id: 'identify_areas_for_improvement',
        name: 'Identyfikacja Obszarów do Poprawy',
        description: 'Analiza danych w celu identyfikacji kluczowych obszarów wymagających uwagi',
        status: 'pending' as const,
        progress: 0
      },
      {
        id: 'identify_questions_for_improvement',
        name: 'Analiza Kluczowych Pytań',
        description: 'Określanie konkretnych pytań i wyzwań do rozwiązania',
        status: 'pending' as const,
        progress: 0
      },
      {
        id: 'strategic_planning',
        name: 'Planowanie Strategiczne Zakończone',
        description: 'Finalizacja analizy strategicznej i przygotowanie do oceny OLIMP',
        status: 'pending' as const,
        progress: 0
      }
    ];
    setClimb2ProgressSteps(steps);
  };

  // Get overall progress percentage
  const getClimb2OverallProgress = () => {
    if (climb2ProgressSteps.length === 0) return 0;
    
    const totalSteps = climb2ProgressSteps.length;
    const completedSteps = climb2ProgressSteps.filter(step => step.status === 'completed').length;
    const activeStep = climb2ProgressSteps.find(step => step.status === 'active');
    
    let progress = (completedSteps / totalSteps) * 100;
    
    // Add partial progress from active step
    if (activeStep) {
      progress += (activeStep.progress / totalSteps);
    }
    
    return Math.min(100, Math.round(progress));
  };

  // Update progress steps based on backend status
  const updateClimb2ProgressSteps = (currentNode: string, statusData: any) => {
    setClimb2DetailedStatus(statusData);
    
    const nodeProgressMap: { [key: string]: number } = {
      'starting': 2,
      'initializing': 5,
      'calculate_maturity': 20,
      'human_feedback': 40,
      'strategic_planning': 60,
      'identify_areas_for_improvement': 80,
      'identify_questions_for_improvement': 100,
      'completed': 100
    };

    setClimb2ProgressSteps(prev => {
      return prev.map(step => {
        if (currentNode === 'completed' || currentNode === 'strategic_planning') {
          return { ...step, status: 'completed' as const, progress: 100 };
        } else if (currentNode === step.id || 
                   // Handle strategic planning sub-nodes
                   (currentNode === 'identify_areas_for_improvement' && step.id === 'identify_areas_for_improvement') ||
                   (currentNode === 'identify_questions_for_improvement' && step.id === 'identify_questions_for_improvement')) {
          return { 
            ...step, 
            status: 'active' as const, 
            progress: nodeProgressMap[currentNode] || 50 
          };
        } else if ((nodeProgressMap[currentNode] || 0) > (nodeProgressMap[step.id] || 0)) {
          return { ...step, status: 'completed' as const, progress: 100 };
        } else {
          return { ...step, status: 'pending' as const, progress: 0 };
        }
      });
    });
  };

  // Start CLIMB2 analysis
  const startClimb2Analysis = async (preSubmittedGoals?: Record<string, string>) => {
    try {
      setIsRunningAnalysis(true);
      setClimb2Status('starting');
      
      // Initialize progress tracking
      initializeClimb2Progress();
      
      console.log('Sending strategic goals to run-analysis:', preSubmittedGoals);
      const response = await fetch('/api/run-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ strategicGoals: preSubmittedGoals || {} }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start CLIMB2 analysis');
      }
      
      setClimb2Status('running');
      
      // Poll for status with enhanced progress tracking
      const pollStatus = setInterval(async () => {
        try {
          const statusResponse = await fetch('/api/check-analysis-status');
          const statusData = await statusResponse.json();
          
          setClimb2Status(statusData.currentNode);
          updateClimb2ProgressSteps(statusData.currentNode, statusData);
          
          // Check for completion - either 'completed' or 'strategic_planning' (since that's our new end point)
          if (statusData.currentNode === 'completed' || statusData.currentNode === 'strategic_planning') {
            clearInterval(pollStatus);
            setIsRunningAnalysis(false);
            setStageProgress(prev => ({ ...prev, 'climb2-analysis': true }));
            setCurrentStage('olimp-questionnaire'); // Skip climb2-results and go directly to OLIMP
            
            if (statusData.reportPath) {
              setClimb2ReportPath(statusData.reportPath);
            }
          } else if (statusData.currentNode === 'error' || statusData.currentNode === 'stopped') {
            clearInterval(pollStatus);
            setIsRunningAnalysis(false);
            setError('Analiza CLIMB2 nie powiodła się lub została zatrzymana');
          }
        } catch (err) {
          console.error('Error polling CLIMB2 status:', err);
        }
      }, 3000); // Poll every 3 seconds
      
    } catch (err) {
      console.error('Error starting CLIMB2 analysis:', err);
      setError('Nie udało się uruchomić analizy CLIMB2. Spróbuj ponownie.');
      setIsRunningAnalysis(false);
    }
  };

  // Handle CLIMB2 results completion
  const handleClimb2ResultsComplete = () => {
    setStageProgress(prev => ({ ...prev, 'climb2-results': true }));
    setCurrentStage('olimp-questionnaire');
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
      }, 5000); // Poll every 5 seconds
      
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

  const handleBackToClimb2Goals = () => {
    setCurrentStage('climb2-goals');
  };

  const handleBackToClimb2Results = () => {
    setCurrentStage('climb2-results');
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

  // Render appropriate stage
  if (currentStage === 'climb2-goals') {
    const categories = getAllDisplayNames();

    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Ustal Cele Strategiczne</h1>
                <p className="text-gray-600">
                  Na podstawie twoich obecnych poziomów dojrzałości, ustaw strategiczne poziomy celów dla każdej kategorii.
                </p>
              </div>
              <button
                onClick={handleBackToClimb2}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Powrót do Kwestionariusza
              </button>
            </div>
          </header>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <MaturityLevelMatrix 
              categories={getAllTechnicalNames()}
              currentLevels={maturityLevels}
              existingGoals={strategicGoals}
              onSubmit={handleClimb2GoalsComplete}
            />
          </div>
        </div>
      </main>
    );
  }

  if (currentStage === 'climb2-analysis') {
    const overallProgress = getClimb2OverallProgress();
    const activeStep = climb2ProgressSteps.find(step => step.status === 'active');
    const currentStepName = activeStep?.name || 'Processing...';

    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Analiza CLIMB2 w Toku</h1>
            <p className="text-gray-600 mb-6">
              System CLIMB2 generuje wstępne rekomendacje na podstawie oceny dojrzałości i celów strategicznych.
            </p>
          </div>

          {/* Overall Progress */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-gray-900">Postęp Ogólny</h2>
                <span className="text-blue-600 font-medium text-lg">{overallProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-in-out" 
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-gray-700 font-medium">{currentStepName}</p>
              <p className="text-sm text-gray-500 mt-1">
                {climb2DetailedStatus?.requiresInput && climb2DetailedStatus?.requestAllGoals 
                  ? 'Oczekiwanie na wprowadzenie celów strategicznych poniżej...'
                  : activeStep?.description || 'Inicjalizacja analizy...'}
              </p>
            </div>
          </div>

          {/* Detailed Progress Steps */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Kroki Analizy</h2>
            <div className="space-y-4">
              {climb2ProgressSteps.map((step, index) => (
                <div key={step.id} className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      step.status === 'completed' 
                        ? 'bg-green-500 text-white' 
                        : step.status === 'active'
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step.status === 'completed' ? '✓' : index + 1}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className={`font-medium ${
                      step.status === 'active' ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {step.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    {step.status === 'active' && step.progress > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                            style={{ width: `${step.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Strategic Goal Input */}
          {climb2DetailedStatus?.requiresInput && climb2DetailedStatus?.requestAllGoals && climb2DetailedStatus?.allCategories && climb2DetailedStatus?.currentNode !== 'completed' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">Wymagane Cele Strategiczne</h2>
              <p className="text-blue-800 mb-4">
                Analiza wymaga celów strategicznych dla każdej kategorii. Wybierz docelowe poziomy dojrzałości (A-E) gdzie:
              </p>
              <div className="text-sm text-blue-700 mb-4 grid grid-cols-2 gap-2">
                <div>• <strong>A:</strong> Doskonały</div>
                <div>• <strong>B:</strong> Dobry</div>
                <div>• <strong>C:</strong> Średni</div>
                <div>• <strong>D:</strong> Poniżej średniej</div>
                <div>• <strong>E:</strong> Słaby</div>
              </div>
              
              <MaturityLevelMatrix 
                categories={climb2DetailedStatus.allCategories} 
                currentLevels={maturityLevels}
                existingGoals={climb2DetailedStatus.strategicGoals || {}}
                onSubmit={async (goals) => {
                  try {
                    const response = await fetch('/api/set-strategic-goals-all', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ goals }),
                    });
                    
                    if (response.ok) {
                      // Goals submitted successfully, polling will pick up the change
                      console.log('Strategic goals submitted successfully');
                    } else {
                      setError('Nie udało się przesłać celów strategicznych');
                    }
                  } catch (error) {
                    console.error('Error submitting strategic goals:', error);
                    setError('Błąd podczas przesyłania celów strategicznych');
                  }
                }}
              />
            </div>
          )}

          {/* Strategic Goals Display */}
          {climb2DetailedStatus?.strategicGoals && Object.keys(climb2DetailedStatus.strategicGoals).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktywne Cele Strategiczne</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(climb2DetailedStatus.strategicGoals).map(([category, goalLevel]) => (
                  <div key={category} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <span className="inline-flex items-center justify-center w-6 h-6 mr-2 bg-gray-400 text-white rounded-full text-xs font-bold">
                      {maturityLevels[category] || 'A'}
                    </span>
                    <svg className="h-4 w-4 text-gray-500 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="inline-flex items-center justify-center w-6 h-6 ml-1 mr-2 bg-blue-600 text-white rounded-full text-xs font-bold">
                      {String(goalLevel)}
                    </span>
                    <span className="text-sm text-gray-700 truncate">{category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completion Message */}
          {climb2ReportPath && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">Analiza CLIMB2 Zakończona!</h3>
              <p className="text-green-700 mb-4">
                Twoja wstępna ocena jest gotowa. Teraz przejdziesz do szczegółowego kwestionariusza OLIMP w celu kompleksowej analizy.
              </p>
              <div className="animate-pulse">
                <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-bounce"></div>
                  Przygotowywanie Oceny OLIMP...
                </div>
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="text-center mt-8">
            <button
              onClick={handleBackToClimb2Goals}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Powrót do Celów Strategicznych
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (currentStage === 'climb2-results') {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Analiza CLIMB2 Zakończona!</h1>
            <div className="flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-6">
              Twoja wstępna ocena gotowości na AI została pomyślnie zakończona. Przejrzyj wyniki poniżej i kontynuuj do szczegółowej oceny OLIMP.
            </p>
          </div>

          {/* Report Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Raport CLIMB2</h2>
            {climb2ReportPath ? (
              <div className="mb-4">
                <p className="text-gray-600 mb-4">
                  Twój raport CLIMB2 zawiera wstępne rekomendacje oparte na ocenie dojrzałości i celach strategicznych.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={`/report?path=${encodeURIComponent(climb2ReportPath)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Zobacz Raport CLIMB2
                  </a>
                  <a
                    href={`/report?path=${encodeURIComponent(climb2ReportPath)}&download=true`}
                    className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Pobierz Raport
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 19c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-yellow-800">Raport jest generowany. Poczekaj chwilę i odśwież jeśli to konieczne.</span>
                </div>
              </div>
            )}
          </div>

          {/* Strategic Goals Summary */}
          {strategicGoals && Object.keys(strategicGoals).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Twoje Cele Strategiczne</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(strategicGoals).map(([category, goalLevel]) => (
                  <div key={category} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <span className="inline-flex items-center justify-center w-6 h-6 mr-2 bg-gray-400 text-white rounded-full text-xs font-bold">
                      {maturityLevels[category] || 'A'}
                    </span>
                    <svg className="h-4 w-4 text-gray-500 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="inline-flex items-center justify-center w-6 h-6 ml-1 mr-2 bg-blue-600 text-white rounded-full text-xs font-bold">
                      {String(goalLevel)}
                    </span>
                    <span className="text-sm text-gray-700 truncate">{category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">Następne Kroki</h2>
            <p className="text-blue-800 mb-4">
              Teraz, gdy masz wstępną ocenę CLIMB2, przejdź do szczegółowego kwestionariusza OLIMP w celu kompleksowej analizy z konkretnou identyfikacją luk i rekomendacjami wdrożenia.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleClimb2ResultsComplete}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Kontynuuj do Oceny OLIMP
              </button>
              <button
                onClick={() => setCurrentStage('climb2-analysis')}
                className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Powrót do Analizy
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (currentStage === 'olimp-questionnaire') {
    return <OlimpQuestionnaire onComplete={handleOlimpComplete} onBack={handleBackToClimb2Results} />;
  }

  if (currentStage === 'olimp-priorities') {
    return <PrioritySelection onComplete={handlePriorityComplete} onBack={handleBackToOlimp} />;
  }

  if (currentStage === 'olimp-analysis') {
    const getStepDisplayName = (step: string) => {
      const stepMap: { [key: string]: string } = {
        'setup': 'Inicjalizacja Analizy',
        'processing': 'Analiza Luk',
        'extract_answers': 'Wyodrębnianie Odpowiedzi',
        'identify_gaps': 'Identyfikacja Luk',
        'parallel_recommendations': 'Równoległe Rekomendacje',
        'evaluation': 'Równoległe Rekomendacje',
        'evaluation_branches': 'Analiza Wielogałęziowa',
        'recommend': 'Generowanie Rekomendacji',
        'recommend_branches': 'Rekomendacje Gałęzi',
        'consensus': 'Budowanie Konsensusu',
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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Analiza OLIMP w Toku</h1>
            <p className="text-gray-600 mb-6">
              System OLIMP przeprowadza kompleksową analizę luk i generuje szczegółowe rekomendacje.
            </p>
          </div>

          {/* Progress Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Postęp Ogólny</h2>
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
                <p className="text-sm text-gray-600">Postęp Kroków</p>
                <p className="font-medium text-gray-900">
                  {olimpProgress && olimpProgress.stepsCompleted && olimpProgress.totalSteps ? 
                    `${olimpProgress.stepsCompleted}/${olimpProgress.totalSteps}` : 
                    (analysisStatus === 'running' ? 'W Toku' : '0/8')}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Upłynął Czas</p>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Rurociąg Analizy</h2>
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
                              <span className="ml-1 text-xs font-medium">Intensywne Przetwarzanie...</span>
                            </span>
                          )}
                        </p>
                        {isGenerating && step === 'generating_final_report' && (
                          <p className="text-xs text-orange-700 mt-1">
                            Kompilowanie kompleksowego raportu ze wszystkimi danymi analizy...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Special notice for final report generation */}
            {olimpProgress?.currentStep === 'generating_final_report' && olimpProgress?.stepStatus === 'generating' && (
              <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <svg className="animate-spin h-5 w-5 text-orange-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <h3 className="font-semibold text-orange-900">Generowanie Raportu Końcowego w Toku</h3>
                </div>
                <p className="text-sm text-orange-800">
                  System kompiluje wszystkie dane analizy w kompleksowy raport końcowy. Ten proces obejmuje konsolidację spostrzezeń z wielu perspektyw ekspertów AI i może potrwać kilka minut.
                </p>
                <div className="mt-3 flex items-center text-xs text-orange-700">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="ml-2 font-medium">Przetwarzanie intensywnej analizy...</span>
                </div>
              </div>
            )}
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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Analiza Zakończona!</h1>
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              <strong className="font-bold">Sukces!</strong>
              <span className="block sm:inline"> Twoja kompleksowa analiza gotowości na AI została zakończona.</span>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Dostępne Raporty</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {climb2ReportPath && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Raport CLIMB2</h3>
                    <p className="text-sm text-gray-600 mb-3">Wstępna ocena dojrzałości i rekomendacje strategiczne</p>
                    <a
                      href={`/report?path=${encodeURIComponent(climb2ReportPath)}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 text-sm"
                    >
                      Zobacz Raport CLIMB2
                    </a>
                  </div>
                )}
                
                {reportPath && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Raport Końcowy OLIMP</h3>
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
            </div>

            <button
              onClick={() => {
                setCurrentStage('climb2-questionnaire');
                setStageProgress({
                  'climb2-questionnaire': false,
                  'climb2-goals': false,
                  'climb2-analysis': false,
                  'climb2-results': false,
                  'olimp-questionnaire': false,
                  'olimp-priorities': false,
                  'olimp-analysis': false,
                  'final-reports': false
                });
              }}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
            >
              Rozpocznij Nową Analizę
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Ocena Gotowości na AI</h1>
              <p className="text-gray-600">
                Uzupełnij tę wieloetapową ocenę, aby otrzymać kompleksowe rekomendacje gotowości na AI.
              </p>
              
              {/* Progress indicator */}
              <div className="mt-4 flex items-center space-x-2 text-xs">
                <div className={`flex items-center ${stageProgress['climb2-questionnaire'] ? 'text-green-600' : 'text-blue-600'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${stageProgress['climb2-questionnaire'] ? 'bg-green-600' : 'bg-blue-600'}`}></div>
                  <span className="font-medium">1. Kwestionariusz CLIMB2</span>
                </div>
                <div className={`flex items-center ${stageProgress['climb2-goals'] ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${stageProgress['climb2-goals'] ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                  <span>2. Cele Strategiczne</span>
                </div>
                <div className={`flex items-center ${stageProgress['climb2-analysis'] ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${stageProgress['climb2-analysis'] ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                  <span>3. Analiza CLIMB2</span>
                </div>
                <div className={`flex items-center ${stageProgress['climb2-results'] ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${stageProgress['climb2-results'] ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                  <span>4. Wyniki CLIMB2</span>
                </div>
                <div className={`flex items-center ${stageProgress['olimp-questionnaire'] ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${stageProgress['olimp-questionnaire'] ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                  <span>5. Ocena OLIMP</span>
                </div>
                <div className={`flex items-center ${stageProgress['olimp-priorities'] ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${stageProgress['olimp-priorities'] ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                  <span>6. Priorytety</span>
                </div>
                <div className={`flex items-center ${stageProgress['olimp-analysis'] ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${stageProgress['olimp-analysis'] ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                  <span>7. Analiza Końcowa</span>
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
                  ? 'Analizowanie...' 
                  : sampleAnswersLoaded 
                    ? 'Analiza Przykładowych Danych Zakończona' 
                    : 'Analizuj Przykładowe Dane'}
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
                  {isSubmitting ? 'Przetwarzanie...' : 'Kontynuuj do Celów Strategicznych'}
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
