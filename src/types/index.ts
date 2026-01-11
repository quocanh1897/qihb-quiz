// Vocabulary Entry from CSV
export interface VocabularyEntry {
    id: string;               // MD5 hash of word + pinyin
    word: string;             // Tiếng Trung - Chinese characters
    pinyin: string;           // Phiên âm - Pronunciation
    type: string;             // Từ loại - Word type (Danh từ, Động từ, etc.)
    meaning: string[];        // Tiếng Việt - Array of Vietnamese meanings
    example: string;          // Ví dụ - Example sentence in Chinese
    examplePinyin: string;    // Chú thích - Example pinyin
    exampleMeaning: string;   // Dịch - Vietnamese translation of example
    hskLevel?: number;        // HSK Level (1, 2, or 3)
}

// Quiz Length Options
export type QuizLength = 'short' | 'medium' | 'long' | 'maximum';

// Re-export QUIZ_LENGTH_CONFIG from config for backwards compatibility
export { QUIZ_LENGTHS as QUIZ_LENGTH_CONFIG } from '@/config';

// Question Types
export type QuestionType = 'multiple-choice' | 'matching' | 'fill-blank' | 'sentence-arrangement' | 'sentence-completion';

// Multiple Choice Question Variants
export type MCVariant =
    | 'word-to-pinyin'      // Given word, select correct pinyin
    | 'pinyin-to-word'      // Given pinyin, select correct word
    | 'meaning-to-word'     // Given meaning, select correct word
    | 'meaning-to-pinyin'   // Given meaning, select correct pinyin
    | 'word-to-meaning'     // Given word, select correct meaning
    | 'pinyin-to-meaning';  // Given pinyin, select correct meaning

export interface MultipleChoiceOption {
    id: string;
    label: string;           // A, B, C, D, E, F
    value: string;           // The actual content
    isCorrect: boolean;
}

export interface MultipleChoiceQuestion {
    id: string;
    type: 'multiple-choice';
    variant: MCVariant;
    question: string;        // The question text (word, pinyin, or meaning)
    questionMeta?: string;   // Additional context (e.g., word type)
    correctAnswer: VocabularyEntry;
    options: MultipleChoiceOption[];
}

export interface MatchingItem {
    id: string;
    vocabularyId: string;
    word: string;
    pinyin: string;
    meaning: string;
    example: string;          // Ví dụ - Example sentence in Chinese
    exampleMeaning: string;   // Dịch - Vietnamese translation of example
}

export interface NoiseItem {
    id: string;
    type: 'word' | 'pinyin' | 'meaning';
    value: string;
}

export interface MatchingQuestion {
    id: string;
    type: 'matching';
    items: MatchingItem[];   // Items to match
    shuffledWords: string[];
    shuffledPinyins: string[];
    shuffledMeanings: string[];
    noiseItems: NoiseItem[]; // Noise items (1 per 3 records)
}

export interface FillBlankOption {
    id: string;
    label: string;           // A, B, C, D, E, F
    value: string;           // The word option
    isCorrect: boolean;
}

export interface FillBlankQuestion {
    id: string;
    type: 'fill-blank';
    sentence: string;        // The example sentence with blank
    sentencePinyin: string;  // Pinyin of the sentence
    sentenceMeaning: string; // Vietnamese meaning of the sentence
    blankPosition: number;   // Character index where blank starts
    blankLength: number;     // Length of the blank (word length)
    correctAnswer: VocabularyEntry;
    options: FillBlankOption[];
}

export interface SentenceWord {
    id: string;
    text: string;            // The word/character with attached punctuation
    position: number;        // Original position in sentence (0-indexed)
}

export interface SentenceArrangementQuestion {
    id: string;
    type: 'sentence-arrangement';
    correctSentence: string;     // The full correct sentence
    sentencePinyin: string;      // Pinyin of the sentence
    sentenceMeaning: string;     // Vietnamese meaning of the sentence
    words: SentenceWord[];       // Correct order of words
    shuffledWords: SentenceWord[]; // Shuffled words for user to arrange
    vocabularyEntry: VocabularyEntry; // Source vocabulary for tracking
}

export interface SentenceCompletionQuestion {
    id: string;
    type: 'sentence-completion';
    sentence: string;            // The full sentence
    sentenceMeaning: string;     // Vietnamese meaning
    blankWord: string;           // The word to fill in (without punctuation)
    blankWordWithPunctuation: string; // The word with any attached punctuation
    blankPinyin: string;         // Pinyin hint for the blank word
    blankPosition: number;       // Index of the blank word in the sentence
    sentenceBeforeBlank: string; // Text before the blank
    sentenceAfterBlank: string;  // Text after the blank
    vocabularyEntry: VocabularyEntry; // Source vocabulary for tracking
}

export type Question = MultipleChoiceQuestion | MatchingQuestion | FillBlankQuestion | SentenceArrangementQuestion | SentenceCompletionQuestion;

// Answer Types
export interface MCAnswer {
    questionId: string;
    type: 'multiple-choice';
    selectedOption: string;  // The selected option ID
    isCorrect: boolean;
    timeSpent: number;       // Time in milliseconds
}

export interface MatchingAnswer {
    questionId: string;
    type: 'matching';
    connections: {
        word: string;
        pinyin: string;
        meaning: string;
        isCorrect: boolean;
    }[];
    correctCount: number;
    timeSpent: number;
    usedHint: boolean;    // Whether the user used the hint (halves score if correct)
}

export interface FillBlankAnswer {
    questionId: string;
    type: 'fill-blank';
    selectedOption: string;  // The selected option ID
    isCorrect: boolean;
    timeSpent: number;
}

export interface SentenceArrangementAnswer {
    questionId: string;
    type: 'sentence-arrangement';
    arrangedWords: string[];  // IDs of words in user's arranged order
    isCorrect: boolean;       // True if all words in correct order
    correctCount: number;     // Number of words in correct position
    totalWords: number;       // Total number of words
    timeSpent: number;
    usedHint: boolean;        // Whether the user used the hint (halves score if correct)
}

export interface SentenceCompletionAnswer {
    questionId: string;
    type: 'sentence-completion';
    userInput: string;        // What the user typed
    isCorrect: boolean;
    timeSpent: number;
}

export type Answer = MCAnswer | MatchingAnswer | FillBlankAnswer | SentenceArrangementAnswer | SentenceCompletionAnswer;

// Frequency Tracking
export interface FrequencyRecord {
    wordId: string;
    word: string;
    pinyin: string;
    meaning: string[];
    appearances: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;        // Percentage
    progressPoints: number;  // Points earned/lost in this quiz for this word
}

// Global Word Stats (for progress score calculation)
export interface GlobalWordStats {
    wordId: string;
    word: string;
    pinyin: string;
    meaning: string[];
    totalAppearances: number;  // Total times this word has appeared across all quizzes
    totalCorrect: number;
    totalIncorrect: number;
    progressScore: number;     // Cumulative progress score for this word
}

// Quiz State
export interface Quiz {
    id: string;
    length: QuizLength;
    questions: Question[];
    startTime: number;
    endTime?: number;
}

// Quiz Results
export interface QuizResult {
    quizId: string;
    date: Date;
    length: QuizLength;
    totalQuestions: number;
    correctCount: number;
    incorrectCount: number;
    totalTime: number;       // Total time in milliseconds
    mcAverageTime: number;   // Average time for MC questions
    matchingAverageTime: number;  // Average time for matching questions
    fillBlankAverageTime: number; // Average time for fill-blank questions
    sentenceArrangementAverageTime: number; // Average time for sentence arrangement questions
    sentenceCompletionAverageTime: number;  // Average time for sentence completion questions
    frequencyData: FrequencyRecord[];
    answers: Answer[];
    progressScore: number;   // "Điểm tiến bộ" - Progress score for this quiz [-100, 100]
    percentageScore: number; // Traditional percentage score [0, 100]
}

// Timer State
export interface TimerState {
    totalTime: number;
    questionStartTime: number;
    isPaused: boolean;
}

// Quiz History for IndexedDB
export interface QuizHistory {
    id?: number;
    quizId: string;
    date: Date;
    score: number;           // Percentage score
    progressScore: number;   // Progress score [-100, 100]
    totalQuestions: number;
    correctCount: number;
    incorrectCount: number;
    duration: number;
    frequencyData: FrequencyRecord[];
    quizLength: QuizLength;
}
