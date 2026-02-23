import { useState, useCallback, useRef, useEffect } from 'react';

const APP_HEADER_ID = 'app-header-container';
const DEFAULT_MIN_Y = 65;

export interface DragPosition {
    x: number;
    y: number;
}

export interface UsePanelDragProps {
    initialPosition: DragPosition;
    onDragStart?: () => void;
    onDragEnd?: (finalPosition: DragPosition) => void;
    onPositionChange?: (newPosition: DragPosition) => void;
}

export const usePanelDrag = ({
    initialPosition,
    onDragStart,
    onDragEnd,
    onPositionChange
}: UsePanelDragProps) => {
    const [position, setPosition] = useState<DragPosition>(initialPosition);
    const [isDragging, setIsDragging] = useState(false);

    // Refs to track state without closure staleness during event handlers
    const dragStartRef = useRef<{ x: number, y: number } | null>(null);
    const initialPosRef = useRef<DragPosition | null>(null);
    const positionRef = useRef<DragPosition>(initialPosition);

    // Keep ref in sync
    useEffect(() => {
        positionRef.current = position;
    }, [position]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Only trigger on left click
        if (e.button !== 0) return;

        e.preventDefault(); // Prevent text selection

        dragStartRef.current = { x: e.clientX, y: e.clientY };
        initialPosRef.current = { ...positionRef.current };
        setIsDragging(true);

        if (onDragStart) onDragStart();

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!dragStartRef.current || !initialPosRef.current) return;

            const dx = moveEvent.clientX - dragStartRef.current.x;
            const dy = moveEvent.clientY - dragStartRef.current.y;

            // Calculate Constraints
            const headerElement = document.getElementById(APP_HEADER_ID);
            // If the header exists, use its bottom position. Otherwise use default.
            // We use Math.floor/ceil to be safe, but getBoundingClientRect is precise.
            const minY = headerElement ? headerElement.getBoundingClientRect().bottom : DEFAULT_MIN_Y;

            const newX = initialPosRef.current.x + dx;
            // Apply the constraint: Y cannot be less than minY
            const newY = Math.max(minY, initialPosRef.current.y + dy);

            const newPos = { x: newX, y: newY };
            setPosition(newPos);

            if (onPositionChange) onPositionChange(newPos);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            setIsDragging(false);

            dragStartRef.current = null;
            initialPosRef.current = null;

            if (onDragEnd) onDragEnd(positionRef.current);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [onDragStart, onDragEnd, onPositionChange]);

    return {
        position,
        setPosition,
        handleMouseDown,
        isDragging
    };
};
