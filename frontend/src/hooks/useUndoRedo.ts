/**
 * useUndoRedo Hook
 * Provides undo/redo functionality for timetable operations
 */

import { useState, useCallback, useMemo } from 'react';

interface Operation<T> {
    type: string;
    timestamp: number;
    before: T;
    after: T;
    description: string;
}

interface UndoRedoState<T> {
    past: Operation<T>[];
    present: T;
    future: Operation<T>[];
}

interface UndoRedoResult<T> {
    state: T;
    canUndo: boolean;
    canRedo: boolean;
    undoCount: number;
    redoCount: number;
    lastOperation: Operation<T> | null;
    undo: () => T | null;
    redo: () => T | null;
    pushOperation: (type: string, before: T, after: T, description: string) => void;
    clearHistory: () => void;
    getHistory: () => Operation<T>[];
}

const MAX_HISTORY = 50;

function useUndoRedo<T>(initialState: T): UndoRedoResult<T> {
    const [history, setHistory] = useState<UndoRedoState<T>>({
        past: [],
        present: initialState,
        future: []
    });

    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;
    const undoCount = history.past.length;
    const redoCount = history.future.length;
    const lastOperation = history.past.length > 0
        ? history.past[history.past.length - 1]
        : null;

    const undo = useCallback((): T | null => {
        if (!canUndo) return null;

        const previous = history.past[history.past.length - 1];
        const newPast = history.past.slice(0, -1);

        setHistory({
            past: newPast,
            present: previous.before,
            future: [
                {
                    ...previous,
                    before: previous.after,
                    after: previous.before
                },
                ...history.future
            ]
        });

        return previous.before;
    }, [history, canUndo]);

    const redo = useCallback((): T | null => {
        if (!canRedo) return null;

        const next = history.future[0];
        const newFuture = history.future.slice(1);

        setHistory({
            past: [
                ...history.past,
                {
                    ...next,
                    before: next.after,
                    after: next.before
                }
            ],
            present: next.before,
            future: newFuture
        });

        return next.before;
    }, [history, canRedo]);

    const pushOperation = useCallback((
        type: string,
        before: T,
        after: T,
        description: string
    ) => {
        const operation: Operation<T> = {
            type,
            timestamp: Date.now(),
            before,
            after,
            description
        };

        setHistory(prev => ({
            past: [...prev.past.slice(-MAX_HISTORY + 1), operation],
            present: after,
            future: [] // Clear redo stack when new operation is pushed
        }));
    }, []);

    const clearHistory = useCallback(() => {
        setHistory(prev => ({
            past: [],
            present: prev.present,
            future: []
        }));
    }, []);

    const getHistory = useCallback((): Operation<T>[] => {
        return [...history.past].reverse();
    }, [history.past]);

    return {
        state: history.present,
        canUndo,
        canRedo,
        undoCount,
        redoCount,
        lastOperation,
        undo,
        redo,
        pushOperation,
        clearHistory,
        getHistory
    };
}

export default useUndoRedo;

// Types export for use in other components
export type { Operation, UndoRedoResult };
