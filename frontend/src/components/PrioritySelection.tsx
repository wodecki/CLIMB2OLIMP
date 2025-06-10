'use client';

import React, { useState, useEffect } from 'react';
import { PriorityArea } from '@/types/questionnaire';

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
    "TECHNOLOGIA I INFRASTRUKTURA",
    "DANE",
    "LUDZIE I KOMPETENCJE",
    "ORGANIZACJA I PROCESY",
    "STRATEGIA I ZARZĄDZANIE",
    "BUDŻET",
    "PRODUKTY I USŁUGI",
    "ETYKA I REGULACJE"
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
      alert('Please select at least one priority area for improvement.');
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
          <strong className="font-bold">Error!</strong>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Priority Areas Selection</h1>
              <p className="text-gray-600">
                Select the areas you want to focus on for improvement analysis. These areas will be used 
                to identify gaps between your current state and optimal AI readiness.
              </p>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700"
            >
              Back to OLIMP Questionnaire
            </button>
          </div>
        </header>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Available Improvement Areas
            </h2>
            <p className="text-gray-600">
              Selected: {selectedCount} of {priorityAreas.length} areas
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
                  <h3 className="text-lg font-medium">{area.name}</h3>
                  <p className="text-sm mt-1 opacity-75">
                    {area.name === "TECHNOLOGIA I INFRASTRUKTURA" && "Focus on IT infrastructure, cloud adoption, and technical capabilities"}
                    {area.name === "DANE" && "Focus on data quality, management, automation, and analytics"}
                    {area.name === "LUDZIE I KOMPETENCJE" && "Focus on team skills, training, and AI competency development"}
                    {area.name === "ORGANIZACJA I PROCESY" && "Focus on organizational structure, workflows, and process integration"}
                    {area.name === "STRATEGIA I ZARZĄDZANIE" && "Focus on long-term AI strategy, business impact assessment, and governance"}
                    {area.name === "BUDŻET" && "Focus on financial planning, resource allocation, and investment priorities"}
                    {area.name === "PRODUKTY I USŁUGI" && "Focus on AI-enhanced products, automation, and customer experience"}
                    {area.name === "ETYKA I REGULACJE" && "Focus on AI ethics, compliance, data protection, and regulatory adherence"}
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
            <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Gap analysis will be computed for selected areas</li>
              <li>• Current state vs. optimal level (E) comparison</li>
              <li>• Step-by-step improvement recommendations</li>
              <li>• Comprehensive OLIMP analysis report generation</li>
            </ul>
          </div>

          <div className="flex justify-between">
            <button
              onClick={onBack}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md font-medium hover:bg-gray-300"
            >
              Back
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
              Start OLIMP Analysis
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}