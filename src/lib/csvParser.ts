import Papa from 'papaparse';
import type { VocabularyEntry } from '@/types';
import { generateVocabularyId } from './hashUtils';

// New simplified CSV format: word,pinyin,meaning,example,example-pinyin,example-meaning
interface NewCSVRow {
    word?: string;
    pinyin?: string;
    meaning?: string;
    example?: string;
    'example-pinyin'?: string;
    'example-meaning'?: string;
}

// Legacy format (Vietnamese headers, semicolon-separated)
interface LegacyCSVRow {
    'Tiếng Trung'?: string;
    'Phiên âm'?: string;
    'Từ loại'?: string;
    'Tiếng Việt'?: string;
    'Ví dụ'?: string;
    'Chú thích'?: string;
    'Dịch'?: string;
    'Tiếng\nTrung'?: string;
    'Phiên\nâm'?: string;
    'Tiếng\nViệt'?: string;
}

type CSVRow = NewCSVRow & LegacyCSVRow;

/**
 * Parse CSV file and return vocabulary entries
 */
export async function parseCSVFile(file: File): Promise<VocabularyEntry[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            encoding: 'UTF-8',
            complete: (results) => {
                try {
                    const entries = processRawData(results.data as CSVRow[]);
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
export function parseCSVText(text: string, hskLevel?: number): VocabularyEntry[] {
    const results = Papa.parse<CSVRow>(text, {
        header: true,
        skipEmptyLines: true,
    });

    return processRawData(results.data, hskLevel);
}

/**
 * Process raw CSV data into vocabulary entries
 * Supports both new format (comma-separated) and legacy format (semicolon-separated with Vietnamese headers)
 */
function processRawData(rows: CSVRow[], hskLevel?: number): VocabularyEntry[] {
    const entriesMap = new Map<string, VocabularyEntry>();

    for (const row of rows) {
        // Try new format first, then fallback to legacy
        const word = (row.word || row['Tiếng Trung'] || row['Tiếng\nTrung'] || '').trim();
        const pinyin = (row.pinyin || row['Phiên âm'] || row['Phiên\nâm'] || '').trim();
        const type = (row['Từ loại'] || '').trim(); // Only in legacy format
        const meaning = (row.meaning || row['Tiếng Việt'] || row['Tiếng\nViệt'] || '').trim();
        const example = (row.example || row['Ví dụ'] || '').trim();
        const examplePinyin = (row['example-pinyin'] || row['Chú thích'] || '').trim();
        const exampleMeaning = (row['example-meaning'] || row['Dịch'] || '').trim();

        if (!word || !pinyin) continue;

        const id = generateVocabularyId(word, pinyin);

        // Check if this exact word+pinyin combo exists
        if (entriesMap.has(id)) {
            // Add additional meaning to existing entry
            const existingEntry = entriesMap.get(id)!;
            if (meaning && !existingEntry.meaning.includes(meaning)) {
                existingEntry.meaning.push(meaning);
            }
        } else {
            // Create new entry
            // Split meanings by semicolon if present (e.g., "yêu; tình yêu")
            const meanings = meaning
                ? meaning.split(';').map(m => m.trim()).filter(m => m)
                : [];

            const entry: VocabularyEntry = {
                id,
                word,
                pinyin,
                type,
                meaning: meanings.length > 0 ? meanings : [''],
                example,
                examplePinyin,
                exampleMeaning,
                hskLevel,
            };
            entriesMap.set(id, entry);
        }
    }

    // Filter out entries without proper data
    const entries = Array.from(entriesMap.values()).filter(
        entry => entry.word && entry.pinyin && entry.meaning.length > 0 && entry.meaning[0] !== ''
    );

    return entries;
}

// HSK vocabulary data
interface HSKVocabularyData {
    hsk1: VocabularyEntry[];
    hsk2: VocabularyEntry[];
    hsk3: VocabularyEntry[];
    all: VocabularyEntry[];
}

// Cache for vocabulary data
let cachedVocabulary: HSKVocabularyData | null = null;
let fetchPromise: Promise<HSKVocabularyData> | null = null;

/**
 * Fetch and parse all HSK vocabulary files (HSK1, HSK2, HSK3)
 * Returns merged vocabulary with HSK level information
 */
export async function loadDefaultVocabulary(): Promise<VocabularyEntry[]> {
    const data = await loadAllHSKVocabulary();
    return data.all;
}

/**
 * Load all HSK vocabulary data with level information
 */
export async function loadAllHSKVocabulary(): Promise<HSKVocabularyData> {
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
            // Fetch all three HSK files in parallel
            const [hsk1Response, hsk2Response, hsk3Response] = await Promise.all([
                fetch('/files/hsk1.csv'),
                fetch('/files/hsk2.csv'),
                fetch('/files/hsk3.csv'),
            ]);

            const [hsk1Text, hsk2Text, hsk3Text] = await Promise.all([
                hsk1Response.text(),
                hsk2Response.text(),
                hsk3Response.text(),
            ]);

            // Parse each file with its HSK level
            const hsk1 = parseCSVText(hsk1Text, 1);
            const hsk2 = parseCSVText(hsk2Text, 2);
            const hsk3 = parseCSVText(hsk3Text, 3);

            // Merge all vocabularies (remove duplicates based on id)
            const allMap = new Map<string, VocabularyEntry>();

            // Add in order: HSK1 -> HSK2 -> HSK3 (later entries override if duplicate)
            for (const entry of hsk1) {
                allMap.set(entry.id, entry);
            }
            for (const entry of hsk2) {
                allMap.set(entry.id, entry);
            }
            for (const entry of hsk3) {
                allMap.set(entry.id, entry);
            }

            const all = Array.from(allMap.values());

            cachedVocabulary = { hsk1, hsk2, hsk3, all };
            return cachedVocabulary;
        } catch (error) {
            console.error('Failed to load vocabulary:', error);
            throw new Error('Không thể tải dữ liệu từ vựng');
        } finally {
            fetchPromise = null;
        }
    })();

    return fetchPromise;
}

/**
 * Get HSK vocabulary counts
 */
export async function getHSKCounts(): Promise<{ hsk1: number; hsk2: number; hsk3: number; total: number }> {
    const data = await loadAllHSKVocabulary();
    return {
        hsk1: data.hsk1.length,
        hsk2: data.hsk2.length,
        hsk3: data.hsk3.length,
        total: data.all.length,
    };
}

/**
 * Clear the vocabulary cache (useful for forcing a reload)
 */
export function clearVocabularyCache(): void {
    cachedVocabulary = null;
}
