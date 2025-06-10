export interface QuestionOption {
  [key: string]: string; // e.g., "A": "The cross-functional team does not exist in the product development process."
}

export interface Question {
  [key: string]: QuestionOption; // e.g., "How is the cross-functional team involved in the product development process?": { ... }
}

export interface QuestionnaireData {
  [key: string]: Question; // e.g., "Roles and Collaboration": { ... }
}

export interface Answer {
  [key: string]: string; // e.g., "How is the cross-functional team involved in the product development process?": "The cross-functional team is involved in most stages of product development."
}

export interface AnswerData {
  [key: string]: Answer; // e.g., "Roles and Collaboration": { ... }
}

export interface LetterAnswer {
  [key: string]: string[]; // e.g., "Roles and Collaboration": ["C", "E", "D", "B", "D", "C", "E"]
}

export interface CategoryProgress {
  [key: string]: {
    total: number;
    answered: number;
  };
}

// OLIMP-specific types
export interface OlimpQuestion {
  question_text: string;
  answer_options: {
    [key: string]: string; // "A", "B", "C", "D", "E"
  };
  selected_answer?: string;
}

export interface OlimpSection {
  section_name: string;
  question_count: number;
  questions: OlimpQuestion[];
}

export interface OlimpQuestionnaireData {
  questionnaire: string;
  questionnaire_title: string;
  sections: OlimpSection[];
}

export interface OlimpAnswerData {
  questionnaire: string;
  questionnaire_title: string;
  sections: OlimpSection[];
}

// Priority selection types
export interface PriorityArea {
  name: string;
  selected: boolean;
}

export interface GapStep {
  level: string;
  description: string;
}

export interface Gap {
  present: {
    level: string;
    description: string;
  };
  steps: GapStep[];
}

export interface GapData {
  [sectionName: string]: {
    [questionText: string]: Gap;
  };
}
