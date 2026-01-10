import type {
    VocabularyEntry,
    Quiz,
    Question,
    MultipleChoiceQuestion,
    MatchingQuestion,
    FillBlankQuestion,
    SentenceArrangementQuestion,
    MultipleChoiceOption,
    MatchingItem,
    FillBlankOption,
    SentenceWord,
    QuizLength,
    QuestionType,
    MCVariant,
} from '@/types';
import { generateQuestionId, generateQuizId } from './hashUtils';
import { MC_CONFIG, MATCHING_CONFIG, FILL_BLANK_CONFIG, SENTENCE_ARRANGEMENT_CONFIG, QUIZ_LENGTHS, HSK_WEIGHTS, QUESTION_TYPE_WEIGHTS, getQuestionText } from '@/config';

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
 * Get the length to match for distractors based on variant
 * For word-based answers: use word length
 * For pinyin-based answers: use pinyin length  
 * For meaning-based answers: use first meaning length
 */
function getMatchLength(entry: VocabularyEntry, variant: MCVariant): number {
    switch (variant) {
        case 'word-to-pinyin':
        case 'meaning-to-pinyin':
            return entry.pinyin.length;
        case 'pinyin-to-word':
        case 'meaning-to-word':
            return entry.word.length;
        case 'word-to-meaning':
        case 'pinyin-to-meaning':
            return entry.meaning[0].length;
        default:
            return entry.word.length;
    }
}

/**
 * Find distractors with matching length, gradually expanding tolerance if needed
 */
function findMatchingDistractors(
    vocabulary: VocabularyEntry[],
    correct: VocabularyEntry,
    variant: MCVariant,
    count: number,
    maxTolerance: number
): VocabularyEntry[] {
    const targetLength = getMatchLength(correct, variant);
    const others = vocabulary.filter(v => v.id !== correct.id);

    // Try to find exact matches first, then gradually expand tolerance
    for (let tolerance = 0; tolerance <= maxTolerance; tolerance++) {
        const candidates = others.filter(v => {
            const len = getMatchLength(v, variant);
            return Math.abs(len - targetLength) <= tolerance;
        });

        if (candidates.length >= count) {
            return selectRandom(candidates, count);
        }
    }

    // Fallback: use all available vocabulary if still not enough
    return selectRandom(others, Math.min(count, others.length));
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

    // Randomly select variant first (so we can match length based on answer type)
    const variant = variants[Math.floor(Math.random() * variants.length)];

    // Select correct answer
    const correct = available[Math.floor(Math.random() * available.length)];

    // Find distractors with matching length (exact match preferred, then expand)
    const distractors = findMatchingDistractors(
        vocabulary,
        correct,
        variant,
        distractorCount,
        wordLengthTolerance
    );

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
 * Find distractors with matching word length for fill-blank questions
 * Prioritizes exact match, then gradually expands tolerance
 */
function findFillBlankDistractors(
    vocabulary: VocabularyEntry[],
    correct: VocabularyEntry,
    count: number,
    maxTolerance: number
): VocabularyEntry[] {
    const targetLength = correct.word.length;
    const others = vocabulary.filter(v => v.id !== correct.id);

    // Try exact match first, then gradually expand tolerance
    for (let tolerance = 0; tolerance <= maxTolerance; tolerance++) {
        const candidates = others.filter(v =>
            Math.abs(v.word.length - targetLength) <= tolerance
        );

        if (candidates.length >= count) {
            return selectRandom(candidates, count);
        }
    }

    // Fallback: use all available vocabulary
    return selectRandom(others, Math.min(count, others.length));
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

    // Find distractors with matching word length (exact match preferred)
    const distractors = findFillBlankDistractors(
        vocabulary,
        correct,
        distractorCount,
        wordLengthTolerance
    );

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
 * Split a Chinese sentence into words using pinyin as word boundary hints
 * Punctuation is attached to the preceding word
 */
function splitChineseSentence(sentence: string, pinyin: string): string[] {
    // Chinese punctuation marks
    const punctuation = /[。，！？、；：""''（）《》【】…—·]/;

    // Split pinyin by spaces to get word count hint
    const pinyinWords = pinyin.trim().split(/\s+/).filter(w => w.length > 0);

    // Extract characters from sentence (excluding punctuation for counting)
    const chars: string[] = [];
    const punctuationPositions: Map<number, string> = new Map();

    let charIndex = 0;
    for (let i = 0; i < sentence.length; i++) {
        const char = sentence[i];
        if (punctuation.test(char)) {
            // Store punctuation to attach to previous word
            punctuationPositions.set(charIndex - 1, (punctuationPositions.get(charIndex - 1) || '') + char);
        } else {
            chars.push(char);
            charIndex++;
        }
    }

    // If pinyin word count doesn't help, split character by character
    if (pinyinWords.length === 0 || chars.length === 0) {
        return sentence.split('').filter(c => c.trim());
    }

    // Estimate character count per pinyin word
    // This is a heuristic: most pinyin syllables = 1 Chinese character
    const words: string[] = [];
    let currentCharIndex = 0;

    for (let i = 0; i < pinyinWords.length && currentCharIndex < chars.length; i++) {
        const pinyinWord = pinyinWords[i];
        // Count syllables in pinyin (rough estimate by counting vowels groups)
        // Each syllable roughly corresponds to one Chinese character
        const syllableCount = (pinyinWord.match(/[aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+/gi) || []).length || 1;

        // Take that many characters
        const charCount = Math.min(syllableCount, chars.length - currentCharIndex);
        let word = chars.slice(currentCharIndex, currentCharIndex + charCount).join('');

        // Attach any punctuation that follows this word
        const lastCharPos = currentCharIndex + charCount - 1;
        if (punctuationPositions.has(lastCharPos)) {
            word += punctuationPositions.get(lastCharPos);
        }

        if (word) {
            words.push(word);
        }
        currentCharIndex += charCount;
    }

    // If there are remaining characters, add them as the last word
    if (currentCharIndex < chars.length) {
        let remainingWord = chars.slice(currentCharIndex).join('');
        // Attach any trailing punctuation
        for (let i = currentCharIndex; i < chars.length; i++) {
            if (punctuationPositions.has(i)) {
                remainingWord += punctuationPositions.get(i);
            }
        }
        if (remainingWord) {
            words.push(remainingWord);
        }
    }

    return words.length > 0 ? words : [sentence];
}

/**
 * Generate a sentence arrangement question
 */
export function generateSentenceArrangement(
    vocabulary: VocabularyEntry[],
    usedIds: Set<string>
): SentenceArrangementQuestion | null {
    const { minWords, maxWords } = SENTENCE_ARRANGEMENT_CONFIG;

    // Filter entries that have examples with pinyin
    const available = vocabulary.filter(v => {
        if (usedIds.has(v.id)) return false;
        if (!v.example || !v.examplePinyin || !v.exampleMeaning) return false;
        // The example should have enough content
        return v.example.length >= 4;
    });

    if (available.length < 1) {
        return null;
    }

    // Try to find a suitable sentence (not too short, not too long)
    let selected: VocabularyEntry | null = null;
    let words: string[] = [];

    // Shuffle and try to find a good candidate
    const shuffled = shuffle([...available]);
    for (const entry of shuffled) {
        const splitWords = splitChineseSentence(entry.example, entry.examplePinyin);
        if (splitWords.length >= minWords && splitWords.length <= maxWords) {
            selected = entry;
            words = splitWords;
            break;
        }
    }

    // If no suitable sentence found, use first available with whatever word count
    if (!selected) {
        selected = shuffled[0];
        words = splitChineseSentence(selected.example, selected.examplePinyin);

        // If still too few words, try character-by-character split
        if (words.length < minWords) {
            words = selected.example.split('').filter(c => c.trim() && !/[。，！？、；：""''（）《》【】…—·]/.test(c));
            // Attach punctuation to last word
            const lastPunctuation = selected.example.match(/[。，！？、；：""''（）《》【】…—·]+$/);
            if (lastPunctuation && words.length > 0) {
                words[words.length - 1] += lastPunctuation[0];
            }
        }
    }

    // Create word objects with positions
    const sentenceWords: SentenceWord[] = words.map((text, index) => ({
        id: `${generateQuestionId()}-${index}`,
        text,
        position: index,
    }));

    // Shuffle words for the question
    const shuffledWords = shuffle([...sentenceWords]);

    return {
        id: generateQuestionId(),
        type: 'sentence-arrangement',
        correctSentence: selected.example,
        sentencePinyin: selected.examplePinyin,
        sentenceMeaning: selected.exampleMeaning,
        words: sentenceWords,
        shuffledWords,
        vocabularyEntry: selected,
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
 * Strategy: 
 * - Question types distributed by configurable weights (multipleChoice, matching, fillBlank)
 * - HSK levels distributed by configurable weights (hsk1, hsk2, hsk3)
 * - If questionType is specified, generates only that type of questions
 */
export function generateQuiz(
    vocabulary: VocabularyEntry[],
    length: QuizLength,
    questionType?: QuestionType
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

    // Calculate question type counts
    let mcCount: number;
    let matchingCount: number;
    let fillBlankCount: number;
    let sentenceArrangementCount: number;

    if (questionType) {
        // Single type quiz - all questions are of the specified type
        mcCount = questionType === 'multiple-choice' ? questionCount : 0;
        matchingCount = questionType === 'matching' ? questionCount : 0;
        fillBlankCount = questionType === 'fill-blank' ? questionCount : 0;
        sentenceArrangementCount = questionType === 'sentence-arrangement' ? questionCount : 0;
    } else {
        // Mixed quiz - distribute by configurable weights
        const { multipleChoice: mcWeight, matching: matchingWeight, fillBlank: fillBlankWeight, sentenceArrangement: saWeight } = QUESTION_TYPE_WEIGHTS;
        const totalWeight = mcWeight + matchingWeight + fillBlankWeight + saWeight;

        // Calculate counts based on weights (ensure at least 1 of each type if questionCount >= 4)
        const numTypes = 4;
        const minPerType = questionCount >= numTypes ? 1 : 0;
        const remainingAfterMin = Math.max(0, questionCount - (minPerType * numTypes));

        // Distribute remaining questions by weight
        const mcExtra = Math.round((remainingAfterMin * mcWeight) / totalWeight);
        const matchingExtra = Math.round((remainingAfterMin * matchingWeight) / totalWeight);
        const saExtra = Math.round((remainingAfterMin * saWeight) / totalWeight);
        const fillBlankExtra = remainingAfterMin - mcExtra - matchingExtra - saExtra; // Remainder goes to fillBlank

        mcCount = minPerType + mcExtra;
        matchingCount = minPerType + matchingExtra;
        fillBlankCount = minPerType + fillBlankExtra;
        sentenceArrangementCount = minPerType + saExtra;
    }

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

    // Generate sentence arrangement questions with weighted HSK selection
    for (let i = 0; i < sentenceArrangementCount; i++) {
        const hskLevel = hasHskData ? selectHskLevelByWeight() : 0;
        const vocabPool = hasHskData
            ? getVocabPoolByLevel(hsk1Vocab, hsk2Vocab, hsk3Vocab, hskLevel)
            : vocabulary;

        const sentenceArrangement = generateSentenceArrangement(vocabPool, usedIds);
        if (sentenceArrangement) {
            questions.push(sentenceArrangement);
            usedIds.add(sentenceArrangement.vocabularyEntry.id);
        } else {
            // Fallback to all vocabulary if specific pool is exhausted
            const fallback = generateSentenceArrangement(vocabulary, usedIds);
            if (fallback) {
                questions.push(fallback);
                usedIds.add(fallback.vocabularyEntry.id);
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
    } else if (question.type === 'sentence-arrangement') {
        return [question.vocabularyEntry.id];
    } else {
        return question.items.map(item => item.id);
    }
}
