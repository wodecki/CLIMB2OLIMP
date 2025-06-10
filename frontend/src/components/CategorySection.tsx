'use client';

import React from 'react';
import QuestionItem from './QuestionItem';
import { Question, Answer } from '@/types/questionnaire';

interface CategorySectionProps {
  categoryName: string;
  questions: Question;
  answers: Answer;
  onAnswerSelected: (questionText: string, answer: string) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  categoryName,
  questions,
  answers,
  onAnswerSelected,
}) => {
  // Calculate progress for this category
  const totalQuestions = Object.keys(questions).length;
  const answeredQuestions = Object.keys(answers || {}).length;
  const progressPercentage = totalQuestions > 0 
    ? Math.round((answeredQuestions / totalQuestions) * 100) 
    : 0;

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{categoryName}</h2>
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700 mr-2">
            {answeredQuestions}/{totalQuestions} answered
          </span>
          <div className="w-32 bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(questions).map(([questionText, options]) => (
          <QuestionItem
            key={questionText}
            questionText={questionText}
            options={options}
            selectedAnswer={answers?.[questionText] || null}
            onAnswerSelected={(answer) => onAnswerSelected(questionText, answer)}
          />
        ))}
      </div>
    </div>
  );
};

export default CategorySection;
