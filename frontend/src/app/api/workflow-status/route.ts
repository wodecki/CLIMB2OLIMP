import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const olimpDataPath = path.join(process.cwd(), '..', 'OLIMP', 'data', 'process');
    
    // Check which files exist to determine workflow status
    const files = {
      a1Json: fs.existsSync(path.join(olimpDataPath, 'A_1.json')),
      a2Json: fs.existsSync(path.join(olimpDataPath, 'A_2.json')),
      aGapsJson: fs.existsSync(path.join(olimpDataPath, 'A_gaps.json')),
      aJson: fs.existsSync(path.join(olimpDataPath, 'A.json'))
    };
    
    // Determine current stage based on files
    let currentStage = 'climb2';
    if (files.a1Json) {
      currentStage = 'olimp';
    }
    if (files.a2Json) {
      currentStage = 'priorities';
    }
    if (files.aGapsJson) {
      currentStage = 'analysis';
    }
    
    // Check if analysis is running
    const olimpPath = path.join(process.cwd(), '..', 'OLIMP');
    const pidFile = path.join(olimpPath, 'analysis_pid.txt');
    const isAnalysisRunning = fs.existsSync(pidFile);
    
    // Check for completed reports
    const reportsDir = path.join(olimpPath, 'data', 'reports');
    const hasReports = fs.existsSync(reportsDir) && 
      fs.readdirSync(reportsDir).some(file => file.endsWith('.md'));
    
    if (hasReports && !isAnalysisRunning) {
      currentStage = 'reports';
    }
    
    return NextResponse.json({
      currentStage,
      files,
      isAnalysisRunning,
      hasReports,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error checking workflow status:', error);
    return NextResponse.json(
      { error: 'Failed to check workflow status' },
      { status: 500 }
    );
  }
}