import { create } from 'zustand';
import type {
    Quiz,
    Question,
    Answer,
    MCAnswer,
    MatchingAnswer,
    FillBlankAnswer,
    SentenceArrangementAnswer,
    FrequencyRecord,
    QuizResult,
    QuizLength,
    QuestionType,
    VocabularyEntry,
    MultipleChoiceQuestion,
    MatchingQuestion,
    FillBlankQuestion,
    SentenceArrangementQuestion,
} from '@/types';
import { generateQuiz, getQuestionVocabularyIds } from '@/lib/quizGenerator';
import { saveQuizHistory, updateGlobalWordStats, getWordStats, calculateProgressPoints } from '@/lib/db';

interface QuizState {
    currentQuiz: Quiz | null;
    currentQuestionIndex: number;
    answers: Answer[];
    frequency: Map<string, FrequencyRecord>;
    questionStartTime: number;
    isSubmitted: boolean;
    result: QuizResult | null;

    // Actions
    startQuiz: (vocabulary: VocabularyEntry[], length: QuizLength, questionType?: QuestionType) => void;
    submitAnswer: (answer: Answer) => void;
    nextQuestion: () => void;
    previousQuestion: () => void;
    goToQuestion: (index: number) => void;
    finishQuiz: () => Promise<QuizResult>;
    resetQuiz: () => void;

    // Helpers
    getCurrentQuestion: () => Question | null;
    getAnswer: (questionId: string) => Answer | undefined;
    isQuestionAnswered: (questionId: string) => boolean;
    getProgress: () => { current: number; total: number; percentage: number };
}

export const useQuizStore = create<QuizState>((set, get) => ({
    currentQuiz: null,
    currentQuestionIndex: 0,
    answers: [],
    frequency: new Map(),
    questionStartTime: Date.now(),
    isSubmitted: false,
    result: null,

    startQuiz: (vocabulary: VocabularyEntry[], length: QuizLength, questionType?: QuestionType) => {
        const quiz = generateQuiz(vocabulary, length, questionType);

        // Initialize frequency tracking for all words in quiz
        const frequency = new Map<string, FrequencyRecord>();

        for (const question of quiz.questions) {
            const ids = getQuestionVocabularyIds(question);
            for (const id of ids) {
                if (!frequency.has(id)) {
                    const entry = vocabulary.find(v => v.id === id);
                    if (entry) {
                        frequency.set(id, {
                            wordId: id,
                            word: entry.word,
                            pinyin: entry.pinyin,
                            meaning: entry.meaning,
                            appearances: 0,
                            correctAnswers: 0,
                            incorrectAnswers: 0,
                            accuracy: 0,
                            progressPoints: 0,
                        });
                    }
                }
            }
        }

        set({
            currentQuiz: quiz,
            currentQuestionIndex: 0,
            answers: [],
            frequency,
            questionStartTime: Date.now(),
            isSubmitted: false,
            result: null,
        });
    },

    submitAnswer: (answer: Answer) => {
        const { answers, frequency, currentQuiz } = get();

        // Check if already answered
        if (answers.some(a => a.questionId === answer.questionId)) {
            return;
        }

        // Update frequency tracking
        const question = currentQuiz?.questions.find(q => q.id === answer.questionId);
        if (question) {
            const updatedFrequency = new Map(frequency);

            if (question.type === 'multiple-choice') {
                const mcQuestion = question as MultipleChoiceQuestion;
                const record = updatedFrequency.get(mcQuestion.correctAnswer.id);
                if (record) {
                    record.appearances++;
                    if ((answer as MCAnswer).isCorrect) {
                        record.correctAnswers++;
                    } else {
                        record.incorrectAnswers++;
                    }
                    record.accuracy = (record.correctAnswers / record.appearances) * 100;
                }
            } else if (question.type === 'fill-blank') {
                const fillBlankQuestion = question as FillBlankQuestion;
                const record = updatedFrequency.get(fillBlankQuestion.correctAnswer.id);
                if (record) {
                    record.appearances++;
                    if ((answer as FillBlankAnswer).isCorrect) {
                        record.correctAnswers++;
                    } else {
                        record.incorrectAnswers++;
                    }
                    record.accuracy = (record.correctAnswers / record.appearances) * 100;
                }
            } else if (question.type === 'sentence-arrangement') {
                const saQuestion = question as SentenceArrangementQuestion;
                const saAnswer = answer as SentenceArrangementAnswer;
                const record = updatedFrequency.get(saQuestion.vocabularyEntry.id);
                if (record) {
                    record.appearances++;
                    if (saAnswer.isCorrect) {
                        record.correctAnswers++;
                    } else {
                        record.incorrectAnswers++;
                    }
                    record.accuracy = (record.correctAnswers / record.appearances) * 100;
                }
            } else {
                const matchingQuestion = question as MatchingQuestion;
                const matchingAnswer = answer as MatchingAnswer;

                for (const item of matchingQuestion.items) {
                    const record = updatedFrequency.get(item.id);
                    if (record) {
                        record.appearances++;
                        const connection = matchingAnswer.connections.find(
                            c => c.word === item.word
                        );
                        if (connection?.isCorrect) {
                            record.correctAnswers++;
                        } else {
                            record.incorrectAnswers++;
                        }
                        record.accuracy = (record.correctAnswers / record.appearances) * 100;
                    }
                }
            }

            set({
                answers: [...answers, answer],
                frequency: updatedFrequency,
                isSubmitted: true,
            });
        }
    },

    nextQuestion: () => {
        const { currentQuiz, currentQuestionIndex } = get();
        if (currentQuiz && currentQuestionIndex < currentQuiz.questions.length - 1) {
            set({
                currentQuestionIndex: currentQuestionIndex + 1,
                questionStartTime: Date.now(),
                isSubmitted: false,
            });
        }
    },

    previousQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
            set({
                currentQuestionIndex: currentQuestionIndex - 1,
                isSubmitted: true, // Previous questions are always "submitted"
            });
        }
    },

    goToQuestion: (index: number) => {
        const { currentQuiz, answers } = get();
        if (currentQuiz && index >= 0 && index < currentQuiz.questions.length) {
            const question = currentQuiz.questions[index];
            const isAnswered = answers.some(a => a.questionId === question.id);
            set({
                currentQuestionIndex: index,
                questionStartTime: Date.now(),
                isSubmitted: isAnswered,
            });
        }
    },

    finishQuiz: async () => {
        const { currentQuiz, answers, frequency } = get();

        if (!currentQuiz) {
            throw new Error('No active quiz');
        }

        const endTime = Date.now();
        const totalTime = endTime - currentQuiz.startTime;

        // Calculate statistics
        let correctCount = 0;
        let mcTotalTime = 0;
        let mcCount = 0;
        let matchingTotalTime = 0;
        let matchingCount = 0;
        let fillBlankTotalTime = 0;
        let fillBlankCount = 0;
        let sentenceArrangementTotalTime = 0;
        let sentenceArrangementCount = 0;

        for (const answer of answers) {
            if (answer.type === 'multiple-choice') {
                if (answer.isCorrect) correctCount++;
                mcTotalTime += answer.timeSpent;
                mcCount++;
            } else if (answer.type === 'fill-blank') {
                if (answer.isCorrect) correctCount++;
                fillBlankTotalTime += answer.timeSpent;
                fillBlankCount++;
            } else if (answer.type === 'sentence-arrangement') {
                // Only count as correct if 100% of words are in correct position
                if (answer.isCorrect) correctCount++;
                sentenceArrangementTotalTime += answer.timeSpent;
                sentenceArrangementCount++;
            } else {
                correctCount += answer.correctCount;
                matchingTotalTime += answer.timeSpent;
                matchingCount++;
            }
        }

        const totalQuestions = currentQuiz.questions.reduce((sum, q) => {
            if (q.type === 'matching') {
                return sum + (q as MatchingQuestion).items.length;
            }
            // Sentence arrangement counts as 1 question (not by word count)
            return sum + 1;
        }, 0);

        // Calculate progress points for each word and update global stats
        let totalProgressScore = 0;
        const updatedFrequency = new Map(frequency);

        for (const [wordId, record] of updatedFrequency) {
            if (record.appearances > 0) {
                // Get current global stats for this word
                const globalStats = await getWordStats(wordId);
                const currentAppearances = globalStats?.totalAppearances || 0;

                // Calculate progress points based on correctness and word "newness"
                let wordProgressPoints = 0;

                // For each correct answer, add points (more for newer words)
                for (let i = 0; i < record.correctAnswers; i++) {
                    wordProgressPoints += calculateProgressPoints(currentAppearances + i, true);
                }

                // For each incorrect answer, subtract points (more for older words)
                for (let i = 0; i < record.incorrectAnswers; i++) {
                    wordProgressPoints += calculateProgressPoints(currentAppearances + record.correctAnswers + i, false);
                }

                record.progressPoints = Math.round(wordProgressPoints * 10) / 10;
                totalProgressScore += wordProgressPoints;

                // Update global word stats
                for (let i = 0; i < record.appearances; i++) {
                    const isCorrect = i < record.correctAnswers;
                    await updateGlobalWordStats(wordId, record.word, record.pinyin, record.meaning, isCorrect);
                }
            }
        }

        // Clamp progress score to [-100, 100]
        totalProgressScore = Math.max(-100, Math.min(100, Math.round(totalProgressScore * 10) / 10));

        const frequencyData = Array.from(updatedFrequency.values())
            .filter(f => f.appearances > 0)
            .sort((a, b) => {
                // Sort by progress points (desc), then by incorrect (desc)
                if (b.progressPoints !== a.progressPoints) return b.progressPoints - a.progressPoints;
                return b.incorrectAnswers - a.incorrectAnswers;
            });

        const percentageScore = Math.round((correctCount / totalQuestions) * 100);

        const result: QuizResult = {
            quizId: currentQuiz.id,
            date: new Date(),
            length: currentQuiz.length,
            totalQuestions,
            correctCount,
            incorrectCount: totalQuestions - correctCount,
            totalTime,
            mcAverageTime: mcCount > 0 ? mcTotalTime / mcCount : 0,
            matchingAverageTime: matchingCount > 0 ? matchingTotalTime / matchingCount : 0,
            fillBlankAverageTime: fillBlankCount > 0 ? fillBlankTotalTime / fillBlankCount : 0,
            frequencyData,
            answers,
            progressScore: totalProgressScore,
            percentageScore,
        };

        // Save to IndexedDB with full analytics
        await saveQuizHistory({
            quizId: currentQuiz.id,
            date: new Date(),
            score: percentageScore,
            progressScore: totalProgressScore,
            totalQuestions,
            correctCount,
            incorrectCount: totalQuestions - correctCount,
            duration: totalTime,
            frequencyData,
            quizLength: currentQuiz.length,
        });

        set({ result });
        return result;
    },

    resetQuiz: () => {
        set({
            currentQuiz: null,
            currentQuestionIndex: 0,
            answers: [],
            frequency: new Map(),
            questionStartTime: Date.now(),
            isSubmitted: false,
            result: null,
        });
    },

    getCurrentQuestion: () => {
        const { currentQuiz, currentQuestionIndex } = get();
        if (!currentQuiz) return null;
        return currentQuiz.questions[currentQuestionIndex] || null;
    },

    getAnswer: (questionId: string) => {
        const { answers } = get();
        return answers.find(a => a.questionId === questionId);
    },

    isQuestionAnswered: (questionId: string) => {
        const { answers } = get();
        return answers.some(a => a.questionId === questionId);
    },

    getProgress: () => {
        const { currentQuiz, currentQuestionIndex } = get();
        if (!currentQuiz) return { current: 0, total: 0, percentage: 0 };

        const total = currentQuiz.questions.length;
        const current = currentQuestionIndex + 1;
        const percentage = (current / total) * 100;

        return { current, total, percentage };
    },
}));
