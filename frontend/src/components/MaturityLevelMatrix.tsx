'use client';

import React, { useState, useEffect } from 'react';
import MaturityLevelSelector from './MaturityLevelSelector';
import { getDisplayName, getTechnicalName } from '@/utils/categoryTranslations';

interface MaturityLevelMatrixProps {
  categories: string[];
  currentLevels: Record<string, string>;
  existingGoals: Record<string, string>;
  onSubmit: (goals: Record<string, string>) => void;
}

const MaturityLevelMatrix: React.FC<MaturityLevelMatrixProps> = ({
  categories,
  currentLevels,
  existingGoals,
  onSubmit,
}) => {
  const [selectedGoals, setSelectedGoals] = useState<Record<string, string>>(existingGoals || {});
  
  // Update selected goals when existingGoals prop changes, but only for new categories
  // This prevents overwriting user selections that haven't been submitted yet
  useEffect(() => {
    if (Object.keys(existingGoals || {}).length > 0) {
      setSelectedGoals(prev => {
        const newGoals = { ...prev };
        
        // Add any new goals from existingGoals
        Object.entries(existingGoals).forEach(([category, level]) => {
          // Only update if the category doesn't exist in selectedGoals
          // or if the value has changed in the backend
          if (!newGoals[category]) {
            newGoals[category] = level;
          }
        });
        
        return newGoals;
      });
    }
  }, [existingGoals]);
  
  const handleGoalSelect = (category: string, level: string) => {
    // Always store goals using technical names
    const technicalName = getTechnicalName(category);
    setSelectedGoals(prev => ({
      ...prev,
      [technicalName]: level
    }));
  };
  
  const isAllSelected = () => {
    return categories.every(category => {
      const technicalName = getTechnicalName(category);
      return selectedGoals[technicalName];
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-800">Poziomy Dojrzałości</h3>
          <p className="text-sm text-gray-600">
            Obecne poziomy dojrzałości są pokazane na szaro. Kliknij na poziom, aby ustawić go jako swój cel strategiczny.
          </p>
        </div>
        
        <div className="space-y-6">
          {categories.map(category => (
            <MaturityLevelSelector
              key={category}
              category={getDisplayName(category)}
              currentLevel={currentLevels[getTechnicalName(category)] || 'A'}
              selectedLevel={selectedGoals[getTechnicalName(category)] || null}
              onLevelSelect={(level) => handleGoalSelect(category, level)}
            />
          ))}
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          className={`px-4 py-2 rounded-md font-medium ${
            isAllSelected()
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!isAllSelected()}
          onClick={() => onSubmit(selectedGoals)}
        >
          Prześlij
        </button>
      </div>
    </div>
  );
};

export default MaturityLevelMatrix;
