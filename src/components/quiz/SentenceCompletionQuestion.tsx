import React, { useState, useRef, useEffect } from 'react';
import type { SentenceCompletionQuestion as SentenceCompletionQuestionType } from '@/types';
import { Button } from '@/components/common/Button';
import { SpeakerButton } from '@/components/common/SpeakerButton';
import { SENTENCE_COMPLETION_CONFIG } from '@/config';
import { Check, X, Keyboard } from 'lucide-react';

interface SentenceCompletionQuestionProps {
    question: SentenceCompletionQuestionType;
    onSubmit: (userInput: string, isCorrect: boolean) => void;
    isSubmitted: boolean;
    previousAnswer?: string;
    readOnly?: boolean;
}

/**
 * Remove punctuation for answer comparison
 */
function normalizeAnswer(text: string): string {
    return text
        .replace(/[。，！？、；：""''（）《》【】…—·\s]/g, '')
        .toLowerCase()
        .trim();
}

export function SentenceCompletionQuestionComponent({
    question,
    onSubmit,
    isSubmitted,
    previousAnswer,
    readOnly = false,
}: SentenceCompletionQuestionProps) {
    const [userInput, setUserInput] = useState(previousAnswer || '');
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on mount
    useEffect(() => {
        if (!isSubmitted && !readOnly && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isSubmitted, readOnly]);

    const handleSubmit = () => {
        if (!userInput.trim() || isSubmitted || readOnly) return;

        const normalizedInput = normalizeAnswer(userInput);
        const normalizedCorrect = normalizeAnswer(question.blankWord);
        const isCorrect = normalizedInput === normalizedCorrect;

        onSubmit(userInput.trim(), isCorrect);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && userInput.trim()) {
            handleSubmit();
        }
    };

    const isCorrect = isSubmitted && normalizeAnswer(userInput) === normalizeAnswer(question.blankWord);
    const isWrong = isSubmitted && !isCorrect;

    return (
        <div className="space-y-6">
            {/* Question Header */}
            <div className="text-center">
                <p className="text-lg font-medium text-charcoal mb-2">
                    {SENTENCE_COMPLETION_CONFIG.questionText}
                </p>
            </div>

            {/* Meaning Hint */}
            <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-700">
                    <span className="font-medium">💡 Nghĩa:</span> {question.sentenceMeaning}
                </p>
            </div>

            {/* Sentence with Blank */}
            <div className="p-6 bg-secondary-50 rounded-xl border border-secondary-200">
                <div className="flex flex-wrap items-center justify-center gap-1 text-xl font-chinese leading-relaxed">
                    {/* Before blank */}
                    <span>{question.sentenceBeforeBlank}</span>

                    {/* Blank section with pinyin hint */}
                    <div className="inline-flex flex-col items-center mx-1">
                        {/* Pinyin hint above */}
                        <span className="text-sm font-pinyin text-primary-600 mb-1">
                            {question.blankPinyin}
                        </span>

                        {/* Input or result */}
                        {!isSubmitted ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={readOnly}
                                placeholder="..."
                                className={`
                                    w-24 px-3 py-2 text-center font-chinese text-xl
                                    border-2 border-dashed rounded-lg
                                    focus:outline-none focus:border-primary-500 focus:bg-white
                                    ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white border-primary-300'}
                                `}
                                autoComplete="off"
                                autoCapitalize="off"
                                autoCorrect="off"
                                spellCheck={false}
                            />
                        ) : (
                            <span className={`
                                inline-flex items-center gap-1 px-3 py-2 rounded-lg border-2
                                ${isCorrect ? 'bg-success-50 border-success-400 text-success-700' : ''}
                                ${isWrong ? 'bg-error-50 border-error-400 text-error-700' : ''}
                            `}>
                                {isCorrect && <Check size={18} className="text-success-500" />}
                                {isWrong && <X size={18} className="text-error-500" />}
                                <span className="font-chinese">{userInput}</span>
                            </span>
                        )}
                    </div>

                    {/* After blank */}
                    <span>{question.sentenceAfterBlank}</span>
                </div>
            </div>

            {/* Show correct answer if wrong */}
            {isWrong && (
                <div className="p-4 bg-success-50 rounded-lg border border-success-200">
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-sm text-success-700 font-medium">Đáp án đúng:</span>
                        <span className="font-chinese text-xl text-success-800 font-semibold">
                            {question.blankWord}
                        </span>
                        <SpeakerButton text={question.sentence} size={20} />
                    </div>
                </div>
            )}

            {/* Full sentence with speaker after submission */}
            {isSubmitted && isCorrect && (
                <div className="p-4 bg-success-50 rounded-lg border border-success-200">
                    <div className="flex items-center justify-center gap-3">
                        <span className="font-chinese text-lg text-success-800">
                            {question.sentence}
                        </span>
                        <SpeakerButton text={question.sentence} size={20} />
                    </div>
                </div>
            )}

            {/* Submit Button */}
            {!isSubmitted && !readOnly && (
                <div className="flex justify-center">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleSubmit}
                        disabled={!userInput.trim()}
                        icon={<Keyboard size={20} />}
                    >
                        Xác nhận
                    </Button>
                </div>
            )}

            {/* Keyboard hint */}
            {!isSubmitted && !readOnly && (
                <p className="text-center text-xs text-gray-400">
                    Nhấn Enter để xác nhận đáp án
                </p>
            )}
        </div>
    );
}
