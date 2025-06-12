'use client';

import React, { useState, useEffect } from 'react';
import CategoryNavigation from '@/components/CategoryNavigation';
import CategorySection from '@/components/CategorySection';
import MaturityLevelMatrix from '@/components/MaturityLevelMatrix';
import OlimpQuestionnaire from '@/components/OlimpQuestionnaire';
import PrioritySelection from '@/components/PrioritySelection';
import { QuestionnaireData, AnswerData, CategoryProgress, OlimpAnswerData, LetterAnswer } from '@/types/questionnaire';

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
        setError('Failed to load questionnaire. Please try again later.');
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
      setError(err instanceof Error ? err.message : 'Failed to analyze sample data. Please try again.');
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
        if (!confirm('Not all questions have been answered. Do you want to continue anyway?')) {
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
        throw new Error(`Failed to submit questionnaire: ${errorData.error || response.statusText}`);
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
      setError(err instanceof Error ? err.message : 'Failed to submit questionnaire. Please try again.');
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
      setError('Failed to submit strategic goals. Please try again.');
    }
  };

  // Initialize CLIMB2 progress steps
  const initializeClimb2Progress = () => {
    const steps = [
      {
        id: 'calculate_maturity',
        name: 'Calculate Maturity Levels',
        description: 'Analyzing questionnaire responses to determine current maturity levels',
        status: 'pending' as const,
        progress: 0
      },
      {
        id: 'human_feedback',
        name: 'Strategic Goal Processing',
        description: 'Processing strategic goals and planning improvements',
        status: 'pending' as const,
        progress: 0
      },
      {
        id: 'identify_areas_for_improvement',
        name: 'Identify Improvement Areas',
        description: 'Analyzing data to identify key areas needing attention',
        status: 'pending' as const,
        progress: 0
      },
      {
        id: 'identify_questions_for_improvement',
        name: 'Analyze Key Questions',
        description: 'Determining specific questions and challenges to address',
        status: 'pending' as const,
        progress: 0
      },
      {
        id: 'create_analysts',
        name: 'Create Expert Analysts',
        description: 'Generating specialized analyst profiles for evaluation',
        status: 'pending' as const,
        progress: 0
      },
      {
        id: 'diagnose',
        name: 'Diagnose Issues',
        description: 'Identifying key challenges and improvement areas',
        status: 'pending' as const,
        progress: 0
      },
      {
        id: 'recommend',
        name: 'Generate Recommendations',
        description: 'Creating actionable recommendations and strategies',
        status: 'pending' as const,
        progress: 0
      },
      {
        id: 'write_report',
        name: 'Write Final Report',
        description: 'Compiling comprehensive analysis report',
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
      'calculate_maturity': 15,
      'human_feedback': 25,
      'strategic_planning': 30,
      'identify_areas_for_improvement': 35,
      'identify_questions_for_improvement': 40,
      'create_analysts': 45,
      'make_analysts': 45,
      'consulting': 60,
      'diagnose': 70,
      'recommend': 85,
      'write_report': 95,
      'completed': 100
    };

    setClimb2ProgressSteps(prev => {
      return prev.map(step => {
        if (currentNode === 'completed') {
          return { ...step, status: 'completed' as const, progress: 100 };
        } else if (currentNode === step.id || 
                   // Handle node aliases
                   (currentNode === 'make_analysts' && step.id === 'create_analysts') ||
                   (currentNode === 'consulting' && step.id === 'diagnose')) {
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
          
          if (statusData.currentNode === 'completed') {
            clearInterval(pollStatus);
            setIsRunningAnalysis(false);
            setStageProgress(prev => ({ ...prev, 'climb2-analysis': true }));
            setCurrentStage('climb2-results');
            
            if (statusData.reportPath) {
              setClimb2ReportPath(statusData.reportPath);
            }
          } else if (statusData.currentNode === 'error' || statusData.currentNode === 'stopped') {
            clearInterval(pollStatus);
            setIsRunningAnalysis(false);
            setError('CLIMB2 analysis failed or was stopped');
          }
        } catch (err) {
          console.error('Error polling CLIMB2 status:', err);
        }
      }, 3000); // Poll every 3 seconds
      
    } catch (err) {
      console.error('Error starting CLIMB2 analysis:', err);
      setError('Failed to start CLIMB2 analysis. Please try again.');
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
      setError('Failed to submit OLIMP answers. Please try again.');
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
      setError('Failed to compute gaps. Please try again.');
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
              setError(`OLIMP analysis failed: ${statusData.progress.error}`);
            } else {
              setError('OLIMP analysis failed or was stopped');
            }
          }
        } catch (err) {
          console.error('Error polling OLIMP status:', err);
        }
      }, 5000); // Poll every 5 seconds
      
    } catch (err) {
      console.error('Error starting OLIMP analysis:', err);
      setError('Failed to start OLIMP analysis. Please try again.');
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
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <button 
            onClick={() => setError(null)}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render appropriate stage
  if (currentStage === 'climb2-goals') {
    const categories = [
      "Roles and Collaboration",
      "Training", 
      "Activities and Flow",
      "Decision-Making",
      "KM Processes",
      "KM Techniques",
      "Methods",
      "Computerization and Software"
    ];

    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Set Strategic Goals</h1>
                <p className="text-gray-600">
                  Based on your current maturity levels, please set strategic goal levels for each category.
                </p>
              </div>
              <button
                onClick={handleBackToClimb2}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Back to Questionnaire
              </button>
            </div>
          </header>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <MaturityLevelMatrix 
              categories={categories}
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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">CLIMB2 Analysis Running</h1>
            <p className="text-gray-600 mb-6">
              The CLIMB2 system is generating your preliminary recommendations based on your maturity assessment and strategic goals.
            </p>
          </div>

          {/* Overall Progress */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-gray-900">Overall Progress</h2>
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
                  ? 'Waiting for strategic goals input below...'
                  : activeStep?.description || 'Initializing analysis...'}
              </p>
            </div>
          </div>

          {/* Detailed Progress Steps */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Steps</h2>
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
              <h2 className="text-lg font-semibold text-blue-900 mb-4">Strategic Goals Required</h2>
              <p className="text-blue-800 mb-4">
                The analysis needs strategic goals for each category. Please select target maturity levels (A-E) where:
              </p>
              <div className="text-sm text-blue-700 mb-4 grid grid-cols-2 gap-2">
                <div>• <strong>A:</strong> Excellent</div>
                <div>• <strong>B:</strong> Good</div>
                <div>• <strong>C:</strong> Average</div>
                <div>• <strong>D:</strong> Below Average</div>
                <div>• <strong>E:</strong> Poor</div>
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
                      setError('Failed to submit strategic goals');
                    }
                  } catch (error) {
                    console.error('Error submitting strategic goals:', error);
                    setError('Error submitting strategic goals');
                  }
                }}
              />
            </div>
          )}

          {/* Strategic Goals Display */}
          {climb2DetailedStatus?.strategicGoals && Object.keys(climb2DetailedStatus.strategicGoals).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Strategic Goals</h2>
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
              <h3 className="text-lg font-semibold text-green-900 mb-2">CLIMB2 Analysis Complete!</h3>
              <p className="text-green-700 mb-4">
                Your preliminary assessment is ready. You'll now proceed to the detailed OLIMP questionnaire for comprehensive analysis.
              </p>
              <div className="animate-pulse">
                <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-bounce"></div>
                  Preparing OLIMP Assessment...
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
              ← Back to Strategic Goals
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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">CLIMB2 Analysis Complete!</h1>
            <div className="flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-6">
              Your preliminary AI readiness assessment has been completed successfully. Review your results below and continue to the detailed OLIMP assessment.
            </p>
          </div>

          {/* Report Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">CLIMB2 Report</h2>
            {climb2ReportPath ? (
              <div className="mb-4">
                <p className="text-gray-600 mb-4">
                  Your CLIMB2 report contains preliminary recommendations based on your maturity assessment and strategic goals.
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
                    View CLIMB2 Report
                  </a>
                  <a
                    href={`/report?path=${encodeURIComponent(climb2ReportPath)}&download=true`}
                    className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Report
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 19c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-yellow-800">Report is being generated. Please wait a moment and refresh if needed.</span>
                </div>
              </div>
            )}
          </div>

          {/* Strategic Goals Summary */}
          {strategicGoals && Object.keys(strategicGoals).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Strategic Goals</h2>
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
            <h2 className="text-lg font-semibold text-blue-900 mb-3">Next Steps</h2>
            <p className="text-blue-800 mb-4">
              Now that you have your preliminary CLIMB2 assessment, proceed to the detailed OLIMP questionnaire for a comprehensive analysis with specific gap identification and implementation recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleClimb2ResultsComplete}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Continue to OLIMP Assessment
              </button>
              <button
                onClick={() => setCurrentStage('climb2-analysis')}
                className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back to Analysis
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
        'setup': 'Initializing Analysis',
        'processing': 'Gap Analysis',
        'extract_answers': 'Extracting Responses',
        'identify_gaps': 'Identifying Gaps',
        'evaluation': 'Parallel Recommendations',
        'evaluation_branches': 'Multi-Branch Analysis',
        'recommend': 'Generating Recommendations',
        'recommend_branches': 'Branch Recommendations',
        'consensus': 'Consensus Building',
        'completed': 'Analysis Complete'
      };
      return stepMap[step] || step;
    };

    const getProgressPercentage = () => {
      if (!olimpProgress) return 0;
      if (olimpProgress.stepsCompleted && olimpProgress.totalSteps) {
        return Math.round((olimpProgress.stepsCompleted / olimpProgress.totalSteps) * 100);
      }
      // Fallback to basic progress if available
      if (olimpProgress.percentage) {
        return olimpProgress.percentage;
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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">OLIMP Analysis Running</h1>
            <p className="text-gray-600 mb-6">
              The OLIMP system is performing comprehensive gap analysis and generating detailed recommendations.
            </p>
          </div>

          {/* Progress Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Overall Progress</h2>
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
                <p className="text-sm text-gray-600">Current Step</p>
                <p className="font-medium text-gray-900">
                  {olimpProgress ? 
                    (olimpProgress.currentStep ? getStepDisplayName(olimpProgress.currentStep) : 
                     olimpProgress.step || 'Processing analysis...') : 
                    'Initializing...'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Steps Progress</p>
                <p className="font-medium text-gray-900">
                  {olimpProgress && olimpProgress.stepsCompleted && olimpProgress.totalSteps ? 
                    `${olimpProgress.stepsCompleted}/${olimpProgress.totalSteps}` : 
                    (analysisStatus === 'running' ? 'In Progress' : '0/7')}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Elapsed Time</p>
                <p className="font-medium text-gray-900">
                  {olimpProgress && olimpProgress.elapsedTime ? 
                    formatElapsedTime(olimpProgress.elapsedTime) : 
                    (analysisStatus === 'running' ? 'Running...' : '0s')}
                </p>
              </div>
            </div>
          </div>

          {/* Branch Analysis Progress */}
          {olimpProgress?.branches && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Multi-Branch Analysis</h2>
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
                          {branchData.status === 'skipped' ? 'Skipped' : `${branchData.iterations}/${branchData.max_iterations} iterations`}
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Pipeline</h2>
            <div className="space-y-3">
              {['setup', 'extract_answers', 'identify_gaps', 'evaluation', 'recommend', 'consensus', 'completed'].map((step, index) => {
                const isCompleted = olimpProgress && olimpProgress.stepsCompleted ? olimpProgress.stepsCompleted > index : false;
                const isActive = olimpProgress && olimpProgress.currentStep === step;
                
                return (
                  <div key={step} className="flex items-center">
                    <div className="flex-shrink-0 mr-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isActive
                            ? 'bg-blue-600 text-white animate-pulse'
                            : 'bg-gray-200 text-gray-600'
                      }`}>
                        {isCompleted ? '✓' : index + 1}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <p className={`font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                        {getStepDisplayName(step)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Display */}
          {analysisStatus === 'error' && olimpProgress?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-red-900 mb-3">Analysis Error</h2>
              <p className="text-red-800 text-sm mb-4">{olimpProgress.error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Restart Analysis
              </button>
            </div>
          )}

          {/* Back Navigation */}
          <div className="text-center">
            <button
              onClick={() => setCurrentStage('olimp-priorities')}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Priority Selection
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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Analysis Complete!</h1>
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              <strong className="font-bold">Success!</strong>
              <span className="block sm:inline"> Your comprehensive AI readiness analysis has been completed.</span>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Available Reports</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {climb2ReportPath && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">CLIMB2 Report</h3>
                    <p className="text-sm text-gray-600 mb-3">Preliminary maturity assessment and strategic recommendations</p>
                    <a
                      href={`/report?path=${encodeURIComponent(climb2ReportPath)}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 text-sm"
                    >
                      View CLIMB2 Report
                    </a>
                  </div>
                )}
                
                {reportPath && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">OLIMP Final Report</h3>
                    <p className="text-sm text-gray-600 mb-3">Comprehensive AI readiness analysis with gap analysis and implementation roadmap</p>
                    <a
                      href={`/report?path=${encodeURIComponent(reportPath)}`}
                      className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 text-sm"
                    >
                      View Final Report
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
              Start New Analysis
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Readiness Assessment</h1>
              <p className="text-gray-600">
                Complete this multi-stage assessment to receive comprehensive AI readiness recommendations.
              </p>
              
              {/* Progress indicator */}
              <div className="mt-4 flex items-center space-x-2 text-xs">
                <div className={`flex items-center ${stageProgress['climb2-questionnaire'] ? 'text-green-600' : 'text-blue-600'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${stageProgress['climb2-questionnaire'] ? 'bg-green-600' : 'bg-blue-600'}`}></div>
                  <span className="font-medium">1. CLIMB2 Questionnaire</span>
                </div>
                <div className={`flex items-center ${stageProgress['climb2-goals'] ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${stageProgress['climb2-goals'] ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                  <span>2. Strategic Goals</span>
                </div>
                <div className={`flex items-center ${stageProgress['climb2-analysis'] ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${stageProgress['climb2-analysis'] ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                  <span>3. CLIMB2 Analysis</span>
                </div>
                <div className={`flex items-center ${stageProgress['climb2-results'] ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${stageProgress['climb2-results'] ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                  <span>4. CLIMB2 Results</span>
                </div>
                <div className={`flex items-center ${stageProgress['olimp-questionnaire'] ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${stageProgress['olimp-questionnaire'] ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                  <span>5. OLIMP Assessment</span>
                </div>
                <div className={`flex items-center ${stageProgress['olimp-priorities'] ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${stageProgress['olimp-priorities'] ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                  <span>6. Priorities</span>
                </div>
                <div className={`flex items-center ${stageProgress['olimp-analysis'] ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${stageProgress['olimp-analysis'] ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                  <span>7. Final Analysis</span>
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
                  ? 'Analyzing...' 
                  : sampleAnswersLoaded 
                    ? 'Sample Analysis Complete' 
                    : 'Analyze Sample Data'}
              </button>
            </div>
          </div>
        </header>

        {questionnaireData && (
          <>
            <CategoryNavigation
              categories={categories}
              activeCategory={activeCategory}
              progress={progress}
              onCategoryChange={handleCategoryChange}
            />

            {activeCategory && (
              <CategorySection
                categoryName={activeCategory}
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
                Previous Section
              </button>
              
              {categories.indexOf(activeCategory) < categories.length - 1 ? (
                <button
                  onClick={handleNextCategory}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
                >
                  Next Section
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
                  {isSubmitting ? 'Processing...' : 'Continue to Strategic Goals'}
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
                  ? 'CLIMB2 questionnaire completed! Moving to strategic goals...'
                  : 'Failed to submit questionnaire. Please try again.'}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}