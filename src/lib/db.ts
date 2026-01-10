import Dexie, { type Table } from 'dexie';
import type { VocabularyEntry, QuizHistory, GlobalWordStats } from '@/types';

export class QIHBQuizDB extends Dexie {
    vocabulary!: Table<VocabularyEntry>;
    quizHistory!: Table<QuizHistory>;
    globalWordStats!: Table<GlobalWordStats>;

    constructor() {
        super('QIHBQuizDB');

        // Version 2: Updated schema with progress score and global word stats
        this.version(2).stores({
            vocabulary: 'id, word, pinyin, type',
            quizHistory: '++id, quizId, date, score, progressScore',
            globalWordStats: 'wordId, totalAppearances',
        });

        // Migration from v1
        this.version(1).stores({
            vocabulary: 'id, word, pinyin, type',
            quizHistory: '++id, quizId, date, score',
            globalFrequency: 'wordId, appearances, correctAnswers',
        });
    }
}

export const db = new QIHBQuizDB();

// Utility functions
export async function clearVocabulary(): Promise<void> {
    await db.vocabulary.clear();
}

export async function importVocabulary(entries: VocabularyEntry[]): Promise<void> {
    await db.vocabulary.bulkPut(entries);
}

export async function getVocabulary(): Promise<VocabularyEntry[]> {
    return db.vocabulary.toArray();
}

export async function getVocabularyCount(): Promise<number> {
    return db.vocabulary.count();
}

export async function getRandomVocabulary(count: number): Promise<VocabularyEntry[]> {
    const all = await db.vocabulary.toArray();
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

export async function getVocabularyByLength(length: number, tolerance: number = 1): Promise<VocabularyEntry[]> {
    const all = await db.vocabulary.toArray();
    return all.filter(v => Math.abs(v.word.length - length) <= tolerance);
}

export async function saveQuizHistory(history: Omit<QuizHistory, 'id'>): Promise<number> {
    const id = await db.quizHistory.add(history as QuizHistory);
    return id as number;
}

export async function getQuizHistory(): Promise<QuizHistory[]> {
    return db.quizHistory.orderBy('date').reverse().toArray();
}

/**
 * Update global word statistics after a quiz
 */
export async function updateGlobalWordStats(wordId: string, word: string, pinyin: string, meaning: string[], isCorrect: boolean): Promise<GlobalWordStats> {
    const existing = await db.globalWordStats.get(wordId);

    // Calculate the progress points for this answer
    const totalAppearances = existing ? existing.totalAppearances + 1 : 1;
    const points = calculateProgressPoints(totalAppearances, isCorrect);

    if (existing) {
        const updated: GlobalWordStats = {
            ...existing,
            totalAppearances,
            totalCorrect: existing.totalCorrect + (isCorrect ? 1 : 0),
            totalIncorrect: existing.totalIncorrect + (isCorrect ? 0 : 1),
            progressScore: Math.max(-100, Math.min(100, existing.progressScore + points)), // Clamp to [-100, 100]
        };
        await db.globalWordStats.put(updated);
        return updated;
    } else {
        const newStats: GlobalWordStats = {
            wordId,
            word,
            pinyin,
            meaning,
            totalAppearances: 1,
            totalCorrect: isCorrect ? 1 : 0,
            totalIncorrect: isCorrect ? 0 : 1,
            progressScore: points,
        };
        await db.globalWordStats.put(newStats);
        return newStats;
    }
}

/**
 * Get global word stats for a specific word
 */
export async function getWordStats(wordId: string): Promise<GlobalWordStats | undefined> {
    return db.globalWordStats.get(wordId);
}

/**
 * Get all global word statistics
 */
export async function getAllWordStats(): Promise<GlobalWordStats[]> {
    return db.globalWordStats.toArray();
}

/**
 * Calculate progress points for a word answer
 * Newer words (fewer appearances) give/take more points
 * Formula: basePoints * (1 - appearances/maxAppearances)
 * Range: [-100, 100]
 */
export function calculateProgressPoints(
    totalAppearances: number,
    isCorrect: boolean,
    maxAppearances: number = 50
): number {
    // Base points - maximum points for a completely new word
    const basePoints = 10;

    // Calculate weight: newer words have higher weight
    // Weight goes from 1.0 (new word) to 0.2 (very old word)
    const weight = Math.max(0.2, 1 - (totalAppearances / maxAppearances));

    // Calculate points
    const points = Math.round(basePoints * weight * 10) / 10;

    return isCorrect ? points : -points;
}

/**
 * Get quiz history by ID
 */
export async function getQuizHistoryById(id: number): Promise<QuizHistory | undefined> {
    return db.quizHistory.get(id);
}
