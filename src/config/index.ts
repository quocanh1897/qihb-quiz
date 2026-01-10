import quizConfig from './quiz.config.json';
import type { QuizLength, MCVariant } from '@/types';

// Type definitions for the config
export interface QuizLengthConfig {
    label: string;
    count: number;
    description: string;
}

export interface MultipleChoiceConfig {
    optionCount: number;
    optionLabels: string[];
    distractorCount: number;
    wordLengthTolerance: number;
    variants: MCVariant[];
    questionTexts: Record<MCVariant, string>;
}

export interface MatchingConfig {
    minItems: number;
    maxItems: number;
}

export interface FillBlankConfig {
    optionCount: number;
    optionLabels: string[];
    distractorCount: number;
    wordLengthTolerance: number;
    questionText: string;
}

export interface SpeechConfig {
    preferFemale: boolean;
    rate: number;
    pitch: number;
    volume: number;
}

export interface HSKWeightsConfig {
    hsk1: number;
    hsk2: number;
    hsk3: number;
}

export interface QuestionTypeWeightsConfig {
    multipleChoice: number;
    matching: number;
    fillBlank: number;
    sentenceArrangement: number;
    sentenceCompletion: number;
}

export interface SentenceArrangementConfig {
    minWords: number;
    maxWords: number;
    questionText: string;
}

export interface SentenceCompletionConfig {
    minWordLength: number;
    questionText: string;
}

export interface QuizConfig {
    speech: SpeechConfig;
    hskWeights: HSKWeightsConfig;
    questionTypeWeights: QuestionTypeWeightsConfig;
    quizLengths: Record<QuizLength, QuizLengthConfig>;
    multipleChoice: MultipleChoiceConfig;
    matching: MatchingConfig;
    fillBlank: FillBlankConfig;
    sentenceArrangement: SentenceArrangementConfig;
    sentenceCompletion: SentenceCompletionConfig;
}

// Export the typed config
export const config: QuizConfig = quizConfig as QuizConfig;

// Convenience exports
export const SPEECH_CONFIG = config.speech;
export const HSK_WEIGHTS = config.hskWeights;
export const QUESTION_TYPE_WEIGHTS = config.questionTypeWeights;
export const QUIZ_LENGTHS = config.quizLengths;
export const MC_CONFIG = config.multipleChoice;
export const MATCHING_CONFIG = config.matching;
export const FILL_BLANK_CONFIG = config.fillBlank;
export const SENTENCE_ARRANGEMENT_CONFIG = config.sentenceArrangement;
export const SENTENCE_COMPLETION_CONFIG = config.sentenceCompletion;

// Helper function to get random matching item count
export function getRandomMatchingItemCount(): number {
    const { minItems, maxItems } = MATCHING_CONFIG;
    return Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems;
}

// Helper to get question text for MC variant
export function getQuestionText(variant: MCVariant): string {
    return MC_CONFIG.questionTexts[variant];
}
