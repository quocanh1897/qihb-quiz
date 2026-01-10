import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { Layout } from '@/components/common/Layout';
import { Button } from '@/components/common/Button';
import { ProgressBar } from '@/components/common/ProgressBar';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { QuizTimer } from '@/components/quiz/QuizTimer';
import { useQuizStore } from '@/stores/quizStore';
import { useTimer } from '@/hooks/useTimer';
import type { Answer } from '@/types';

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
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoHome}
          icon={<Home size={18} />}
        >
          Trang chủ
        </Button>
        
        <QuizTimer time={formattedTime} />
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Tiến độ</span>
          <span className="font-medium">
            {progress.current} / {progress.total}
          </span>
        </div>
        <ProgressBar value={progress.percentage} size="md" />
      </div>

      {/* Question Card */}
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

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="ghost"
          size="md"
          onClick={previousQuestion}
          disabled={currentQuestionIndex === 0}
          icon={<ChevronLeft size={18} />}
        >
          Lùi
        </Button>

        {isSubmitted && (
          <Button
            variant={isLastQuestion ? 'primary' : 'accent'}
            size="md"
            onClick={handleNext}
            icon={isLastQuestion ? <Flag size={18} /> : <ChevronRight size={18} />}
            iconPosition="right"
          >
            {isLastQuestion ? 'Hoàn thành' : 'Tiến'}
          </Button>
        )}
      </div>

      {/* Question Navigator */}
      <div className="mt-8 pt-6 border-t border-secondary-200">
        <p className="text-sm text-gray-500 mb-3">Điều hướng câu hỏi:</p>
        <div className="flex flex-wrap gap-2">
          {currentQuiz.questions.map((q, index) => {
            const isAnswered = answers.some(a => a.questionId === q.id);
            const isCurrent = index === currentQuestionIndex;
            
            return (
              <button
                key={q.id}
                onClick={() => useQuizStore.getState().goToQuestion(index)}
                className={`
                  w-10 h-10 rounded-lg text-sm font-medium transition-all
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
              <Button
                variant="ghost"
                fullWidth
                onClick={() => setShowFinishDialog(false)}
              >
                Tiếp tục làm
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleFinish}
              >
                Nộp bài
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
