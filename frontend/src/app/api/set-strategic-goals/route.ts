import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { goal } = body;
    
    if (!goal || typeof goal !== 'string' || !['A', 'B', 'C', 'D', 'E'].includes(goal.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid goal. Must be one of: A, B, C, D, E' },
        { status: 400 }
      );
    }
    
    // Path to the backend directory
    const backendPath = path.join(process.cwd(), '..', 'backend');
    
    // Path to a temporary file to store the user input
    const inputFilePath = path.join(backendPath, 'user_input.txt');
    
    // Write the user input to the file
    fs.writeFileSync(inputFilePath, goal.toUpperCase());
    
    // Execute a command to send the input to the running process
    // This assumes there's a script in the backend that can read from the file and send it to the process
    try {
      // Check if there's a process ID file
      const pidFilePath = path.join(backendPath, 'analysis_pid.txt');
      if (fs.existsSync(pidFilePath)) {
        const pid = fs.readFileSync(pidFilePath, 'utf-8').trim();
        
        // On Unix-like systems, we can use the 'kill' command to send a signal to the process
        // This is a custom signal (SIGUSR1) that the backend process should handle
        if (process.platform !== 'win32') {
          await execAsync(`/bin/kill -USR1 ${pid}`);
        } else {
          // On Windows, we would need a different approach
          // For now, we'll just rely on the backend checking for the file periodically
          console.log('Windows platform detected, relying on file polling');
        }
      }
    } catch (execError) {
      console.error('Error signaling process:', execError);
      // Continue anyway, as the backend might be polling for the file
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting strategic goals:', error);
    return NextResponse.json(
      { error: 'Failed to set strategic goals' },
      { status: 500 }
    );
  }
}
