import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTimerReturn {
    elapsedTime: number;        // Total elapsed time in milliseconds
    formattedTime: string;      // Formatted as MM:SS
    questionTime: number;       // Time spent on current question
    isPaused: boolean;
    start: () => void;
    pause: () => void;
    resume: () => void;
    reset: () => void;
    resetQuestionTimer: () => void;
    getQuestionTime: () => number;
}

export function useTimer(): UseTimerReturn {
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isPaused, setIsPaused] = useState(true);
    const [questionStartTime, setQuestionStartTime] = useState(0);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const pausedTimeRef = useRef<number>(0);

    const clearTimerInterval = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const start = useCallback(() => {
        if (intervalRef.current) return;

        startTimeRef.current = Date.now() - pausedTimeRef.current;
        setQuestionStartTime(Date.now());
        setIsPaused(false);

        intervalRef.current = setInterval(() => {
            setElapsedTime(Date.now() - startTimeRef.current);
        }, 100);
    }, []);

    const pause = useCallback(() => {
        clearTimerInterval();
        pausedTimeRef.current = elapsedTime;
        setIsPaused(true);
    }, [elapsedTime, clearTimerInterval]);

    const resume = useCallback(() => {
        if (!isPaused || intervalRef.current) return;

        startTimeRef.current = Date.now() - pausedTimeRef.current;
        setIsPaused(false);

        intervalRef.current = setInterval(() => {
            setElapsedTime(Date.now() - startTimeRef.current);
        }, 100);
    }, [isPaused]);

    const reset = useCallback(() => {
        clearTimerInterval();
        setElapsedTime(0);
        setIsPaused(true);
        startTimeRef.current = 0;
        pausedTimeRef.current = 0;
        setQuestionStartTime(0);
    }, [clearTimerInterval]);

    const resetQuestionTimer = useCallback(() => {
        setQuestionStartTime(Date.now());
    }, []);

    const getQuestionTime = useCallback(() => {
        if (questionStartTime === 0) return 0;
        return Date.now() - questionStartTime;
    }, [questionStartTime]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearTimerInterval();
        };
    }, [clearTimerInterval]);

    // Format time as MM:SS
    const formattedTime = (() => {
        const totalSeconds = Math.floor(elapsedTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    })();

    const questionTime = questionStartTime > 0 ? Date.now() - questionStartTime : 0;

    return {
        elapsedTime,
        formattedTime,
        questionTime,
        isPaused,
        start,
        pause,
        resume,
        reset,
        resetQuestionTimer,
        getQuestionTime,
    };
}

/**
 * Format milliseconds to human readable string
 */
export function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes === 0) {
        return `${seconds} giây`;
    }

    return `${minutes} phút ${seconds} giây`;
}

/**
 * Format milliseconds to MM:SS format
 */
export function formatTimeShort(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
