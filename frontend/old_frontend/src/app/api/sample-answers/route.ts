import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { AnswerData } from '@/types/questionnaire';

export async function GET() {
  try {
    // Path to the backend data directory
    const backendDataPath = path.join(process.cwd(), '..', 'backend', 'data');
    const filePath = path.join(backendDataPath, 'sample_answer.json');
    
    // Read the sample answers file
    const data = fs.readFileSync(filePath, 'utf8');
    const sampleAnswers: AnswerData = JSON.parse(data);
    
    return NextResponse.json(sampleAnswers);
  } catch (error) {
    console.error('Error fetching sample answers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sample answers' },
      { status: 500 }
    );
  }
}
