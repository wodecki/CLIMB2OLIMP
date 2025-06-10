import React from 'react';
import Link from 'next/link';

export default function About() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">About Managerial Problem Solver</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Overview</h2>
          <p className="text-gray-700 mb-4">
            The Managerial Problem Solver is a sophisticated tool designed to help organizations diagnose and address managerial challenges. By leveraging a multi-agent system built with LangGraph, it provides detailed analysis and actionable recommendations based on your responses to the questionnaire.
          </p>
          <p className="text-gray-700 mb-4">
            This application uses advanced AI techniques to simulate a team of specialized analysts, each focusing on different aspects of management and organizational development.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">How It Works</h2>
          <ol className="list-decimal pl-6 space-y-3 text-gray-700">
            <li>
              <strong>Complete the Questionnaire</strong> - Answer questions across various categories related to your organization's management practices.
            </li>
            <li>
              <strong>AI Analysis</strong> - Our multi-agent system processes your responses, with each agent analyzing specific aspects of your organization.
            </li>
            <li>
              <strong>Comprehensive Report</strong> - Receive a detailed report with diagnosis, recommendations, and an implementation roadmap.
            </li>
            <li>
              <strong>Implementation</strong> - Use the insights and recommendations to improve your organization's management practices.
            </li>
          </ol>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Analyst Team</h2>
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-900">Data Governance Analyst</h3>
              <p className="text-gray-600">Focuses on data quality, availability, and security to support AI adoption.</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-900">Change Management Specialist</h3>
              <p className="text-gray-600">Specializes in team structures, training programs, and organizational development.</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-900">Process Improvement Consultant</h3>
              <p className="text-gray-600">Examines workflows and processes to identify inefficiencies and opportunities for AI integration.</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-900">Decision Science Advisor</h3>
              <p className="text-gray-600">Guides strategic decision-making and establishes governance frameworks for AI solutions.</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-900">Technical Implementation Specialist</h3>
              <p className="text-gray-600">Oversees technical design and integration of AI platforms with existing systems.</p>
            </div>
          </div>
        </section>
        
        <div className="mt-8 text-center">
          <Link 
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Start Questionnaire
          </Link>
        </div>
      </div>
    </main>
  );
}
