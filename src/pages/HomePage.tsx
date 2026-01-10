import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Database, Sparkles, Loader2, RefreshCw, BarChart3, CheckCircle, GitCompare, PenLine, Shuffle, ListOrdered } from 'lucide-react';
import { Layout } from '@/components/common/Layout';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { useVocabularyStore } from '@/stores/vocabularyStore';
import { getHSKCounts } from '@/lib/csvParser';
import type { QuestionType } from '@/types';

interface HSKCounts {
    hsk1: number;
    hsk2: number;
    hsk3: number;
    total: number;
}

export function HomePage() {
    const navigate = useNavigate();
    const { vocabulary, isLoading, isInitialized, error, initialize, loadDefault } = useVocabularyStore();
    const [hskCounts, setHskCounts] = useState<HSKCounts | null>(null);

    useEffect(() => {
        if (!isInitialized && !isLoading) {
            initialize();
        }
    }, [isInitialized, isLoading, initialize]);

    useEffect(() => {
        if (isInitialized) {
            getHSKCounts().then(setHskCounts).catch(console.error);
        }
    }, [isInitialized]);

    const handleStartQuiz = (questionType?: QuestionType) => {
        if (vocabulary.length === 0) {
            return;
        }
        if (questionType) {
            navigate(`/setup?type=${questionType}`);
        } else {
            navigate('/setup');
        }
    };

    const handleReloadData = () => {
        loadDefault();
    };

    return (
        <Layout>
            <div className="min-h-[80vh] flex flex-col items-center justify-center py-8">
                {/* Logo & Title */}
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-glow mb-6">
                        <BookOpen size={48} className="text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-3">
                        QIHB-Quiz
                    </h1>
                    <p className="text-xl text-gray-600 flex items-center justify-center gap-2">
                        <Sparkles size={20} className="text-primary-500" />
                        Dành tặng riêng cho EM BÉ QIHB
                        <Sparkles size={20} className="text-primary-500" />
                    </p>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <Card className="w-full max-w-md text-center animate-fade-in">
                        <Loader2 size={48} className="mx-auto text-primary-500 animate-spin mb-4" />
                        <p className="text-gray-600">Đang tải dữ liệu từ vựng...</p>
                    </Card>
                )}

                {/* Error State */}
                {error && (
                    <Card className="w-full max-w-md text-center animate-fade-in">
                        <div className="text-error-500 mb-4">
                            <p className="font-semibold mb-2">Có lỗi xảy ra</p>
                            <p className="text-sm text-gray-600">{error}</p>
                        </div>
                        <Button variant="primary" onClick={handleReloadData}>
                            Thử lại
                        </Button>
                    </Card>
                )}

                {/* Main Content */}
                {isInitialized && !error && (
                    <div className="w-full max-w-md space-y-4 animate-slide-up">
                        {/* Stats Card */}
                        <Card className="text-center">
                            <div className="flex items-center justify-center gap-2 text-accent-500 mb-3">
                                <Database size={20} />
                                <span className="text-sm font-medium">Dữ liệu từ vựng</span>
                            </div>
                            <p className="text-4xl font-bold text-charcoal mb-2">
                                {vocabulary.length}
                            </p>
                            <p className="text-gray-500 text-sm mb-3">từ vựng tổng cộng</p>

                            {/* HSK Level Breakdown */}
                            {hskCounts && (
                                <div className="flex justify-center gap-4 pt-3 border-t border-secondary-200">
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-green-600">{hskCounts.hsk1}</p>
                                        <p className="text-xs text-gray-400">HSK1</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-blue-600">{hskCounts.hsk2}</p>
                                        <p className="text-xs text-gray-400">HSK2</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-purple-600">{hskCounts.hsk3}</p>
                                        <p className="text-xs text-gray-400">HSK3</p>
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Random Quiz Button */}
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            onClick={() => handleStartQuiz()}
                            disabled={vocabulary.length === 0}
                            icon={<Shuffle size={20} />}
                            className="shadow-lg hover:shadow-xl"
                        >
                            Bài thi ngẫu nhiên
                        </Button>

                        {/* Question Type Specific Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                size="md"
                                fullWidth
                                onClick={() => handleStartQuiz('multiple-choice')}
                                disabled={vocabulary.length === 0}
                                icon={<CheckCircle size={16} />}
                                className="text-xs"
                            >
                                Trắc nghiệm
                            </Button>
                            <Button
                                variant="outline"
                                size="md"
                                fullWidth
                                onClick={() => handleStartQuiz('matching')}
                                disabled={vocabulary.length === 0}
                                icon={<GitCompare size={16} />}
                                className="text-xs"
                            >
                                Nối từ
                            </Button>
                            <Button
                                variant="outline"
                                size="md"
                                fullWidth
                                onClick={() => handleStartQuiz('fill-blank')}
                                disabled={vocabulary.length === 0}
                                icon={<PenLine size={16} />}
                                className="text-xs"
                            >
                                Điền từ
                            </Button>
                            <Button
                                variant="outline"
                                size="md"
                                fullWidth
                                onClick={() => handleStartQuiz('sentence-arrangement')}
                                disabled={vocabulary.length === 0}
                                icon={<ListOrdered size={16} />}
                                className="text-xs"
                            >
                                Sắp xếp câu
                            </Button>
                        </div>

                        {/* Secondary Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="secondary"
                                size="md"
                                fullWidth
                                onClick={handleReloadData}
                                disabled={isLoading}
                                icon={<RefreshCw size={18} />}
                            >
                                Tải lại dữ liệu
                            </Button>
                            <Button
                                variant="outline"
                                size="md"
                                fullWidth
                                onClick={() => navigate('/profile')}
                                icon={<BarChart3 size={18} />}
                            >
                                Xem thống kê
                            </Button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 text-center text-sm text-gray-400 animate-fade-in">
                    <p>Ứng dụng luyện từ vựng tiếng Trung</p>
                    <p className="mt-1">HSK 1-3 • {vocabulary.length} từ vựng</p>
                    <p className="mt-1">© quocanh1897@gmail.com</p>
                    <p className="mt-2 text-xs">v1.2.0</p>
                </div>
            </div>
        </Layout>
    );
}
