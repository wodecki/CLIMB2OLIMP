import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Simple in-memory cache to avoid re-reading files
const reportCache = new Map<string, { content: string, mtime: number }>();

// Clear cache endpoint (for development)
export async function DELETE() {
  reportCache.clear();
  return NextResponse.json({ message: 'Report cache cleared' });
}

// Function to clean up report content by removing unwanted artifacts
function cleanReportContent(content: string): string {
  // Handle \\n literal strings that should be newlines
  if (content.includes('\\n')) {
    content = content.replace(/\\n/g, '\n');
  }
  
  // Remove metadata header in one pass using a more specific pattern
  const metadataPattern = /^# FINAL CONSENSUS RECOMMENDATION REPORT[\s\S]*?---\s*\n/;
  content = content.replace(metadataPattern, '');
  
  // Remove conversational preambles that might start the report
  const conversationalPatterns = [
    /^Jasne,\s*oto\s+[^.]*\./,
    /^Oczywiście,\s*[^.]*\./,
    /^Przedstawiam\s+[^.]*\./,
    /^Przygotowałem\s+[^.]*\./,
    /^Poniżej\s+znajduje\s+się\s+[^.]*\./
  ];
  
  for (const pattern of conversationalPatterns) {
    content = content.replace(pattern, '');
  }
  
  // Clean up any remaining artifacts at the beginning
  content = content.replace(/^[\s\n]*---[\s\n]*/, '');
  content = content.replace(/^\n+/, '');
  content = content.replace(/^\*+\s*\n/, ''); // Remove asterisk separators
  
  // Ensure we start with a proper title if content doesn't start with #
  if (!content.trim().startsWith('#')) {
    const firstLine = content.split('\n')[0];
    if (firstLine && !firstLine.startsWith('#')) {
      content = '# ' + firstLine + '\n\n' + content.substring(firstLine.length).replace(/^\n+/, '');
    }
  }
  
  return content.trim();
}

export async function GET(request: Request) {
  try {
    // Get the report path from the query parameters
    const { searchParams } = new URL(request.url);
    const reportPath = searchParams.get('path');
    
    // Path to the OLIMP reports directory
    const olimpPath = path.join(process.cwd(), '..', 'OLIMP');
    const reportsDir = path.join(olimpPath, 'data', 'reports');
    
    // If a specific report path is provided, use it
    if (reportPath) {
      // Check if the report path is absolute or relative
      let fullReportPath;
      if (path.isAbsolute(reportPath)) {
        // If it's an absolute path, use it directly
        fullReportPath = reportPath;
      } else {
        // If it's a relative path, join it with the OLIMP path
        fullReportPath = path.join(olimpPath, reportPath);
      }
      
      // Check if the file exists
      if (!fs.existsSync(fullReportPath)) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }
      
      // Check cache first
      const stats = fs.statSync(fullReportPath);
      const cacheKey = fullReportPath;
      const cached = reportCache.get(cacheKey);
      
      let reportContent: string;
      if (cached && cached.mtime === stats.mtime.getTime()) {
        // Use cached content
        reportContent = cached.content;
      } else {
        // Read and clean the report file
        const rawContent = fs.readFileSync(fullReportPath, 'utf8');
        reportContent = cleanReportContent(rawContent);
        
        // Cache the cleaned content
        reportCache.set(cacheKey, { 
          content: reportContent, 
          mtime: stats.mtime.getTime() 
        });
      }
      
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
      
      // Filter for consensus report first, then other report files
      let reportFiles = files.filter(file => file === 'A_recommendations_CONSENSUS_FINAL.md');
      
      // If no consensus report, look for other reports
      if (reportFiles.length === 0) {
        reportFiles = files.filter(file => 
          (file.startsWith('A_recommendations') || file.startsWith('report_')) && 
          file.endsWith('.md') && 
          !file.includes('_branch_') && 
          !file.includes('_evaluation_')
        );
      }
      
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
      
      // Check cache first
      const stats = fs.statSync(fullReportPath);
      const cacheKey = fullReportPath;
      const cached = reportCache.get(cacheKey);
      
      let reportContent: string;
      if (cached && cached.mtime === stats.mtime.getTime()) {
        // Use cached content
        reportContent = cached.content;
      } else {
        // Read and clean the report file
        const rawContent = fs.readFileSync(fullReportPath, 'utf8');
        reportContent = cleanReportContent(rawContent);
        
        // Cache the cleaned content
        reportCache.set(cacheKey, { 
          content: reportContent, 
          mtime: stats.mtime.getTime() 
        });
      }
      
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
