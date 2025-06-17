'use client';

import React from 'react';
import { CategoryProgress } from '@/types/questionnaire';

interface CategoryNavigationProps {
  categories: string[];
  activeCategory: string;
  progress: CategoryProgress;
  onCategoryChange: (category: string) => void;
}

const CategoryNavigation: React.FC<CategoryNavigationProps> = ({
  categories,
  activeCategory,
  progress,
  onCategoryChange,
}) => {
  // Calculate overall progress
  const totalQuestions = Object.values(progress).reduce((sum, cat) => sum + cat.total, 0);
  const answeredQuestions = Object.values(progress).reduce((sum, cat) => sum + cat.answered, 0);
  const overallProgress = totalQuestions > 0 
    ? Math.round((answeredQuestions / totalQuestions) * 100) 
    : 0;

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Postęp</h3>
        <span className="text-sm font-medium">
          {answeredQuestions}/{totalQuestions} pytań udzielonych ({overallProgress}%)
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
        <div
          className="bg-blue-600 h-2.5 rounded-full"
          style={{ width: `${overallProgress}%` }}
        ></div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const categoryProgress = progress[category];
          const categoryPercentage = categoryProgress?.total > 0 
            ? Math.round((categoryProgress.answered / categoryProgress.total) * 100) 
            : 0;
          
          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="truncate max-w-[120px]">{category}</span>
                <div className="w-full bg-gray-300 rounded-full h-1 mt-1">
                  <div
                    className={`h-1 rounded-full ${
                      activeCategory === category ? 'bg-blue-300' : 'bg-blue-600'
                    }`}
                    style={{ width: `${categoryPercentage}%` }}
                  ></div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryNavigation;
