import { NextRequest, NextResponse } from 'next/server';
import { getQuestionnaireData, saveAnswerData, convertToLetterAnswers } from '@/middleware/questionnaire';
import { AnswerData, QuestionnaireData } from '@/types/questionnaire';

export async function GET() {
  try {
    const data = await getQuestionnaireData();
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
    const questionnaireData: QuestionnaireData = await getQuestionnaireData();
    const letterAnswers = convertToLetterAnswers(questionnaireData, answerData);
    
    // Save the answer data
    await saveAnswerData(answerData, letterAnswers);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving questionnaire data:', error);
    return NextResponse.json(
      { error: 'Failed to save questionnaire data' },
      { status: 500 }
    );
  }
}
