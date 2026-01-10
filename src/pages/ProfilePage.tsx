import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, Target, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Trash2, AlertTriangle, BookOpen, X } from 'lucide-react';
import { Layout, PageHeader } from '@/components/common/Layout';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { SpeakerButton } from '@/components/common/SpeakerButton';
import { getQuizHistory, getAllWordStats, getVocabulary, db } from '@/lib/db';
import { formatTime } from '@/hooks/useTimer';
import type { QuizHistory, FrequencyRecord, GlobalWordStats, VocabularyEntry } from '@/types';
import { QUIZ_LENGTHS } from '@/config';

// Word Detail Popup Component
interface WordDetailPopupProps {
    word: VocabularyEntry | null;
    onClose: () => void;
    position: { top: number; left: number } | null;
}

function WordDetailPopup({ word, onClose, position }: WordDetailPopupProps) {
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    if (!word || !position) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-fade-in">
            <div
                ref={popupRef}
                className="bg-white rounded-2xl shadow-2xl border border-secondary-200 max-w-sm w-full mx-4 overflow-hidden animate-scale-in"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="font-chinese text-2xl font-bold text-white">{word.word}</span>
                        <SpeakerButton text={word.word} size={20} className="text-white hover:bg-white/20" />
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Pinyin */}
                    <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phiên âm</span>
                        <p className="font-pinyin text-lg text-charcoal">{word.pinyin}</p>
                    </div>

                    {/* Type */}
                    {word.type && (
                        <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Từ loại</span>
                            <p className="text-charcoal">
                                <span className="inline-block px-2 py-0.5 bg-accent-100 text-accent-700 rounded text-sm">
                                    {word.type}
                                </span>
                            </p>
                        </div>
                    )}

                    {/* Meaning */}
                    <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nghĩa</span>
                        <p className="text-charcoal">{word.meaning.join(', ')}</p>
                    </div>

                    {/* Example */}
                    {word.example && (
                        <div className="bg-secondary-50 rounded-xl p-3 space-y-2">
                            <div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ví dụ</span>
                                <p className="font-chinese text-charcoal">{word.example}</p>
                            </div>
                            {word.examplePinyin && (
                                <div>
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phiên âm ví dụ</span>
                                    <p className="font-pinyin text-sm text-gray-600">{word.examplePinyin}</p>
                                </div>
                            )}
                            {word.exampleMeaning && (
                                <div>
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nghĩa ví dụ</span>
                                    <p className="text-charcoal text-sm">{word.exampleMeaning}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Clickable Word Button Component
interface WordButtonProps {
    word: string;
    vocabularyMap: Map<string, VocabularyEntry>;
    onWordClick: (word: VocabularyEntry, event: React.MouseEvent) => void;
    className?: string;
}

function WordButton({ word, vocabularyMap, onWordClick, className = '' }: WordButtonProps) {
    const handleClick = (e: React.MouseEvent) => {
        // Find vocabulary entry by word
        const entry = Array.from(vocabularyMap.values()).find(v => v.word === word);
        if (entry) {
            onWordClick(entry, e);
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`font-chinese font-semibold text-primary-700 bg-primary-50 border border-primary-200 px-2 py-1 rounded-md transition-all duration-200 cursor-pointer hover:bg-primary-100 hover:border-primary-400 hover:shadow-sm active:scale-95 underline decoration-primary-300 decoration-dashed underline-offset-2 ${className}`}
        >
            {word}
        </button>
    );
}

export function ProfilePage() {
    const navigate = useNavigate();
    const [history, setHistory] = useState<QuizHistory[]>([]);
    const [globalStats, setGlobalStats] = useState<GlobalWordStats[]>([]);
    const [vocabularyMap, setVocabularyMap] = useState<Map<string, VocabularyEntry>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [showAllStats, setShowAllStats] = useState(false);
    const [selectedWord, setSelectedWord] = useState<VocabularyEntry | null>(null);
    const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [historyData, statsData, vocabData] = await Promise.all([
                getQuizHistory(),
                getAllWordStats(),
                getVocabulary(),
            ]);
            setHistory(historyData);
            // Sort by progressScore ascending (lowest/worst first)
            setGlobalStats(statsData.sort((a, b) => a.progressScore - b.progressScore));

            // Create a map for quick lookup
            const vocabMap = new Map<string, VocabularyEntry>();
            vocabData.forEach(v => {
                vocabMap.set(v.id, v);
                vocabMap.set(v.word, v); // Also map by word for easy lookup
            });
            setVocabularyMap(vocabMap);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearHistory = async () => {
        if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử và thống kê tiến độ?')) {
            await Promise.all([
                db.quizHistory.clear(),
                db.globalWordStats.clear(),
            ]);
            setHistory([]);
            setGlobalStats([]);
        }
    };

    const handleDeleteEntry = async (id: number) => {
        if (confirm('Bạn có chắc muốn xóa bài thi này?')) {
            await db.quizHistory.delete(id);
            setHistory(history.filter(h => h.id !== id));
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleWordClick = useCallback((word: VocabularyEntry, event: React.MouseEvent) => {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setPopupPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
        });
        setSelectedWord(word);
    }, []);

    const handleClosePopup = useCallback(() => {
        setSelectedWord(null);
        setPopupPosition(null);
    }, []);

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getProgressIcon = (score: number) => {
        if (score > 5) return <TrendingUp size={16} className="text-success-500" />;
        if (score < -5) return <TrendingDown size={16} className="text-error-500" />;
        return <Minus size={16} className="text-warning-500" />;
    };

    const getProgressColor = (score: number) => {
        if (score > 5) return 'text-success-600';
        if (score < -5) return 'text-error-600';
        return 'text-warning-600';
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-success-600 bg-success-50';
        if (score >= 60) return 'text-warning-600 bg-warning-50';
        return 'text-error-600 bg-error-50';
    };

    const getProgressScoreBadgeColor = (score: number) => {
        if (score > 5) return 'text-success-600 bg-success-50';
        if (score < -5) return 'text-error-600 bg-error-50';
        return 'text-warning-600 bg-warning-50';
    };

    // Get top 5 words that need review (lowest progress score)
    const top5NeedReview = globalStats.slice(0, 5);

    // Stats to display (limited or all)
    const displayedStats = showAllStats ? globalStats : globalStats.slice(0, 10);

    return (
        <Layout>
            {/* Word Detail Popup */}
            <WordDetailPopup
                word={selectedWord}
                onClose={handleClosePopup}
                position={popupPosition}
            />

            {/* Back Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                icon={<ChevronLeft size={18} />}
                className="mb-6"
            >
                Quay lại
            </Button>

            <PageHeader
                title="📊 Thống kê học tập"
                subtitle="Xem tiến độ học tập và lịch sử các bài thi đã làm"
            />

            {isLoading ? (
                <Card className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-500">Đang tải dữ liệu...</p>
                </Card>
            ) : history.length === 0 ? (
                <Card className="text-center py-12">
                    <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-charcoal mb-2">Chưa có dữ liệu</h3>
                    <p className="text-gray-500 mb-6">Hoàn thành bài thi đầu tiên để xem thống kê ở đây!</p>
                    <Button variant="primary" onClick={() => navigate('/setup')}>
                        Bắt đầu làm bài
                    </Button>
                </Card>
            ) : (
                <>
                    {/* Summary Stats */}
                    <Card className="mb-6 bg-gradient-to-r from-primary-50 to-accent-50">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-charcoal">{history.length}</p>
                                <p className="text-sm text-gray-500">Bài thi</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-charcoal">
                                    {Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length)}%
                                </p>
                                <p className="text-sm text-gray-500">TB tỷ lệ đúng</p>
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${getProgressColor(
                                    Math.round(history.reduce((sum, h) => sum + (h.progressScore || 0), 0) / history.length)
                                )}`}>
                                    {Math.round(history.reduce((sum, h) => sum + (h.progressScore || 0), 0) / history.length) > 0 ? '+' : ''}
                                    {Math.round(history.reduce((sum, h) => sum + (h.progressScore || 0), 0) / history.length)}
                                </p>
                                <p className="text-sm text-gray-500">TB điểm tiến bộ</p>
                            </div>
                        </div>
                    </Card>

                    {/* Global Learning Progress Stats */}
                    {globalStats.length > 0 && (
                        <Card className="mb-6" padding="none">
                            {/* Top 5 Words to Review */}
                            {top5NeedReview.length > 0 && (
                                <div className="p-4 border-b border-secondary-100 bg-gradient-to-r from-error-50 to-warning-50">
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertTriangle size={18} className="text-error-500" />
                                        <h3 className="font-semibold text-charcoal">Top 5 từ cần ôn tập</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {top5NeedReview.map((stat, index) => (
                                            <div
                                                key={stat.wordId}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-error-200 shadow-sm"
                                            >
                                                <span className="text-xs font-bold text-error-500 bg-error-100 w-5 h-5 rounded-full flex items-center justify-center">
                                                    {index + 1}
                                                </span>
                                                <WordButton
                                                    word={stat.word}
                                                    vocabularyMap={vocabularyMap}
                                                    onWordClick={handleWordClick}
                                                    className="text-base"
                                                />
                                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${getProgressScoreBadgeColor(stat.progressScore)}`}>
                                                    {stat.progressScore > 0 ? '+' : ''}{stat.progressScore}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Full Learning Progress Table */}
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={18} className="text-primary-500" />
                                        <h3 className="font-semibold text-charcoal">Thống kê tiến độ học tập</h3>
                                        <span className="text-xs text-gray-400">({globalStats.length} từ)</span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto -mx-4 px-4">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-gray-500 border-b border-secondary-200">
                                                <th className="pb-2 pr-4">Từ vựng</th>
                                                <th className="pb-2 pr-4">Phiên âm</th>
                                                <th className="pb-2 text-center">Số lần</th>
                                                <th className="pb-2 text-center">Sai</th>
                                                <th className="pb-2 text-center">Điểm tiến bộ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-secondary-100">
                                            {displayedStats.map((stat) => (
                                                <tr key={stat.wordId} className="hover:bg-secondary-50 transition-colors">
                                                    <td className="py-2.5 pr-4">
                                                        <WordButton
                                                            word={stat.word}
                                                            vocabularyMap={vocabularyMap}
                                                            onWordClick={handleWordClick}
                                                            className="text-base font-medium"
                                                        />
                                                    </td>
                                                    <td className="py-2.5 pr-4">
                                                        <span className="font-pinyin text-gray-600">
                                                            {stat.pinyin}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 text-center">
                                                        <span className="font-medium text-charcoal">
                                                            {stat.totalAppearances}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 text-center">
                                                        <span className="font-medium text-error-600">
                                                            {stat.totalIncorrect}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getProgressScoreBadgeColor(stat.progressScore)}`}>
                                                            {stat.progressScore > 0 ? '+' : ''}{stat.progressScore}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Show more/less button */}
                                {globalStats.length > 10 && (
                                    <div className="mt-4 text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowAllStats(!showAllStats)}
                                            icon={showAllStats ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        >
                                            {showAllStats ? 'Thu gọn' : `Xem tất cả ${globalStats.length} từ`}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Clear History Button */}
                    <div className="flex justify-end mb-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearHistory}
                            icon={<Trash2 size={16} />}
                            className="text-error-500 hover:text-error-600"
                        >
                            Xóa tất cả
                        </Button>
                    </div>

                    {/* History List */}
                    <div className="space-y-4">
                        {history.map((entry) => (
                            <Card key={entry.id} padding="none" className="overflow-hidden">
                                {/* Header */}
                                <div
                                    className="p-4 cursor-pointer hover:bg-secondary-50 transition-colors"
                                    onClick={() => entry.id && toggleExpand(entry.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {/* Score Badge */}
                                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(entry.score)}`}>
                                                {entry.score}%
                                            </div>

                                            {/* Progress Score */}
                                            <div className="flex items-center gap-1">
                                                {getProgressIcon(entry.progressScore || 0)}
                                                <span className={`text-sm font-semibold ${getProgressColor(entry.progressScore || 0)}`}>
                                                    {(entry.progressScore || 0) > 0 ? '+' : ''}{entry.progressScore || 0}
                                                </span>
                                            </div>

                                            {/* Quiz Info */}
                                            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                                                <Target size={14} />
                                                <span>{entry.correctCount}/{entry.totalQuestions} câu</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {/* Date */}
                                            <div className="text-right">
                                                <p className="text-sm text-gray-600">{formatDate(entry.date)}</p>
                                                <p className="text-xs text-gray-400 flex items-center justify-end gap-1">
                                                    <Clock size={12} />
                                                    {formatTime(entry.duration)}
                                                    <span className="hidden sm:inline">
                                                        • {entry.quizLength ? QUIZ_LENGTHS[entry.quizLength].label : 'Không rõ'}
                                                    </span>
                                                </p>
                                            </div>

                                            {/* Expand Icon */}
                                            {expandedId === entry.id ? (
                                                <ChevronUp size={20} className="text-gray-400" />
                                            ) : (
                                                <ChevronDown size={20} className="text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content - Analytics Table */}
                                {expandedId === entry.id && entry.frequencyData && entry.frequencyData.length > 0 && (
                                    <div className="border-t border-secondary-100">
                                        <div className="p-4 bg-secondary-50">
                                            <h4 className="text-sm font-semibold text-charcoal mb-3">📝 Chi tiết từ vựng</h4>
                                            <div className="overflow-x-auto -mx-4 px-4">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="text-left text-gray-500">
                                                            <th className="pb-2 pr-4">Từ</th>
                                                            <th className="pb-2 pr-4 hidden sm:table-cell">Phiên âm</th>
                                                            <th className="pb-2 text-center">Đúng</th>
                                                            <th className="pb-2 text-center">Sai</th>
                                                            <th className="pb-2 text-center">Điểm</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-secondary-200">
                                                        {entry.frequencyData.slice(0, 10).map((record: FrequencyRecord) => (
                                                            <tr key={record.wordId}>
                                                                <td className="py-2 pr-4">
                                                                    <WordButton
                                                                        word={record.word}
                                                                        vocabularyMap={vocabularyMap}
                                                                        onWordClick={handleWordClick}
                                                                        className="text-base font-medium"
                                                                    />
                                                                </td>
                                                                <td className="py-2 pr-4 hidden sm:table-cell">
                                                                    <span className="font-pinyin text-gray-600">
                                                                        {record.pinyin}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2 text-center text-success-600 font-medium">
                                                                    {record.correctAnswers}
                                                                </td>
                                                                <td className="py-2 text-center text-error-600 font-medium">
                                                                    {record.incorrectAnswers}
                                                                </td>
                                                                <td className="py-2 text-center">
                                                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${(record.progressPoints || 0) > 0
                                                                        ? 'text-success-600 bg-success-50'
                                                                        : (record.progressPoints || 0) < 0
                                                                            ? 'text-error-600 bg-error-50'
                                                                            : 'text-gray-600 bg-gray-50'
                                                                        }`}>
                                                                        {(record.progressPoints || 0) > 0 ? '+' : ''}{record.progressPoints || 0}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {entry.frequencyData.length > 10 && (
                                                    <p className="text-xs text-gray-400 mt-2 text-center">
                                                        ...và {entry.frequencyData.length - 10} từ khác
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Delete Button */}
                                        <div className="p-3 bg-secondary-100 flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    entry.id && handleDeleteEntry(entry.id);
                                                }}
                                                icon={<Trash2 size={14} />}
                                                className="text-error-500 hover:text-error-600"
                                            >
                                                Xóa
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </Layout>
    );
}
