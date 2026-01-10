import CryptoJS from 'crypto-js';

/**
 * Generate MD5 hash for vocabulary entry ID
 * Uses word + pinyin for uniqueness (handles words with multiple pronunciations)
 */
export function generateVocabularyId(word: string, pinyin: string): string {
    const combined = `${word}_${pinyin}`.trim();
    return CryptoJS.MD5(combined).toString();
}

/**
 * Generate unique ID for questions
 */
export function generateQuestionId(): string {
    return CryptoJS.lib.WordArray.random(8).toString();
}

/**
 * Generate unique ID for quiz sessions
 */
export function generateQuizId(): string {
    const timestamp = Date.now().toString();
    const random = CryptoJS.lib.WordArray.random(4).toString();
    return `quiz_${timestamp}_${random}`;
}
