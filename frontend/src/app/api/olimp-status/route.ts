import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Simple cache for status to avoid excessive file system operations
let statusCache: { status: any; timestamp: number } | null = null;
const CACHE_TTL = 1000; // 1 second cache

export async function GET() {
  try {
    // Check cache first
    const now = Date.now();
    if (statusCache && (now - statusCache.timestamp) < CACHE_TTL) {
      return NextResponse.json(statusCache.status);
    }
    
    const olimpPath = path.join(process.cwd(), '..', 'OLIMP');
    
    // Check if analysis is running by looking for PID file
    const pidFile = path.join(olimpPath, 'analysis_pid.txt');
    const isRunning = fs.existsSync(pidFile);
    
    let pid = null;
    if (isRunning) {
      try {
        pid = fs.readFileSync(pidFile, 'utf-8').trim();
      } catch (err) {
        console.error('Error reading PID file:', err);
      }
    }
    
    // Check for completed reports
    const reportsDir = path.join(olimpPath, 'data', 'reports');
    const finalReportsDir = path.join(olimpPath, 'data', 'final results', 'A');
    
    let completedReports: string[] = [];
    let finalReport: string | null = null;
    
    // Check for consensus report
    const consensusReportPath = path.join(reportsDir, 'A_recommendations_CONSENSUS_FINAL.md');
    if (fs.existsSync(consensusReportPath)) {
      finalReport = consensusReportPath;
      completedReports.push('A_recommendations_CONSENSUS_FINAL.md');
    }
    
    // Check for other reports
    if (fs.existsSync(reportsDir)) {
      const reportFiles = fs.readdirSync(reportsDir)
        .filter(file => file.endsWith('.md'))
        .sort((a, b) => {
          const statsA = fs.statSync(path.join(reportsDir, a));
          const statsB = fs.statSync(path.join(reportsDir, b));
          return statsB.mtime.getTime() - statsA.mtime.getTime();
        });
      
      completedReports = [...completedReports, ...reportFiles.filter(f => !completedReports.includes(f))];
    }
    
    // Check final results directory
    if (fs.existsSync(finalReportsDir)) {
      const finalFiles = fs.readdirSync(finalReportsDir)
        .filter(file => file.endsWith('.md'));
      
      if (finalFiles.length > 0 && !finalReport) {
        finalReport = path.join(finalReportsDir, finalFiles[0]);
      }
    }
    
    // Determine status with simplified logic
    let status = 'idle';
    let detailedStatus = null;
    
    // Check for completion markers
    const completionFile = path.join(olimpPath, 'analysis_complete.txt');
    const errorFile = path.join(olimpPath, 'analysis_error.txt');
    const stopFile = path.join(olimpPath, 'stop_analysis.txt');
    
    if (fs.existsSync(errorFile)) {
      status = 'error';
      try {
        const errorContent = fs.readFileSync(errorFile, 'utf-8');
        detailedStatus = { error: errorContent };
      } catch (err) {
        detailedStatus = { error: 'Unknown error occurred' };
      }
    } else if (fs.existsSync(stopFile)) {
      status = 'stopped';
    } else if (fs.existsSync(completionFile)) {
      status = 'completed';
      try {
        const completionContent = fs.readFileSync(completionFile, 'utf-8');
        detailedStatus = { completion: completionContent };
      } catch (err) {
        detailedStatus = { completion: 'Analysis completed' };
      }
    } else if (isRunning && pid) {
      status = 'running';
      
      // Determine current step based on what files exist
      let currentStep = 'extract_answers';
      let stepsCompleted = 1;
      let totalSteps = 9; // Added visualization step
      let stepStatus = 'active';
      
      const aJsonPath = path.join(olimpPath, 'data', 'process', 'A.json');
      const gapsJsonPath = path.join(olimpPath, 'data', 'process', 'A_gaps.json');
      const interimReportsDir = path.join(olimpPath, 'data', 'reports', 'interim_reports');
      const consensusReportPath = path.join(olimpPath, 'data', 'reports', 'A_recommendations_CONSENSUS_FINAL.md');
      
      if (fs.existsSync(aJsonPath)) {
        currentStep = 'identify_gaps';
        stepsCompleted = 2;
      }
      
      if (fs.existsSync(gapsJsonPath)) {
        currentStep = 'parallel_recommendations';
        stepsCompleted = 3;
      }
      
      // Check for interim reports to track parallel branch progress
      if (fs.existsSync(interimReportsDir)) {
        const interimFiles = fs.readdirSync(interimReportsDir).filter(f => f.endsWith('.md'));
        if (interimFiles.length > 0) {
          stepsCompleted = 4 + Math.min(3, Math.floor(interimFiles.length / 9)); // 9 files total (3 branches × 3 files each)
          
          // Check if all parallel recommendations are complete
          if (interimFiles.length >= 9) {
            currentStep = 'generating_final_report';
            stepsCompleted = 7;
            stepStatus = 'generating'; // Special status for final report generation
          }
        }
      }
      
      // Check if final report exists
      if (fs.existsSync(consensusReportPath)) {
        currentStep = 'visualizing_report';
        stepsCompleted = 8;
        stepStatus = 'generating'; // Frontend is processing the report
      }
      
      detailedStatus = {
        currentStep,
        stepsCompleted,
        totalSteps,
        stepStatus,
        elapsedTime: 180, // 3 minutes as default
        message: `OLIMP analysis in progress: ${currentStep.replace('_', ' ')}`,
        pid: pid
      };
    } else if (finalReport || completedReports.length > 0) {
      status = 'completed';
      detailedStatus = { 
        message: 'Analysis completed successfully',
        reportsFound: completedReports.length
      };
    }
    
    const response = {
      status,
      isRunning,
      pid,
      progress: detailedStatus,
      reports: {
        completed: completedReports,
        final: finalReport,
        totalCount: completedReports.length
      },
      timestamp: new Date().toISOString()
    };
    
    // Cache the response
    statusCache = {
      status: response,
      timestamp: now
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error checking OLIMP status:', error);
    return NextResponse.json(
      { error: 'Failed to check OLIMP status' },
      { status: 500 }
    );
  }
}