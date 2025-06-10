import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST() {
  try {
    console.log('Starting OLIMP analysis...');
    
    // Path to the OLIMP directory
    const olimpPath = path.join(process.cwd(), '..', 'OLIMP');
    
    // Check if required files exist
    const requiredFiles = [
      path.join(olimpPath, 'data', 'process', 'A.json'),
      path.join(olimpPath, 'data', 'process', 'A_1.json'),
      path.join(olimpPath, 'data', 'process', 'A_2.json'),
      path.join(olimpPath, 'data', 'process', 'A_gaps.json')
    ];
    
    for (const filePath of requiredFiles) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing: ${path.basename(filePath)}`);
      }
    }
    
    console.log('All required files found. Starting OLIMP process...');
    
    // Clean up any previous analysis files
    const filesToClean = [
      path.join(olimpPath, 'analysis_pid.txt'),
      path.join(olimpPath, 'stop_analysis.txt')
    ];
    
    for (const file of filesToClean) {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
          console.log(`Cleaned up: ${file}`);
        } catch (err) {
          console.error(`Error cleaning ${file}:`, err);
        }
      }
    }
    
    // Create reports directory if it doesn't exist
    const reportsDir = path.join(olimpPath, 'data', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const interimReportsDir = path.join(reportsDir, 'interim_reports');
    if (!fs.existsSync(interimReportsDir)) {
      fs.mkdirSync(interimReportsDir, { recursive: true });
    }
    
    // Use Python from the OLIMP virtual environment or system Python
    let pythonPath = 'python3';
    const venvPythonPath = path.join(olimpPath, '.venv', 'bin', 'python');
    if (fs.existsSync(venvPythonPath)) {
      pythonPath = venvPythonPath;
    }
    
    console.log(`Using Python: ${pythonPath}`);
    
    // Create null device paths for stdio redirection
    const nullDevice = process.platform === 'win32' ? 'NUL' : '/dev/null';
    
    // Spawn the Python process
    const pythonProcess = spawn(pythonPath, ['main.py'], {
      cwd: olimpPath,
      detached: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NON_INTERACTIVE: 'true', // Set non-interactive mode
        PATH: process.env.PATH
      }
    });
    
    // Save the process ID
    const pidFile = path.join(olimpPath, 'analysis_pid.txt');
    fs.writeFileSync(pidFile, pythonProcess.pid?.toString() || '');
    
    // Redirect stdio to prevent blocking
    if (pythonProcess.stdin) pythonProcess.stdin.end();
    if (pythonProcess.stdout) pythonProcess.stdout.pipe(fs.createWriteStream(nullDevice));
    if (pythonProcess.stderr) pythonProcess.stderr.pipe(fs.createWriteStream(nullDevice));
    
    // Unref the child process so it can run independently
    pythonProcess.unref();
    
    // Log process information
    console.log(`OLIMP analysis started with PID: ${pythonProcess.pid}`);
    
    return NextResponse.json({
      success: true,
      message: 'OLIMP analysis started successfully',
      pid: pythonProcess.pid,
      status: 'running'
    });
    
  } catch (error) {
    console.error('Error starting OLIMP analysis:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start OLIMP analysis' },
      { status: 500 }
    );
  }
}