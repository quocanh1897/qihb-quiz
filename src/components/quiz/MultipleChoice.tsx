import { useState, useEffect } from 'react';
import { Check, X, BookOpen } from 'lucide-react';
import type { MultipleChoiceQuestion, MultipleChoiceOption } from '@/types';
import { Button } from '@/components/common/Button';
import { SpeakerButton } from '@/components/common/SpeakerButton';

interface MultipleChoiceProps {
    question: MultipleChoiceQuestion;
    onSubmit: (selectedId: string, isCorrect: boolean) => void;
    isSubmitted: boolean;
    previousAnswer?: string;
    readOnly?: boolean;
}

export function MultipleChoice({
    question,
    onSubmit,
    isSubmitted,
    previousAnswer,
    readOnly = false,
}: MultipleChoiceProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(previousAnswer || null);

    // Reset selection when question changes
    useEffect(() => {
        setSelectedOption(previousAnswer || null);
    }, [question.id, previousAnswer]);

    const handleOptionClick = (option: MultipleChoiceOption) => {
        if (isSubmitted || readOnly) return;
        setSelectedOption(option.id);
    };

    const handleSubmit = () => {
        if (!selectedOption || isSubmitted) return;

        const selected = question.options.find(o => o.id === selectedOption);
        if (selected) {
            onSubmit(selectedOption, selected.isCorrect);
        }
    };

    const getOptionClasses = (option: MultipleChoiceOption) => {
        const base = 'w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4';

        if (isSubmitted) {
            if (option.isCorrect) {
                return `${base} border-success-500 bg-success-50`;
            }
            if (option.id === selectedOption && !option.isCorrect) {
                return `${base} border-error-500 bg-error-50`;
            }
            return `${base} border-secondary-200 bg-secondary-50 opacity-60`;
        }

        if (option.id === selectedOption) {
            return `${base} border-primary-500 bg-primary-50 ring-2 ring-primary-200`;
        }

        return `${base} border-secondary-200 bg-white hover:border-primary-300 hover:bg-primary-50 cursor-pointer`;
    };

    const getQuestionStyle = () => {
        const variant = question.variant;
        if (variant.startsWith('word') || variant === 'pinyin-to-word' || variant === 'meaning-to-word') {
            return 'font-chinese text-4xl md:text-5xl';
        }
        if (variant.includes('pinyin')) {
            return 'font-pinyin text-3xl md:text-4xl';
        }
        return 'text-2xl md:text-3xl';
    };

    const getOptionStyle = (_option: MultipleChoiceOption) => {
        const variant = question.variant;

        // Determine what the option represents based on variant
        if (variant === 'word-to-pinyin' || variant === 'meaning-to-pinyin') {
            return 'font-pinyin text-lg';
        }
        if (variant === 'pinyin-to-word' || variant === 'meaning-to-word') {
            return 'font-chinese text-xl';
        }
        return 'text-base';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Question */}
            <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">{question.questionMeta}</p>
                <div className={`${getQuestionStyle()} font-semibold text-charcoal`}>
                    {question.question}
                </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
                {question.options.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => handleOptionClick(option)}
                        disabled={isSubmitted || readOnly}
                        className={getOptionClasses(option)}
                    >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
              ${option.id === selectedOption
                                ? isSubmitted
                                    ? option.isCorrect
                                        ? 'bg-success-500 text-white'
                                        : 'bg-error-500 text-white'
                                    : 'bg-primary-500 text-white'
                                : isSubmitted && option.isCorrect
                                    ? 'bg-success-500 text-white'
                                    : 'bg-secondary-200 text-charcoal'
                            }`}
                        >
                            {isSubmitted ? (
                                option.isCorrect ? (
                                    <Check size={16} />
                                ) : option.id === selectedOption ? (
                                    <X size={16} />
                                ) : (
                                    option.label
                                )
                            ) : (
                                option.label
                            )}
                        </span>
                        <span className={getOptionStyle(option)}>
                            {option.value}
                        </span>
                    </button>
                ))}
            </div>

            {/* Word with Speaker (shown after submission) */}
            {isSubmitted && (
                <div className="flex items-center justify-center gap-2 animate-fade-in">
                    <span className="font-chinese text-2xl font-semibold text-charcoal">
                        {question.correctAnswer.word}
                    </span>
                    <SpeakerButton text={question.correctAnswer.word} size={20} />
                    <span className="text-gray-400">|</span>
                    <span className="font-pinyin text-lg text-gray-600">
                        {question.correctAnswer.pinyin}
                    </span>
                </div>
            )}

            {/* Result Message */}
            {isSubmitted && (
                <div className={`p-4 rounded-xl text-center animate-scale-in ${question.options.find(o => o.id === selectedOption)?.isCorrect
                    ? 'bg-success-100 text-success-700'
                    : 'bg-error-100 text-error-700'
                    }`}>
                    {question.options.find(o => o.id === selectedOption)?.isCorrect ? (
                        <div className="flex items-center justify-center gap-2">
                            <Check size={20} />
                            <span className="font-semibold">Đúng rồi!</span>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <X size={20} />
                                <span className="font-semibold">Sai rồi!</span>
                            </div>
                            <p className="text-sm">
                                Đáp án đúng là: <span className="font-semibold">{question.options.find(o => o.isCorrect)?.value}</span>
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Example Sentence */}
            {isSubmitted && question.correctAnswer.example && (
                <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4 animate-fade-in">
                    <div className="flex items-start gap-3">
                        <BookOpen size={18} className="text-primary-500 mt-0.5 shrink-0" />
                        <div className="space-y-2">
                            <div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ví dụ</span>
                                <p className="font-chinese text-lg text-charcoal">{question.correctAnswer.example}</p>
                                {question.correctAnswer.examplePinyin && (
                                    <p className="font-pinyin text-sm text-gray-500">{question.correctAnswer.examplePinyin}</p>
                                )}
                            </div>
                            {question.correctAnswer.exampleMeaning && (
                                <div>
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nghĩa là</span>
                                    <p className="text-charcoal">{question.correctAnswer.exampleMeaning}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            {!isSubmitted && !readOnly && (
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={!selectedOption}
                    onClick={handleSubmit}
                >
                    Gửi
                </Button>
            )}
        </div>
    );
}
