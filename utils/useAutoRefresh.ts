import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Custom hook for auto-refreshing data at a specified interval.
 * 
 * @param callback Function to be called on each interval
 * @param intervalTime Interval time in milliseconds
 * @param initialEnabled Whether the auto-refresh is enabled initially (default: true)
 * @returns Object containing controls: pause, resume, reset, and isPaused state
 */
export function useAutoRefresh(
    callback: () => void,
    intervalTime: number,
    initialEnabled: boolean = true
) {
    const [isPaused, setIsPaused] = useState(!initialEnabled);
    const callbackRef = useRef(callback);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Keep callback ref up to date to avoid stale closures in the interval
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startTimer = useCallback(() => {
        stopTimer(); // Ensure no duplicate timers
        if (intervalTime > 0) {
            timerRef.current = setInterval(() => {
                callbackRef.current();
            }, intervalTime);
        }
    }, [intervalTime, stopTimer]);

    // Handle start/stop based on paused state and interval
    useEffect(() => {
        if (!isPaused && intervalTime > 0) {
            startTimer();
        } else {
            stopTimer();
        }

        return () => stopTimer();
    }, [isPaused, intervalTime, startTimer, stopTimer]);

    const pause = useCallback(() => {
        setIsPaused(true);
    }, []);

    const resume = useCallback(() => {
        setIsPaused(false);
    }, []);

    const reset = useCallback(() => {
        stopTimer();
        if (!isPaused) {
            startTimer();
        }
    }, [isPaused, startTimer, stopTimer]);

    return {
        pause,
        resume,
        reset,
        isPaused
    };
}
