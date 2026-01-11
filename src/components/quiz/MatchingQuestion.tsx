import { useState, useEffect, useCallback } from 'react';
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
import { Check, X, ArrowRight, BookOpen, Lightbulb } from 'lucide-react';
import type { MatchingQuestion, MatchingItem, MatchingAnswer } from '@/types';
import { Button } from '@/components/common/Button';
import { SpeakerButton } from '@/components/common/SpeakerButton';
import { Card } from '@/components/common/Card';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface MatchingQuestionProps {
    question: MatchingQuestion;
    onSubmit: (connections: { word: string; pinyin: string; meaning: string; isCorrect: boolean }[], correctCount: number, usedHint: boolean) => void;
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
    isInPool?: boolean;
    fullWidth?: boolean;
}

interface DroppableBoxProps {
    id: string;
    type: ItemType;
    placedItem: { id: string; value: string } | null;
    isSubmitted: boolean;
    isCorrect?: boolean;
    disabled?: boolean;
}

// Draggable item component - used both in pool and in placed boxes
function DraggableItem({ id, value, type, isPlaced, isInPool = true, fullWidth = false }: DraggableItemProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id,
        data: { type, value, isFromBox: !isInPool },
    });

    // In pool and placed - hide from pool
    if (isPlaced && isInPool) return null;

    const getStyle = () => {
        switch (type) {
            case 'word':
                return fullWidth ? 'bg-transparent border-transparent' : 'bg-blue-50 border-blue-200 hover:border-blue-400';
            case 'pinyin':
                return fullWidth ? 'bg-transparent border-transparent' : 'bg-green-50 border-green-200 hover:border-green-400';
            case 'meaning':
                return fullWidth ? 'bg-transparent border-transparent' : 'bg-amber-50 border-amber-200 hover:border-amber-400';
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
                ${fullWidth ? 'flex w-full h-full justify-center' : 'inline-flex'} 
                items-center px-3 py-2 rounded-lg border-2 
                ${getStyle()}
                ${isDragging ? 'opacity-50 scale-95' : ''}
                cursor-grab active:cursor-grabbing transition-all duration-150 select-none
            `}
        >
            <span className={getTextStyle()}>{value}</span>
        </div>
    );
}

// Droppable box component - now supports dragging items out
function DroppableBox({ id, type, placedItem, isSubmitted, isCorrect, disabled }: DroppableBoxProps) {
    const { isOver, setNodeRef } = useDroppable({
        id,
        data: { type },
        disabled: isSubmitted || disabled,
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

    // When submitted, show static content
    if (isSubmitted && placedItem) {
        return (
            <div
                className={`
                    flex items-center justify-center min-h-[44px] px-3 py-2 rounded-lg border-2 transition-all duration-150
                    ${isCorrect ? 'border-success-400 bg-success-50' : 'border-error-400 bg-error-50'}
                `}
            >
                <div className="flex items-center gap-1.5">
                    {isCorrect ? (
                        <Check size={14} className="text-success-600 shrink-0" />
                    ) : (
                        <X size={14} className="text-error-600 shrink-0" />
                    )}
                    <span className={getTextStyle()}>{placedItem.value}</span>
                </div>
            </div>
        );
    }

    const getFilledStyle = () => {
        switch (type) {
            case 'word':
                return 'bg-blue-50 border-blue-200';
            case 'pinyin':
                return 'bg-green-50 border-green-200';
            case 'meaning':
                return 'bg-amber-50 border-amber-200';
        }
    };

    return (
        <div
            ref={setNodeRef}
            className={`
                flex items-center justify-center min-h-[44px] rounded-lg border-2 transition-all duration-150
                ${placedItem ? getFilledStyle() : getEmptyStyle()}
            `}
        >
            {placedItem ? (
                // Render draggable item inside the box so it can be dragged out - stretches to fill box
                <DraggableItem
                    id={placedItem.id}
                    value={placedItem.value}
                    type={type}
                    isPlaced={false}
                    isInPool={false}
                    fullWidth
                />
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
    const { playSound } = useSoundEffects();

    // Track which items are placed in which boxes
    // grid[rowIndex][type] = { id, value } or null
    const [grid, setGrid] = useState<Record<number, Record<ItemType, { id: string; value: string } | null>>>({});

    // Track which items have been placed
    const [placedItems, setPlacedItems] = useState<Set<string>>(new Set());

    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeData, setActiveData] = useState<{ type: ItemType; value: string } | null>(null);
    const [results, setResults] = useState<{ word: string; pinyin: string; meaning: string; isCorrect: boolean }[]>([]);

    // Hint state
    const [usedHint, setUsedHint] = useState(false);
    const [showHintExplanation, setShowHintExplanation] = useState(false);
    const [hiddenNoiseItems, setHiddenNoiseItems] = useState<Set<string>>(new Set());

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
            setUsedHint(previousAnswer.usedHint || false);
            setShowHintExplanation(previousAnswer.usedHint || false);
            // If hint was used, hide all noise items
            if (previousAnswer.usedHint && question.noiseItems) {
                setHiddenNoiseItems(new Set(question.noiseItems.map(n => n.value)));
            }
        } else {
            // Initialize empty grid
            const initialGrid: Record<number, Record<ItemType, { id: string; value: string } | null>> = {};
            for (let i = 0; i < itemCount; i++) {
                initialGrid[i] = { word: null, pinyin: null, meaning: null };
            }
            setGrid(initialGrid);
            setPlacedItems(new Set());
            setResults([]);
            setUsedHint(false);
            setShowHintExplanation(false);
            setHiddenNoiseItems(new Set());
        }
    }, [question.id, itemCount, previousAnswer, question.noiseItems]);

    // Handle showing hints - also removes noise items from answer boxes
    const handleShowHint = useCallback(() => {
        if (question.noiseItems && question.noiseItems.length > 0) {
            playSound('hint');
            setUsedHint(true);
            setShowHintExplanation(true);

            // Get all noise values
            const noiseValues = new Set(question.noiseItems.map(n => n.value));
            setHiddenNoiseItems(noiseValues);

            // Remove noise items from the grid (answer boxes)
            setGrid(prev => {
                const newGrid = { ...prev };
                for (let i = 0; i < itemCount; i++) {
                    const row = prev[i];
                    if (row) {
                        const newRow = { ...row };
                        // Check each cell and remove if it's a noise item
                        if (row.word && noiseValues.has(row.word.value)) {
                            newRow.word = null;
                        }
                        if (row.pinyin && noiseValues.has(row.pinyin.value)) {
                            newRow.pinyin = null;
                        }
                        if (row.meaning && noiseValues.has(row.meaning.value)) {
                            newRow.meaning = null;
                        }
                        newGrid[i] = newRow;
                    }
                }
                return newGrid;
            });

            // Remove noise items from placedItems tracking
            setPlacedItems(prev => {
                const newSet = new Set(prev);
                for (const id of prev) {
                    // Extract the value part from ID (format: type-index-value)
                    const parts = id.split('-');
                    const value = parts.slice(2).join('-'); // Handle values with dashes
                    if (noiseValues.has(value)) {
                        newSet.delete(id);
                    }
                }
                return newSet;
            });
        }
    }, [question.noiseItems, playSound, itemCount]);

    // Check if item should be hidden (noise item that's been eliminated)
    const shouldHideItem = useCallback((value: string): boolean => {
        return hiddenNoiseItems.has(value);
    }, [hiddenNoiseItems]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        setActiveData(event.active.data.current as { type: ItemType; value: string });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveData(null);

        const activeData = active.data.current as { type: ItemType; value: string; isFromBox?: boolean };
        const activeType = activeData.type;
        const activeValue = activeData.value;
        const activeIdStr = active.id as string;
        const isFromBox = activeData.isFromBox;

        // Find the source box if dragging from a box
        let sourceRowIndex: number | null = null;
        if (isFromBox) {
            for (let i = 0; i < itemCount; i++) {
                if (grid[i]?.[activeType]?.id === activeIdStr) {
                    sourceRowIndex = i;
                    break;
                }
            }
        }

        // If dropped outside any target
        if (!over) {
            // If from box, remove it (return to pool)
            if (isFromBox && sourceRowIndex !== null) {
                setGrid(prev => ({
                    ...prev,
                    [sourceRowIndex!]: {
                        ...prev[sourceRowIndex!],
                        [activeType]: null
                    }
                }));
                setPlacedItems(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(activeIdStr);
                    return newSet;
                });
            }
            return;
        }

        // Parse over.id to get row and type: format is "drop-{row}-{type}"
        const overIdStr = over.id as string;
        if (!overIdStr.startsWith('drop-')) {
            // Dropped on pool area - remove from box
            if (isFromBox && sourceRowIndex !== null) {
                setGrid(prev => ({
                    ...prev,
                    [sourceRowIndex!]: {
                        ...prev[sourceRowIndex!],
                        [activeType]: null
                    }
                }));
                setPlacedItems(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(activeIdStr);
                    return newSet;
                });
            }
            return;
        }

        const parts = overIdStr.split('-');
        const targetRowIndex = parseInt(parts[1]);
        const dropType = parts[2] as ItemType;

        // Only allow dropping same type
        if (activeType !== dropType) return;

        // If dropping on the same box it came from, do nothing
        if (isFromBox && sourceRowIndex === targetRowIndex) return;

        const existingItem = grid[targetRowIndex]?.[dropType];

        // Handle swap if target box is already filled
        if (existingItem) {
            if (isFromBox && sourceRowIndex !== null) {
                // Swap items between boxes
                setGrid(prev => ({
                    ...prev,
                    [sourceRowIndex!]: {
                        ...prev[sourceRowIndex!],
                        [activeType]: existingItem
                    },
                    [targetRowIndex]: {
                        ...prev[targetRowIndex],
                        [dropType]: { id: activeIdStr, value: activeValue }
                    }
                }));
            }
            // If from pool and target is filled, do nothing
            return;
        }

        // Place the item in the target box
        setGrid(prev => ({
            ...prev,
            [targetRowIndex]: {
                ...prev[targetRowIndex],
                [dropType]: { id: activeIdStr, value: activeValue }
            }
        }));

        // If from box, clear the source
        if (isFromBox && sourceRowIndex !== null) {
            setGrid(prev => ({
                ...prev,
                [sourceRowIndex!]: {
                    ...prev[sourceRowIndex!],
                    [activeType]: null
                }
            }));
        } else {
            // From pool - add to placed items
            setPlacedItems(prev => new Set([...prev, activeIdStr]));
        }
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
        onSubmit(connectionResults, correctCount, usedHint);
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
                {/* Hint explanation */}
                {showHintExplanation && !isSubmitted && (
                    <Card className="bg-amber-50 border border-amber-200 text-center animate-fade-in">
                        <p className="text-amber-700 text-sm">
                            <span className="font-medium">💡 Đã loại bỏ {question.noiseItems?.length || 0} đáp án nhiễu!</span>
                        </p>
                        <p className="text-xs text-amber-500 mt-1">
                            (Trả lời đúng sẽ giảm 50% số điểm câu này)
                        </p>
                    </Card>
                )}

                {/* Item Pool */}
                {!isSubmitted && (
                    <div className="bg-secondary-50 rounded-xl p-4 space-y-3">
                        {/* Words - use original index to maintain stable IDs */}
                        <div className="flex flex-wrap gap-2">
                            {question.shuffledWords.map((word, originalIndex) => {
                                if (shouldHideItem(word)) return null;
                                const itemId = `word-${originalIndex}-${word}`;
                                const isItemPlaced = placedItems.has(itemId);
                                // Use key with placement state to force remount when item returns from box
                                // This ensures dnd-kit gets a fresh state
                                return (
                                    <DraggableItem
                                        key={`${itemId}-${isItemPlaced ? 'placed' : 'pool'}`}
                                        id={itemId}
                                        value={word}
                                        type="word"
                                        isPlaced={isItemPlaced}
                                    />
                                );
                            })}
                        </div>

                        {/* Pinyins - use original index to maintain stable IDs */}
                        <div className="flex flex-wrap gap-2">
                            {question.shuffledPinyins.map((pinyin, originalIndex) => {
                                if (shouldHideItem(pinyin)) return null;
                                const itemId = `pinyin-${originalIndex}-${pinyin}`;
                                const isItemPlaced = placedItems.has(itemId);
                                return (
                                    <DraggableItem
                                        key={`${itemId}-${isItemPlaced ? 'placed' : 'pool'}`}
                                        id={itemId}
                                        value={pinyin}
                                        type="pinyin"
                                        isPlaced={isItemPlaced}
                                    />
                                );
                            })}
                        </div>

                        {/* Meanings - use original index to maintain stable IDs */}
                        <div className="flex flex-wrap gap-2">
                            {question.shuffledMeanings.map((meaning, originalIndex) => {
                                if (shouldHideItem(meaning)) return null;
                                const itemId = `meaning-${originalIndex}-${meaning}`;
                                const isItemPlaced = placedItems.has(itemId);
                                return (
                                    <DraggableItem
                                        key={`${itemId}-${isItemPlaced ? 'placed' : 'pool'}`}
                                        id={itemId}
                                        value={meaning}
                                        type="meaning"
                                        isPlaced={isItemPlaced}
                                    />
                                );
                            })}
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
                                    <DroppableBox
                                        id={`drop-${rowIndex}-word`}
                                        type="word"
                                        placedItem={grid[rowIndex]?.word || null}
                                        isSubmitted={isSubmitted}
                                        isCorrect={isRowCorrect}
                                    />

                                    {/* Pinyin Box */}
                                    <DroppableBox
                                        id={`drop-${rowIndex}-pinyin`}
                                        type="pinyin"
                                        placedItem={grid[rowIndex]?.pinyin || null}
                                        isSubmitted={isSubmitted}
                                        isCorrect={isRowCorrect}
                                    />

                                    {/* Meaning Box */}
                                    <DroppableBox
                                        id={`drop-${rowIndex}-meaning`}
                                        type="meaning"
                                        placedItem={grid[rowIndex]?.meaning || null}
                                        isSubmitted={isSubmitted}
                                        isCorrect={isRowCorrect}
                                    />
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
                                inline-flex items-center px-3 py-2 rounded-lg border-2 shadow-lg select-none
                                ${activeData.type === 'word' ? 'bg-blue-50 border-blue-400' : ''}
                                ${activeData.type === 'pinyin' ? 'bg-green-50 border-green-400' : ''}
                                ${activeData.type === 'meaning' ? 'bg-amber-50 border-amber-400' : ''}
                            `}
                        >
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

            {/* Action Buttons */}
            {!isSubmitted && !readOnly && (
                <div className="flex gap-3">
                    {/* Hint Button - only show if there are noise items and hint not used yet */}
                    {!usedHint && question.noiseItems && question.noiseItems.length > 0 && (
                        <div className="relative group flex-shrink-0">
                            <Button
                                variant="secondary"
                                size="lg"
                                onClick={handleShowHint}
                                icon={<Lightbulb size={18} />}
                            >
                                Gợi ý
                            </Button>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-charcoal text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                Khử đáp án nhiễu
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-charcoal"></div>
                            </div>
                        </div>
                    )}
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={handleSubmit}
                        disabled={!isAllFilled()}
                    >
                        {isAllFilled() ? 'Gửi' : `Còn ${itemCount * 3 - placedItems.size} ô trống`}
                    </Button>
                </div>
            )}
        </div>
    );
}
