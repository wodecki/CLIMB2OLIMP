import { NextRequest, NextResponse } from 'next/server';
import { AnswerData, QuestionnaireData, LetterAnswer } from '@/types/questionnaire';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// Helper functions
function getQuestionnaireData(): QuestionnaireData {
  const backendDataPath = path.join(process.cwd(), '..', 'backend', 'data');
  const filePath = path.join(backendDataPath, 'CLIMB2.json');
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

function convertToLetterAnswers(questionnaireData: QuestionnaireData, answerData: AnswerData): LetterAnswer {
  const letterAnswers: LetterAnswer = {};
  
  for (const [category, questions] of Object.entries(questionnaireData)) {
    letterAnswers[category] = [];
    
    if (answerData[category]) {
      for (const [questionText, questionOptions] of Object.entries(questions)) {
        const answerText = answerData[category][questionText];
        if (answerText) {
          // Find the letter for this answer
          for (const [letter, description] of Object.entries(questionOptions)) {
            if (description === answerText) {
              letterAnswers[category].push(letter);
              break;
            }
          }
        }
      }
    }
  }
  
  return letterAnswers;
}

function saveAnswerData(answerData: AnswerData, letterAnswers: LetterAnswer): void {
  const backendDataPath = path.join(process.cwd(), '..', 'backend', 'data');
  
  // Save the JSON format
  const jsonFilePath = path.join(backendDataPath, 'answer_1.json');
  fs.writeFileSync(jsonFilePath, JSON.stringify(answerData, null, 4), 'utf8');
  
  // Save the text format
  const txtFilePath = path.join(backendDataPath, 'answer_1.txt');
  let txtContent = '';
  for (const [category, answers] of Object.entries(letterAnswers)) {
    txtContent += `# ${category}\n`;
    txtContent += `${answers.join(',')}\n`;
  }
  fs.writeFileSync(txtFilePath, txtContent, 'utf8');
  
  console.log('Answer data saved successfully');
}

async function calculateMaturityLevels(answerData: AnswerData): Promise<void> {
  return new Promise((resolve, reject) => {
    const backendPath = path.join(process.cwd(), '..', 'backend');
    const pythonPath = path.join(backendPath, '.venv', 'bin', 'python');
    
    // Create a Python script to calculate maturity levels
    const pythonScript = `
import sys
import os
sys.path.append('${backendPath}')
import json
from graph.nodes.maturity_level import calculate_maturity_level
from graph.state import OverallState

# Load the questionnaire data
questionnaire_data = ${JSON.stringify(answerData)}
print("Questionnaire data loaded:", questionnaire_data)

# Create state
state = OverallState({'questionnaire': questionnaire_data})
print("State created")

# Calculate maturity levels
result = calculate_maturity_level(state)
print("Maturity levels calculated:", result)
`;

    // Write the script to a temporary file
    const scriptPath = path.join(backendPath, 'temp_calculate_maturity.py');
    fs.writeFileSync(scriptPath, pythonScript);
    
    // Execute the Python script
    const pythonProcess = spawn(pythonPath, [scriptPath], { 
      cwd: backendPath,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      // Clean up the temporary script
      try {
        fs.unlinkSync(scriptPath);
      } catch (err) {
        console.error('Error cleaning up script:', err);
      }
      
      if (code === 0) {
        console.log('Maturity levels calculated successfully');
        console.log('Python output:', stdout);
        resolve();
      } else {
        console.error('Error calculating maturity levels:', stderr);
        reject(new Error(`Python process exited with code ${code}: ${stderr}`));
      }
    });
    
    pythonProcess.on('error', (error) => {
      console.error('Error spawning Python process:', error);
      reject(error);
    });
  });
}

export async function GET() {
  try {
    const data = getQuestionnaireData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching questionnaire data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questionnaire data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const answerData: AnswerData = await request.json();
    
    // Get the questionnaire data to convert answers to letters
    const questionnaireData: QuestionnaireData = getQuestionnaireData();
    const letterAnswers = convertToLetterAnswers(questionnaireData, answerData);
    
    // Save the answer data
    saveAnswerData(answerData, letterAnswers);
    
    // Calculate maturity levels immediately after saving
    console.log('Calculating maturity levels...');
    await calculateMaturityLevels(answerData);
    console.log('Maturity levels calculation completed');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving questionnaire data:', error);
    return NextResponse.json(
      { error: 'Failed to save questionnaire data' },
      { status: 500 }
    );
  }
}
