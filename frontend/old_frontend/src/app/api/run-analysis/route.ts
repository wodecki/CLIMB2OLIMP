import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

import { execSync } from 'child_process';

export async function POST() {
  try {
    // Path to the backend directory
    const backendPath = path.join(process.cwd(), '..', 'backend');
    
    // Initialize the status file before starting the process
    const statusFilePath = path.join(backendPath, 'status.json');
    
    // First, stop any running analysis
    try {
      // Update the status to stopped
      const stoppedStatus = {
        currentNode: "stopped",
        requiresInput: false,
        questions: null
      };
      
      // Write the updated status
      if (fs.existsSync(statusFilePath)) {
        fs.writeFileSync(statusFilePath, JSON.stringify(stoppedStatus, null, 2));
      }
      
      // Create a stop_analysis.txt file to signal the process to stop
      const stopFilePath = path.join(backendPath, 'stop_analysis.txt');
      fs.writeFileSync(stopFilePath, 'stop');
      
      // Find and kill any running Python processes for the analysis
      try {
        // Get the path to the virtual environment's Python interpreter
        const pythonPath = path.join(backendPath, '.venv', 'bin', 'python');
        
        // This command works on macOS/Linux to find and kill Python processes running main.py
        if (process.platform !== 'win32') {
          try {
            execSync(`pkill -f '${pythonPath} main.py'`, { cwd: backendPath });
          } catch (e) {
            // It's okay if this fails - it might mean no processes were running
            console.log('No running analysis processes found or unable to kill processes');
          }
        } else {
          // On Windows, we would need a different approach
          console.log('Windows platform detected, skipping process termination');
        }
      } catch (error) {
        // It's okay if this fails - it might mean no processes were running
        console.log('Error while trying to kill processes:', error);
      }
      
      // Wait a moment for processes to terminate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (stopError) {
      console.error('Error stopping previous analysis:', stopError);
      // Continue anyway, as we want to start a new analysis
    }
    
    // Clean up any files from previous analyses
    const filesToDelete = [
      // Removed maturity_levels.json to preserve calculated maturity levels
      path.join(backendPath, 'user_input_all.json'),
      path.join(backendPath, 'user_input.txt'),
      path.join(backendPath, 'stop_analysis.txt'),
      path.join(backendPath, 'analysis_pid.txt')
    ];
    
    // Delete each file if it exists
    for (const file of filesToDelete) {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
          console.log(`Deleted ${file}`);
        } catch (err) {
          console.error(`Error deleting ${file}:`, err);
        }
      }
    }
    
    // Set initial status to calculate_maturity since that's the first step in the graph
    const initialStatus = {
      currentNode: "calculate_maturity",
      requiresInput: false,
      questions: null,
      strategicGoals: {}
    };
    
    // Write the initial status
    fs.writeFileSync(statusFilePath, JSON.stringify(initialStatus, null, 2));
    
    // Use the virtual environment's Python interpreter
    const pythonPath = path.join(backendPath, '.venv', 'bin', 'python');
    
    // Create null device paths for stdio redirection
    const nullDevice = process.platform === 'win32' ? 'NUL' : '/dev/null';
    
    // Spawn the Python process without waiting for it to complete
    const pythonProcess = spawn(pythonPath, ['main.py'], { 
      cwd: backendPath,
      detached: true, // Run the process in the background
      stdio: ['pipe', 'pipe', 'pipe'], // Use pipes for stdio to prevent EOF errors
      env: {
        ...process.env, // Include all current environment variables
        NON_INTERACTIVE: 'false', // Set interactive mode to enable frontend strategic goal input
        PATH: process.env.PATH // Ensure PATH is passed
      }
    });
    
    // Redirect stdio to prevent blocking
    if (pythonProcess.stdin) pythonProcess.stdin.end();
    if (pythonProcess.stdout) pythonProcess.stdout.pipe(fs.createWriteStream(nullDevice));
    if (pythonProcess.stderr) pythonProcess.stderr.pipe(fs.createWriteStream(nullDevice));
    
    // Unref the child process so it can run independently of the parent
    pythonProcess.unref();
    
    return NextResponse.json({
      success: true,
      message: 'Analysis started successfully. Check the status page for progress updates.'
    });
  } catch (error) {
    console.error('Error starting backend analysis:', error);
    return NextResponse.json(
      { error: 'Failed to start backend analysis' },
      { status: 500 }
    );
  }
}
