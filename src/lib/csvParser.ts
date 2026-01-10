import Papa from 'papaparse';
import type { VocabularyEntry } from '@/types';
import { generateVocabularyId } from './hashUtils';

interface RawCSVRow {
    'Tiếng Trung'?: string;
    'Phiên âm'?: string;
    'Từ loại'?: string;
    'Tiếng Việt'?: string;
    'Ví dụ'?: string;
    'Chú thích'?: string;
    'Dịch'?: string;
    // Alternative column names (handling multi-line headers in CSV)
    'Tiếng\nTrung'?: string;
    'Phiên\nâm'?: string;
    'Tiếng\nViệt'?: string;
}

/**
 * Parse CSV file and return vocabulary entries
 * Handles:
 * - Multi-line entries (continuation rows)
 * - Multiple meanings for same word
 * - Multiple pronunciations
 * - UTF-8 encoding
 */
export async function parseCSVFile(file: File): Promise<VocabularyEntry[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            delimiter: ';',
            skipEmptyLines: false,
            encoding: 'UTF-8',
            complete: (results) => {
                try {
                    const entries = processRawData(results.data as RawCSVRow[]);
                    resolve(entries);
                } catch (error) {
                    reject(error);
                }
            },
            error: (error) => {
                reject(error);
            },
        });
    });
}

/**
 * Parse CSV from text content (for pre-loaded files)
 */
export function parseCSVText(text: string): VocabularyEntry[] {
    const results = Papa.parse<RawCSVRow>(text, {
        header: true,
        delimiter: ';',
        skipEmptyLines: false,
    });

    return processRawData(results.data);
}

/**
 * Process raw CSV data into vocabulary entries
 */
function processRawData(rows: RawCSVRow[]): VocabularyEntry[] {
    const entriesMap = new Map<string, VocabularyEntry>();
    let currentEntry: VocabularyEntry | null = null;

    for (const row of rows) {
        // Get values, handling multi-line column names in CSV headers
        const word = (row['Tiếng Trung'] || row['Tiếng\nTrung'] || '').trim();
        const pinyin = (row['Phiên âm'] || row['Phiên\nâm'] || '').trim();
        const type = (row['Từ loại'] || '').trim();
        const meaning = (row['Tiếng Việt'] || row['Tiếng\nViệt'] || '').trim();
        const example = (row['Ví dụ'] || '').trim();
        const examplePinyin = (row['Chú thích'] || '').trim();
        const exampleMeaning = (row['Dịch'] || '').trim();

        // If word is present, this is a new entry or a new pronunciation
        if (word) {
            const id = generateVocabularyId(word, pinyin);

            // Check if this exact word+pinyin combo exists
            if (entriesMap.has(id)) {
                // Add additional meaning to existing entry
                currentEntry = entriesMap.get(id)!;
                if (meaning && !currentEntry.meaning.includes(meaning)) {
                    currentEntry.meaning.push(meaning);
                }
            } else {
                // Create new entry
                currentEntry = {
                    id,
                    word,
                    pinyin,
                    type,
                    meaning: meaning ? [meaning] : [],
                    example,
                    examplePinyin,
                    exampleMeaning,
                };
                entriesMap.set(id, currentEntry);
            }
        } else if (currentEntry) {
            // Continuation row - add meaning to current entry
            if (meaning && !currentEntry.meaning.includes(meaning)) {
                currentEntry.meaning.push(meaning);
            }
            // If there's a new pinyin but no word, it's an alternative pronunciation
            if (pinyin && pinyin !== currentEntry.pinyin) {
                const newId = generateVocabularyId(currentEntry.word, pinyin);
                if (!entriesMap.has(newId)) {
                    const newEntry: VocabularyEntry = {
                        id: newId,
                        word: currentEntry.word,
                        pinyin,
                        type: type || currentEntry.type,
                        meaning: meaning ? [meaning] : [...currentEntry.meaning],
                        example: example || currentEntry.example,
                        examplePinyin: examplePinyin || currentEntry.examplePinyin,
                        exampleMeaning: exampleMeaning || currentEntry.exampleMeaning,
                    };
                    entriesMap.set(newId, newEntry);
                }
            }
        }
    }

    // Filter out entries without proper data
    const entries = Array.from(entriesMap.values()).filter(
        entry => entry.word && entry.pinyin && entry.meaning.length > 0
    );

    return entries;
}

// Cache for default vocabulary to prevent repeated fetches
let cachedVocabulary: VocabularyEntry[] | null = null;
let fetchPromise: Promise<VocabularyEntry[]> | null = null;

/**
 * Fetch and parse the default HSK3 CSV file
 * Uses caching to prevent repeated network requests
 */
export async function loadDefaultVocabulary(): Promise<VocabularyEntry[]> {
    // Return cached data if available
    if (cachedVocabulary) {
        return cachedVocabulary;
    }

    // If a fetch is already in progress, wait for it
    if (fetchPromise) {
        return fetchPromise;
    }

    // Start new fetch and cache the promise
    fetchPromise = (async () => {
        try {
            const response = await fetch('/files/hsk3.csv');
            const text = await response.text();
            const entries = parseCSVText(text);
            cachedVocabulary = entries;
            return entries;
        } catch (error) {
            console.error('Failed to load default vocabulary:', error);
            throw new Error('Không thể tải dữ liệu từ vựng');
        } finally {
            fetchPromise = null;
        }
    })();

    return fetchPromise;
}

/**
 * Clear the vocabulary cache (useful for forcing a reload)
 * Note: Only clears cached data, not ongoing fetch promise
 */
export function clearVocabularyCache(): void {
    cachedVocabulary = null;
    // Don't clear fetchPromise - if a fetch is in progress, let it complete
    // This prevents multiple concurrent fetches when clearVocabularyCache is called
}
