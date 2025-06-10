import fs from 'fs';
import path from 'path';
import { QuestionnaireData, AnswerData, LetterAnswer } from '@/types/questionnaire';

// Path to the backend data directory
const backendDataPath = path.join(process.cwd(), '..', 'backend', 'data');

/**
 * Reads the questionnaire data from the backend
 */
export async function getQuestionnaireData(): Promise<QuestionnaireData> {
  try {
    const filePath = path.join(backendDataPath, 'all_questions.json');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading questionnaire data:', error);
    throw new Error('Failed to load questionnaire data');
  }
}

/**
 * Saves the answer data to the backend
 */
export async function saveAnswerData(answerData: AnswerData, letterAnswers: LetterAnswer): Promise<void> {
  try {
    // Save the JSON format
    const jsonFilePath = path.join(backendDataPath, 'answer_1.json');
    fs.writeFileSync(jsonFilePath, JSON.stringify(answerData, null, 4), 'utf8');
    
    // Save the text format
    const txtFilePath = path.join(backendDataPath, 'answer_1.txt');
    const txtContent = formatLetterAnswers(letterAnswers);
    fs.writeFileSync(txtFilePath, txtContent, 'utf8');
    
    console.log('Answer data saved successfully');
  } catch (error) {
    console.error('Error saving answer data:', error);
    throw new Error('Failed to save answer data');
  }
}

/**
 * Formats the letter answers into the expected text format
 */
function formatLetterAnswers(letterAnswers: LetterAnswer): string {
  let result = '';
  
  for (const [category, answers] of Object.entries(letterAnswers)) {
    result += `# ${category}\n`;
    result += `${answers.join(',')}\n`;
  }
  
  return result;
}

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
 * Converts full answer data to letter format
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
