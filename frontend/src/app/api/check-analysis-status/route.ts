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
    
    // If analysis is completed, add the most recent report path
    if (status.currentNode === 'completed') {
      const reportsPath = path.join(backendPath, 'reports');
      
      if (fs.existsSync(reportsPath)) {
        try {
          const reportFiles = fs.readdirSync(reportsPath)
            .filter(file => file.startsWith('report_') && file.endsWith('.md'))
            .map(file => ({
              name: file,
              path: path.join(reportsPath, file),
              mtime: fs.statSync(path.join(reportsPath, file)).mtime
            }))
            .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
          
          if (reportFiles.length > 0) {
            status.reportPath = reportFiles[0].path;
          }
        } catch (err) {
          console.error('Error finding report files:', err);
        }
      }
    }
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error checking analysis status:', error);
    return NextResponse.json(
      { error: 'Failed to check analysis status' },
      { status: 500 }
    );
  }
}
