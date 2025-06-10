import { NextRequest, NextResponse } from 'next/server';
import { GapData } from '@/types/questionnaire';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { selectedAreas } = await request.json();
    
    console.log('Computing gaps for selected areas:', selectedAreas);
    
    // Read OLIMP answers (A_2.json)
    const olimpDataPath = path.join(process.cwd(), '..', 'OLIMP', 'data', 'process');
    const olimpAnswersPath = path.join(olimpDataPath, 'A_2.json');
    
    if (!fs.existsSync(olimpAnswersPath)) {
      throw new Error('OLIMP answers not found. Please complete the OLIMP questionnaire first.');
    }
    
    const olimpAnswers = JSON.parse(fs.readFileSync(olimpAnswersPath, 'utf-8'));
    
    // Answer level progression mapping
    const levelProgression: { [key: string]: string[] } = {
      'A': ['B', 'C', 'D', 'E'],
      'B': ['C', 'D', 'E'],
      'C': ['D', 'E'],
      'D': ['E'],
      'E': [] // Already at maximum
    };
    
    const gaps: GapData = {};
    
    // Check if sections exist
    if (!olimpAnswers.sections) {
      throw new Error('Invalid OLIMP answers format');
    }
    
    // Process each target section
    for (const section of olimpAnswers.sections) {
      const sectionName = section.section_name;
      
      if (selectedAreas.includes(sectionName)) {
        gaps[sectionName] = {};
        
        // Process each question in the section
        for (const question of section.questions) {
          const questionText = question.question_text;
          const selectedAnswer = question.selected_answer;
          const answerOptions = question.answer_options;
          
          if (selectedAnswer && selectedAnswer in levelProgression) {
            const stepsToE = levelProgression[selectedAnswer];
            
            // Get verbose descriptions for present state and steps
            const presentVerbose = answerOptions[selectedAnswer] || '';
            const stepsVerbose = stepsToE.map(step => ({
              level: step,
              description: answerOptions[step] || ''
            }));
            
            gaps[sectionName][questionText] = {
              present: {
                level: selectedAnswer,
                description: presentVerbose
              },
              steps: stepsVerbose
            };
          }
        }
      }
    }
    
    // Save gaps to JSON file
    const gapsFilePath = path.join(olimpDataPath, 'A_gaps.json');
    fs.writeFileSync(gapsFilePath, JSON.stringify(gaps, null, 2));
    
    // Print essential summary
    const totalQuestions = Object.values(gaps).reduce((sum, sectionGaps) => 
      sum + Object.keys(sectionGaps).length, 0
    );
    
    console.log(`Gaps analysis completed: ${totalQuestions} questions across ${Object.keys(gaps).length} sections`);
    console.log(`Gaps saved to: ${gapsFilePath}`);
    
    return NextResponse.json({
      success: true,
      message: 'Gaps computed successfully',
      gaps: gaps,
      summary: {
        totalQuestions,
        sectionsAnalyzed: Object.keys(gaps).length,
        filePath: gapsFilePath
      }
    });
    
  } catch (error) {
    console.error('Error computing gaps:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to compute gaps' },
      { status: 500 }
    );
  }
}