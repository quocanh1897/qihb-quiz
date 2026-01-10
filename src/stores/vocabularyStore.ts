import { create } from 'zustand';
import type { VocabularyEntry } from '@/types';
import { db, importVocabulary, getVocabulary, getVocabularyCount, clearVocabulary } from '@/lib/db';
import { loadDefaultVocabulary, parseCSVFile, clearVocabularyCache } from '@/lib/csvParser';

interface VocabularyState {
    vocabulary: VocabularyEntry[];
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;

    // Actions
    initialize: () => Promise<void>;
    loadFromCSV: (file: File) => Promise<void>;
    loadDefault: () => Promise<void>;
    getRandomWords: (count: number) => VocabularyEntry[];
    getByLength: (length: number, tolerance?: number) => VocabularyEntry[];
    reset: () => Promise<void>;
}

// Prevent concurrent initialization calls
let initPromise: Promise<void> | null = null;

export const useVocabularyStore = create<VocabularyState>((set, get) => ({
    vocabulary: [],
    isLoading: false,
    isInitialized: false,
    error: null,

    initialize: async () => {
        // Already initialized, skip
        const { isInitialized } = get();
        if (isInitialized) {
            return;
        }

        // If initialization is already in progress, wait for it
        if (initPromise) {
            return initPromise;
        }

        set({ isLoading: true, error: null });

        initPromise = (async () => {
            try {
                // Check if vocabulary exists in IndexedDB
                const count = await getVocabularyCount();

                if (count > 0) {
                    // Load from IndexedDB
                    const vocabulary = await getVocabulary();
                    set({ vocabulary, isInitialized: true, isLoading: false });
                } else {
                    // Load default vocabulary
                    await get().loadDefault();
                }
            } catch (error) {
                set({
                    error: error instanceof Error ? error.message : 'Lỗi khởi tạo dữ liệu',
                    isLoading: false
                });
            } finally {
                initPromise = null;
            }
        })();

        return initPromise;
    },

    loadFromCSV: async (file: File) => {
        set({ isLoading: true, error: null });

        try {
            const entries = await parseCSVFile(file);

            if (entries.length === 0) {
                throw new Error('Không tìm thấy dữ liệu từ vựng trong file');
            }

            // Clear existing and import new
            await clearVocabulary();
            await importVocabulary(entries);

            set({ vocabulary: entries, isInitialized: true, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Lỗi đọc file CSV',
                isLoading: false
            });
        }
    },

    loadDefault: async () => {
        set({ isLoading: true, error: null });

        try {
            // Clear cache to force fresh fetch when explicitly reloading
            clearVocabularyCache();

            const entries = await loadDefaultVocabulary();

            if (entries.length === 0) {
                throw new Error('Không tìm thấy dữ liệu từ vựng mặc định');
            }

            // Clear existing and import default
            await clearVocabulary();
            await importVocabulary(entries);

            set({ vocabulary: entries, isInitialized: true, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Lỗi tải dữ liệu mặc định',
                isLoading: false
            });
        }
    },

    getRandomWords: (count: number) => {
        const { vocabulary } = get();
        const shuffled = [...vocabulary].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    },

    getByLength: (length: number, tolerance: number = 1) => {
        const { vocabulary } = get();
        return vocabulary.filter(v => Math.abs(v.word.length - length) <= tolerance);
    },

    reset: async () => {
        await clearVocabulary();
        set({ vocabulary: [], isInitialized: false, error: null });
    },
}));
