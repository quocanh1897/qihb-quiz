import { useState, useEffect } from 'react';
import { Check, X, BookOpen } from 'lucide-react';
import type { FillBlankQuestion, FillBlankOption } from '@/types';
import { Button } from '@/components/common/Button';
import { SpeakerButton } from '@/components/common/SpeakerButton';
import { FILL_BLANK_CONFIG } from '@/config';

interface FillBlankQuestionProps {
    question: FillBlankQuestion;
    onSubmit: (selectedId: string, isCorrect: boolean) => void;
    isSubmitted: boolean;
    previousAnswer?: string;
    readOnly?: boolean;
}

export function FillBlankQuestionComponent({
    question,
    onSubmit,
    isSubmitted,
    previousAnswer,
    readOnly = false,
}: FillBlankQuestionProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    // Reset selection when question changes
    useEffect(() => {
        if (previousAnswer) {
            setSelectedOption(previousAnswer);
        } else {
            setSelectedOption(null);
        }
    }, [question.id, previousAnswer]);

    const handleSelect = (option: FillBlankOption) => {
        if (isSubmitted || readOnly) return;
        setSelectedOption(option.id);
    };

    const handleSubmit = () => {
        if (!selectedOption) return;
        const option = question.options.find(o => o.id === selectedOption);
        if (option) {
            onSubmit(selectedOption, option.isCorrect);
        }
    };

    // Get the selected word to display in the blank
    const selectedWord = selectedOption
        ? question.options.find(o => o.id === selectedOption)?.value
        : null;

    // Build the sentence with blank
    const renderSentenceWithBlank = () => {
        const before = question.sentence.slice(0, question.blankPosition);
        const after = question.sentence.slice(question.blankPosition + question.blankLength);

        return (
            <span className="font-chinese text-2xl leading-relaxed">
                {before}
                <span className={`
                    inline-flex items-center justify-center min-w-[3em] px-2 py-1 mx-1
                    border-2 border-dashed rounded-lg transition-all duration-200
                    ${selectedWord
                        ? isSubmitted
                            ? question.options.find(o => o.id === selectedOption)?.isCorrect
                                ? 'border-success-500 bg-success-50 text-success-700'
                                : 'border-error-500 bg-error-50 text-error-700'
                            : 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 bg-gray-50 text-gray-400'
                    }
                `}>
                    {selectedWord || '____'}
                </span>
                {after}
            </span>
        );
    };

    const getOptionStyle = (option: FillBlankOption) => {
        const isSelected = selectedOption === option.id;

        if (isSubmitted) {
            if (option.isCorrect) {
                return 'border-success-500 bg-success-50 text-success-700 ring-2 ring-success-200';
            }
            if (isSelected && !option.isCorrect) {
                return 'border-error-500 bg-error-50 text-error-700 ring-2 ring-error-200';
            }
            return 'border-secondary-200 bg-secondary-50 text-gray-400';
        }

        if (isSelected) {
            return 'border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-200';
        }

        return 'border-secondary-200 bg-white text-charcoal hover:border-primary-300 hover:bg-primary-50';
    };

    const correctOption = question.options.find(o => o.isCorrect);
    const selectedOptionObj = question.options.find(o => o.id === selectedOption);
    const isCorrect = selectedOptionObj?.isCorrect;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Question Meta */}
            <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">{FILL_BLANK_CONFIG.questionText}</p>
            </div>

            {/* Sentence with Blank */}
            <div className="text-center p-6 bg-secondary-50 rounded-xl border border-secondary-200">
                {renderSentenceWithBlank()}
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {question.options.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => handleSelect(option)}
                        disabled={isSubmitted || readOnly}
                        className={`
                            relative flex items-center gap-3 p-4 rounded-xl border-2
                            transition-all duration-200 text-left
                            ${getOptionStyle(option)}
                            ${!isSubmitted && !readOnly ? 'cursor-pointer' : 'cursor-default'}
                        `}
                    >
                        {/* Label */}
                        <span className={`
                            w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                            ${selectedOption === option.id
                                ? 'bg-primary-500 text-white'
                                : 'bg-secondary-100 text-gray-600'
                            }
                            ${isSubmitted && option.isCorrect ? 'bg-success-500 text-white' : ''}
                            ${isSubmitted && selectedOption === option.id && !option.isCorrect ? 'bg-error-500 text-white' : ''}
                        `}>
                            {option.label}
                        </span>

                        {/* Value */}
                        <span className="font-chinese text-lg flex-1">
                            {option.value}
                        </span>

                        {/* Result Icon */}
                        {isSubmitted && option.isCorrect && (
                            <Check className="w-5 h-5 text-success-500" />
                        )}
                        {isSubmitted && selectedOption === option.id && !option.isCorrect && (
                            <X className="w-5 h-5 text-error-500" />
                        )}
                    </button>
                ))}
            </div>

            {/* Result Message */}
            {isSubmitted && (
                <div className={`
                    flex items-center justify-center gap-2 p-4 rounded-xl
                    ${isCorrect
                        ? 'bg-success-50 text-success-700 border border-success-200'
                        : 'bg-error-50 text-error-700 border border-error-200'
                    }
                `}>
                    {isCorrect ? (
                        <>
                            <Check className="w-5 h-5" />
                            <span className="font-medium">Đúng rồi!</span>
                        </>
                    ) : (
                        <>
                            <X className="w-5 h-5" />
                            <span className="font-medium">
                                Sai rồi! Đáp án đúng là: <span className="font-chinese">{correctOption?.value}</span>
                            </span>
                        </>
                    )}
                </div>
            )}

            {/* Word Info with Speaker (shown after submission) */}
            {isSubmitted && (
                <div className="flex items-center justify-center gap-3 animate-fade-in">
                    <span className="font-chinese text-2xl font-semibold text-charcoal">
                        {question.correctAnswer.word}
                    </span>
                    <SpeakerButton text={question.correctAnswer.word} size={20} />
                    <span className="text-gray-400">|</span>
                    <span className="font-pinyin text-xl text-gray-600">
                        {question.correctAnswer.pinyin}
                    </span>
                    <span className="text-gray-400">|</span>
                    <span className="text-lg text-gray-600">
                        {question.correctAnswer.meaning[0]}
                    </span>
                </div>
            )}

            {/* Sentence Meaning (shown after submission) */}
            {isSubmitted && question.sentenceMeaning && (
                <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4 animate-fade-in">
                    <div className="flex items-start gap-3">
                        <BookOpen size={18} className="text-primary-500 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nghĩa câu</span>
                            <p className="text-charcoal">{question.sentenceMeaning}</p>
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
                    onClick={handleSubmit}
                    disabled={!selectedOption}
                >
                    Gửi
                </Button>
            )}
        </div>
    );
}
