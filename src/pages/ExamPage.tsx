import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { Layout } from '@/components/common/Layout';
import { ProgressBar } from '@/components/common/ProgressBar';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { QuizTimer } from '@/components/quiz/QuizTimer';
import { useQuizStore } from '@/stores/quizStore';
import { useTimer } from '@/hooks/useTimer';
import { Answer } from '@/types';

export function ExamPage() {
    const navigate = useNavigate();
    const {
        currentQuiz,
        currentQuestionIndex,
        answers,
        isSubmitted,
        getCurrentQuestion,
        getAnswer,
        submitAnswer,
        nextQuestion,
        previousQuestion,
        finishQuiz,
        getProgress,
    } = useQuizStore();

    const {
        formattedTime,
        start,
        getQuestionTime,
        resetQuestionTimer,
    } = useTimer();

    const [showFinishDialog, setShowFinishDialog] = useState(false);
    const questionCardRef = useRef<HTMLDivElement>(null);

    // Start timer when exam begins
    useEffect(() => {
        if (currentQuiz) {
            start();
        }
    }, [currentQuiz, start]);

    // Reset question timer when moving to new question
    useEffect(() => {
        resetQuestionTimer();
    }, [currentQuestionIndex, resetQuestionTimer]);

    // Redirect if no quiz
    useEffect(() => {
        if (!currentQuiz) {
            navigate('/setup');
        }
    }, [currentQuiz, navigate]);

    if (!currentQuiz) {
        return null;
    }

    const currentQuestion = getCurrentQuestion();
    const progress = getProgress();
    const previousAnswer = currentQuestion ? getAnswer(currentQuestion.id) : undefined;
    const isLastQuestion = currentQuestionIndex === currentQuiz.questions.length - 1;
    const allAnswered = answers.length === currentQuiz.questions.length;

    const handleSubmitAnswer = (answer: Answer) => {
        submitAnswer(answer);
    };

    const handleNext = () => {
        if (isLastQuestion) {
            if (allAnswered) {
                handleFinish();
            } else {
                setShowFinishDialog(true);
            }
        } else {
            nextQuestion();
        }
    };

    const handleFinish = async () => {
        try {
            await finishQuiz();
            navigate('/results');
        } catch (error) {
            console.error('Failed to finish quiz:', error);
        }
    };

    const handleGoHome = () => {
        if (confirm('Bạn có chắc muốn thoát? Tiến độ bài thi sẽ không được lưu.')) {
            navigate('/');
        }
    };

    return (
        <Layout>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={handleGoHome}
                    className="flex items-center gap-1 text-gray-500 hover:text-charcoal transition-colors p-2 rounded-lg hover:bg-secondary-100"
                >
                    <Home size={18} />
                    <span className="text-sm">Trang chủ</span>
                </button>

                <QuizTimer time={formattedTime} />
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Tiến độ</span>
                    <span className="font-medium">
                        {progress.current} / {progress.total}
                    </span>
                </div>
                <ProgressBar value={progress.percentage} size="md" />
            </div>

            {/* Main Content with Side Navigation */}
            <div className="relative flex items-stretch min-h-[400px]">
                {/* Left Navigation Button - Full height, invisible outline, glow on hover */}
                <button
                    onClick={previousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className={`
                        flex-shrink-0 w-12 md:w-14 rounded-l-xl flex items-center justify-center
                        transition-all duration-300
                        ${currentQuestionIndex === 0
                            ? 'opacity-30 pointer-events-none text-gray-300'
                            : 'text-primary-500 hover:text-primary-600 hover:bg-primary-50/80 hover:shadow-[0_0_25px_rgba(232,90,79,0.4)] active:scale-95'
                        }
                    `}
                >
                    <ChevronLeft size={32} strokeWidth={2.5} />
                </button>

                {/* Question Card */}
                <div ref={questionCardRef} className="flex-1 min-w-0">
                    {currentQuestion && (
                        <QuestionCard
                            question={currentQuestion}
                            questionNumber={progress.current}
                            totalQuestions={progress.total}
                            onSubmit={handleSubmitAnswer}
                            isSubmitted={isSubmitted}
                            previousAnswer={previousAnswer}
                            timeSpent={getQuestionTime()}
                            readOnly={!!previousAnswer}
                        />
                    )}
                </div>

                {/* Right Navigation Button - Full height, invisible outline, glow on hover */}
                <button
                    onClick={handleNext}
                    disabled={!isSubmitted}
                    className={`
                        flex-shrink-0 w-12 md:w-14 rounded-r-xl flex items-center justify-center
                        transition-all duration-300
                        ${!isSubmitted
                            ? 'opacity-30 pointer-events-none text-gray-300'
                            : isLastQuestion
                                ? 'text-success-500 hover:text-success-600 hover:bg-success-50/80 hover:shadow-[0_0_25px_rgba(86,125,88,0.5)] active:scale-95 animate-pulse'
                                : 'text-primary-500 hover:text-primary-600 hover:bg-primary-50/80 hover:shadow-[0_0_25px_rgba(232,90,79,0.4)] active:scale-95'
                        }
                    `}
                >
                    {isLastQuestion ? <Flag size={28} strokeWidth={2.5} /> : <ChevronRight size={32} strokeWidth={2.5} />}
                </button>
            </div>

            {/* Question Navigator */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
                {currentQuiz.questions.map((q, index) => {
                    const isAnswered = answers.some(a => a.questionId === q.id);
                    const isCurrent = index === currentQuestionIndex;

                    return (
                        <button
                            key={q.id}
                            onClick={() => useQuizStore.getState().goToQuestion(index)}
                            className={`
                                w-9 h-9 rounded-lg text-sm font-medium transition-all
                                ${isCurrent
                                    ? 'bg-primary-500 text-white ring-2 ring-primary-300'
                                    : isAnswered
                                        ? 'bg-success-100 text-success-700 hover:bg-success-200'
                                        : 'bg-secondary-100 text-gray-600 hover:bg-secondary-200'
                                }
                            `}
                        >
                            {index + 1}
                        </button>
                    );
                })}
            </div>

            {/* Finish Dialog */}
            {showFinishDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-scale-in">
                        <h3 className="text-xl font-bold text-charcoal mb-2">
                            Hoàn thành bài thi?
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Bạn đã trả lời {answers.length}/{currentQuiz.questions.length} câu hỏi.
                            {answers.length < currentQuiz.questions.length && (
                                <span className="text-warning-600 block mt-1">
                                    Còn {currentQuiz.questions.length - answers.length} câu chưa trả lời!
                                </span>
                            )}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowFinishDialog(false)}
                                className="flex-1 px-4 py-3 rounded-xl text-charcoal bg-secondary-100 hover:bg-secondary-200 transition-colors font-medium"
                            >
                                Tiếp tục làm
                            </button>
                            <button
                                onClick={handleFinish}
                                className="flex-1 px-4 py-3 rounded-xl text-white bg-primary-500 hover:bg-primary-600 transition-colors font-medium"
                            >
                                Nộp bài
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
