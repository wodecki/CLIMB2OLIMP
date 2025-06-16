'use client';

import React, { useState, useEffect } from 'react';
import { PriorityArea } from '@/types/questionnaire';
import { getOlimpDisplayName, getOlimpTechnicalName, OLIMP_AREA_DESCRIPTIONS } from '@/utils/olimpTranslations';

interface PrioritySelectionProps {
  onComplete: (selectedAreas: string[]) => void;
  onBack: () => void;
}

export default function PrioritySelection({ onComplete, onBack }: PrioritySelectionProps) {
  const [priorityAreas, setPriorityAreas] = useState<PriorityArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Available priority areas (from areas_for_improvement.toml)
  const availableAreas = [
    "TECHNOLOGY AND INFRASTRUCTURE",
    "DATA",
    "PEOPLE AND COMPETENCIES",
    "ORGANIZATION AND PROCESSES",
    "STRATEGY AND MANAGEMENT",
    "BUDGET",
    "PRODUCTS AND SERVICES",
    "ETHICS AND REGULATIONS"
  ];

  useEffect(() => {
    // Initialize priority areas
    const initialAreas = availableAreas.map(area => ({
      name: area,
      selected: false // Default to all unchecked
    }));
    
    setPriorityAreas(initialAreas);
    setIsLoading(false);
  }, []);

  const handleAreaToggle = (areaName: string) => {
    setPriorityAreas(prev => 
      prev.map(area => 
        area.name === areaName 
          ? { ...area, selected: !area.selected }
          : area
      )
    );
  };

  const handleComplete = () => {
    const selectedAreas = priorityAreas
      .filter(area => area.selected)
      .map(area => area.name);
    
    if (selectedAreas.length === 0) {
      alert('Wybierz co najmniej jeden obszar priorytetowy do poprawy.');
      return;
    }
    
    onComplete(selectedAreas);
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

  const selectedCount = priorityAreas.filter(area => area.selected).length;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Wybor Obszarów Priorytetowych</h1>
              <p className="text-gray-600">
                Wybierz obszary, na których chcesz się skupić w analizie ulepszen. Te obszary będą używane 
                do identyfikacji luk między twoim obecnym stanem a optymalną gotowością na AI.
              </p>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700"
            >
              Powrót do Kwestionariusza OLIMP
            </button>
          </div>
        </header>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Dostępne Obszary Ulepszen
            </h2>
            <p className="text-gray-600">
              Wybrane: {selectedCount} z {priorityAreas.length} obszarów
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {priorityAreas.map((area) => (
              <label
                key={area.name}
                className={`flex items-center p-6 rounded-lg border cursor-pointer transition-colors ${
                  area.selected
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={area.selected}
                  onChange={() => handleAreaToggle(area.name)}
                  className="mr-4 h-5 w-5 text-blue-600 rounded"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-medium">{getOlimpDisplayName(area.name)}</h3>
                  <p className="text-sm mt-1 opacity-75">
                    {OLIMP_AREA_DESCRIPTIONS[getOlimpDisplayName(area.name) as keyof typeof OLIMP_AREA_DESCRIPTIONS]}
                  </p>
                </div>
                {area.selected && (
                  <div className="ml-4 flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">Co się dzieje dalej?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Analiza luk zostanie obliczona dla wybranych obszarów</li>
              <li>• Porównanie obecnego stanu z optymalnym poziomem (E)</li>
              <li>• Rekomendacje ulepszen krok po kroku</li>
              <li>• Generowanie kompleksowego raportu analizy OLIMP</li>
            </ul>
          </div>

          <div className="flex justify-between">
            <button
              onClick={onBack}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md font-medium hover:bg-gray-300"
            >
              Powrót
            </button>
            
            <button
              onClick={handleComplete}
              disabled={selectedCount === 0}
              className={`px-6 py-2 rounded-md font-medium ${
                selectedCount > 0
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-400 text-white cursor-not-allowed'
              }`}
            >
              Rozpocznij Analizę OLIMP
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
