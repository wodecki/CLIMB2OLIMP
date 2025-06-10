import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';

// Convert exec to a Promise-based function
const execPromise = util.promisify(exec);

export async function POST() {
  try {
    // Path to the backend directory
    const backendPath = path.join(process.cwd(), '..', 'backend');
    
    // Path to the status file
    const statusFilePath = path.join(backendPath, 'status.json');
    
    // Check if the status file exists
    if (fs.existsSync(statusFilePath)) {
      // Update the status to stopped
      const statusData = {
        currentNode: "stopped",
        requiresInput: false,
        questions: null
      };
      
      // Write the updated status
      fs.writeFileSync(statusFilePath, JSON.stringify(statusData, null, 2));
      
      // Create a stop_analysis.txt file to signal the process to stop
      const stopFilePath = path.join(backendPath, 'stop_analysis.txt');
      fs.writeFileSync(stopFilePath, 'stop');
      
      // Find and kill any running Python processes for the analysis
      try {
        // Get the path to the virtual environment's Python interpreter
        const pythonPath = path.join(backendPath, '.venv', 'bin', 'python');
        
        // This command works on macOS/Linux to find and kill Python processes running main.py
        // We need to be more specific to target the virtual environment's Python
        await execPromise(`pkill -f '${pythonPath} main.py'`, { cwd: backendPath });
      } catch (error) {
        // It's okay if this fails - it might mean no processes were running
        console.log('No running analysis processes found or unable to kill processes');
      }
      
      return NextResponse.json({ success: true, message: 'Analysis stopped successfully' });
    } else {
      return NextResponse.json({ success: true, message: 'No running analysis found' });
    }
  } catch (error) {
    console.error('Error stopping analysis:', error);
    return NextResponse.json(
      { error: 'Failed to stop analysis' },
      { status: 500 }
    );
  }
}
