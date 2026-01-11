import { useState, useCallback, useEffect } from 'react';
import type { Question, Answer, MCAnswer, MatchingAnswer, FillBlankAnswer, SentenceArrangementAnswer, SentenceCompletionAnswer } from '@/types';
import { MultipleChoice } from './MultipleChoice';
import { MatchingQuestionComponent } from './MatchingQuestion';
import { FillBlankQuestionComponent } from './FillBlankQuestion';
import { SentenceArrangementQuestion } from './SentenceArrangementQuestion';
import { SentenceCompletionQuestionComponent } from './SentenceCompletionQuestion';
import { Card } from '@/components/common/Card';
import { useSoundEffects, getAnimationDurations } from '@/hooks/useSoundEffects';

interface QuestionCardProps {
    question: Question;
    questionNumber: number;
    totalQuestions: number;
    onSubmit: (answer: Answer) => void;
    isSubmitted: boolean;
    previousAnswer?: Answer;
    timeSpent: number;
    readOnly?: boolean;
}

export function QuestionCard({
    question,
    questionNumber,
    totalQuestions,
    onSubmit,
    isSubmitted,
    previousAnswer,
    timeSpent,
    readOnly = false,
}: QuestionCardProps) {
    const { playSound } = useSoundEffects();
    const { shakeDuration, successPulseDuration, animationEnabled } = getAnimationDurations();

    // Animation states (temporary)
    const [shakeAnimation, setShakeAnimation] = useState(false);
    const [pulseAnimation, setPulseAnimation] = useState(false);

    // Track if initial slide-up animation is done
    const [initialAnimationDone, setInitialAnimationDone] = useState(false);

    // Persistent feedback state (stays until question changes)
    const [feedbackResult, setFeedbackResult] = useState<'correct' | 'incorrect' | null>(null);

    // Reset feedback when question changes
    useEffect(() => {
        setFeedbackResult(null);
        setShakeAnimation(false);
        setPulseAnimation(false);
        setInitialAnimationDone(false);
        // Mark initial animation as done after it completes
        const timer = setTimeout(() => setInitialAnimationDone(true), 400);
        return () => clearTimeout(timer);
    }, [question.id]);

    const triggerFeedback = useCallback((isCorrect: boolean) => {
        playSound(isCorrect ? 'correct' : 'incorrect');

        // Set persistent feedback result
        setFeedbackResult(isCorrect ? 'correct' : 'incorrect');

        if (!animationEnabled) return;

        if (isCorrect) {
            setPulseAnimation(true);
            setTimeout(() => setPulseAnimation(false), successPulseDuration);
        } else {
            setShakeAnimation(true);
            setTimeout(() => setShakeAnimation(false), shakeDuration);
        }
    }, [playSound, animationEnabled, shakeDuration, successPulseDuration]);

    const handleMCSubmit = (selectedId: string, isCorrect: boolean) => {
        triggerFeedback(isCorrect);
        const answer: MCAnswer = {
            questionId: question.id,
            type: 'multiple-choice',
            selectedOption: selectedId,
            isCorrect,
            timeSpent,
        };
        onSubmit(answer);
    };

    const handleMatchingSubmit = (
        connections: { word: string; pinyin: string; meaning: string; isCorrect: boolean }[],
        correctCount: number,
        usedHint: boolean = false
    ) => {
        const allCorrect = correctCount === connections.length;
        triggerFeedback(allCorrect);
        const answer: MatchingAnswer = {
            questionId: question.id,
            type: 'matching',
            connections,
            correctCount,
            timeSpent,
            usedHint,
        };
        onSubmit(answer);
    };

    const handleFillBlankSubmit = (selectedId: string, isCorrect: boolean) => {
        triggerFeedback(isCorrect);
        const answer: FillBlankAnswer = {
            questionId: question.id,
            type: 'fill-blank',
            selectedOption: selectedId,
            isCorrect,
            timeSpent,
        };
        onSubmit(answer);
    };

    const handleSentenceArrangementSubmit = (answer: SentenceArrangementAnswer) => {
        triggerFeedback(answer.isCorrect);
        onSubmit(answer);
    };

    const handleSentenceCompletionSubmit = (userInput: string, isCorrect: boolean) => {
        triggerFeedback(isCorrect);
        const answer: SentenceCompletionAnswer = {
            questionId: question.id,
            type: 'sentence-completion',
            userInput,
            isCorrect,
            timeSpent,
        };
        onSubmit(answer);
    };

    // Build animation classes - only apply one animation at a time to avoid conflicts
    const getAnimationClass = () => {
        if (shakeAnimation) return 'animate-shake';
        if (pulseAnimation) return 'animate-success-pulse animate-success-bounce';
        // Only apply slide-up on initial render, then no animation to avoid jiggle
        if (!initialAnimationDone) return 'animate-slide-up';
        return '';
    };

    // Persistent styles based on feedback result (stays until question changes)
    const getFeedbackStyle = () => {
        if (feedbackResult === 'correct') {
            return {
                boxShadow: '0 0 0 3px rgba(86, 125, 88, 0.4), 0 0 15px rgba(86, 125, 88, 0.2)',
                borderColor: 'rgb(86, 125, 88)',
                backgroundColor: 'rgba(228, 235, 228, 0.3)',
            };
        }
        if (feedbackResult === 'incorrect') {
            return {
                boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.4), 0 0 15px rgba(239, 68, 68, 0.2)',
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(254, 226, 226, 0.3)',
            };
        }
        return {};
    };

    return (
        <Card
            className={`${getAnimationClass()} transition-all duration-300 border-2 border-transparent`}
            style={getFeedbackStyle()}
        >
            {/* Question Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-secondary-100">
                <span className="text-sm font-medium text-gray-500">
                    Câu hỏi {questionNumber} / {totalQuestions}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${question.type === 'multiple-choice'
                    ? 'bg-primary-100 text-primary-700'
                    : question.type === 'fill-blank'
                        ? 'bg-warning-100 text-warning-700'
                        : question.type === 'sentence-arrangement'
                            ? 'bg-purple-100 text-purple-700'
                            : question.type === 'sentence-completion'
                                ? 'bg-teal-100 text-teal-700'
                                : 'bg-accent-100 text-accent-700'
                    }`}>
                    {question.type === 'multiple-choice'
                        ? 'Trắc nghiệm'
                        : question.type === 'fill-blank'
                            ? 'Điền ô trống'
                            : question.type === 'sentence-arrangement'
                                ? 'Sắp xếp câu'
                                : question.type === 'sentence-completion'
                                    ? 'Hoàn thiện câu'
                                    : 'Nối từ'}
                </span>
            </div>

            {/* Question Content */}
            {question.type === 'multiple-choice' ? (
                <MultipleChoice
                    question={question}
                    onSubmit={handleMCSubmit}
                    isSubmitted={isSubmitted}
                    previousAnswer={(previousAnswer as MCAnswer)?.selectedOption}
                    readOnly={readOnly}
                />
            ) : question.type === 'fill-blank' ? (
                <FillBlankQuestionComponent
                    question={question}
                    onSubmit={handleFillBlankSubmit}
                    isSubmitted={isSubmitted}
                    previousAnswer={(previousAnswer as FillBlankAnswer)?.selectedOption}
                    readOnly={readOnly}
                />
            ) : question.type === 'sentence-arrangement' ? (
                <SentenceArrangementQuestion
                    question={question}
                    onAnswer={handleSentenceArrangementSubmit}
                    questionStartTime={Date.now() - timeSpent}
                    isSubmitted={isSubmitted}
                    existingAnswer={previousAnswer as SentenceArrangementAnswer | undefined}
                />
            ) : question.type === 'sentence-completion' ? (
                <SentenceCompletionQuestionComponent
                    question={question}
                    onSubmit={handleSentenceCompletionSubmit}
                    isSubmitted={isSubmitted}
                    previousAnswer={(previousAnswer as SentenceCompletionAnswer)?.userInput}
                    readOnly={readOnly}
                />
            ) : (
                <MatchingQuestionComponent
                    question={question}
                    onSubmit={handleMatchingSubmit}
                    isSubmitted={isSubmitted}
                    previousAnswer={previousAnswer as MatchingAnswer | undefined}
                    readOnly={readOnly}
                />
            )}
        </Card>
    );
}
