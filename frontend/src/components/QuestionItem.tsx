'use client';

import React from 'react';
import { QuestionOption } from '@/types/questionnaire';

interface QuestionItemProps {
  questionText: string;
  options: QuestionOption;
  selectedAnswer: string | null;
  onAnswerSelected: (answer: string) => void;
}

const QuestionItem: React.FC<QuestionItemProps> = ({
  questionText,
  options,
  selectedAnswer,
  onAnswerSelected,
}) => {
  // Sort options by key (A, B, C, D, E)
  const sortedOptions = Object.entries(options).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{questionText}</h3>
      <div className="space-y-3">
        {sortedOptions.map(([key, description]) => (
          <div key={key} className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id={`${questionText}-${key}`}
                type="radio"
                name={questionText}
                value={description}
                checked={selectedAnswer === description}
                onChange={() => onAnswerSelected(description)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
            </div>
            <div className="ml-3 text-sm">
              <label
                htmlFor={`${questionText}-${key}`}
                className={`font-medium ${
                  selectedAnswer === description ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                <span className="font-bold">{key}:</span> {description}
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionItem;
