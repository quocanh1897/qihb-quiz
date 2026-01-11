import { useState, useCallback, useEffect } from 'react';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { SpeakerButton } from '@/components/common/SpeakerButton';
import type { SentenceArrangementQuestion as SentenceArrangementQuestionType, SentenceArrangementAnswer, SentenceWord } from '@/types';
import { SENTENCE_ARRANGEMENT_CONFIG } from '@/config';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface SentenceArrangementQuestionProps {
    question: SentenceArrangementQuestionType;
    onAnswer: (answer: SentenceArrangementAnswer) => void;
    questionStartTime: number;
    isSubmitted: boolean;
    existingAnswer?: SentenceArrangementAnswer;
}

interface SortableWordProps {
    word: SentenceWord;
    isSubmitted: boolean;
    correctPosition?: number;
    currentIndex: number;
}

function SortableWord({ word, isSubmitted, correctPosition, currentIndex }: SortableWordProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: word.id, disabled: isSubmitted });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: 'none' as const,
    };

    const isCorrectPosition = correctPosition !== undefined && correctPosition === currentIndex;
    const isWrongPosition = isSubmitted && !isCorrectPosition;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`
                inline-flex items-center gap-1 px-3 py-2 rounded-lg border-2 font-chinese text-lg
                ${isDragging ? 'opacity-50 scale-95 z-50' : ''}
                ${!isSubmitted ? 'bg-white border-gray-200 hover:border-primary-300 cursor-grab active:cursor-grabbing' : ''}
                ${isSubmitted && isCorrectPosition ? 'bg-success-50 border-success-400 text-success-700' : ''}
                ${isSubmitted && isWrongPosition ? 'bg-error-50 border-error-400 text-error-700' : ''}
                transition-all duration-150 select-none
            `}
        >
            {isSubmitted && isCorrectPosition && <Check size={16} className="text-success-500 flex-shrink-0" />}
            {isSubmitted && isWrongPosition && <X size={16} className="text-error-500 flex-shrink-0" />}
            <span>{word.text}</span>
        </div>
    );
}

export function SentenceArrangementQuestion({
    question,
    onAnswer,
    questionStartTime,
    isSubmitted,
    existingAnswer,
}: SentenceArrangementQuestionProps) {
    const { playSound } = useSoundEffects();
    const [arrangedWords, setArrangedWords] = useState<SentenceWord[]>(() => {
        if (existingAnswer) {
            // Restore order from existing answer
            return existingAnswer.arrangedWords.map(id =>
                question.shuffledWords.find(w => w.id === id)!
            ).filter(Boolean);
        }
        return [...question.shuffledWords];
    });
    const [activeId, setActiveId] = useState<string | null>(null);
    const [showHint, setShowHint] = useState(false);
    const [usedHint, setUsedHint] = useState(false);

    // Auto-reset when question changes (navigating between questions)
    useEffect(() => {
        if (existingAnswer) {
            // Restore order from existing answer
            setArrangedWords(
                existingAnswer.arrangedWords.map(id =>
                    question.shuffledWords.find(w => w.id === id)!
                ).filter(Boolean)
            );
            setShowHint(existingAnswer.usedHint);
            setUsedHint(existingAnswer.usedHint);
        } else {
            // Reset to shuffled order for new/unanswered questions
            setArrangedWords([...question.shuffledWords]);
            setShowHint(false);
            setUsedHint(false);
        }
    }, [question.id, existingAnswer, question.shuffledWords]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 100,
                tolerance: 5,
            },
        })
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            setArrangedWords((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }, []);

    const handleSubmit = useCallback(() => {
        const timeSpent = Date.now() - questionStartTime;

        // Check each position
        let correctCount = 0;
        for (let i = 0; i < arrangedWords.length; i++) {
            if (arrangedWords[i].position === i) {
                correctCount++;
            }
        }

        const isCorrect = correctCount === arrangedWords.length;

        const answer: SentenceArrangementAnswer = {
            questionId: question.id,
            type: 'sentence-arrangement',
            arrangedWords: arrangedWords.map(w => w.id),
            isCorrect,
            correctCount,
            totalWords: arrangedWords.length,
            timeSpent,
            usedHint,
        };

        onAnswer(answer);
    }, [arrangedWords, question.id, questionStartTime, onAnswer, usedHint]);

    const handleShowHint = useCallback(() => {
        playSound('hint');
        setShowHint(true);
        setUsedHint(true);
    }, [playSound]);

    const activeWord = activeId ? arrangedWords.find(w => w.id === activeId) : null;

    // Build correct position map for showing results
    const correctPositionMap = new Map<string, number>();
    question.words.forEach((word, index) => {
        correctPositionMap.set(word.id, index);
    });

    return (
        <div className="space-y-6">
            {/* Question Header */}
            <div className="text-center">
                <p className="text-lg font-medium text-charcoal mb-2">
                    {SENTENCE_ARRANGEMENT_CONFIG.questionText}
                </p>
                {/* Only show pinyin and speaker after submission */}
                {isSubmitted && (
                    <div className="flex items-center justify-center gap-2 text-gray-600 mt-2">
                        <span className="font-pinyin text-sm">{question.sentencePinyin}</span>
                        <SpeakerButton text={question.correctSentence} size={18} />
                    </div>
                )}
            </div>

            {/* Meaning hint - only shown after clicking "Xem gợi ý" or after submission */}
            {(showHint || isSubmitted) && (
                <Card className="bg-amber-50 border border-amber-200 text-center animate-fade-in">
                    <p className="text-amber-700 text-sm">
                        <span className="font-medium">💡 Nghĩa:</span> {question.sentenceMeaning}
                    </p>
                    {usedHint && !isSubmitted && (
                        <p className="text-xs text-amber-500 mt-1">
                            (Điểm sẽ giảm 50% nếu trả lời đúng)
                        </p>
                    )}
                </Card>
            )}

            {/* Arrangement Area */}
            <div className="min-h-[100px] p-4 bg-white rounded-xl border-2 border-dashed border-gray-300">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={arrangedWords.map(w => w.id)}
                        strategy={horizontalListSortingStrategy}
                    >
                        <div className="flex flex-wrap gap-2 justify-center">
                            {arrangedWords.map((word, index) => (
                                <SortableWord
                                    key={word.id}
                                    word={word}
                                    isSubmitted={isSubmitted}
                                    correctPosition={correctPositionMap.get(word.id)}
                                    currentIndex={index}
                                />
                            ))}
                        </div>
                    </SortableContext>

                    <DragOverlay>
                        {activeWord ? (
                            <div className="inline-flex items-center px-3 py-2 rounded-lg border-2 border-primary-400 bg-primary-50 font-chinese text-lg shadow-lg select-none">
                                <span>{activeWord.text}</span>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Result display */}
            {isSubmitted && existingAnswer && (
                <Card className={`text-center ${existingAnswer.isCorrect ? 'bg-success-50 border-success-200' : 'bg-error-50 border-error-200'}`}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        {existingAnswer.isCorrect ? (
                            <Check size={24} className="text-success-500" />
                        ) : (
                            <X size={24} className="text-error-500" />
                        )}
                        <span className={`font-bold ${existingAnswer.isCorrect ? 'text-success-700' : 'text-error-700'}`}>
                            {existingAnswer.isCorrect
                                ? existingAnswer.usedHint
                                    ? 'Chính xác! (dùng gợi ý: -50%)'
                                    : 'Chính xác!'
                                : `Đúng ${existingAnswer.correctCount}/${existingAnswer.totalWords} từ`}
                        </span>
                    </div>

                    {!existingAnswer.isCorrect && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600 mb-1">Câu đúng:</p>
                            <p className="font-chinese text-lg text-charcoal">{question.correctSentence}</p>
                        </div>
                    )}
                </Card>
            )}

            {/* Action Buttons */}
            {!isSubmitted && (
                <div className="flex gap-3">
                    {!showHint && (
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={handleShowHint}
                            icon={<Lightbulb size={18} />}
                            className="flex-shrink-0"
                        >
                            Xem gợi ý
                        </Button>
                    )}
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={handleSubmit}
                    >
                        Xác nhận
                    </Button>
                </div>
            )}
        </div>
    );
}
