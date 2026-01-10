import { Clock, Zap, Puzzle } from 'lucide-react';
import { Card, CardTitle } from '@/components/common/Card';
import { formatTime } from '@/hooks/useTimer';
import type { QuizResult } from '@/types';

interface TimeStatsProps {
    result: QuizResult;
}

export function TimeStats({ result }: TimeStatsProps) {
    return (
        <Card>
            <CardTitle className="flex items-center gap-2 mb-4">
                <Clock size={20} className="text-accent-500" />
                Thống kê thời gian
            </CardTitle>

            <div className="space-y-4">
                {/* Total Time */}
                <div className="flex items-center justify-between py-3 border-b border-secondary-100">
                    <span className="text-gray-600">Tổng thời gian hoàn thành</span>
                    <span className="font-semibold text-charcoal">{formatTime(result.totalTime)}</span>
                </div>

                {/* MC Average */}
                {result.mcAverageTime > 0 && (
                    <div className="flex items-center justify-between py-3 border-b border-secondary-100">
                        <div className="flex items-center gap-2">
                            <Zap size={16} className="text-primary-500" />
                            <span className="text-gray-600">Trung bình thời gian câu trắc nghiệm</span>
                        </div>
                        <span className="font-semibold text-charcoal">
                            {formatTime(result.mcAverageTime)}
                        </span>
                    </div>
                )}

                {/* Matching Average */}
                {result.matchingAverageTime > 0 && (
                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2">
                            <Puzzle size={16} className="text-accent-500" />
                            <span className="text-gray-600">Trung bình thời gian câu nối từ</span>
                        </div>
                        <span className="font-semibold text-charcoal">
                            {formatTime(result.matchingAverageTime)}
                        </span>
                    </div>
                )}
            </div>
        </Card>
    );
}
