import type { Question, Answer, MCAnswer, MatchingAnswer, FillBlankAnswer, SentenceArrangementAnswer } from '@/types';
import { MultipleChoice } from './MultipleChoice';
import { MatchingQuestionComponent } from './MatchingQuestion';
import { FillBlankQuestionComponent } from './FillBlankQuestion';
import { SentenceArrangementQuestion } from './SentenceArrangementQuestion';
import { Card } from '@/components/common/Card';

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
    const handleMCSubmit = (selectedId: string, isCorrect: boolean) => {
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
        correctCount: number
    ) => {
        const answer: MatchingAnswer = {
            questionId: question.id,
            type: 'matching',
            connections,
            correctCount,
            timeSpent,
        };
        onSubmit(answer);
    };

    const handleFillBlankSubmit = (selectedId: string, isCorrect: boolean) => {
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
        onSubmit(answer);
    };

    return (
        <Card className="animate-slide-up">
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
                            : 'bg-accent-100 text-accent-700'
                    }`}>
                    {question.type === 'multiple-choice'
                        ? 'Trắc nghiệm'
                        : question.type === 'fill-blank'
                            ? 'Điền ô trống'
                            : question.type === 'sentence-arrangement'
                                ? 'Sắp xếp câu'
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
