
import React, { useRef, useEffect, useState } from 'react';
import { Relationship, RelationshipDirection } from '../types';

interface RelationshipContextMenuProps {
    x: number;
    y: number;
    relationship: Relationship;
    onClose: () => void;
    onDelete: () => void;
    onChangeDirection: (direction: RelationshipDirection) => void;
    isDarkMode: boolean;
}

export const RelationshipContextMenu: React.FC<RelationshipContextMenuProps> = ({ 
    x, y, relationship, onClose, onDelete, onChangeDirection, isDarkMode 
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [showDirectionMenu, setShowDirectionMenu] = useState(false);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => { 
            if(ref.current && !ref.current.contains(e.target as Node)) onClose(); 
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    // Prevent going off screen
    const style = {
        top: Math.min(y, window.innerHeight - 150),
        left: Math.min(x, window.innerWidth - 200)
    };

    const bgClass = isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300';
    const textClass = isDarkMode ? 'text-gray-200' : 'text-gray-800';
    const hoverClass = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
    const dividerClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';

    const directions = [
        { label: 'Forward (→)', value: RelationshipDirection.To },
        { label: 'Reverse (←)', value: RelationshipDirection.From },
        { label: 'Bi-directional (↔)', value: RelationshipDirection.Both },
        { label: 'None (—)', value: RelationshipDirection.None },
    ];

    return (
        <div ref={ref} className={`fixed border rounded shadow-xl z-50 py-1 w-56 ${bgClass}`} style={style}>
            <div 
                className={`relative w-full text-left px-4 py-2 text-sm cursor-pointer flex justify-between items-center ${textClass} ${hoverClass}`}
                onMouseEnter={() => setShowDirectionMenu(true)}
                onMouseLeave={() => setShowDirectionMenu(false)}
                onClick={(e) => { e.stopPropagation(); setShowDirectionMenu(!showDirectionMenu); }}
            >
                <span>Change Direction</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>

                {showDirectionMenu && (
                    <div className={`absolute left-full top-0 -ml-1 w-48 border rounded shadow-xl py-1 ${bgClass}`}>
                        {directions.map(dir => (
                            <button
                                key={dir.value}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChangeDirection(dir.value);
                                    onClose();
                                }}
                                className={`block w-full text-left px-4 py-2 text-sm flex justify-between items-center ${textClass} ${hoverClass}`}
                            >
                                <span>{dir.label}</span>
                                {relationship.direction === dir.value && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            <div className={`border-t my-1 ${dividerClass}`}></div>
            
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); onClose(); }} 
                className={`block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 hover:text-red-200 transition-colors`}
            >
                Delete Relationship
            </button>
        </div>
    );
}
