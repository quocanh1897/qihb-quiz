import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Play, Database, Sparkles, Loader2 } from 'lucide-react';
import { Layout } from '@/components/common/Layout';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { useVocabularyStore } from '@/stores/vocabularyStore';

export function HomePage() {
    const navigate = useNavigate();
    const { vocabulary, isLoading, isInitialized, error, initialize, loadDefault } = useVocabularyStore();

    useEffect(() => {
        if (!isInitialized && !isLoading) {
            initialize();
        }
    }, [isInitialized, isLoading, initialize]);

    const handleStartQuiz = () => {
        if (vocabulary.length === 0) {
            return;
        }
        navigate('/setup');
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
                            <div className="flex items-center justify-center gap-2 text-accent-500 mb-2">
                                <Database size={20} />
                                <span className="text-sm font-medium">Dữ liệu từ vựng</span>
                            </div>
                            <p className="text-3xl font-bold text-charcoal mb-1">
                                {vocabulary.length}
                            </p>
                            <p className="text-gray-500 text-sm">từ vựng HSK3</p>
                        </Card>

                        {/* Start Quiz Button */}
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            onClick={handleStartQuiz}
                            disabled={vocabulary.length === 0}
                            icon={<Play size={20} />}
                            className="shadow-lg hover:shadow-xl"
                        >
                            Tạo bài thi mới
                        </Button>

                        {/* Secondary Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="secondary"
                                size="md"
                                fullWidth
                                onClick={handleReloadData}
                                disabled={isLoading}
                            >
                                Tải lại dữ liệu
                            </Button>
                            <Button
                                variant="outline"
                                size="md"
                                fullWidth
                                onClick={() => navigate('/profile')}
                            >
                                Xem thống kê
                            </Button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 text-center text-sm text-gray-400 animate-fade-in">
                    <p>Ứng dụng luyện từ vựng tiếng Trung</p>
                    <p className="mt-1">HSK Level 3 • {vocabulary.length} từ vựng</p>
                    <p className="mt-1">© quocanh1897@gmail.com</p>
                </div>
            </div>
        </Layout>
    );
}
