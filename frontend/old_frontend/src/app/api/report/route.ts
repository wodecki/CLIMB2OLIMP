import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    // Get the report path from the query parameters
    const { searchParams } = new URL(request.url);
    const reportPath = searchParams.get('path');
    
    // Path to the backend directory
    const backendPath = path.join(process.cwd(), '..', 'backend');
    const reportsDir = path.join(backendPath, 'reports');
    
    // If a specific report path is provided, use it
    if (reportPath) {
      // Check if the report path is absolute or relative
      let fullReportPath;
      if (path.isAbsolute(reportPath)) {
        // If it's an absolute path, use it directly
        fullReportPath = reportPath;
      } else {
        // If it's a relative path, join it with the backend path
        fullReportPath = path.join(backendPath, reportPath);
      }
      
      // Check if the file exists
      if (!fs.existsSync(fullReportPath)) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }
      
      // Read the report file
      const reportContent = fs.readFileSync(fullReportPath, 'utf8');
      
      return NextResponse.json({
        content: reportContent
      });
    } 
    // If no report path is provided, get the most recent report
    else {
      // Check if the reports directory exists
      if (!fs.existsSync(reportsDir)) {
        return NextResponse.json(
          { error: 'Reports directory not found' },
          { status: 404 }
        );
      }
      
      // Get all files in the reports directory
      const files = fs.readdirSync(reportsDir);
      
      // Filter for report files (not error reports)
      const reportFiles = files.filter(file => file.startsWith('report_') && file.endsWith('.md'));
      
      // If no report files found, return an error
      if (reportFiles.length === 0) {
        return NextResponse.json(
          { error: 'No reports found' },
          { status: 404 }
        );
      }
      
      // Sort the report files by date (newest first)
      reportFiles.sort((a, b) => {
        const aTime = fs.statSync(path.join(reportsDir, a)).mtime.getTime();
        const bTime = fs.statSync(path.join(reportsDir, b)).mtime.getTime();
        return bTime - aTime;
      });
      
      // Get the most recent report
      const mostRecentReport = reportFiles[0];
      const fullReportPath = path.join(reportsDir, mostRecentReport);
      
      // Read the report file
      const reportContent = fs.readFileSync(fullReportPath, 'utf8');
      
      return NextResponse.json({
        content: reportContent
      });
    }
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}
