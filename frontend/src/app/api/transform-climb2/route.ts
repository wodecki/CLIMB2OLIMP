import { NextRequest, NextResponse } from 'next/server';
import { AnswerData, LetterAnswer, QuestionnaireData } from '@/types/questionnaire';
import { CATEGORY_TRANSLATIONS } from '@/utils/categoryTranslations';
import fs from 'fs';
import path from 'path';

// Convert answer data to letter format
function convertToLetterAnswers(
  questionnaireData: QuestionnaireData,
  answerData: AnswerData
): LetterAnswer {
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

export async function POST(request: NextRequest) {
  try {
    const { answerData, questionnaireData } = await request.json() as {
      answerData: AnswerData;
      questionnaireData: QuestionnaireData;
    };
    
    // Convert to letter answers
    const letterAnswers = convertToLetterAnswers(questionnaireData, answerData);
    
    console.log('Transforming CLIMB2 data to A_1.json format...');
    
    // Create the OLIMP data directory if it doesn't exist
    const olimpDataPath = path.join(process.cwd(), '..', 'OLIMP', 'data', 'process');
    if (!fs.existsSync(olimpDataPath)) {
      fs.mkdirSync(olimpDataPath, { recursive: true });
    }
    
    // Transform CLIMB2 structure to A_1.json format
    // Use the questionnaire data that was passed from the frontend instead of reading files
    if (!questionnaireData || Object.keys(questionnaireData).length === 0) {
      throw new Error('Invalid questionnaire data provided');
    }
    
    const climb2Structure = questionnaireData;
    
    // Map CLIMB2 categories to OLIMP format using translations
    const categoryMapping: { [key: string]: string } = {};
    Object.keys(CATEGORY_TRANSLATIONS).forEach(technicalName => {
      categoryMapping[technicalName] = technicalName.toUpperCase();
    });
    
    // Create A_1.json structure
    const a1JsonStructure = {
      questionnaire: "CLIMB_2",
      questionnaire_title: "Kwestionariusz dla modelu CLIMB2",
      sections: [] as any[]
    };
    
    // Process each category
    for (const [climb2Category, climb2Questions] of Object.entries(climb2Structure)) {
      const olimpSectionName = categoryMapping[climb2Category] || climb2Category;
      const userAnswers = answerData[climb2Category] || {};
      const userLetterAnswers = letterAnswers[climb2Category] || [];
      
      const questions: any[] = [];
      let questionIndex = 0;
      
      // Process each question in the category
      for (const [questionText, answerOptions] of Object.entries(climb2Questions as any)) {
        const userAnswer = userAnswers[questionText];
        let selectedAnswer = '';
        
        // Find the selected letter answer
        if (userAnswer && answerOptions) {
          for (const [letter, description] of Object.entries(answerOptions as any)) {
            if (description === userAnswer) {
              selectedAnswer = letter;
              break;
            }
          }
        }
        
        // If we couldn't find it from text matching, use the letter answer directly
        if (!selectedAnswer && userLetterAnswers[questionIndex]) {
          selectedAnswer = userLetterAnswers[questionIndex];
        }
        
        questions.push({
          question_text: questionText,
          answer_options: answerOptions,
          selected_answer: selectedAnswer
        });
        
        questionIndex++;
      }
      
      a1JsonStructure.sections.push({
        section_name: olimpSectionName,
        question_count: questions.length,
        questions: questions
      });
    }
    
    // Save A_1.json
    const a1JsonPath = path.join(olimpDataPath, 'A_1.json');
    fs.writeFileSync(a1JsonPath, JSON.stringify(a1JsonStructure, null, 2));
    
    console.log(`CLIMB2 data transformed and saved to: ${a1JsonPath}`);
    console.log(`Sections processed: ${a1JsonStructure.sections.length}`);
    
    // Also create the integrated A.json file that OLIMP expects
    const aJsonStructure = {
      CLIMB_2: a1JsonStructure
    };
    
    const aJsonPath = path.join(olimpDataPath, 'A.json');
    fs.writeFileSync(aJsonPath, JSON.stringify(aJsonStructure, null, 2));
    
    console.log(`Integrated A.json saved to: ${aJsonPath}`);
    
    return NextResponse.json({
      success: true,
      message: 'CLIMB2 data transformed successfully',
      files: {
        a1Json: a1JsonPath,
        aJson: aJsonPath
      },
      summary: {
        sectionsProcessed: a1JsonStructure.sections.length,
        totalQuestions: a1JsonStructure.sections.reduce((sum, section) => sum + section.question_count, 0)
      }
    });
    
  } catch (error) {
    console.error('Error transforming CLIMB2 data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to transform CLIMB2 data' },
      { status: 500 }
    );
  }
}