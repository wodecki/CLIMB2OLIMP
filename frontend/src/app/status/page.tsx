'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MaturityLevelMatrix from '@/components/MaturityLevelMatrix';
import MaturityLevelSelector from '@/components/MaturityLevelSelector';

interface AnalysisStatus {
  currentNode: string;
  requiresInput: boolean;
  questions: any[] | null;
  reportPath?: string;
  currentCategory?: string;
  strategicGoals?: Record<string, string>;
  requestAllGoals?: boolean;
  allCategories?: string[];
}

export default function StatusPage() {
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(3000); // 3 seconds
  const [maturityLevels, setMaturityLevels] = useState<Record<string, string>>({});
  
  // Function to fetch the current status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/check-analysis-status');
      
      if (!response.ok) {
        throw new Error('Failed to fetch analysis status');
      }
      
      const data: AnalysisStatus = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching analysis status:', err);
      setError('Nie udało się załadować statusu analizy. Spróbuj ponownie później.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to fetch maturity levels
  const fetchMaturityLevels = async () => {
    try {
      const response = await fetch('/api/get-maturity-levels');
      
      if (!response.ok) {
        throw new Error('Failed to fetch maturity levels');
      }
      
      const data = await response.json();
      setMaturityLevels(data.maturityLevels || {});
    } catch (err) {
      console.error('Error fetching maturity levels:', err);
      // Don't set error state here to avoid blocking the UI
    }
  };
  
  // Fetch status and maturity levels on component mount and set up interval
  useEffect(() => {
    fetchStatus();
    fetchMaturityLevels();
    
    // Set up interval to refresh status
    const intervalId = setInterval(() => {
      fetchStatus();
      fetchMaturityLevels();
    }, refreshInterval);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval]);
  
  // Get a human-readable description of the current node
  const getNodeDescription = (nodeName: string): string => {
    const nodeDescriptions: Record<string, string> = {
      'starting': 'Rozpoczynanie procesu analizy',
      'initializing': 'Inicjalizacja analizy',
      'not_running': 'Analiza nie działa',
      'calculate_maturity': 'Obliczanie poziomów dojrzałości',
      'human_feedback': 'Oczekiwanie na opinie człowieka',
      'strategic_planning': 'Planowanie strategicznych ulepszen',
      'make_analysts': 'Tworzenie profili analityków',
      'consulting': 'Konsultacje z analitykami',
      'write_report': 'Pisanie raportu końcowego',
      'identify_areas_for_improvement': 'Identyfikacja obszarów do poprawy',
      'identify_questions_for_improvement': 'Identyfikacja pytań do poprawy',
      'create_analysts': 'Tworzenie profili analityków',
      'diagnose': 'Diagnozowanie problemów',
      'recommend': 'Generowanie rekomendacji',
      'process_feedback': 'Przetwarzanie opinii użytkownika',
      'completed': 'Analiza zakończona',
      'stopped': 'Analiza zatrzymana',
      'error': 'Analiza napotkała błąd'
    };
    
    return nodeDescriptions[nodeName] || `Przetwarzanie: ${nodeName}`;
  };
  
  // Get progress percentage based on node
  const getProgressPercentage = (nodeName: string): number => {
    const nodeProgress: Record<string, number> = {
      'starting': 2,
      'initializing': 5,
      'not_running': 0,
      'calculate_maturity': 10,
      'human_feedback': 20,
      'strategic_planning': 30,
      'make_analysts': 40,
      'consulting': 60,
      'write_report': 90,
      'identify_areas_for_improvement': 25,
      'identify_questions_for_improvement': 35,
      'create_analysts': 45,
      'diagnose': 50,
      'recommend': 70,
      'process_feedback': 25,
      'completed': 100,
      'stopped': 50, // Changed from 0 to 50 to show partial progress
      'error': 0
    };
    
    return nodeProgress[nodeName] || 50;
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
  
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Status Analizy</h1>
              {/* Removed status description as requested */}
            </div>
            <div>
              <Link 
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
              >
                Powrót do Kwestionariusza
              </Link>
            </div>
          </div>
        </header>
        
        {status && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Aktualny Status</h2>
            
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="font-medium text-gray-700">
                  {getNodeDescription(status.currentNode)}
                </span>
                <span className="text-blue-600 font-medium">
                  {getProgressPercentage(status.currentNode)}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
                  style={{ width: `${getProgressPercentage(status.currentNode)}%` }}
                ></div>
              </div>
            </div>
            
            {/* Current Node and Status blocks removed as requested */}
            
            {status.strategicGoals && Object.keys(status.strategicGoals).length > 0 && (
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <h3 className="font-medium text-gray-800 mb-2">Poziomy Dojrzałości i Cele Strategiczne</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(status.strategicGoals).map(([category, goalLevel]) => (
                    <div key={category} className="flex items-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 mr-1 bg-gray-400 text-white rounded-full text-xs font-bold">
                        {maturityLevels[category] || 'A'}
                      </span>
                      <svg className="h-4 w-4 text-gray-500 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <span className="inline-flex items-center justify-center w-6 h-6 ml-1 mr-2 bg-blue-600 text-white rounded-full text-xs font-bold">
                        {goalLevel}
                      </span>
                      <span className="text-gray-700">{category}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <p className="flex items-center justify-center">
                    <span className="inline-flex items-center mr-1">Szary: Aktualny Poziom</span>
                    <svg className="h-4 w-4 text-gray-500 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="inline-flex items-center ml-1">Niebieski: Cel Strategiczny</span>
                  </p>
                </div>
              </div>
            )}
            
            {status.requiresInput && (
              <div className="bg-white border border-gray-200 rounded-md p-4 mb-6">
                <div className="w-full">
                  {status.currentNode === 'human_feedback' && status.requestAllGoals && status.allCategories ? (
                    <div>
                      <h3 className="text-sm font-medium text-gray-800">Ustaw Cele Strategiczne</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-700 mb-4">
                          Wybierz poziomy celów strategicznych (A-E) dla wszystkich kategorii:
                        </p>
                        
                        <MaturityLevelMatrix 
                          categories={status.allCategories} 
                          currentLevels={maturityLevels}
                          existingGoals={status.strategicGoals || {}}
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
                                // Wait a moment and then refresh the status
                                setTimeout(() => {
                                  fetchStatus();
                                  fetchMaturityLevels();
                                }, 1000);
                              } else {
                                alert('Nie udało się przesłać celów strategicznych');
                              }
                            } catch (error) {
                              console.error('Error submitting strategic goals:', error);
                              alert('Błąd przesyłania celów strategicznych');
                            }
                          }}
                        />
                      </div>
                    </div>
                  ) : status.currentNode === 'human_feedback' && status.currentCategory ? (
                    <div>
                      <h3 className="text-sm font-medium text-gray-800">Ustaw Cel Strategiczny</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-700 mb-4">
                          Wybierz poziom celu strategicznego (A-E) dla: <strong>{status.currentCategory}</strong>
                        </p>
                        
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          {(() => {
                            // Use a state variable to track the selected level for this category
                            const [singleSelectedLevel, setSingleSelectedLevel] = useState<string | null>(null);
                            
                            return (
                              <MaturityLevelSelector
                                category={status.currentCategory}
                                currentLevel={maturityLevels[status.currentCategory] || 'A'}
                                selectedLevel={singleSelectedLevel}
                                onLevelSelect={async (level) => {
                                  // Update the local state immediately
                                  setSingleSelectedLevel(level);
                                  
                                  try {
                                    const response = await fetch('/api/set-strategic-goals', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({ goal: level }),
                                    });
                                    
                                    if (response.ok) {
                                      // Wait a moment and then refresh the status
                                      setTimeout(() => {
                                        fetchStatus();
                                        fetchMaturityLevels();
                                      }, 1000);
                                    } else {
                                      alert('Nie udało się przesłać celu strategicznego');
                                      // Reset the selection if the API call fails
                                      setSingleSelectedLevel(null);
                                    }
                                  } catch (error) {
                                    console.error('Error submitting strategic goal:', error);
                                    alert('Błąd przesyłania celu strategicznego');
                                    // Reset the selection if the API call fails
                                    setSingleSelectedLevel(null);
                                  }
                                }}
                              />
                            );
                          })()}
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-500">
                          <p>A = Doskonały, B = Dobry, C = Średni, D = Poniżej średniej, E = Słaby</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700">
                      Analiza oczekuje na wprowadzenie danych przez użytkownika. Sprawdź terminal lub linię komend gdzie działa analiza.
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-4">
              {/* Refresh Status button and Auto-refresh dropdown removed as requested */}
              
              {status && status.currentNode === 'completed' && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        Analiza zakończona pomyślnie! Możesz teraz zobaczyć raport.
                      </p>
                      <div className="mt-2">
                        <Link 
                          href="/report"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:border-green-700 focus:shadow-outline-green active:bg-green-700 transition ease-in-out duration-150"
                        >
                          Zobacz Raport
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {status && !['not_running', 'completed', 'stopped', 'error'].includes(status.currentNode) && (
                <button
                  onClick={async () => {
                    if (confirm('Czy na pewno chcesz zatrzymać analizę?')) {
                      try {
                        const response = await fetch('/api/stop-analysis', {
                          method: 'POST',
                        });
                        
                        if (response.ok) {
                          alert('Analiza zatrzymana pomyślnie');
                          fetchStatus();
                        } else {
                          alert('Nie udało się zatrzymać analizy');
                        }
                      } catch (err) {
                        console.error('Error stopping analysis:', err);
                        alert('Błąd zatrzymywania analizy');
                      }
                    }
                  }}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors"
                >
                  Zatrzymaj Analizę
                </button>
              )}
              
              {status && status.currentNode === 'error' && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">
                        Analiza napotkała błąd. Sprawdź raport błędów w celu uzyskania szczegółów lub spróbuj uruchomić analizę ponownie.
                      </p>
                      {status.reportPath && (
                        <div className="mt-2">
                          <Link 
                            href={`/report?path=${encodeURIComponent(status.reportPath)}`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-red-600 hover:bg-red-500 focus:outline-none focus:border-red-700 focus:shadow-outline-red active:bg-red-700 transition ease-in-out duration-150"
                          >
                            Zobacz Raport Błędów
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {status && status.currentNode === 'stopped' && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Analiza została zatrzymana. Możesz rozpocząć nową analizę ze strony kwestionariusza.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Proces Analizy</h2>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className={`flex-shrink-0 h-5 w-5 rounded-full ${
                status?.currentNode === 'calculate_maturity' 
                  ? 'bg-blue-600 animate-pulse' 
                  : (status?.currentNode === 'stopped' && getProgressPercentage(status?.currentNode) >= 10)
                    ? 'bg-green-500'
                    : (getProgressPercentage(status?.currentNode || '') >= 10 
                      ? 'bg-green-500' 
                      : 'bg-gray-300')
              }`}></div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Oblicz Poziomy Dojrzałości</h3>
                <p className="text-gray-600">Analiza odpowiedzi kwestionariusza w celu określenia obecnych poziomów dojrzałości.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className={`flex-shrink-0 h-5 w-5 rounded-full ${
                status?.currentNode === 'human_feedback' || status?.currentNode === 'process_feedback'
                  ? 'bg-blue-600 animate-pulse' 
                  : (status?.currentNode === 'stopped' && getProgressPercentage(status?.currentNode) >= 20)
                    ? 'bg-green-500'
                    : (getProgressPercentage(status?.currentNode || '') >= 20 
                      ? 'bg-green-500' 
                      : 'bg-gray-300')
              }`}></div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Ustaw Cele Strategiczne</h3>
                <p className="text-gray-600">Zbieranie celów strategicznych dla każdej kategorii w celu kierowania analizą.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className={`flex-shrink-0 h-5 w-5 rounded-full ${
                status?.currentNode === 'create_analysts' || status?.currentNode === 'make_analysts'
                  ? 'bg-blue-600 animate-pulse' 
                  : (status?.currentNode === 'stopped' && getProgressPercentage(status?.currentNode) >= 40)
                    ? 'bg-green-500'
                    : (getProgressPercentage(status?.currentNode || '') >= 40 
                      ? 'bg-green-500' 
                      : 'bg-gray-300')
              }`}></div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Utwórz Profile Analityków</h3>
                <p className="text-gray-600">Tworzenie wyspecjalizowanych profili analityków do oceny problemu.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className={`flex-shrink-0 h-5 w-5 rounded-full ${
                status?.currentNode === 'diagnose'
                  ? 'bg-blue-600 animate-pulse' 
                  : (status?.currentNode === 'stopped' && getProgressPercentage(status?.currentNode) >= 50)
                    ? 'bg-green-500'
                    : (getProgressPercentage(status?.currentNode || '') >= 50 
                      ? 'bg-green-500' 
                      : 'bg-gray-300')
              }`}></div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Zdiagnozuj Problemy</h3>
                <p className="text-gray-600">Identyfikacja kluczowych problemów i wyzwań na podstawie oceny dojrzałości.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className={`flex-shrink-0 h-5 w-5 rounded-full ${
                status?.currentNode === 'recommend' || status?.currentNode === 'consulting'
                  ? 'bg-blue-600 animate-pulse' 
                  : (status?.currentNode === 'stopped' && getProgressPercentage(status?.currentNode) >= 60)
                    ? 'bg-green-500'
                    : (getProgressPercentage(status?.currentNode || '') >= 60 
                      ? 'bg-green-500' 
                      : 'bg-gray-300')
              }`}></div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Generuj Rekomendacje</h3>
                <p className="text-gray-600">Tworzenie praktycznych rekomendacji w celu poprawy poziomów dojrzałości.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className={`flex-shrink-0 h-5 w-5 rounded-full ${
                status?.currentNode === 'write_report'
                  ? 'bg-blue-600 animate-pulse' 
                  : (status?.currentNode === 'stopped' && getProgressPercentage(status?.currentNode) >= 90)
                    ? 'bg-green-500'
                    : (getProgressPercentage(status?.currentNode || '') >= 90 
                      ? 'bg-green-500' 
                      : 'bg-gray-300')
              }`}></div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Napisz Raport Końcowy</h3>
                <p className="text-gray-600">Kompilowanie wszystkich wniosków i rekomendacji w kompleksowy raport.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
