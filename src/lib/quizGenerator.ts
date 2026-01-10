import type {
    VocabularyEntry,
    Quiz,
    Question,
    MultipleChoiceQuestion,
    MatchingQuestion,
    FillBlankQuestion,
    MultipleChoiceOption,
    MatchingItem,
    FillBlankOption,
    QuizLength,
    MCVariant,
} from '@/types';
import { generateQuestionId, generateQuizId } from './hashUtils';
import { MC_CONFIG, MATCHING_CONFIG, FILL_BLANK_CONFIG, QUIZ_LENGTHS, HSK_WEIGHTS, getQuestionText } from '@/config';

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Select random items from array
 */
function selectRandom<T>(array: T[], count: number): T[] {
    return shuffle(array).slice(0, count);
}


/**
 * Get the display value for question based on variant
 */
function getQuestionDisplay(entry: VocabularyEntry, variant: MCVariant): string {
    switch (variant) {
        case 'word-to-pinyin':
        case 'word-to-meaning':
            return entry.word;
        case 'pinyin-to-word':
        case 'pinyin-to-meaning':
            return entry.pinyin;
        case 'meaning-to-word':
        case 'meaning-to-pinyin':
            return entry.meaning[0];
    }
}

/**
 * Get the option value based on variant
 */
function getOptionValue(entry: VocabularyEntry, variant: MCVariant): string {
    switch (variant) {
        case 'word-to-pinyin':
        case 'meaning-to-pinyin':
            return entry.pinyin;
        case 'pinyin-to-word':
        case 'meaning-to-word':
            return entry.word;
        case 'word-to-meaning':
        case 'pinyin-to-meaning':
            return entry.meaning[0];
    }
}

/**
 * Generate a multiple choice question
 */
export function generateMultipleChoice(
    vocabulary: VocabularyEntry[],
    usedIds: Set<string>
): MultipleChoiceQuestion | null {
    const { optionCount, optionLabels, distractorCount, wordLengthTolerance, variants } = MC_CONFIG;

    // Filter out already used entries
    const available = vocabulary.filter(v => !usedIds.has(v.id));

    if (available.length < optionCount) {
        return null;
    }

    // Select correct answer
    const correct = available[Math.floor(Math.random() * available.length)];

    // Find similar-length words for distractors (±tolerance character)
    const wordLength = correct.word.length;
    let distractorPool = vocabulary.filter(
        v => v.id !== correct.id && Math.abs(v.word.length - wordLength) <= wordLengthTolerance
    );

    // If not enough similar length, expand pool
    if (distractorPool.length < distractorCount) {
        distractorPool = vocabulary.filter(v => v.id !== correct.id);
    }

    // Select random distractors
    const distractors = selectRandom(distractorPool, distractorCount);

    // Randomly select variant
    const variant = variants[Math.floor(Math.random() * variants.length)];

    // Create options
    const allEntries = shuffle([correct, ...distractors]);
    const options: MultipleChoiceOption[] = allEntries.map((entry, index) => ({
        id: entry.id,
        label: optionLabels[index],
        value: getOptionValue(entry, variant),
        isCorrect: entry.id === correct.id,
    }));

    return {
        id: generateQuestionId(),
        type: 'multiple-choice',
        variant,
        question: getQuestionDisplay(correct, variant),
        questionMeta: getQuestionText(variant),
        correctAnswer: correct,
        options,
    };
}

/**
 * Generate a matching question with random item count
 */
export function generateMatching(
    vocabulary: VocabularyEntry[],
    usedIds: Set<string>,
    itemCount?: number
): MatchingQuestion | null {
    const { minItems, maxItems } = MATCHING_CONFIG;
    // Random item count from minItems to maxItems if not specified
    const targetCount = itemCount ?? Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems;

    // Filter out already used entries
    let available = vocabulary.filter(v => !usedIds.has(v.id));

    if (available.length < targetCount) {
        // If not enough unused, allow some reuse
        const remaining = targetCount - available.length;
        const used = vocabulary.filter(v => usedIds.has(v.id));
        const additional = selectRandom(used, Math.min(remaining, used.length));
        available = [...available, ...additional];
    }

    if (available.length < targetCount) {
        return null;
    }

    // Select random entries based on target count
    const selected = selectRandom(available, targetCount);

    const items: MatchingItem[] = selected.map(entry => ({
        id: entry.id,
        vocabularyId: entry.id,
        word: entry.word,
        pinyin: entry.pinyin,
        meaning: entry.meaning[0],
        example: entry.example || '',
        exampleMeaning: entry.exampleMeaning || '',
    }));

    return {
        id: generateQuestionId(),
        type: 'matching',
        items,
        shuffledWords: shuffle(items.map(i => i.word)),
        shuffledPinyins: shuffle(items.map(i => i.pinyin)),
        shuffledMeanings: shuffle(items.map(i => i.meaning)),
    };
}

/**
 * Generate a fill-in-the-blank question
 */
export function generateFillBlank(
    vocabulary: VocabularyEntry[],
    usedIds: Set<string>
): FillBlankQuestion | null {
    const { optionLabels, distractorCount, wordLengthTolerance } = FILL_BLANK_CONFIG;

    // Filter entries that have examples containing the word
    const available = vocabulary.filter(v => {
        if (usedIds.has(v.id)) return false;
        if (!v.example || !v.exampleMeaning) return false;
        // The example must contain the word
        return v.example.includes(v.word);
    });

    if (available.length < 1) {
        return null;
    }

    // Select correct answer
    const correct = available[Math.floor(Math.random() * available.length)];

    // Find the position of the word in the example
    const blankPosition = correct.example.indexOf(correct.word);
    if (blankPosition === -1) {
        return null;
    }

    // Find similar-length words for distractors
    const wordLength = correct.word.length;
    let distractorPool = vocabulary.filter(
        v => v.id !== correct.id && Math.abs(v.word.length - wordLength) <= wordLengthTolerance
    );

    // If not enough similar length, expand pool
    if (distractorPool.length < distractorCount) {
        distractorPool = vocabulary.filter(v => v.id !== correct.id);
    }

    // Select random distractors
    const distractors = selectRandom(distractorPool, distractorCount);

    // Create options
    const allEntries = shuffle([correct, ...distractors]);
    const options: FillBlankOption[] = allEntries.map((entry, index) => ({
        id: entry.id,
        label: optionLabels[index],
        value: entry.word,
        isCorrect: entry.id === correct.id,
    }));

    return {
        id: generateQuestionId(),
        type: 'fill-blank',
        sentence: correct.example,
        sentencePinyin: correct.examplePinyin || '',
        sentenceMeaning: correct.exampleMeaning,
        blankPosition,
        blankLength: correct.word.length,
        correctAnswer: correct,
        options,
    };
}

/**
 * Select HSK level based on configured weights
 * Returns 1, 2, or 3 based on weighted random selection
 */
function selectHskLevelByWeight(): number {
    const totalWeight = HSK_WEIGHTS.hsk1 + HSK_WEIGHTS.hsk2 + HSK_WEIGHTS.hsk3;
    const random = Math.random() * totalWeight;

    if (random < HSK_WEIGHTS.hsk1) {
        return 1;
    } else if (random < HSK_WEIGHTS.hsk1 + HSK_WEIGHTS.hsk2) {
        return 2;
    } else {
        return 3;
    }
}

/**
 * Get vocabulary pool for a specific HSK level
 */
function getVocabPoolByLevel(
    hsk1Vocab: VocabularyEntry[],
    hsk2Vocab: VocabularyEntry[],
    hsk3Vocab: VocabularyEntry[],
    level: number
): VocabularyEntry[] {
    switch (level) {
        case 1: return hsk1Vocab;
        case 2: return hsk2Vocab;
        case 3: return hsk3Vocab;
        default: return [...hsk1Vocab, ...hsk2Vocab, ...hsk3Vocab];
    }
}

/**
 * Generate a complete quiz with all question types
 * Strategy: Questions are distributed by HSK level based on configurable weights
 * Default weights: HSK1=2, HSK2=3, HSK3=5 (20%, 30%, 50%)
 */
export function generateQuiz(
    vocabulary: VocabularyEntry[],
    length: QuizLength
): Quiz {
    const questionCount = Math.min(QUIZ_LENGTHS[length].count, vocabulary.length);
    const questions: Question[] = [];
    const usedIds = new Set<string>();

    // Separate vocabulary by HSK level
    const hsk1Vocab = vocabulary.filter(v => v.hskLevel === 1);
    const hsk2Vocab = vocabulary.filter(v => v.hskLevel === 2);
    const hsk3Vocab = vocabulary.filter(v => v.hskLevel === 3);

    // If no HSK info available, fall back to using all vocabulary
    const hasHskData = hsk1Vocab.length > 0 || hsk2Vocab.length > 0 || hsk3Vocab.length > 0;

    // There are 3 question types now
    // Ensure at least 1 of each type, then distribute the rest randomly
    const minPerType = 1;

    // Calculate max for each type (at least 1)
    const remainingAfterMin = Math.max(0, questionCount - 3); // 3 types × 1 min each

    // Random distribution for remaining questions
    const matchingExtra = Math.floor(Math.random() * Math.min(remainingAfterMin, Math.floor(questionCount / 3)));
    const fillBlankExtra = Math.floor(Math.random() * Math.min(remainingAfterMin - matchingExtra, Math.floor(questionCount / 3)));
    const mcExtra = remainingAfterMin - matchingExtra - fillBlankExtra;

    const matchingCount = minPerType + matchingExtra;
    const fillBlankCount = minPerType + fillBlankExtra;
    const mcCount = minPerType + mcExtra;

    // Generate matching questions with weighted HSK selection
    for (let i = 0; i < matchingCount; i++) {
        const hskLevel = hasHskData ? selectHskLevelByWeight() : 0;
        let vocabPool = hasHskData
            ? getVocabPoolByLevel(hsk1Vocab, hsk2Vocab, hsk3Vocab, hskLevel)
            : vocabulary;

        // Fallback to all vocabulary if specific pool is too small
        if (vocabPool.length < MATCHING_CONFIG.minItems) {
            vocabPool = vocabulary;
        }

        const matching = generateMatching(vocabPool, usedIds);
        if (matching) {
            questions.push(matching);
            matching.items.forEach(item => usedIds.add(item.id));
        } else {
            // Fallback to all vocabulary if specific pool is exhausted
            const fallback = generateMatching(vocabulary, usedIds);
            if (fallback) {
                questions.push(fallback);
                fallback.items.forEach(item => usedIds.add(item.id));
            }
        }
    }

    // Generate fill-blank questions with weighted HSK selection
    for (let i = 0; i < fillBlankCount; i++) {
        const hskLevel = hasHskData ? selectHskLevelByWeight() : 0;
        const vocabPool = hasHskData
            ? getVocabPoolByLevel(hsk1Vocab, hsk2Vocab, hsk3Vocab, hskLevel)
            : vocabulary;

        const fillBlank = generateFillBlank(vocabPool, usedIds);
        if (fillBlank) {
            questions.push(fillBlank);
            usedIds.add(fillBlank.correctAnswer.id);
        } else {
            // Fallback to all vocabulary if specific pool is exhausted
            const fallback = generateFillBlank(vocabulary, usedIds);
            if (fallback) {
                questions.push(fallback);
                usedIds.add(fallback.correctAnswer.id);
            }
        }
    }

    // Generate multiple choice questions with weighted HSK selection
    let mcGenerated = 0;
    let attempts = 0;
    const maxAttempts = mcCount * 3;

    while (mcGenerated < mcCount && attempts < maxAttempts) {
        const hskLevel = hasHskData ? selectHskLevelByWeight() : 0;
        const vocabPool = hasHskData
            ? getVocabPoolByLevel(hsk1Vocab, hsk2Vocab, hsk3Vocab, hskLevel)
            : vocabulary;

        const mc = generateMultipleChoice(vocabPool, new Set()); // Allow reuse for MC
        if (mc) {
            questions.push(mc);
            usedIds.add(mc.correctAnswer.id);
            mcGenerated++;
        } else {
            // Fallback to all vocabulary if specific pool is exhausted
            const fallback = generateMultipleChoice(vocabulary, new Set());
            if (fallback) {
                questions.push(fallback);
                usedIds.add(fallback.correctAnswer.id);
                mcGenerated++;
            }
        }
        attempts++;
    }

    // Shuffle all questions
    const shuffledQuestions = shuffle(questions);

    return {
        id: generateQuizId(),
        length,
        questions: shuffledQuestions,
        startTime: Date.now(),
    };
}

/**
 * Get all vocabulary IDs that appear in a question
 */
export function getQuestionVocabularyIds(question: Question): string[] {
    if (question.type === 'multiple-choice') {
        return [question.correctAnswer.id];
    } else if (question.type === 'fill-blank') {
        return [question.correctAnswer.id];
    } else {
        return question.items.map(item => item.id);
    }
}
