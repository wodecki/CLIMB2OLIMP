'use client';

import React, { useState, useEffect } from 'react';
import { OlimpQuestionnaireData, OlimpAnswerData, OlimpSection, OlimpQuestion, CategoryProgress } from '@/types/questionnaire';

interface OlimpQuestionnaireProps {
  onComplete: (answers: OlimpAnswerData) => void;
  onBack: () => void;
}

export default function OlimpQuestionnaire({ onComplete, onBack }: OlimpQuestionnaireProps) {
  const [questionnaireData, setQuestionnaireData] = useState<OlimpQuestionnaireData | null>(null);
  const [answerData, setAnswerData] = useState<OlimpAnswerData | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [progress, setProgress] = useState<CategoryProgress>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingSampleData, setIsLoadingSampleData] = useState(false);
  const [sampleDataLoaded, setSampleDataLoaded] = useState(false);

  // Fetch OLIMP questionnaire data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/olimp-questionnaire');
        
        if (!response.ok) {
          throw new Error('Failed to fetch OLIMP questionnaire data');
        }
        
        const data: OlimpQuestionnaireData = await response.json();
        setQuestionnaireData(data);
        
        // Initialize answer data structure
        const initialAnswerData: OlimpAnswerData = {
          questionnaire: data.questionnaire,
          questionnaire_title: data.questionnaire_title,
          sections: data.sections.map(section => ({
            ...section,
            questions: section.questions.map(question => ({
              ...question,
              selected_answer: undefined
            }))
          }))
        };
        setAnswerData(initialAnswerData);
        
        // Set first section as active
        if (data.sections.length > 0) {
          setActiveSection(data.sections[0].section_name);
        }
        
        // Initialize progress tracking
        const initialProgress: CategoryProgress = {};
        data.sections.forEach(section => {
          initialProgress[section.section_name] = {
            total: section.questions.length,
            answered: 0
          };
        });
        setProgress(initialProgress);
        
      } catch (err) {
        console.error('Error fetching OLIMP questionnaire data:', err);
        setError('Nie udało się załadować kwestionariusza OLIMP. Spróbuj ponownie później.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update progress when answers change
  useEffect(() => {
    if (!answerData) return;
    
    const newProgress: CategoryProgress = {};
    
    answerData.sections.forEach(section => {
      const answeredQuestions = section.questions.filter(q => q.selected_answer).length;
      
      newProgress[section.section_name] = {
        total: section.questions.length,
        answered: answeredQuestions
      };
    });
    
    setProgress(newProgress);
  }, [answerData]);

  // Handle answer selection
  const handleAnswerSelected = (sectionName: string, questionIndex: number, answer: string) => {
    if (!answerData) return;

    const updatedAnswerData = { ...answerData };
    const sectionIndex = updatedAnswerData.sections.findIndex(s => s.section_name === sectionName);
    
    if (sectionIndex !== -1) {
      updatedAnswerData.sections[sectionIndex].questions[questionIndex].selected_answer = answer;
      setAnswerData(updatedAnswerData);
    }
  };

  // Handle section change
  const handleSectionChange = (sectionName: string) => {
    setActiveSection(sectionName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to next section
  const handleNextSection = () => {
    if (!questionnaireData) return;
    
    const currentIndex = questionnaireData.sections.findIndex(s => s.section_name === activeSection);
    if (currentIndex < questionnaireData.sections.length - 1) {
      setActiveSection(questionnaireData.sections[currentIndex + 1].section_name);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Navigate to previous section
  const handlePrevSection = () => {
    if (!questionnaireData) return;
    
    const currentIndex = questionnaireData.sections.findIndex(s => s.section_name === activeSection);
    if (currentIndex > 0) {
      setActiveSection(questionnaireData.sections[currentIndex - 1].section_name);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate random sample data
  const generateSampleData = () => {
    if (!questionnaireData) return null;

    const sampleAnswerData: OlimpAnswerData = {
      questionnaire: questionnaireData.questionnaire,
      questionnaire_title: questionnaireData.questionnaire_title,
      sections: questionnaireData.sections.map(section => ({
        ...section,
        questions: section.questions.map(question => {
          // Generate random answer from A-E
          const answerOptions = Object.keys(question.answer_options);
          const randomAnswer = answerOptions[Math.floor(Math.random() * answerOptions.length)];
          
          return {
            ...question,
            selected_answer: randomAnswer
          };
        })
      }))
    };

    return sampleAnswerData;
  };

  // Analyze sample data (load data and complete questionnaire)
  const handleAnalyzeSampleData = async () => {
    try {
      setIsLoadingSampleData(true);
      console.log('Loading sample data and completing OLIMP questionnaire...');
      
      // Step 1: Generate sample data
      const sampleData = generateSampleData();
      if (sampleData) {
        setAnswerData(sampleData);
        setSampleDataLoaded(true);
        
        // Step 2: Complete the questionnaire automatically
        console.log('Auto-completing OLIMP questionnaire with sample data...');
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Complete the questionnaire
        onComplete(sampleData);
      }
    } catch (err) {
      console.error('Error analyzing sample data:', err);
      setError('Nie udało się przeanalizować przykładowych danych. Spróbuj ponownie.');
    } finally {
      setIsLoadingSampleData(false);
    }
  };

  // Handle completion
  const handleComplete = () => {
    if (!answerData) return;
    
    // Check if all questions are answered
    const totalQuestions = Object.values(progress).reduce((sum, cat) => sum + cat.total, 0);
    const answeredQuestions = Object.values(progress).reduce((sum, cat) => sum + cat.answered, 0);
    
    if (answeredQuestions < totalQuestions) {
      if (!confirm('Nie wszystkie pytania OLIMP zostały udzielone. Czy chcesz kontynuować mimo to?')) {
        return;
      }
    }
    
    onComplete(answerData);
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
        </div>
      </div>
    );
  }

  if (!questionnaireData || !answerData) return null;

  const activeSecti = questionnaireData.sections.find(s => s.section_name === activeSection);
  const activeSectionIndex = questionnaireData.sections.findIndex(s => s.section_name === activeSection);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Kwestionariusz OLIMP</h1>
              <p className="text-gray-600">
                {questionnaireData.questionnaire_title}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleAnalyzeSampleData}
                disabled={isLoadingSampleData || sampleDataLoaded}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  isLoadingSampleData || sampleDataLoaded
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {isLoadingSampleData 
                  ? 'Analizowanie...' 
                  : sampleDataLoaded 
                    ? 'Analiza Przykładowych Danych Zakończona' 
                    : 'Analizuj Przykładowe Dane'}
              </button>
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700"
              >
                Powrót do CLIMB2
              </button>
            </div>
          </div>
        </header>

        {/* Section Navigation */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {questionnaireData.sections.map((section) => {
              const sectionProgress = progress[section.section_name];
              const isActive = section.section_name === activeSection;
              const completionRate = sectionProgress ? (sectionProgress.answered / sectionProgress.total) * 100 : 0;
              
              return (
                <button
                  key={section.section_name}
                  onClick={() => handleSectionChange(section.section_name)}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    isActive
                      ? 'bg-blue-100 border-blue-500 text-blue-900'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <h3 className="font-medium text-sm mb-2">{section.section_name}</h3>
                  <div className="flex items-center justify-between text-xs">
                    <span>{sectionProgress?.answered || 0}/{sectionProgress?.total || 0}</span>
                    <span className="text-gray-500">{Math.round(completionRate)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Section Questions */}
        {activeSecti && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{activeSecti.section_name}</h2>
            
            <div className="space-y-8">
              {activeSecti.questions.map((question, questionIndex) => {
                const answerSection = answerData.sections.find(s => s.section_name === activeSection);
                const currentAnswer = answerSection?.questions[questionIndex]?.selected_answer;
                
                return (
                  <div key={questionIndex} className="border-b border-gray-100 pb-6 last:border-b-0">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {questionIndex + 1}. {question.question_text}
                    </h3>
                    
                    <div className="space-y-3">
                      {Object.entries(question.answer_options).map(([letter, description]) => (
                        <label
                          key={letter}
                          className={`flex items-start p-4 rounded-lg border cursor-pointer transition-colors ${
                            currentAnswer === letter
                              ? 'bg-blue-50 border-blue-200 text-blue-900'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`section-${activeSectionIndex}-question-${questionIndex}`}
                            value={letter}
                            checked={currentAnswer === letter}
                            onChange={() => handleAnswerSelected(activeSection, questionIndex, letter)}
                            className="mt-1 mr-3 text-blue-600"
                          />
                          <div>
                            <span className="font-medium">{letter}:</span>
                            <span className="ml-2">{description}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 mb-16">
          <button
            onClick={handlePrevSection}
            disabled={activeSectionIndex === 0}
            className={`px-6 py-2 rounded-md font-medium ${
              activeSectionIndex === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Poprzednia Sekcja
          </button>
          
          {activeSectionIndex < questionnaireData.sections.length - 1 ? (
            <button
              onClick={handleNextSection}
              className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
            >
              Następna Sekcja
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-6 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700"
            >
              Zakończ Kwestionariusz OLIMP
            </button>
          )}
        </div>
      </div>
    </main>
  );
}