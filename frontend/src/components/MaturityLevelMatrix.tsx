'use client';

import React, { useState, useEffect } from 'react';
import MaturityLevelSelector from './MaturityLevelSelector';

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
    setSelectedGoals(prev => ({
      ...prev,
      [category]: level
    }));
  };
  
  const isAllSelected = () => {
    return categories.every(category => selectedGoals[category]);
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-800">Maturity Levels</h3>
          <p className="text-sm text-gray-600">
            Current maturity levels are shown in grey. Click on a level to set it as your strategic goal.
          </p>
        </div>
        
        <div className="space-y-6">
          {categories.map(category => (
            <MaturityLevelSelector
              key={category}
              category={category}
              currentLevel={currentLevels[category] || 'A'}
              selectedLevel={selectedGoals[category] || null}
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
          Submit All Goals
        </button>
      </div>
    </div>
  );
};

export default MaturityLevelMatrix;
