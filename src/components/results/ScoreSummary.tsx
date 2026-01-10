import { Target, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { formatTime } from '@/hooks/useTimer';
import type { QuizResult } from '@/types';

interface ScoreSummaryProps {
    result: QuizResult;
}

export function ScoreSummary({ result }: ScoreSummaryProps) {
    const percentage = result.percentageScore;
    const progressScore = result.progressScore;

    const getScoreColor = () => {
        if (percentage >= 80) return 'text-success-600';
        if (percentage >= 60) return 'text-warning-600';
        return 'text-error-600';
    };

    const getProgressColor = () => {
        if (progressScore > 5) return 'text-success-600';
        if (progressScore < -5) return 'text-error-600';
        return 'text-warning-600';
    };

    const getProgressIcon = () => {
        if (progressScore > 5) return <TrendingUp size={20} className="text-success-500" />;
        if (progressScore < -5) return <TrendingDown size={20} className="text-error-500" />;
        return <Minus size={20} className="text-warning-500" />;
    };

    const getScoreEmoji = () => {
        if (percentage >= 90) return '🎉';
        if (percentage >= 80) return '👏';
        if (percentage >= 60) return '👍';
        if (percentage >= 40) return '💪';
        return '📚';
    };

    return (
        <Card className="text-center">
            {/* Dual Score Display */}
            <div className="flex justify-center gap-8 mb-6">
                {/* Percentage Score Circle */}
                <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="64"
                            cy="64"
                            r="56"
                            fill="none"
                            stroke="#EAE7DC"
                            strokeWidth="10"
                        />
                        <circle
                            cx="64"
                            cy="64"
                            r="56"
                            fill="none"
                            stroke={percentage >= 80 ? '#567d58' : percentage >= 60 ? '#ecb004' : '#ef4444'}
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={`${(percentage / 100) * 352} 352`}
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl mb-0.5">{getScoreEmoji()}</span>
                        <span className={`text-xl font-bold ${getScoreColor()}`}>
                            {percentage}%
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Tỷ lệ đúng</p>
                </div>

                {/* Progress Score Circle */}
                <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="64"
                            cy="64"
                            r="56"
                            fill="none"
                            stroke="#EAE7DC"
                            strokeWidth="10"
                        />
                        <circle
                            cx="64"
                            cy="64"
                            r="56"
                            fill="none"
                            stroke={progressScore > 5 ? '#567d58' : progressScore < -5 ? '#ef4444' : '#ecb004'}
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={`${(Math.abs(progressScore) / 100) * 352} 352`}
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {getProgressIcon()}
                        <span className={`text-xl font-bold ${getProgressColor()}`}>
                            {progressScore > 0 ? '+' : ''}{progressScore}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Điểm tiến bộ</p>
                </div>
            </div>

            {/* Score Text */}
            <h2 className="text-2xl font-bold text-charcoal mb-2">Kết quả</h2>
            <p className="text-lg text-gray-600 mb-2">
                Đúng <span className="font-semibold text-success-600">{result.correctCount}</span> câu,
                sai <span className="font-semibold text-error-600">{result.incorrectCount}</span> câu
            </p>

            {/* Progress Score Explanation */}
            <p className="text-sm text-gray-500 mb-6">
                {progressScore > 10 && '🌟 Tuyệt vời! Bạn đang tiến bộ rất nhanh với những từ mới!'}
                {progressScore > 0 && progressScore <= 10 && '👍 Tốt! Bạn đang dần nắm vững từ vựng.'}
                {progressScore === 0 && '➡️ Ổn định. Hãy tiếp tục luyện tập!'}
                {progressScore < 0 && progressScore >= -10 && '💪 Cần cải thiện. Hãy ôn lại những từ cũ!'}
                {progressScore < -10 && '📚 Hãy tập trung ôn lại những từ đã học!'}
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary-50 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-2 text-accent-500 mb-2">
                        <Clock size={20} />
                        <span className="text-sm font-medium">Thời gian</span>
                    </div>
                    <p className="text-lg font-semibold text-charcoal">
                        {formatTime(result.totalTime)}
                    </p>
                </div>

                <div className="bg-secondary-50 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-2 text-primary-500 mb-2">
                        <Target size={20} />
                        <span className="text-sm font-medium">Tổng câu hỏi</span>
                    </div>
                    <p className="text-lg font-semibold text-charcoal">
                        {result.totalQuestions} câu
                    </p>
                </div>
            </div>
        </Card>
    );
}
