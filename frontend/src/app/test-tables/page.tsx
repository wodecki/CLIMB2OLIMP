'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const testMarkdown = `# Test Report with Tables

This is a test markdown file to verify table rendering.

## Simple Table

| Column 1 | Column 2 | Column 3 |
| :--- | :--- | :--- |
| Row 1, Col 1 | Row 1, Col 2 | Row 1, Col 3 |
| Row 2, Col 1 | Row 2, Col 2 | Row 2, Col 3 |

## Complex Table with Bold Text

| Obszar | Średni Poziom Obecny | Poziom Docelowy | Kluczowe Wyzwanie |
| :--- | :--- | :--- | :--- |
| **BUDŻET** | **B-** | **E** | Brak strategicznej dyscypliny i priorytetyzacji opartej na wartości |
| **PRODUKTY I USŁUGI** | **C+/D-** | **E** | Niesystematyczne wdrażanie, luki w automatyzacji procesów pomocniczych |
| **ETYKA I REGULACJE** | **B** | **E** | Krytyczny brak fundamentów ładu korporacyjnego, bezpieczeństwa i zgodności |

## Budget Table

| Kategoria | Faza 1 (0-6 mies.) | Faza 2 (6-18 mies.) | Faza 3 (18-36 mies.) | **Suma (PLN)** |
| :--- | :--- | :--- | :--- | :--- |
| **Talent i Zasoby Ludzkie** | 800 000 | 2 500 000 | 3 500 000 | **6 800 000** |
| **Szkolenia i Rozwój** | 500 000 | 800 000 | 600 000 | **1 900 000** |
| **Technologie i Infrastruktura** | 1 200 000 | 1 800 000 | 2 000 000 | **5 000 000** |

This should render as proper HTML tables with the improvements made to the frontend.`;

export default function TestTablesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="prose prose-lg max-w-none prose-headings:text-blue-700 prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h2:border-b prose-h2:pb-2 prose-h2:border-gray-200 prose-h3:text-xl prose-p:text-gray-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-800 prose-strong:font-bold prose-strong:text-gray-900">
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
            }}
          >
            {testMarkdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}