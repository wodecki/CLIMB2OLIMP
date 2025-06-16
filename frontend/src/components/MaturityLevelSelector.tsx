'use client';

import React, { useState, useEffect } from 'react';

interface MaturityLevelSelectorProps {
  category: string;
  currentLevel: string;
  selectedLevel: string | null;
  onLevelSelect: (level: string) => void;
}

const MaturityLevelSelector: React.FC<MaturityLevelSelectorProps> = ({
  category,
  currentLevel,
  selectedLevel,
  onLevelSelect,
}) => {
  const levels = ['A', 'B', 'C', 'D', 'E'];
  
  // Convert level letter to index (0-4)
  const currentLevelIndex = levels.indexOf(currentLevel);
  const selectedLevelIndex = selectedLevel ? levels.indexOf(selectedLevel) : -1;
  
  return (
    <div className="flex flex-col mb-4">
      <div className="text-sm font-medium text-gray-700 mb-2">{category}</div>
      <div className="relative flex items-center h-12">
        {/* Horizontal line */}
        <div className="absolute w-full h-0.5 bg-gray-200"></div>
        
        {/* Selected path line (blue) */}
        {selectedLevelIndex >= 0 && (
          <div 
            className="absolute h-0.5 bg-blue-700" 
            style={{ 
              width: `${(selectedLevelIndex / (levels.length - 1)) * 100}%`,
              left: 0
            }}
          ></div>
        )}
        
        {/* Maturity level circles */}
        {levels.map((level, index) => {
          // Determine if this level should be colored
          const isSelected = selectedLevel === level;
          const isInSelectedPath = selectedLevelIndex >= 0 && index <= selectedLevelIndex;
          const isCurrent = currentLevel === level;
          
          // Determine the color class based on selection state
          let colorClass = "bg-gray-200 text-gray-600"; // Default: grey (unselected)
          
          if (isSelected || isInSelectedPath) {
            colorClass = "bg-blue-700 text-white"; // Blue for selected or in selected path
          } else if (isCurrent) {
            colorClass = "bg-gray-400 text-white"; // Darker grey for current level
          }
          
          return (
            <div 
              key={level}
              className="absolute flex items-center justify-center"
              style={{ left: `${(index / (levels.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}
            >
              <button
                onClick={() => onLevelSelect(level)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${colorClass} hover:opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500`}
                aria-label={`Wybierz poziom dojrzałości ${level}`}
              >
                {level}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MaturityLevelSelector;
