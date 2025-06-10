import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    // Path to the OLIMP progress file
    const progressPath = path.join(process.cwd(), '..', 'OLIMP', 'progress.json');
    
    // Check if progress file exists
    if (!fs.existsSync(progressPath)) {
      return NextResponse.json({ 
        status: 'not_found',
        message: 'No OLIMP analysis in progress'
      });
    }
    
    // Read the progress file
    const progressContent = fs.readFileSync(progressPath, 'utf-8');
    const progressData = JSON.parse(progressContent);
    
    // Return progress data
    return NextResponse.json({
      status: 'success',
      progress: progressData
    });
    
  } catch (error) {
    console.error('Error reading OLIMP progress:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Failed to read progress data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}