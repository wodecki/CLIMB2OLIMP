'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CategoryNavigation from '@/components/CategoryNavigation';
import CategorySection from '@/components/CategorySection';
import { QuestionnaireData, AnswerData, CategoryProgress } from '@/types/questionnaire';

export default function Home() {
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
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [reportPath, setReportPath] = useState<string | null>(null);

  // Fetch questionnaire data
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
    // Scroll to top when changing categories
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load sample answers
  const [sampleAnswersLoaded, setSampleAnswersLoaded] = useState(false);
  
  const handleLoadSampleAnswers = async () => {
    try {
      setIsLoadingSampleAnswers(true);
      
      const response = await fetch('/api/sample-answers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch sample answers');
      }
      
      const sampleAnswers: AnswerData = await response.json();
      setAnswerData(sampleAnswers);
      
      // Update progress after loading sample answers
      if (questionnaireData) {
        const newProgress: CategoryProgress = {};
        
        Object.keys(questionnaireData).forEach(category => {
          const totalQuestions = Object.keys(questionnaireData[category]).length;
          const answeredQuestions = Object.keys(sampleAnswers[category] || {}).length;
          
          newProgress[category] = {
            total: totalQuestions,
            answered: answeredQuestions
          };
        });
        
        setProgress(newProgress);
      }
      
      // Show success message
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(null);
      }, 3000);
      
      // Mark sample answers as loaded
      setSampleAnswersLoaded(true);
      
    } catch (err) {
      console.error('Error loading sample answers:', err);
      setError('Failed to load sample answers. Please try again later.');
    } finally {
      setIsLoadingSampleAnswers(false);
    }
  };

  // Run backend analysis
  const handleRunAnalysis = async () => {
    try {
      setIsRunningAnalysis(true);
      
      const response = await fetch('/api/run-analysis', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to run analysis');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Redirect to the status page
        window.location.href = '/status';
      } else if (result.redirect) {
        // Analysis is already running, redirect to the status page
        window.location.href = result.redirect;
      } else {
        throw new Error(result.message || result.error || 'Unknown error occurred');
      }
      
    } catch (err) {
      console.error('Error running analysis:', err);
      setError('Failed to run analysis. Please try again later.');
      setIsRunningAnalysis(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Check if all questions are answered
      const totalQuestions = Object.values(progress).reduce((sum, cat) => sum + cat.total, 0);
      const answeredQuestions = Object.values(progress).reduce((sum, cat) => sum + cat.answered, 0);
      
      if (answeredQuestions < totalQuestions) {
        if (!confirm('Not all questions have been answered. Do you want to submit anyway?')) {
          setIsSubmitting(false);
          return;
        }
      }
      
      const response = await fetch('/api/questionnaire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answerData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit questionnaire');
      }
      
      setSubmitSuccess(true);
      
      // Show success message for 3 seconds
      setTimeout(() => {
        setSubmitSuccess(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error submitting questionnaire:', err);
      setSubmitSuccess(false);
      
      // Show error message for 3 seconds
      setTimeout(() => {
        setSubmitSuccess(null);
      }, 3000);
    } finally {
      setIsSubmitting(false);
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
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Questionnaire</h1>
              <p className="text-gray-600">
                Fill out this questionnaire to receive a detailed analysis and recommendations for your managerial challenges.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleLoadSampleAnswers}
                disabled={isLoadingSampleAnswers || sampleAnswersLoaded}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  isLoadingSampleAnswers || sampleAnswersLoaded
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isLoadingSampleAnswers 
                  ? 'Loading...' 
                  : sampleAnswersLoaded 
                    ? 'Sample Answers Loaded' 
                    : 'Use Sample Answers'}
              </button>
              
              <button
                onClick={async () => {
                  // If we have answers (either from the user or sample answers), submit them first
                  if (Object.values(progress).some(cat => cat.answered > 0) && !submitSuccess) {
                    await handleSubmit();
                  }
                  
                  // Run analysis immediately
                  handleRunAnalysis();
                }}
                disabled={isSubmitting || isRunningAnalysis || (!submitSuccess && Object.values(progress).every(cat => cat.answered === 0))}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  isSubmitting || isRunningAnalysis
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : sampleAnswersLoaded || (Object.values(progress).reduce((sum, cat) => sum + cat.answered, 0) === Object.values(progress).reduce((sum, cat) => sum + cat.total, 0) && Object.values(progress).reduce((sum, cat) => sum + cat.total, 0) > 0)
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-400 text-white cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Submitting...' : isRunningAnalysis ? 'Running Analysis...' : 'Analyze'}
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
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`px-6 py-2 rounded-md font-medium ${
                    isSubmitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : sampleAnswersLoaded || (Object.values(progress).reduce((sum, cat) => sum + cat.answered, 0) === Object.values(progress).reduce((sum, cat) => sum + cat.total, 0) && Object.values(progress).reduce((sum, cat) => sum + cat.total, 0) > 0)
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-400 text-white cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Analyze'}
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
                  ? 'Questionnaire submitted successfully!'
                  : 'Failed to submit questionnaire. Please try again.'}
              </div>
            )}

            {submitSuccess === true && (
              <div className="fixed bottom-4 left-4 p-4 bg-white rounded-lg shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-2">Next Steps</h3>
                <p className="text-gray-700 mb-3">
                  Your answers have been saved. You can now run the backend analysis to generate a detailed report.
                </p>
                <button
                  onClick={handleRunAnalysis}
                  disabled={isRunningAnalysis}
                  className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                    isRunningAnalysis
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : sampleAnswersLoaded || (Object.values(progress).reduce((sum, cat) => sum + cat.answered, 0) === Object.values(progress).reduce((sum, cat) => sum + cat.total, 0) && Object.values(progress).reduce((sum, cat) => sum + cat.total, 0) > 0)
                        ? 'bg-green-600 text-white hover:bg-blue-700'
                        : 'bg-gray-400 text-white cursor-not-allowed'
                  }`}
                >
                  {isRunningAnalysis ? 'Starting Analysis...' : 'Analyze'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
