import { useState, useEffect } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    useDraggable,
    useDroppable,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { Check, X, GripVertical, ArrowRight, BookOpen } from 'lucide-react';
import type { MatchingQuestion, MatchingItem, MatchingAnswer } from '@/types';
import { Button } from '@/components/common/Button';
import { SpeakerButton } from '@/components/common/SpeakerButton';

interface MatchingQuestionProps {
    question: MatchingQuestion;
    onSubmit: (connections: { word: string; pinyin: string; meaning: string; isCorrect: boolean }[], correctCount: number) => void;
    isSubmitted: boolean;
    previousAnswer?: MatchingAnswer;
    readOnly?: boolean;
}

type ItemType = 'word' | 'pinyin' | 'meaning';

interface DraggableItemProps {
    id: string;
    value: string;
    type: ItemType;
    isPlaced: boolean;
}

interface DroppableBoxProps {
    id: string;
    type: ItemType;
    placedItem: { id: string; value: string } | null;
    isSubmitted: boolean;
    isCorrect?: boolean;
}

// Draggable item component
function DraggableItem({ id, value, type, isPlaced }: DraggableItemProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id,
        data: { type, value },
        disabled: isPlaced,
    });

    if (isPlaced) return null;

    const getStyle = () => {
        switch (type) {
            case 'word':
                return 'bg-blue-50 border-blue-200 hover:border-blue-400';
            case 'pinyin':
                return 'bg-green-50 border-green-200 hover:border-green-400';
            case 'meaning':
                return 'bg-amber-50 border-amber-200 hover:border-amber-400';
        }
    };

    const getTextStyle = () => {
        switch (type) {
            case 'word':
                return 'font-chinese text-base';
            case 'pinyin':
                return 'font-pinyin text-sm';
            case 'meaning':
                return 'text-sm';
        }
    };

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={{ touchAction: 'none' }}
            className={`
                inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 
                ${getStyle()}
                ${isDragging ? 'opacity-50 scale-95' : ''}
                cursor-grab active:cursor-grabbing transition-all duration-150 select-none
            `}
        >
            <GripVertical size={12} className="text-gray-400" />
            <span className={getTextStyle()}>{value}</span>
        </div>
    );
}

// Droppable box component
function DroppableBox({ id, type, placedItem, isSubmitted, isCorrect }: DroppableBoxProps) {
    const { isOver, setNodeRef } = useDroppable({
        id,
        data: { type },
        disabled: isSubmitted || !!placedItem,
    });

    const getEmptyStyle = () => {
        if (isSubmitted) {
            return isCorrect ? 'border-success-400 bg-success-50' : 'border-error-400 bg-error-50';
        }
        if (isOver) {
            return 'border-primary-400 bg-primary-50 border-dashed';
        }
        return 'border-gray-300 bg-gray-50 border-dashed';
    };

    const getFilledStyle = () => {
        if (isSubmitted) {
            return isCorrect ? 'border-success-400 bg-success-50' : 'border-error-400 bg-error-50';
        }
        switch (type) {
            case 'word':
                return 'bg-blue-50 border-blue-300';
            case 'pinyin':
                return 'bg-green-50 border-green-300';
            case 'meaning':
                return 'bg-amber-50 border-amber-300';
        }
    };

    const getTextStyle = () => {
        switch (type) {
            case 'word':
                return 'font-chinese text-base';
            case 'pinyin':
                return 'font-pinyin text-sm';
            case 'meaning':
                return 'text-sm';
        }
    };

    const getPlaceholder = () => {
        switch (type) {
            case 'word':
                return '从';
            case 'pinyin':
                return 'pīnyīn';
            case 'meaning':
                return 'nghĩa';
        }
    };

    return (
        <div
            ref={setNodeRef}
            className={`
                flex items-center justify-center min-h-[44px] px-3 py-2 rounded-lg border-2 transition-all duration-150
                ${placedItem ? getFilledStyle() : getEmptyStyle()}
            `}
        >
            {placedItem ? (
                <div className="flex items-center gap-1.5">
                    {isSubmitted && (
                        isCorrect ? (
                            <Check size={14} className="text-success-600 shrink-0" />
                        ) : (
                            <X size={14} className="text-error-600 shrink-0" />
                        )
                    )}
                    <span className={getTextStyle()}>{placedItem.value}</span>
                </div>
            ) : (
                <span className="text-gray-400 text-sm">{getPlaceholder()}</span>
            )}
        </div>
    );
}

export function MatchingQuestionComponent({
    question,
    onSubmit,
    isSubmitted,
    previousAnswer,
    readOnly = false,
}: MatchingQuestionProps) {
    const itemCount = question.items.length;

    // Track which items are placed in which boxes
    // grid[rowIndex][type] = { id, value } or null
    const [grid, setGrid] = useState<Record<number, Record<ItemType, { id: string; value: string } | null>>>({});

    // Track which items have been placed
    const [placedItems, setPlacedItems] = useState<Set<string>>(new Set());

    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeData, setActiveData] = useState<{ type: ItemType; value: string } | null>(null);
    const [results, setResults] = useState<{ word: string; pinyin: string; meaning: string; isCorrect: boolean }[]>([]);

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

    // Initialize grid when question changes, or restore from previous answer
    useEffect(() => {
        if (previousAnswer && previousAnswer.connections.length > 0) {
            // Restore from previous answer
            const restoredGrid: Record<number, Record<ItemType, { id: string; value: string } | null>> = {};
            const restoredPlaced = new Set<string>();

            previousAnswer.connections.forEach((conn, index) => {
                restoredGrid[index] = {
                    word: conn.word ? { id: `restored-word-${index}`, value: conn.word } : null,
                    pinyin: conn.pinyin ? { id: `restored-pinyin-${index}`, value: conn.pinyin } : null,
                    meaning: conn.meaning ? { id: `restored-meaning-${index}`, value: conn.meaning } : null,
                };
                if (conn.word) restoredPlaced.add(`restored-word-${index}`);
                if (conn.pinyin) restoredPlaced.add(`restored-pinyin-${index}`);
                if (conn.meaning) restoredPlaced.add(`restored-meaning-${index}`);
            });

            setGrid(restoredGrid);
            setPlacedItems(restoredPlaced);
            setResults(previousAnswer.connections);
        } else {
            // Initialize empty grid
            const initialGrid: Record<number, Record<ItemType, { id: string; value: string } | null>> = {};
            for (let i = 0; i < itemCount; i++) {
                initialGrid[i] = { word: null, pinyin: null, meaning: null };
            }
            setGrid(initialGrid);
            setPlacedItems(new Set());
            setResults([]);
        }
    }, [question.id, itemCount, previousAnswer]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        setActiveData(event.active.data.current as { type: ItemType; value: string });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveData(null);

        if (!over) return;

        const activeType = (active.data.current as { type: ItemType }).type;

        // Parse over.id to get row and type: format is "drop-{row}-{type}"
        const overIdStr = over.id as string;
        if (!overIdStr.startsWith('drop-')) return;

        const parts = overIdStr.split('-');
        const rowIndex = parseInt(parts[1]);
        const dropType = parts[2] as ItemType;

        // Only allow dropping same type
        if (activeType !== dropType) return;

        // Check if box is already filled
        if (grid[rowIndex]?.[dropType]) return;

        // Place the item
        const activeIdStr = active.id as string;
        const activeValue = (active.data.current as { value: string }).value;

        setGrid(prev => ({
            ...prev,
            [rowIndex]: {
                ...prev[rowIndex],
                [dropType]: { id: activeIdStr, value: activeValue }
            }
        }));

        setPlacedItems(prev => new Set([...prev, activeIdStr]));
    };

    const handleRemoveItem = (rowIndex: number, type: ItemType) => {
        if (isSubmitted || readOnly) return;

        const item = grid[rowIndex]?.[type];
        if (!item) return;

        setGrid(prev => ({
            ...prev,
            [rowIndex]: {
                ...prev[rowIndex],
                [type]: null
            }
        }));

        setPlacedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(item.id);
            return newSet;
        });
    };

    const handleSubmit = () => {
        if (isSubmitted || readOnly) return;

        // Check each row
        const connectionResults: { word: string; pinyin: string; meaning: string; isCorrect: boolean }[] = [];

        for (let i = 0; i < itemCount; i++) {
            const row = grid[i];
            const word = row?.word?.value || '';
            const pinyin = row?.pinyin?.value || '';
            const meaning = row?.meaning?.value || '';

            // Find the correct item for this word
            const correctItem = question.items.find(item => item.word === word);
            const isCorrect = correctItem?.pinyin === pinyin && correctItem?.meaning === meaning;

            connectionResults.push({
                word,
                pinyin,
                meaning,
                isCorrect: isCorrect ?? false,
            });
        }

        const correctCount = connectionResults.filter(r => r.isCorrect).length;
        setResults(connectionResults);
        onSubmit(connectionResults, correctCount);
    };

    const getCorrectItemForWord = (word: string): MatchingItem | undefined => {
        return question.items.find(item => item.word === word);
    };

    const isAllFilled = () => {
        for (let i = 0; i < itemCount; i++) {
            if (!grid[i]?.word || !grid[i]?.pinyin || !grid[i]?.meaning) {
                return false;
            }
        }
        return true;
    };

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Instructions */}
            <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Nối từ với phiên âm và nghĩa đúng</p>
                <p className="text-xs text-gray-400">Kéo thả từ vào các ô trống theo hàng ngang</p>
            </div>

            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {/* Item Pool */}
                {!isSubmitted && (
                    <div className="bg-secondary-50 rounded-xl p-4 space-y-3">
                        {/* Words */}
                        <div className="flex flex-wrap gap-2">
                            {question.shuffledWords.map((word, i) => (
                                <DraggableItem
                                    key={`word-${i}`}
                                    id={`word-${i}-${word}`}
                                    value={word}
                                    type="word"
                                    isPlaced={placedItems.has(`word-${i}-${word}`)}
                                />
                            ))}
                        </div>

                        {/* Pinyins */}
                        <div className="flex flex-wrap gap-2">
                            {question.shuffledPinyins.map((pinyin, i) => (
                                <DraggableItem
                                    key={`pinyin-${i}`}
                                    id={`pinyin-${i}-${pinyin}`}
                                    value={pinyin}
                                    type="pinyin"
                                    isPlaced={placedItems.has(`pinyin-${i}-${pinyin}`)}
                                />
                            ))}
                        </div>

                        {/* Meanings */}
                        <div className="flex flex-wrap gap-2">
                            {question.shuffledMeanings.map((meaning, i) => (
                                <DraggableItem
                                    key={`meaning-${i}`}
                                    id={`meaning-${i}-${meaning}`}
                                    value={meaning}
                                    type="meaning"
                                    isPlaced={placedItems.has(`meaning-${i}-${meaning}`)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Grid Headers */}
                <div className="grid grid-cols-3 gap-3 text-center text-xs font-semibold text-gray-500">
                    <div className="bg-blue-100 py-2 rounded-lg">Từ vựng</div>
                    <div className="bg-green-100 py-2 rounded-lg">Phiên âm</div>
                    <div className="bg-amber-100 py-2 rounded-lg">Nghĩa</div>
                </div>

                {/* Drop Grid */}
                <div className="space-y-2">
                    {Array.from({ length: itemCount }).map((_, rowIndex) => {
                        const result = results[rowIndex];
                        const word = grid[rowIndex]?.word?.value || '';
                        const correctItem = word ? getCorrectItemForWord(word) : null;
                        const isRowCorrect = result?.isCorrect;

                        return (
                            <div key={rowIndex} className="space-y-1">
                                {/* Row of 3 boxes */}
                                <div className="grid grid-cols-3 gap-3">
                                    {/* Word Box */}
                                    <div
                                        onClick={() => handleRemoveItem(rowIndex, 'word')}
                                        className={!isSubmitted && grid[rowIndex]?.word ? 'cursor-pointer' : ''}
                                    >
                                        <DroppableBox
                                            id={`drop-${rowIndex}-word`}
                                            type="word"
                                            placedItem={grid[rowIndex]?.word || null}
                                            isSubmitted={isSubmitted}
                                            isCorrect={isRowCorrect}
                                        />
                                    </div>

                                    {/* Pinyin Box */}
                                    <div
                                        onClick={() => handleRemoveItem(rowIndex, 'pinyin')}
                                        className={!isSubmitted && grid[rowIndex]?.pinyin ? 'cursor-pointer' : ''}
                                    >
                                        <DroppableBox
                                            id={`drop-${rowIndex}-pinyin`}
                                            type="pinyin"
                                            placedItem={grid[rowIndex]?.pinyin || null}
                                            isSubmitted={isSubmitted}
                                            isCorrect={isRowCorrect}
                                        />
                                    </div>

                                    {/* Meaning Box */}
                                    <div
                                        onClick={() => handleRemoveItem(rowIndex, 'meaning')}
                                        className={!isSubmitted && grid[rowIndex]?.meaning ? 'cursor-pointer' : ''}
                                    >
                                        <DroppableBox
                                            id={`drop-${rowIndex}-meaning`}
                                            type="meaning"
                                            placedItem={grid[rowIndex]?.meaning || null}
                                            isSubmitted={isSubmitted}
                                            isCorrect={isRowCorrect}
                                        />
                                    </div>
                                </div>

                                {/* Speaker button for this word (shown after submission) */}
                                {isSubmitted && correctItem && (
                                    <div className="flex items-center gap-1.5 ml-2 animate-fade-in">
                                        <span className="font-chinese text-sm font-medium text-charcoal">{correctItem.word}</span>
                                        <SpeakerButton text={correctItem.word} size={14} />
                                    </div>
                                )}

                                {/* Correct answer for this row (shown right below if incorrect) */}
                                {isSubmitted && !isRowCorrect && correctItem && (
                                    <div className="flex items-center gap-2 text-xs text-success-700 bg-success-50 px-3 py-1.5 rounded-lg ml-2 animate-fade-in">
                                        <ArrowRight size={12} />
                                        <span className="font-medium">Đáp án:</span>
                                        <span className="font-chinese">{correctItem.word}</span>
                                        <span className="text-gray-400">→</span>
                                        <span className="font-pinyin">{correctItem.pinyin}</span>
                                        <span className="text-gray-400">→</span>
                                        <span>{correctItem.meaning}</span>
                                    </div>
                                )}

                                {/* Example sentence for this row (shown after submission) */}
                                {isSubmitted && correctItem?.example && (
                                    <div className="flex items-start gap-2 text-xs bg-secondary-50 border border-secondary-200 px-3 py-2 rounded-lg ml-2 animate-fade-in">
                                        <BookOpen size={12} className="text-primary-500 mt-0.5 shrink-0" />
                                        <div className="space-y-0.5">
                                            <div>
                                                <span className="text-gray-500">Ví dụ: </span>
                                                <span className="font-chinese text-charcoal">{correctItem.example}</span>
                                            </div>
                                            {correctItem.exampleMeaning && (
                                                <div>
                                                    <span className="text-gray-500">Nghĩa là: </span>
                                                    <span className="text-charcoal">{correctItem.exampleMeaning}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <DragOverlay>
                    {activeId && activeData ? (
                        <div
                            style={{ touchAction: 'none' }}
                            className={`
                                inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 shadow-lg select-none
                                ${activeData.type === 'word' ? 'bg-blue-50 border-blue-400' : ''}
                                ${activeData.type === 'pinyin' ? 'bg-green-50 border-green-400' : ''}
                                ${activeData.type === 'meaning' ? 'bg-amber-50 border-amber-400' : ''}
                            `}
                        >
                            <GripVertical size={12} className="text-gray-500" />
                            <span className={`
                                ${activeData.type === 'word' ? 'font-chinese text-base' : ''}
                                ${activeData.type === 'pinyin' ? 'font-pinyin text-sm' : ''}
                                ${activeData.type === 'meaning' ? 'text-sm' : ''}
                            `}>
                                {activeData.value}
                            </span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Result Summary */}
            {isSubmitted && results.length > 0 && (
                <div className={`p-4 rounded-xl text-center animate-scale-in ${results.filter(r => r.isCorrect).length === results.length
                    ? 'bg-success-100 text-success-700'
                    : results.filter(r => r.isCorrect).length >= results.length / 2
                        ? 'bg-warning-100 text-warning-700'
                        : 'bg-error-100 text-error-700'
                    }`}>
                    <div className="flex items-center justify-center gap-2">
                        {results.filter(r => r.isCorrect).length === results.length ? (
                            <Check size={20} />
                        ) : (
                            <X size={20} />
                        )}
                        <span className="font-semibold">
                            Đúng {results.filter(r => r.isCorrect).length}/{results.length} cặp
                        </span>
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
                    disabled={!isAllFilled()}
                >
                    {isAllFilled() ? 'Gửi' : `Còn ${itemCount * 3 - placedItems.size} ô trống`}
                </Button>
            )}
        </div>
    );
}
