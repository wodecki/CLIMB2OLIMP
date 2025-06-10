import { NextRequest, NextResponse } from 'next/server';
import { AnswerData, QuestionnaireData, LetterAnswer } from '@/types/questionnaire';
import fs from 'fs';
import path from 'path';

// Helper functions
function getQuestionnaireData(): QuestionnaireData {
  const backendDataPath = path.join(process.cwd(), '..', 'backend', 'data');
  const filePath = path.join(backendDataPath, 'all_questions.json');
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

function convertToLetterAnswers(questionnaireData: QuestionnaireData, answerData: AnswerData): LetterAnswer {
  const letterAnswers: LetterAnswer = {};
  
  for (const [category, questions] of Object.entries(questionnaireData)) {
    letterAnswers[category] = [];
    
    if (answerData[category]) {
      for (const [questionText, questionOptions] of Object.entries(questions)) {
        const answerText = answerData[category][questionText];
        if (answerText) {
          // Find the letter for this answer
          for (const [letter, description] of Object.entries(questionOptions)) {
            if (description === answerText) {
              letterAnswers[category].push(letter);
              break;
            }
          }
        }
      }
    }
  }
  
  return letterAnswers;
}

function saveAnswerData(answerData: AnswerData, letterAnswers: LetterAnswer): void {
  const backendDataPath = path.join(process.cwd(), '..', 'backend', 'data');
  
  // Save the JSON format
  const jsonFilePath = path.join(backendDataPath, 'answer_1.json');
  fs.writeFileSync(jsonFilePath, JSON.stringify(answerData, null, 4), 'utf8');
  
  // Save the text format
  const txtFilePath = path.join(backendDataPath, 'answer_1.txt');
  let txtContent = '';
  for (const [category, answers] of Object.entries(letterAnswers)) {
    txtContent += `# ${category}\n`;
    txtContent += `${answers.join(',')}\n`;
  }
  fs.writeFileSync(txtFilePath, txtContent, 'utf8');
  
  console.log('Answer data saved successfully');
}

export async function GET() {
  try {
    const data = getQuestionnaireData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching questionnaire data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questionnaire data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const answerData: AnswerData = await request.json();
    
    // Get the questionnaire data to convert answers to letters
    const questionnaireData: QuestionnaireData = getQuestionnaireData();
    const letterAnswers = convertToLetterAnswers(questionnaireData, answerData);
    
    // Save the answer data
    saveAnswerData(answerData, letterAnswers);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving questionnaire data:', error);
    return NextResponse.json(
      { error: 'Failed to save questionnaire data' },
      { status: 500 }
    );
  }
}
