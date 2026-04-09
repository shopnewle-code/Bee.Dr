/**
 * Security Questions Management
 * Predefined security questions for account recovery
 */

export interface SecurityQuestion {
  id: string;
  question: string;
  category: 'personal' | 'family' | 'location' | 'preference';
}

/**
 * Predefined security questions
 * Users will select 3 from this list
 */
export const PREDEFINED_QUESTIONS: SecurityQuestion[] = [
  {
    id: '1',
    question: "What is your mother's first name?",
    category: 'family',
  },
  {
    id: '2',
    question: 'What was the name of your first school?',
    category: 'personal',
  },
  {
    id: '3',
    question: 'What is your birth city?',
    category: 'location',
  },
  {
    id: '4',
    question: 'What is your favorite food?',
    category: 'preference',
  },
  {
    id: '5',
    question: "What is your pet's name?",
    category: 'personal',
  },
  {
    id: '6',
    question: 'What is your father\'s first name?',
    category: 'family',
  },
  {
    id: '7',
    question: 'What was the name of your first pet?',
    category: 'personal',
  },
  {
    id: '8',
    question: 'What is your favorite color?',
    category: 'preference',
  },
  {
    id: '9',
    question: 'What city were you born in?',
    category: 'location',
  },
  {
    id: '10',
    question: 'What is your favorite song?',
    category: 'preference',
  },
  {
    id: '11',
    question: 'What is the name of your best friend?',
    category: 'personal',
  },
  {
    id: '12',
    question: 'What street did you grow up on?',
    category: 'location',
  },
  {
    id: '13',
    question: "What is your sibling's name?",
    category: 'family',
  },
  {
    id: '14',
    question: 'What is your favorite book?',
    category: 'preference',
  },
  {
    id: '15',
    question: 'What is the name of your high school?',
    category: 'personal',
  },
];

/**
 * Get question by ID
 */
export function getQuestionById(id: string): SecurityQuestion | undefined {
  return PREDEFINED_QUESTIONS.find((q) => q.id === id);
}

/**
 * Get multiple questions by IDs
 */
export function getQuestionsByIds(ids: string[]): SecurityQuestion[] {
  return ids
    .map((id) => getQuestionById(id))
    .filter((q): q is SecurityQuestion => q !== undefined);
}

/**
 * Get random questions (for diversity in questions)
 */
export function getRandomQuestions(count: number = 3): SecurityQuestion[] {
  const shuffled = [...PREDEFINED_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Validate that selected questions are unique
 */
export function validateQuestionsUnique(questionIds: string[]): boolean {
  return new Set(questionIds).size === questionIds.length;
}

/**
 * Validate question exists
 */
export function validateQuestionExists(questionId: string): boolean {
  return PREDEFINED_QUESTIONS.some((q) => q.id === questionId);
}

/**
 * Format question for display
 */
export function formatQuestion(question: string): string {
  return question.trim();
}

/**
 * Normalize answer for comparison
 * - Trim whitespace
 * - Convert to lowercase
 * - Remove extra spaces
 */
export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/\s+/g, ' ');
}
