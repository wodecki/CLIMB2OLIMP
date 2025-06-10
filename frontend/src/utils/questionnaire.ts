import { QuestionnaireData, AnswerData, LetterAnswer } from '@/types/questionnaire';

/**
 * Maps an answer description back to its letter
 */
export function findLetterForAnswer(questionOptions: Record<string, string>, answerText: string): string {
  for (const [letter, description] of Object.entries(questionOptions)) {
    if (description === answerText) {
      return letter;
    }
  }
  return '';
}

/**
 * Converts full answer data to letter format (client-side safe version)
 */
export function convertToLetterAnswers(
  questionnaireData: QuestionnaireData,
  answerData: AnswerData
): LetterAnswer {
  const letterAnswers: LetterAnswer = {};
  
  for (const [category, questions] of Object.entries(questionnaireData)) {
    letterAnswers[category] = [];
    
    if (answerData[category]) {
      for (const [questionText, questionOptions] of Object.entries(questions)) {
        const answerText = answerData[category][questionText];
        if (answerText) {
          const letter = findLetterForAnswer(questionOptions, answerText);
          if (letter) {
            letterAnswers[category].push(letter);
          }
        }
      }
    }
  }
  
  return letterAnswers;
}