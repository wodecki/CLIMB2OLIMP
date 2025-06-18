import { NextRequest, NextResponse } from 'next/server';
import { GapData } from '@/types/questionnaire';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { selectedAreas } = await request.json();
    
    console.log('Computing gaps for selected areas:', selectedAreas);
    
    // CLEANUP: Remove previous session artifacts before processing new selection
    const olimpDataPath = path.join(process.cwd(), '..', 'OLIMP', 'data', 'process');
    const configPath = path.join(process.cwd(), '..', 'OLIMP', 'config');
    
    // Files to clean up from previous sessions
    const reportsPath = path.join(process.cwd(), '..', 'OLIMP', 'data', 'reports');
    const filesToClean = [
      path.join(olimpDataPath, 'A_gaps.json'),
      path.join(configPath, 'areas_for_improvement.toml'),
      // Clean analysis state files
      path.join(process.cwd(), '..', 'OLIMP', 'analysis_pid.txt'),
      path.join(process.cwd(), '..', 'OLIMP', 'stop_analysis.txt'),
      path.join(process.cwd(), '..', 'OLIMP', 'analysis_complete.txt'),
      path.join(process.cwd(), '..', 'OLIMP', 'analysis_error.txt'),
      // Clean previous reports to force regeneration
      path.join(reportsPath, 'A_recommendations.md'),
      path.join(reportsPath, 'A_recommendations_CONSENSUS_FINAL.md')
    ];
    
    console.log('🧹 Cleaning up previous session artifacts...');
    let cleanedFiles = 0;
    
    for (const filePath of filesToClean) {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`   ✓ Removed: ${path.basename(filePath)}`);
          cleanedFiles++;
        } catch (err) {
          console.log(`   ⚠ Failed to remove ${path.basename(filePath)}:`, err);
        }
      }
    }
    
    // Also clean interim reports directory
    const interimReportsPath = path.join(reportsPath, 'interim_reports');
    if (fs.existsSync(interimReportsPath)) {
      try {
        const interimFiles = fs.readdirSync(interimReportsPath);
        let interimCleaned = 0;
        for (const file of interimFiles) {
          if (file.endsWith('.md')) {
            const filePath = path.join(interimReportsPath, file);
            fs.unlinkSync(filePath);
            interimCleaned++;
          }
        }
        if (interimCleaned > 0) {
          console.log(`   ✓ Removed ${interimCleaned} interim report files`);
          cleanedFiles += interimCleaned;
        }
      } catch (err) {
        console.log(`   ⚠ Failed to clean interim reports:`, err);
      }
    }
    
    console.log(`🧹 Cleanup completed: ${cleanedFiles} files removed\n`);
    
    // Read OLIMP answers (A_2.json)
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
    
    // DYNAMIC CONFIG GENERATION: Create areas_for_improvement.toml based on user selection
    const configFilePath = path.join(configPath, 'areas_for_improvement.toml');
    
    // Ensure config directory exists
    if (!fs.existsSync(configPath)) {
      fs.mkdirSync(configPath, { recursive: true });
    }
    
    // Generate TOML content with user-selected areas
    const tomlContent = `# Configuration for areas to analyze for gaps in OLIMP questionnaire
# These sections will be analyzed to identify improvement opportunities
# Dynamically generated based on user priority selection

[gap_analysis]
target_sections = [
${selectedAreas.map((area: string) => `    "${area}"`).join(',\n')}
]

# Generated at: ${new Date().toISOString()}
# Selected areas count: ${selectedAreas.length}
`;
    
    // Write the dynamic configuration
    fs.writeFileSync(configFilePath, tomlContent);
    console.log(`✅ Dynamic config generated: ${configFilePath}`);
    console.log(`📋 Target sections: ${selectedAreas.join(', ')}`);
    
    // Print essential summary
    const totalQuestions = Object.values(gaps).reduce((sum, sectionGaps) => 
      sum + Object.keys(sectionGaps).length, 0
    );
    
    console.log(`Gaps analysis completed: ${totalQuestions} questions across ${Object.keys(gaps).length} sections`);
    console.log(`Gaps saved to: ${gapsFilePath}`);
    
    return NextResponse.json({
      success: true,
      message: 'Gaps computed successfully and config generated',
      gaps: gaps,
      summary: {
        totalQuestions,
        sectionsAnalyzed: Object.keys(gaps).length,
        selectedAreas: selectedAreas.length,
        gapsFilePath: gapsFilePath,
        configFilePath: configFilePath
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