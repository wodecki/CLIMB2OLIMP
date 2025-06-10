import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    // Path to the backend directory
    const backendPath = path.join(process.cwd(), '..', 'backend');
    
    // Path to the status file
    const statusFilePath = path.join(backendPath, 'status.json');
    
    // Check if the status file exists
    if (!fs.existsSync(statusFilePath)) {
      return NextResponse.json(
        { 
          currentNode: "not_running",
          requiresInput: false,
          questions: null
        },
        { status: 200 }
      );
    }
    
    // Read the status file
    const statusData = fs.readFileSync(statusFilePath, 'utf-8');
    const status = JSON.parse(statusData);
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error checking analysis status:', error);
    return NextResponse.json(
      { error: 'Failed to check analysis status' },
      { status: 500 }
    );
  }
}
