import { NextRequest, NextResponse } from 'next/server';
import { OlimpAnswerData } from '@/types/questionnaire';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const olimpAnswers: OlimpAnswerData = await request.json();
    
    // Create the backend data directory if it doesn't exist
    const backendDataPath = path.join(process.cwd(), '..', 'backend', 'data');
    if (!fs.existsSync(backendDataPath)) {
      fs.mkdirSync(backendDataPath, { recursive: true });
    }
    
    // Save OLIMP answers as answer_1.json (backend expects this file)
    const answersFilePath = path.join(backendDataPath, 'answer_1.json');
    
    // Convert to backend format - need to flatten the data structure
    const backendFormat = {
      questionnaire: olimpAnswers.questionnaire,
      questionnaire_title: olimpAnswers.questionnaire_title,
      sections: olimpAnswers.sections
    };
    
    fs.writeFileSync(answersFilePath, JSON.stringify(backendFormat, null, 2));
    
    // Also save in OLIMP format for future processing
    const olimpDataPath = path.join(process.cwd(), '..', 'OLIMP', 'data', 'process');
    if (!fs.existsSync(olimpDataPath)) {
      fs.mkdirSync(olimpDataPath, { recursive: true });
    }
    
    const olimpAnswersFilePath = path.join(olimpDataPath, 'A_2.json');
    fs.writeFileSync(olimpAnswersFilePath, JSON.stringify(backendFormat, null, 2));
    
    console.log('OLIMP answers saved successfully');
    console.log(`Backend format saved to: ${answersFilePath}`);
    console.log(`OLIMP format saved to: ${olimpAnswersFilePath}`);
    
    return NextResponse.json({ 
      success: true,
      message: 'OLIMP answers saved successfully',
      files: {
        backend: answersFilePath,
        olimp: olimpAnswersFilePath
      }
    });
  } catch (error) {
    console.error('Error saving OLIMP answers:', error);
    return NextResponse.json(
      { error: 'Failed to save OLIMP answers' },
      { status: 500 }
    );
  }
}