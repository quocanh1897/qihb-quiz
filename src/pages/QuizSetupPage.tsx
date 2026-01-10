import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Zap, Gauge, Timer, Infinity, Play, CheckCircle, GitCompare, PenLine, Shuffle, ListOrdered, Type } from 'lucide-react';
import { Layout, PageHeader } from '@/components/common/Layout';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { useVocabularyStore } from '@/stores/vocabularyStore';
import { useQuizStore } from '@/stores/quizStore';
import { QUIZ_LENGTHS, MC_CONFIG, MATCHING_CONFIG, FILL_BLANK_CONFIG, SENTENCE_ARRANGEMENT_CONFIG } from '@/config';
import type { QuizLength, QuestionType } from '@/types';

const QUIZ_ICONS: Record<QuizLength, typeof Zap> = {
    short: Zap,
    medium: Gauge,
    long: Timer,
    maximum: Infinity,
};

const QUIZ_OPTIONS = (Object.keys(QUIZ_LENGTHS) as QuizLength[]).map(length => ({
    length,
    label: QUIZ_LENGTHS[length].label,
    count: QUIZ_LENGTHS[length].count,
    description: `${QUIZ_LENGTHS[length].count} câu hỏi`,
    icon: QUIZ_ICONS[length],
}));

const QUESTION_TYPE_INFO: Record<QuestionType, { label: string; icon: typeof CheckCircle; description: string }> = {
    'multiple-choice': {
        label: 'Trắc nghiệm',
        icon: CheckCircle,
        description: 'Chọn đáp án đúng trong các lựa chọn',
    },
    'matching': {
        label: 'Nối từ',
        icon: GitCompare,
        description: 'Ghép từ với phiên âm và nghĩa tương ứng',
    },
    'fill-blank': {
        label: 'Điền từ',
        icon: PenLine,
        description: 'Điền từ thích hợp vào chỗ trống trong câu',
    },
    'sentence-arrangement': {
        label: 'Sắp xếp câu',
        icon: ListOrdered,
        description: 'Sắp xếp các từ thành câu hoàn chỉnh',
    },
    'sentence-completion': {
        label: 'Hoàn thiện câu',
        icon: Type,
        description: 'Nhập từ còn thiếu vào chỗ trống trong câu',
    },
};

export function QuizSetupPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const questionType = searchParams.get('type') as QuestionType | null;

    const [selectedLength, setSelectedLength] = useState<QuizLength>('medium');
    const { vocabulary } = useVocabularyStore();
    const { startQuiz } = useQuizStore();

    const handleStartQuiz = () => {
        if (vocabulary.length === 0) {
            alert('Không có dữ liệu từ vựng. Vui lòng quay lại trang chủ.');
            return;
        }

        startQuiz(vocabulary, selectedLength, questionType || undefined);
        navigate('/exam');
    };

    // Get title based on question type
    const getTitle = () => {
        if (questionType && QUESTION_TYPE_INFO[questionType]) {
            return `Bài thi ${QUESTION_TYPE_INFO[questionType].label}`;
        }
        return 'Bài thi ngẫu nhiên';
    };

    const getSubtitle = () => {
        if (questionType && QUESTION_TYPE_INFO[questionType]) {
            return QUESTION_TYPE_INFO[questionType].description;
        }
        return 'Lựa chọn số lượng câu hỏi phù hợp với thời gian của bạn';
    };

    const TypeIcon = questionType && QUESTION_TYPE_INFO[questionType]
        ? QUESTION_TYPE_INFO[questionType].icon
        : Shuffle;

    const getOptionStyle = (length: QuizLength) => {
        const isSelected = selectedLength === length;
        return `
      relative overflow-hidden transition-all duration-300 cursor-pointer
      ${isSelected
                ? 'ring-2 ring-primary-500 ring-offset-2 bg-primary-50'
                : 'hover:bg-secondary-50 hover:-translate-y-1'
            }
    `;
    };

    return (
        <Layout>
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

            {/* Quiz Type Badge */}
            <div className="flex items-center gap-2 mb-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${questionType
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-secondary-100 text-gray-700'
                    }`}>
                    <TypeIcon size={16} />
                    {getTitle()}
                </div>
            </div>

            <PageHeader
                title="Chọn độ dài bài thi"
                subtitle={getSubtitle()}
            />

            {/* Quiz Length Options */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                {QUIZ_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isDisabled = option.count > vocabulary.length;

                    return (
                        <Card
                            key={option.length}
                            padding="lg"
                            className={`${getOptionStyle(option.length)} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => !isDisabled && setSelectedLength(option.length)}
                        >
                            {/* Selected indicator */}
                            {selectedLength === option.length && (
                                <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] border-t-primary-500">
                                    <span className="absolute -top-[35px] right-[4px] text-white text-xs">✓</span>
                                </div>
                            )}

                            <div className="text-center">
                                <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 ${selectedLength === option.length
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-secondary-100 text-gray-600'
                                    }`}>
                                    <Icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-charcoal mb-1">{option.label}</h3>
                                <p className="text-gray-500">{option.description}</p>
                                {isDisabled && (
                                    <p className="text-xs text-error-500 mt-2">
                                        Cần ít nhất {option.count} từ
                                    </p>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Info Box */}
            <Card className="mb-6 bg-secondary-50 border border-secondary-200">
                <div className="text-sm text-gray-600">
                    <p className="font-medium text-charcoal mb-2">📌 Thông tin bài thi:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                        {!questionType && (
                            <li>Gồm câu hỏi <strong>trắc nghiệm</strong>, <strong>điền từ</strong>, <strong>nối từ</strong>, <strong>sắp xếp câu</strong> và <strong>hoàn thiện câu</strong></li>
                        )}
                        {(!questionType || questionType === 'multiple-choice') && (
                            <li>Mỗi câu trắc nghiệm có {MC_CONFIG.optionCount} lựa chọn ({MC_CONFIG.optionLabels[0]}-{MC_CONFIG.optionLabels[MC_CONFIG.optionLabels.length - 1]})</li>
                        )}
                        {(!questionType || questionType === 'fill-blank') && (
                            <li>Mỗi câu điền từ có {FILL_BLANK_CONFIG.optionCount} lựa chọn</li>
                        )}
                        {(!questionType || questionType === 'matching') && (
                            <li>Mỗi câu nối từ cần ghép {MATCHING_CONFIG.minItems}-{MATCHING_CONFIG.maxItems} cặp từ-phiên âm-nghĩa</li>
                        )}
                        {(!questionType || questionType === 'sentence-arrangement') && (
                            <li>Mỗi câu sắp xếp có {SENTENCE_ARRANGEMENT_CONFIG.minWords}-{SENTENCE_ARRANGEMENT_CONFIG.maxWords} từ cần sắp xếp</li>
                        )}
                        {(!questionType || questionType === 'sentence-completion') && (
                            <li>Mỗi câu hoàn thiện cần nhập từ dựa vào gợi ý phiên âm</li>
                        )}
                        <li>Thời gian làm bài không giới hạn</li>
                    </ul>
                </div>
            </Card>

            {/* Start Button */}
            <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleStartQuiz}
                icon={<Play size={20} />}
                className="shadow-lg"
            >
                Bắt đầu làm bài
            </Button>
        </Layout>
    );
}
