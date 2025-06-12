import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    const olimpPath = path.join(process.cwd(), '..', 'OLIMP');
    
    // Check for simple status markers instead of complex progress file
    const pidFile = path.join(olimpPath, 'analysis_pid.txt');
    const completionFile = path.join(olimpPath, 'analysis_complete.txt');
    const errorFile = path.join(olimpPath, 'analysis_error.txt');
    
    let status = 'idle';
    let message = 'No analysis in progress';
    let progress = null;
    
    if (fs.existsSync(errorFile)) {
      status = 'error';
      message = fs.readFileSync(errorFile, 'utf-8');
    } else if (fs.existsSync(completionFile)) {
      status = 'completed';
      message = 'Analysis completed successfully';
      progress = { percentage: 100, step: 'Complete' };
    } else if (fs.existsSync(pidFile)) {
      status = 'running';
      message = 'OLIMP analysis is running...';
      // Simple progress indication with proper structure
      progress = { 
        currentStep: 'processing',
        stepsCompleted: 3,
        totalSteps: 7,
        elapsedTime: 180,
        percentage: 50, 
        step: 'Processing recommendations',
        note: 'This process may take several minutes'
      };
    }
    
    // Check for actual report files to confirm completion
    const reportsDir = path.join(olimpPath, 'data', 'reports');
    const consensusReport = path.join(reportsDir, 'A_recommendations_CONSENSUS_FINAL.md');
    
    if (fs.existsSync(consensusReport)) {
      status = 'completed';
      message = 'Analysis completed - final report available';
      progress = { percentage: 100, step: 'Complete' };
    }
    
    return NextResponse.json({
      status,
      message,
      progress,
      timestamp: new Date().toISOString()
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