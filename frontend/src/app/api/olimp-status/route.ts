import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
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
    
    // Determine status
    let status = 'idle';
    if (isRunning && pid) {
      status = 'running';
    } else if (finalReport || completedReports.length > 0) {
      status = 'completed';
    }
    
    // Check if stopped
    const stopFile = path.join(olimpPath, 'stop_analysis.txt');
    if (fs.existsSync(stopFile)) {
      status = 'stopped';
    }
    
    // Read progress file for detailed status
    const progressFile = path.join(olimpPath, 'progress.json');
    let progressData = null;
    let detailedStatus = null;
    
    if (fs.existsSync(progressFile)) {
      try {
        const progressContent = fs.readFileSync(progressFile, 'utf-8');
        progressData = JSON.parse(progressContent);
        
        // Check for error status
        if (progressData.status === 'error') {
          status = 'error';
          detailedStatus = {
            error: progressData.error,
            currentNode: progressData.current_node,
            currentStep: progressData.current_step,
            stepsCompleted: progressData.steps_completed,
            totalSteps: progressData.total_steps,
            branches: progressData.branches
          };
        } else if (status === 'running') {
          // Enhance running status with progress details
          detailedStatus = {
            currentStep: progressData.current_step || 'initializing',
            stepsCompleted: progressData.steps_completed || 0,
            totalSteps: progressData.total_steps || 7,
            currentBranch: progressData.current_branch,
            branches: progressData.branches,
            elapsedTime: progressData.elapsed_time
          };
        }
      } catch (err) {
        console.error('Error reading progress file:', err);
      }
    }
    
    return NextResponse.json({
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
    });
    
  } catch (error) {
    console.error('Error checking OLIMP status:', error);
    return NextResponse.json(
      { error: 'Failed to check OLIMP status' },
      { status: 500 }
    );
  }
}