/**
 * Timetable Grid Components
 */

import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { TimetableSlot } from './types';

export const TIME_SLOTS = [
    { start: '08:00', end: '08:45', period: 1 },
    { start: '08:45', end: '09:30', period: 2 },
    { start: '09:30', end: '10:15', period: 3 },
    { start: '10:15', end: '10:30', period: 0, label: 'Break' },
    { start: '10:30', end: '11:15', period: 4 },
    { start: '11:15', end: '12:00', period: 5 },
    { start: '12:00', end: '12:45', period: 6 },
    { start: '12:45', end: '13:30', period: 0, label: 'Lunch' },
    { start: '13:30', end: '14:15', period: 7 },
    { start: '14:15', end: '15:00', period: 8 },
];

export const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

interface DraggableSlotProps {
    slot: TimetableSlot;
    onEdit?: (slot: TimetableSlot) => void;
    onDelete?: (slotId: string) => void;
    readOnly?: boolean;
}

export const DraggableSlot: React.FC<DraggableSlotProps> = ({ slot, onEdit, onDelete, readOnly }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'TIMETABLE_SLOT',
        item: slot,
        canDrag: !readOnly,
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }), [slot, readOnly]);

    return (
        <div
            ref={drag}
            className={`timetable-slot ${isDragging ? 'dragging' : ''} ${readOnly ? 'read-only' : ''}`}
            onClick={() => onEdit?.(slot)}
        >
            <div className="slot-subject">{slot.subject_name || slot.subject}</div>
            <div className="slot-teacher">{slot.teacher_name || slot.teacher}</div>
            <div className="slot-room">{slot.room}</div>
            {slot.id && !readOnly && onDelete && (
                <button
                    className="slot-delete"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(slot.id!);
                    }}
                >
                    ×
                </button>
            )}
        </div>
    );
};

interface DroppableCellProps {
    day: string;
    timeSlot: typeof TIME_SLOTS[0];
    slot?: TimetableSlot;
    onDrop: (day: string, timeSlot: typeof TIME_SLOTS[0], item: TimetableSlot) => void;
    onEdit: (slot: TimetableSlot) => void;
    onDelete: (slotId: string) => void;
}

export const DroppableCell: React.FC<DroppableCellProps> = ({
    day,
    timeSlot,
    slot,
    onDrop,
    onEdit,
    onDelete,
}) => {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: 'TIMETABLE_SLOT',
        drop: (item: TimetableSlot) => onDrop(day, timeSlot, item),
        canDrop: () => timeSlot.period !== 0,
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    }), [day, timeSlot, onDrop]);

    if (timeSlot.period === 0) {
        return (
            <td className="break-cell" colSpan={1}>
                <span>{timeSlot.label}</span>
            </td>
        );
    }

    return (
        <td
            ref={drop}
            className={`droppable-cell ${isOver && canDrop ? 'drop-over' : ''} ${canDrop ? 'can-drop' : ''
                }`}
        >
            {slot ? (
                <DraggableSlot slot={slot} onEdit={onEdit} onDelete={onDelete} />
            ) : (
                <div className="empty-slot">+</div>
            )}
        </td>
    );
};
