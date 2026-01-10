import { useState } from 'react';
import { ChevronUp, ChevronDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardTitle } from '@/components/common/Card';
import type { FrequencyRecord } from '@/types';

interface AnalyticsTableProps {
    frequencyData: FrequencyRecord[];
}

type SortKey = 'appearances' | 'correctAnswers' | 'incorrectAnswers' | 'accuracy' | 'progressPoints';
type SortOrder = 'asc' | 'desc';

export function AnalyticsTable({ frequencyData }: AnalyticsTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>('progressPoints');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc');
        }
    };

    const sortedData = [...frequencyData].sort((a, b) => {
        const multiplier = sortOrder === 'asc' ? 1 : -1;
        return (a[sortKey] - b[sortKey]) * multiplier;
    });

    const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
        if (sortKey !== columnKey) {
            return <ChevronUp size={14} className="text-gray-300" />;
        }
        return sortOrder === 'asc'
            ? <ChevronUp size={14} className="text-primary-500" />
            : <ChevronDown size={14} className="text-primary-500" />;
    };

    const getAccuracyColor = (accuracy: number) => {
        if (accuracy >= 80) return 'text-success-600 bg-success-50';
        if (accuracy >= 50) return 'text-warning-600 bg-warning-50';
        return 'text-error-600 bg-error-50';
    };

    const getProgressColor = (points: number) => {
        if (points > 0) return 'text-success-600 bg-success-50';
        if (points < 0) return 'text-error-600 bg-error-50';
        return 'text-gray-600 bg-gray-50';
    };

    if (frequencyData.length === 0) {
        return (
            <Card>
                <CardTitle className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={20} className="text-warning-500" />
                    Phân tích kết quả
                </CardTitle>
                <p className="text-center text-gray-500 py-8">
                    Không có dữ liệu phân tích
                </p>
            </Card>
        );
    }

    return (
        <Card padding="none" className="overflow-hidden">
            <div className="p-6 border-b border-secondary-100">
                <CardTitle className="flex items-center gap-2">
                    <CheckCircle size={20} className="text-accent-500" />
                    Phân tích kết quả
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                    Sắp xếp theo số lần xuất hiện và số lần sai
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-secondary-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                                Từ vựng
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                                Phiên âm
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 hidden md:table-cell">
                                Nghĩa
                            </th>
                            <th
                                className="px-4 py-3 text-center text-sm font-semibold text-gray-600 cursor-pointer hover:bg-secondary-100"
                                onClick={() => handleSort('appearances')}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    Lần
                                    <SortIcon columnKey="appearances" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-center text-sm font-semibold text-gray-600 cursor-pointer hover:bg-secondary-100"
                                onClick={() => handleSort('correctAnswers')}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    Đúng
                                    <SortIcon columnKey="correctAnswers" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-center text-sm font-semibold text-gray-600 cursor-pointer hover:bg-secondary-100"
                                onClick={() => handleSort('incorrectAnswers')}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    Sai
                                    <SortIcon columnKey="incorrectAnswers" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-center text-sm font-semibold text-gray-600 cursor-pointer hover:bg-secondary-100"
                                onClick={() => handleSort('accuracy')}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    Tỷ lệ
                                    <SortIcon columnKey="accuracy" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-center text-sm font-semibold text-gray-600 cursor-pointer hover:bg-secondary-100"
                                onClick={() => handleSort('progressPoints')}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    Điểm
                                    <SortIcon columnKey="progressPoints" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100">
                        {sortedData.map((record) => (
                            <tr key={record.wordId} className="hover:bg-secondary-50 transition-colors">
                                <td className="px-4 py-3">
                                    <span className="font-chinese text-lg font-medium text-charcoal">
                                        {record.word}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="font-pinyin text-gray-600">
                                        {record.pinyin}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                                    {record.meaning.slice(0, 2).join(', ')}
                                    {record.meaning.length > 2 && '...'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="font-medium text-charcoal">
                                        {record.appearances}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="font-medium text-success-600">
                                        {record.correctAnswers}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="font-medium text-error-600">
                                        {record.incorrectAnswers}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getAccuracyColor(record.accuracy)}`}>
                                        {Math.round(record.accuracy)}%
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getProgressColor(record.progressPoints)}`}>
                                        {record.progressPoints > 0 ? '+' : ''}{record.progressPoints}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
