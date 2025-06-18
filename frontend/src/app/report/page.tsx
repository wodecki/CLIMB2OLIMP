 'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

// Component that uses useSearchParams
function ReportContent() {
  const searchParams = useSearchParams();
  const reportPath = searchParams.get('path');
  
  const [reportContent, setReportContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        // If a report path is provided, include it in the request
        // Otherwise, the API will return the most recent report
        const url = reportPath
          ? `/api/report?path=${encodeURIComponent(reportPath)}`
          : '/api/report';
          
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch report');
        }
        
        const data = await response.json();
        // Clean up the content by removing metadata and fixing formatting
        let cleanContent = data.content;
        
        // Remove the metadata header that starts with "# FINAL CONSENSUS RECOMMENDATION REPORT\n\n**Generated from"
        // and ends with the first "---" separator
        const metadataPattern = /^# FINAL CONSENSUS RECOMMENDATION REPORT\\n\\n\*\*Generated from[\s\S]*?---\s*\n\n/;
        cleanContent = cleanContent.replace(metadataPattern, '');
        
        // Also handle the case where the content might have literal \n instead of actual newlines
        cleanContent = cleanContent.replace(/\\n/g, '\n');
        
        // Remove any remaining metadata at the beginning
        const lines = cleanContent.split('\n');
        let startIndex = 0;
        
        // Skip lines that look like metadata (contain "Generated from", "Branches:", "Consensus Model:", etc.)
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.includes('Generated from') || 
              line.includes('Branches:') || 
              line.includes('Consensus Model:') || 
              line.includes('Timestamp:') ||
              line === '---' ||
              line === '') {
            startIndex = i + 1;
          } else if (line.startsWith('#') || line.startsWith('**')) {
            // Found actual content
            break;
          }
        }
        
        cleanContent = lines.slice(startIndex).join('\n').trim();
        
        // Ensure we start with a proper title
        if (!cleanContent.startsWith('#')) {
          cleanContent = '# Strategiczny Raport Transformacji AI\n\n' + cleanContent;
        }
        
        setReportContent(cleanContent);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Nie udało się załadować raportu. Spróbuj ponownie później.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [reportPath]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const content = reportRef.current?.innerHTML || '';
      printWindow.document.write(`
        <html>
          <head>
            <title>Raport Analizy</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
              }
              h1, h2, h3, h4, h5, h6 {
                color: #2563eb;
                margin-top: 1.5em;
                margin-bottom: 0.5em;
              }
              h1 { font-size: 2.5em; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.3em; }
              h2 { font-size: 2em; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; }
              h3 { font-size: 1.5em; }
              p { margin-bottom: 1em; }
              ul, ol { margin-bottom: 1em; padding-left: 2em; }
              li { margin-bottom: 0.5em; }
              table {
                border-collapse: collapse;
                width: 100%;
                margin-bottom: 1em;
              }
              th, td {
                border: 1px solid #e5e7eb;
                padding: 8px 12px;
                text-align: left;
              }
              th {
                background-color: #f3f4f6;
                font-weight: bold;
              }
              tr:nth-child(even) {
                background-color: #f9fafb;
              }
              blockquote {
                border-left: 4px solid #e5e7eb;
                padding-left: 1em;
                margin-left: 0;
                color: #6b7280;
              }
              code {
                font-family: monospace;
                background-color: #f3f4f6;
                padding: 0.2em 0.4em;
                border-radius: 3px;
              }
              pre {
                background-color: #f3f4f6;
                padding: 1em;
                border-radius: 5px;
                overflow-x: auto;
              }
              pre code {
                background-color: transparent;
                padding: 0;
              }
              hr {
                border: 0;
                border-top: 1px solid #e5e7eb;
                margin: 2em 0;
              }
              img {
                max-width: 100%;
                height: auto;
              }
              a {
                color: #2563eb;
                text-decoration: none;
              }
              a:hover {
                text-decoration: underline;
              }
            </style>
          </head>
          <body>
            <h1>Raport Analizy</h1>
            ${content}
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownload = () => {
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analysis_report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Błąd!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <div className="mt-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Powrót do Kwestionariusza
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-blue-700">Raport Analizy</h1>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Drukuj Raport
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Pobierz
          </button>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Powrót do Kwestionariusza
          </Link>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <div
          ref={reportRef}
          className="prose prose-lg max-w-none prose-headings:text-blue-700 prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h2:border-b prose-h2:pb-2 prose-h2:border-gray-200 prose-h3:text-xl prose-p:text-gray-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-800 prose-strong:font-bold prose-strong:text-gray-900"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto my-8">
                  <table className="min-w-full divide-y divide-gray-300 border border-gray-300" {...props} />
                </div>
              ),
              thead: ({ node, ...props }) => (
                <thead className="bg-gray-50" {...props} />
              ),
              tbody: ({ node, ...props }) => (
                <tbody className="divide-y divide-gray-200 bg-white" {...props} />
              ),
              tr: ({ node, ...props }) => (
                <tr className="hover:bg-gray-50" {...props} />
              ),
              th: ({ node, ...props }) => (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" {...props} />
              ),
              td: ({ node, ...props }) => (
                <td className="px-6 py-4 whitespace-normal text-sm text-gray-800" {...props} />
              ),
              h1: ({ node, ...props }) => (
                <h1 className="text-3xl font-bold text-blue-700 mt-8 mb-4" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-2xl font-semibold text-blue-700 mt-6 mb-3 pb-2 border-b border-gray-200" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-xl font-semibold text-blue-700 mt-5 mb-2" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc pl-6 my-4 space-y-2" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal pl-6 my-4 space-y-2" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className="text-gray-800 pl-2" {...props} />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-4" {...props} />
              ),
              code: ({ node, className, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !match && !className?.includes('\n');
                return isInline
                  ? <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-blue-800" {...props} />
                  : <code className="block bg-gray-100 p-4 rounded text-sm font-mono text-blue-800 overflow-x-auto" {...props} />;
              },
              hr: ({ node, ...props }) => (
                <hr className="my-8 border-t border-gray-300" {...props} />
              ),
            }}
          >
            {reportContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}
