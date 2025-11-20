import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Element, Relationship, ColorScheme, RelationshipDirection, ModelMetadata, PanelState, DateFilterState, ModelActions, RelationshipDefinition, ScamperSuggestion } from './types';
import { DEFAULT_COLOR_SCHEMES, LINK_DISTANCE } from './constants';
import GraphCanvas, { GraphCanvasRef } from './components/GraphCanvas';
import ElementDetailsPanel from './components/ElementDetailsPanel';
import RelationshipDetailsPanel from './components/RelationshipDetailsPanel';
import AddRelationshipPanel from './components/AddRelationshipPanel';
import MarkdownPanel from './components/MarkdownPanel';
import JSONPanel from './components/JSONPanel';
import FilterPanel from './components/FilterPanel';
import { ReportPanel } from './components/ReportPanel';
import ChatPanel from './components/ChatPanel';
import SchemaToolbar from './components/SchemaToolbar';
import AnalysisToolbar from './components/AnalysisToolbar';
import LayoutToolbar from './components/LayoutToolbar';
import BulkEditToolbar from './components/BulkEditToolbar';
import ScamperToolbar from './components/ScamperToolbar';
import ScamperModal from './components/ScamperModal';
import ToolsBar from './components/ToolsBar';
import CommandBar from './components/CommandBar';
import MatrixPanel from './components/MatrixPanel';
import TablePanel from './components/TablePanel';
import RightPanelContainer from './components/RightPanelContainer';
import { generateUUID, generateMarkdownFromGraph, computeContentHash, isInIframe } from './utils';
import { GoogleGenAI, Type } from '@google/genai';

// Explicitly define coordinate type to fix type inference issues
type Coords = { x: number; y: number };

// --- Storage Keys ---
const MODELS_INDEX_KEY = 'tapestry_models_index';
const LAST_OPENED_MODEL_ID_KEY = 'tapestry_last_opened_model_id';
const MODEL_DATA_PREFIX = 'tapestry_model_data_';

// --- Shared Pattern Data ---
// Colors: Red=Harmful, Green=Useful, Blue=Action, Teal=Trend, Orange=Emotion, Grey=Context, Black=Organisation, Yellow=Idea, Purple=Topic, Pink=Question
export const TAPESTRY_PATTERNS = [
    {
        name: "The Weave",
        desc: "When shifting trends intersect with human emotion, the fabric of culture is woven.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1f2937" rx="4" />
                <path d="M8 4V28" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" />
                <path d="M16 4V28" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" />
                <path d="M24 4V28" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" />
                <path d="M4 8H28" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.8" />
                <path d="M4 16H28" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.8" />
                <path d="M4 24H28" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.8" />
            </svg>
        )
    },
    {
        name: "The Mesh",
        desc: "Action and inquiry must cross paths within a shared context to create meaningful progress.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1f2937" rx="4" />
                <path d="M4 4L28 28" stroke="#3b82f6" strokeWidth="2" />
                <path d="M28 4L4 28" stroke="#ec4899" strokeWidth="2" />
                <path d="M16 2V30" stroke="#6b7280" strokeWidth="2" />
                <path d="M2 16H30" stroke="#6b7280" strokeWidth="2" />
                <rect x="10" y="10" width="12" height="12" stroke="#eab308" strokeWidth="2" fillOpacity="0" />
            </svg>
        )
    },
    {
        name: "The Loop",
        desc: "A bright idea can loop around a harmful problem to reveal a new trend.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1f2937" rx="4" />
                <path d="M6 6C6 6 10 16 16 16C22 16 26 6 26 6" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                <path d="M6 26C6 26 10 16 16 16C22 16 26 26 26 26" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
                <circle cx="16" cy="16" r="4" fill="#14b8a6" />
            </svg>
        )
    },
    {
        name: "The Stitch",
        desc: "Useful innovations are often loose threads that need the structure of context to hold together.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1f2937" rx="4" />
                <path d="M6 10H26" stroke="#22c55e" strokeWidth="4" strokeDasharray="4 4" />
                <path d="M6 22H26" stroke="#22c55e" strokeWidth="4" strokeDasharray="4 4" />
                <path d="M10 4V28" stroke="#6b7280" strokeWidth="2" />
                <path d="M22 4V28" stroke="#6b7280" strokeWidth="2" />
            </svg>
        )
    },
    {
        name: "The Framework",
        desc: "When harmful challenges intersect, a framework of solid action is required to contain them.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1f2937" rx="4" />
                <rect x="6" y="6" width="20" height="20" stroke="#3b82f6" strokeWidth="2" />
                <path d="M16 2V30" stroke="#ef4444" strokeWidth="4" />
                <path d="M2 16H30" stroke="#ef4444" strokeWidth="4" />
                <rect x="14" y="14" width="4" height="4" fill="#ffffff" />
            </svg>
        )
    },
    {
        name: "The Current",
        desc: "Knowledge flows like a river, but it is the questioning current that gives it shape.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1f2937" rx="4" />
                <path d="M8 8Q12 12 16 8T24 8" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
                <path d="M8 16Q12 20 16 16T24 16" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" />
                <path d="M8 24Q12 28 16 24T24 24" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
            </svg>
        )
    },
    {
        name: "The Pivot",
        desc: "An organisation that embraces a single bright idea can radiate usefulness in all directions.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1f2937" rx="4" />
                <line x1="10" y1="4" x2="10" y2="28" stroke="black" strokeWidth="2" />
                <line x1="22" y1="4" x2="22" y2="28" stroke="black" strokeWidth="2" />
                <line x1="4" y1="10" x2="28" y2="10" stroke="black" strokeWidth="2" />
                <line x1="4" y1="22" x2="28" y2="22" stroke="black" strokeWidth="2" />
                <path d="M16 16L16 4 M16 16L28 16 M16 16L16 28 M16 16L4 16" stroke="#22c55e" strokeWidth="2" />
                <circle cx="16" cy="16" r="4" fill="#eab308" />
            </svg>
        )
    },
    {
        name: "The Filter",
        desc: "Context acts as a filter, refining chaotic trends into clear, direct action.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1f2937" rx="4" />
                <path d="M0 10 Q16 0 32 10" stroke="#14b8a6" strokeWidth="3" fill="none" />
                <rect x="8" y="4" width="4" height="24" fill="#6b7280" />
                <rect x="20" y="4" width="4" height="24" fill="#6b7280" />
                <path d="M16 20 V30" stroke="#3b82f6" strokeWidth="4" markerEnd="url(#arrow)" />
            </svg>
        )
    },
    {
        name: "The Resolution",
        desc: "Even harmful conflict and raw emotion can be braided together to form a useful resolution.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1f2937" rx="4" />
                <path d="M8 4 C8 4 12 12 4 12" stroke="#ef4444" strokeWidth="2" />
                <path d="M24 4 C24 4 20 12 28 12" stroke="#f97316" strokeWidth="2" />
                <path d="M10 16 C10 16 16 24 22 16 C22 16 16 8 10 16" stroke="#22c55e" strokeWidth="3" />
                <path d="M12 26 L20 26" stroke="#22c55e" strokeWidth="3" />
            </svg>
        )
    },
    {
        name: "The Strategy",
        desc: "The strongest organisations build a roof of action supported by the constant thread of questioning.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1f2937" rx="4" />
                <rect x="4" y="8" width="4" height="20" fill="black" />
                <rect x="24" y="8" width="4" height="20" fill="black" />
                <rect x="2" y="4" width="28" height="4" fill="#3b82f6" />
                <line x1="12" y1="8" x2="12" y2="24" stroke="#ec4899" strokeWidth="2" strokeDasharray="2 2" />
                <line x1="20" y1="8" x2="20" y2="24" stroke="#ec4899" strokeWidth="2" strokeDasharray="2 2" />
            </svg>
        )
    },
    {
        name: "The Insight",
        desc: "True insight strikes when a powerful idea pierces through the center of established knowledge.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1f2937" rx="4" />
                <rect x="4" y="4" width="24" height="24" rx="12" fill="#a855f7" fillOpacity="0.3" />
                <circle cx="16" cy="16" r="8" stroke="#6b7280" strokeWidth="2" />
                <path d="M22 4 L14 16 L18 16 L10 28" stroke="#eab308" strokeWidth="2" fill="none" />
            </svg>
        )
    },
    {
        name: "The Compassion",
        desc: "When a harmful trend emerges, it is human emotion that encircles it to provide healing.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#14b8a6" fillOpacity="0.2" rx="4" />
                <path d="M10 10 L22 22 M22 10 L10 22" stroke="#ef4444" strokeWidth="3" />
                <circle cx="16" cy="16" r="10" stroke="#f97316" strokeWidth="3" fill="none" />
            </svg>
        )
    },
    {
        name: "The Brocade",
        desc: "Elevate a standard context by surface-weaving a pattern of bright ideas, adding value without disrupting the underlying structure.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#6b7280" rx="4" />
                <path d="M4 8H12 M16 8H24 M8 16H16 M20 16H28 M4 24H12 M16 24H24" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
            </svg>
        )
    },
    {
        name: "The Twill",
        desc: "Establish a rhythm of overlapping actions that advances diagonally, creating a durable structure capable of withstanding stress.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1f2937" rx="4" />
                <path d="M0 24 L8 32 M0 12 L20 32 M0 0 L32 32 M12 0 L32 20 M24 0 L32 8" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
            </svg>
        )
    },
    {
        name: "The Darnining",
        desc: "Identify harmful holes in the narrative and systematically interlace useful solutions to restore integrity to the whole.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1f2937" rx="4" />
                <circle cx="16" cy="16" r="12" stroke="#ef4444" strokeWidth="3" fill="none" />
                <path d="M8 12H24 M8 16H24 M8 20H24" stroke="#22c55e" strokeWidth="2" />
                <path d="M12 8V24 M16 8V24 M20 8V24" stroke="#a855f7" strokeWidth="2" opacity="0.7" />
            </svg>
        )
    },
    {
        name: "The Jacquard",
        desc: "Manage intricate relationships where every pixel of emotion, organisation, and idea is individually controlled to form a grand design.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1f2937" rx="4" />
                <rect x="4" y="4" width="6" height="6" fill="#111827" />
                <rect x="12" y="4" width="6" height="6" fill="#f97316" />
                <rect x="20" y="4" width="6" height="6" fill="#eab308" />
                <rect x="4" y="12" width="6" height="6" fill="#f97316" />
                <rect x="12" y="12" width="6" height="6" fill="#eab308" />
                <rect x="20" y="12" width="6" height="6" fill="#111827" />
                <rect x="4" y="20" width="6" height="6" fill="#eab308" />
                <rect x="12" y="20" width="6" height="6" fill="#111827" />
                <rect x="20" y="20" width="6" height="6" fill="#f97316" />
            </svg>
        )
    },
    {
        name: "The Selvage",
        desc: "Reinforce the edges of a topic with specific questions to prevent the scope from unraveling into chaos.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#a855f7" fillOpacity="0.2" rx="4" />
                <path d="M6 4V28" stroke="#ec4899" strokeWidth="3" />
                <path d="M26 4V28" stroke="#ec4899" strokeWidth="3" />
                <path d="M10 16H22" stroke="#a855f7" strokeWidth="2" />
            </svg>
        )
    },
    {
        name: "The Kilim",
        desc: "Allow distinct organisations to butt against one another in a slit-weave, maintaining separate identities while forming a continuous surface.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1f2937" rx="4" />
                <path d="M16 4 L4 16 L16 28" fill="#111827" />
                <path d="M16 4 L28 16 L16 28" fill="#3b82f6" />
                <path d="M16 4 V28" stroke="#6b7280" strokeWidth="1" />
            </svg>
        )
    }
];

const TAGLINES = [
    "Visual Knowledge Weaver",
    "Complex Problem Solver",
    "Emerging Trend Explorer",
    "Creative Solution Mapper",
    "Strategic Insight Generator",
    "Dynamic Connection Builder",
    "Structured Chaos Organizer",
    "Future Scenario Planner"
];


// Helper Hook for detecting clicks outside an element
const useClickOutside = <T extends HTMLElement,>(ref: React.RefObject<T>, handler: (event: MouseEvent | TouchEvent) => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

// --- Helper Components defined in App.tsx to reduce file count ---

// Tapestry Icon Animator for Landing Screen
const TapestryAnimator: React.FC = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % TAPESTRY_PATTERNS.length);
        }, 4000); // Change every 4 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-16 h-16 flex-shrink-0">
            {TAPESTRY_PATTERNS.map((pattern, i) => (
                <div 
                    key={i} 
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === index ? 'opacity-100' : 'opacity-0'}`}
                >
                    {pattern.svg}
                </div>
            ))}
        </div>
    );
};

// Text Animator for Landing Screen
const TextAnimator: React.FC = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % TAGLINES.length);
        }, 4000); // Sync with tapestry animator
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative h-8 w-full flex justify-center overflow-hidden">
            {TAGLINES.map((text, i) => (
                <span 
                    key={i} 
                    className={`absolute transition-opacity duration-1000 ease-in-out ${i === index ? 'opacity-100' : 'opacity-0'}`}
                >
                    {text}
                </span>
            ))}
        </div>
    );
};


// Conflict Resolution Modal
interface ConflictResolutionModalProps {
  localMetadata: ModelMetadata;
  diskMetadata: ModelMetadata;
  localData: { elements: Element[], relationships: Relationship[] };
  diskData: { elements: Element[], relationships: Relationship[] };
  onChooseLocal: () => void;
  onChooseDisk: () => void;
  onCancel: () => void;
}

const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({ localMetadata, diskMetadata, localData, diskData, onChooseLocal, onChooseDisk, onCancel }) => {
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg w-full max-w-3xl shadow-2xl border border-gray-600 text-white overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-yellow-400 mb-2">Version Conflict Detected</h2>
                    <p className="text-gray-300">
                        A version of this model (<b>{diskMetadata.name}</b>) already exists in your browser's local storage, 
                        and the content appears to be different.
                    </p>
                    <p className="text-gray-400 text-sm mt-2">Which version would you like to open?</p>
                </div>
                
                <div className="grid grid-cols-2 gap-0 divide-x divide-gray-700">
                    {/* Local Version */}
                    <div className="p-6 hover:bg-gray-750 transition">
                        <h3 className="text-lg font-bold text-blue-400 mb-4">Local Recovery (Autosave)</h3>
                        <div className="space-y-3 text-sm text-gray-300">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Last Modified:</span>
                                <span>{formatDate(localMetadata.updatedAt)}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-gray-500">Elements:</span>
                                <span>{localData.elements.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Relationships:</span>
                                <span>{localData.relationships.length}</span>
                            </div>
                        </div>
                         <button 
                            onClick={onChooseLocal}
                            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition duration-150"
                        >
                            Open Local Version
                        </button>
                    </div>

                    {/* Disk Version */}
                    <div className="p-6 hover:bg-gray-750 transition">
                         <h3 className="text-lg font-bold text-green-400 mb-4">Disk File (Selected)</h3>
                         <div className="space-y-3 text-sm text-gray-300">
                             <div className="flex justify-between">
                                <span className="text-gray-500">Last Modified:</span>
                                <span>{formatDate(diskMetadata.updatedAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Elements:</span>
                                <span>{diskData.elements.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Relationships:</span>
                                <span>{diskData.relationships.length}</span>
                            </div>
                         </div>
                         <button 
                            onClick={onChooseDisk}
                            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-md transition duration-150"
                        >
                            Open Disk File
                        </button>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-700 bg-gray-900 bg-opacity-50 text-center">
                    <button onClick={onCancel} className="text-gray-400 hover:text-white text-sm hover:underline">Cancel Operation</button>
                </div>
            </div>
        </div>
    );
};

// Node ContextMenu Component
interface ContextMenuProps {
  x: number;
  y: number;
  onAddRelationship: () => void;
  onDeleteElement: () => void;
  onClose: () => void;
}
const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onAddRelationship, onDeleteElement, onClose }) => {
  const menuRef = React.useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, onClose);

  return (
    <div
      ref={menuRef}
      className="absolute bg-gray-800 border border-gray-600 rounded-md shadow-lg py-2 z-50 text-white"
      style={{ top: y, left: x }}
    >
      <button onClick={onAddRelationship} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700">
        Add Relationship
      </button>
      <button onClick={onDeleteElement} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700">
        Delete Element
      </button>
    </div>
  );
};


// Canvas ContextMenu Component
interface CanvasContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onZoomToFit: () => void;
  onAutoLayout: () => void;
  onToggleReport: () => void;
  onToggleMarkdown: () => void;
  onToggleJSON: () => void;
  onToggleFilter: () => void;
  onToggleMatrix: () => void;
  onToggleTable: () => void;
  onOpenModel: () => void;
  onSaveModel: () => void;
  onCreateModel: () => void;
  isReportOpen: boolean;
  isMarkdownOpen: boolean;
  isJSONOpen: boolean;
  isFilterOpen: boolean;
  isMatrixOpen: boolean;
  isTableOpen: boolean;
}
const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({ x, y, onClose, onZoomToFit, onAutoLayout, onToggleReport, onToggleMarkdown, onToggleJSON, onToggleFilter, onToggleMatrix, onToggleTable, onOpenModel, onSaveModel, onCreateModel, isReportOpen, isMarkdownOpen, isJSONOpen, isFilterOpen, isMatrixOpen, isTableOpen }) => {
  const menuRef = React.useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, onClose);

  // Combine handlers with onClose to close the menu after an action
  const createHandler = (handler: () => void) => () => {
    handler();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute bg-gray-800 border border-gray-600 rounded-md shadow-lg py-2 z-50 text-white text-sm"
      style={{ top: y, left: x }}
    >
      <button onClick={createHandler(onZoomToFit)} className="block w-full text-left px-4 py-2 hover:bg-gray-700">Zoom to Fit</button>
      <button onClick={createHandler(onAutoLayout)} className="block w-full text-left px-4 py-2 hover:bg-gray-700">Auto-Layout</button>
      <div className="border-t border-gray-600 my-1"></div>
      <button onClick={createHandler(onToggleReport)} className="block w-full text-left px-4 py-2 hover:bg-gray-700">{isReportOpen ? 'Hide' : 'Show'} Report View</button>
      <button onClick={createHandler(onToggleTable)} className="block w-full text-left px-4 py-2 hover:bg-gray-700">{isTableOpen ? 'Hide' : 'Show'} Table View</button>
      <button onClick={createHandler(onToggleMatrix)} className="block w-full text-left px-4 py-2 hover:bg-gray-700">{isMatrixOpen ? 'Hide' : 'Show'} Matrix View</button>
      <button onClick={createHandler(onToggleMarkdown)} className="block w-full text-left px-4 py-2 hover:bg-gray-700">{isMarkdownOpen ? 'Hide' : 'Show'} Markdown View</button>
      <button onClick={createHandler(onToggleJSON)} className="block w-full text-left px-4 py-2 hover:bg-gray-700">{isJSONOpen ? 'Hide' : 'Show'} JSON View</button>
      <button onClick={createHandler(onToggleFilter)} className="block w-full text-left px-4 py-2 hover:bg-gray-700">{isFilterOpen ? 'Hide' : 'Show'} Filter</button>
      <div className="border-t border-gray-600 my-1"></div>
      <button onClick={createHandler(onOpenModel)} className="block w-full text-left px-4 py-2 hover:bg-gray-700">Open...</button>
      <button onClick={createHandler(onSaveModel)} className="block w-full text-left px-4 py-2 hover:bg-gray-700">Save</button>
      <button onClick={createHandler(onCreateModel)} className="block w-full text-left px-4 py-2 hover:bg-gray-700">New Model...</button>
    </div>
  );
};


// SettingsModal Component
interface SettingsModalProps {
  initialSchemes: ColorScheme[];
  initialActiveSchemeId: string | null;
  onSave: (schemes: ColorScheme[], activeSchemeId: string | null) => void;
  onClose: () => void;
}
const SettingsModal: React.FC<SettingsModalProps> = ({ initialSchemes, initialActiveSchemeId, onSave, onClose }) => {
  const [schemes, setSchemes] = useState<ColorScheme[]>(initialSchemes);
  const [activeSchemeId, setActiveSchemeId] = useState<string | null>(initialActiveSchemeId);
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelDesc, setNewLabelDesc] = useState('');
  const [activeTab, setActiveTab] = useState<'tags' | 'relationships'>('tags');

  const selectedScheme = useMemo(() => schemes.find(s => s.id === activeSchemeId), [schemes, activeSchemeId]);

  const handleCreateScheme = () => {
    const name = prompt('Enter new schema name:');
    if (name) {
      const newScheme: ColorScheme = { id: generateUUID(), name, tagColors: {}, relationshipDefinitions: [] };
      setSchemes(prev => [...prev, newScheme]);
      setActiveSchemeId(newScheme.id);
    }
  };
  
  const handleAddTag = () => {
    const trimmedNewTag = newTagName.trim();
    if (trimmedNewTag && selectedScheme) {
      const existingTags = Object.keys(selectedScheme.tagColors);
      if (existingTags.some(t => t.toLowerCase() === trimmedNewTag.toLowerCase())) {
        alert(`Tag "${trimmedNewTag}" already exists in this scheme.`);
        return;
      }
      handleTagColorChange(trimmedNewTag, '#ffffff');
      setNewTagName('');
    }
  };

  const handleTagColorChange = (tag: string, color: string) => {
    if (!activeSchemeId) return;
    setSchemes(prev => prev.map(s => 
      s.id === activeSchemeId 
        ? { ...s, tagColors: { ...s.tagColors, [tag]: color } } 
        : s
    ));
  };
  
  const handleTagDelete = (tag: string) => {
     if (!activeSchemeId) return;
     setSchemes(prev => prev.map(s => {
        if (s.id !== activeSchemeId) return s;
        const newTagColors = {...s.tagColors};
        delete newTagColors[tag];
        return { ...s, tagColors: newTagColors };
     }));
  };

  const handleStartEditingTag = (tag: string) => {
    setEditingTag(tag);
    setEditingTagName(tag);
  };

  const handleCancelEditing = () => {
    setEditingTag(null);
    setEditingTagName('');
  };

  const handleTagRename = () => {
    if (!activeSchemeId || !editingTag || !editingTagName.trim()) {
      handleCancelEditing();
      return;
    }

    const newTagName = editingTagName.trim();
    if (newTagName === editingTag) { // No change
      handleCancelEditing();
      return;
    }

    setSchemes(prev => prev.map(s => {
      if (s.id !== activeSchemeId) return s;

      const existingTags = Object.keys(s.tagColors).filter(t => t !== editingTag);
      if (existingTags.some(t => t.toLowerCase() === newTagName.toLowerCase())) {
        alert(`Tag "${newTagName}" already exists in this scheme.`);
        return s; // Abort change
      }

      const newTagColors = { ...s.tagColors };
      const color = newTagColors[editingTag];
      delete newTagColors[editingTag];
      newTagColors[newTagName] = color;
      
      return { ...s, tagColors: newTagColors };
    }));

    handleCancelEditing();
  };
  
  const handleAddLabel = () => {
      const trimmedLabel = newLabelName.trim();
      if (trimmedLabel && activeSchemeId && selectedScheme) {
          const existing = selectedScheme.relationshipDefinitions || [];
          if (existing.some(l => l.label.toLowerCase() === trimmedLabel.toLowerCase())) {
              alert(`Label "${trimmedLabel}" already exists.`);
              return;
          }
          
          const newDef: RelationshipDefinition = { label: trimmedLabel, description: newLabelDesc.trim() };
          
          setSchemes(prev => prev.map(s => 
             s.id === activeSchemeId
             ? { ...s, relationshipDefinitions: [...(s.relationshipDefinitions || []), newDef] }
             : s
          ));
          setNewLabelName('');
          setNewLabelDesc('');
      }
  };

  const handleLabelDelete = (label: string) => {
      if (!activeSchemeId) return;
      setSchemes(prev => prev.map(s => {
         if (s.id !== activeSchemeId) return s;
         const newDefs = (s.relationshipDefinitions || []).filter(l => l.label !== label);
         return { 
             ...s, 
             relationshipDefinitions: newDefs,
             // If the deleted label was the default, unset it
             defaultRelationshipLabel: s.defaultRelationshipLabel === label ? undefined : s.defaultRelationshipLabel
         };
      }));
  };

  const modalRef = React.useRef<HTMLDivElement>(null);
  useClickOutside(modalRef, onClose);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div ref={modalRef} className="bg-gray-800 rounded-lg p-8 w-full max-w-2xl shadow-xl border border-gray-600 flex flex-col max-h-[85vh]">
        <h2 className="text-2xl font-bold mb-6 text-white flex-shrink-0">Schemas</h2>
        
        <div className="flex gap-4 items-center mb-6 flex-shrink-0">
            <select
              value={activeSchemeId || ''}
              onChange={(e) => setActiveSchemeId(e.target.value)}
              className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {schemes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={handleCreateScheme} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">New Schema</button>
        </div>

        {selectedScheme && (
            <div className="flex flex-col flex-grow min-h-0">
                <div className="flex space-x-4 border-b border-gray-700 mb-4 flex-shrink-0">
                    <button
                        className={`py-2 px-4 font-semibold text-sm transition-colors duration-200 ${activeTab === 'tags' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setActiveTab('tags')}
                    >
                        Element Tags
                    </button>
                    <button
                        className={`py-2 px-4 font-semibold text-sm transition-colors duration-200 ${activeTab === 'relationships' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setActiveTab('relationships')}
                    >
                        Relationship Types
                    </button>
                </div>

              {activeTab === 'tags' && (
                  <>
                    <div className="flex-1 overflow-y-auto pr-2 mb-4">
                        <div className="space-y-2">
                            {Object.entries(selectedScheme.tagColors).map(([tag, color]) => (
                            <div key={tag} className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
                                {editingTag === tag ? (
                                <input 
                                    type="text"
                                    value={editingTagName}
                                    onChange={(e) => setEditingTagName(e.target.value)}
                                    onBlur={handleTagRename}
                                    onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleTagRename();
                                    if (e.key === 'Escape') handleCancelEditing();
                                    }}
                                    autoFocus
                                    className="bg-gray-600 border border-gray-500 rounded-md px-2 py-1 text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                ) : (
                                <span 
                                    onClick={() => handleStartEditingTag(tag)}
                                    className="text-gray-300 font-mono cursor-pointer hover:text-white"
                                >
                                    {tag}
                                </span>
                                )}
                                <div className="flex items-center gap-2">
                                    <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => handleTagColorChange(tag, e.target.value)}
                                    className="w-12 h-8 p-0 border-none rounded bg-transparent cursor-pointer"
                                    />
                                    <button onClick={() => handleTagDelete(tag)} className="text-red-400 hover:text-red-300 p-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 mt-auto">
                        <input 
                            type="text" 
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                            placeholder="New tag name..."
                            className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={handleAddTag} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">Add Tag</button>
                    </div>
                  </>
              )}

              {activeTab === 'relationships' && (
                  <>
                    <div className="flex-1 overflow-y-auto pr-2 mb-4">
                        <div className="space-y-2">
                            {(selectedScheme.relationshipDefinitions || []).map(def => (
                                <div key={def.label} className="bg-gray-700 p-2 rounded-md flex items-start justify-between group">
                                    <div className="flex flex-col">
                                        <span className="text-gray-200 font-semibold text-sm">{def.label}</span>
                                        <span className="text-gray-400 text-xs italic">{def.description || 'No description'}</span>
                                    </div>
                                    <button onClick={() => handleLabelDelete(def.label)} className="text-red-400 hover:text-red-300 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-auto space-y-2">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={newLabelName}
                                onChange={(e) => setNewLabelName(e.target.value)}
                                placeholder="Label (e.g. causes)"
                                className="w-1/3 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <input 
                                type="text" 
                                value={newLabelDesc}
                                onChange={(e) => setNewLabelDesc(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                                placeholder="Description (optional)"
                                className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                         <button onClick={handleAddLabel} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150 text-sm">Add Relationship Type</button>
                    </div>
                  </>
              )}

            </div>
        )}

        <div className="mt-8 flex justify-end space-x-4 pt-4 border-t border-gray-700 flex-shrink-0">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">Cancel</button>
          <button onClick={() => onSave(schemes, activeSchemeId)} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">Save</button>
        </div>
      </div>
    </div>
  );
};


// CreateModelModal Component
interface CreateModelModalProps {
  onCreate: (name: string, description: string) => void;
  onClose?: () => void;
  isInitialSetup?: boolean;
}
const CreateModelModal: React.FC<CreateModelModalProps> = ({ onCreate, onClose, isInitialSetup = false }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim(), description.trim());
    }
  };

  const modalRef = React.useRef<HTMLDivElement>(null);
  useClickOutside(modalRef, () => {
    if (!isInitialSetup) onClose?.();
  });
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div ref={modalRef} className="bg-gray-800 rounded-lg p-8 w-full max-w-lg shadow-xl border border-gray-600 text-white">
        <h2 className="text-2xl font-bold mb-6">{isInitialSetup ? 'Welcome to Tapestry' : 'Create New Model'}</h2>
        {isInitialSetup && <p className="text-gray-400 mb-6">To get started, please give your new knowledge graph a name.</p>}

        <div className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Model Name (e.g., Project Phoenix)"
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mt-8 flex justify-end space-x-4">
          {!isInitialSetup && <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">Cancel</button>}
          <button onClick={handleCreate} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150" disabled={!name.trim()}>Create</button>
        </div>
      </div>
    </div>
  );
};

// OpenModelModal Component
interface OpenModelModalProps {
  models: ModelMetadata[];
  onLoad: (modelId: string) => void;
  onClose: () => void;
  onTriggerCreate: () => void;
}
const OpenModelModal: React.FC<OpenModelModalProps> = ({ models, onLoad, onClose, onTriggerCreate }) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  useClickOutside(modalRef, onClose);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div ref={modalRef} className="bg-gray-800 rounded-lg p-8 w-full max-w-2xl shadow-xl border border-gray-600 text-white">
        <h2 className="text-2xl font-bold mb-6">Open Model</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {models.length > 0 ? (
            models.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(model => (
              <div key={model.id} onClick={() => onLoad(model.id)} className="bg-gray-700 p-4 rounded-lg hover:bg-blue-900 hover:bg-opacity-50 border border-transparent hover:border-blue-500 cursor-pointer transition">
                <h3 className="font-bold text-lg">{model.name}</h3>
                <p className="text-sm text-gray-400">{model.description || 'No description'}</p>
                <p className="text-xs text-gray-500 mt-2">Last updated: {new Date(model.updatedAt).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center py-8">No models found. Create one to get started!</p>
          )}
        </div>
        <div className="mt-8 flex justify-between items-center">
          <button onClick={onTriggerCreate} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">Create New Model</button>
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">Close</button>
        </div>
      </div>
    </div>
  );
};


// --- New Helper Components for Help Menu ---

// HelpMenu Dropdown Component
interface HelpMenuProps {
  onClose: () => void;
  onAbout: () => void;
  onPatternGallery: () => void;
}
const HelpMenu: React.FC<HelpMenuProps> = ({ onClose, onAbout, onPatternGallery }) => {
  // Removed useClickOutside from here. Handled by parent wrapper ref.
  
  const handleAboutClick = () => {
    onAbout();
    onClose();
  };

  const handlePatternGalleryClick = () => {
    onPatternGallery();
    onClose();
  };
  
  return (
    <div
      className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-600 rounded-md shadow-lg py-1 z-50 text-white"
    >
      <button onClick={handlePatternGalleryClick} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700">
        Pattern Gallery
      </button>
      <button onClick={handleAboutClick} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700">
        About Tapestry
      </button>
    </div>
  );
};

// Pattern Gallery Modal Component
interface PatternGalleryModalProps {
  onClose: () => void;
}
const PatternGalleryModal: React.FC<PatternGalleryModalProps> = ({ onClose }) => {
    const modalRef = React.useRef<HTMLDivElement>(null);
    useClickOutside(modalRef, onClose);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div ref={modalRef} className="bg-gray-800 rounded-lg w-full max-w-4xl shadow-xl border border-gray-600 text-gray-300 max-h-[90vh] flex flex-col">
                <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white">Tapestry Pattern Gallery</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {TAPESTRY_PATTERNS.map((pattern, idx) => (
                            <div key={idx} className="bg-gray-700 bg-opacity-50 p-4 rounded-lg border border-gray-600 flex items-start space-x-4 hover:bg-opacity-70 transition">
                                <div className="flex-shrink-0 pt-1 w-8 h-8">
                                    {pattern.svg}
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-sm mb-1">{pattern.name}</h4>
                                    <p className="text-xs text-gray-300 italic leading-snug">{pattern.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// About Modal Component
interface AboutModalProps {
  onClose: () => void;
}
const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  useClickOutside(modalRef, onClose);
  
  const licenseText = `MIT License

Copyright (c) 2025 Mark Burnett,
https://www.linkedin.com/in/markburnett,
https://github.com/embernet/tapestry

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div ref={modalRef} className="bg-gray-800 rounded-lg w-full max-w-2xl shadow-xl border border-gray-600 text-gray-300 max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-700">
           <div className="flex items-center gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8c2-2 4-2 6 0s4 2 6 0" />
                <path d="M4 12c2-2 4-2 6 0s4 2 6 0" />
                <path d="M4 16c2-2 4-2 6 0s4 2 6 0" />
              </svg>
              <div>
                <h2 className="text-3xl font-bold text-white">Tapestry</h2>
                <p className="text-gray-400 text-sm">Visual Knowledge Weaver</p>
              </div>
           </div>
           <button onClick={onClose} className="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
           </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-8 space-y-8">
          <div className="prose prose-invert max-w-none">
            <p className="text-lg leading-relaxed">
              Tapestry is a tool for creating and exploring knowledge graphs. It helps you understand the relationships between ideas, people, organisations, and actions to find ways to improve situations and plan what to do next. It is a space for reflection, communication, and innovation.
            </p>
          </div>
          
          <div className="space-y-2 text-sm text-gray-400">
            <p>Created by Mark Burnett</p>
            <div className="flex gap-4">
                 <a href="https://linkedin.com/in/markburnett" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
                    LinkedIn
                 </a>
                 <a href="https://github.com/embernet/tapestry" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                    GitHub
                 </a>
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-700">
             <h3 className="text-lg font-semibold text-white mb-2">License</h3>
             <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono bg-gray-900 bg-opacity-50 p-4 rounded-md border border-gray-700">
              {licenseText}
             </pre>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main App Component ---

export default function App() {
  const [elements, setElements] = useState<Element[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [colorSchemes, setColorSchemes] = useState<ColorScheme[]>(DEFAULT_COLOR_SCHEMES);
  const [activeSchemeId, setActiveSchemeId] = useState<string | null>(DEFAULT_COLOR_SCHEMES[0]?.id || null);
  const [defaultTags, setDefaultTags] = useState<string[]>([]);
  
  // --- Layout Parameters State ---
  const [layoutParams, setLayoutParams] = useState({ linkDistance: 250, repulsion: -400 });
  const [jiggleTrigger, setJiggleTrigger] = useState(0);

  // --- Active Tool State ---
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // --- Bulk Edit State ---
  const [isBulkEditActive, setIsBulkEditActive] = useState(false);
  const [bulkTagsToAdd, setBulkTagsToAdd] = useState<string[]>([]);
  const [bulkTagsToRemove, setBulkTagsToRemove] = useState<string[]>([]);

  const toggleTool = (toolName: string) => {
      setActiveTool(prev => {
          // If closing the bulk tool, ensure mode is reset
          if (prev === 'bulk' && toolName !== 'bulk') {
              setIsBulkEditActive(false);
          }
          return prev === toolName ? null : toolName;
      });
  };

  // Reset bulk mode if tool is closed
  useEffect(() => {
      if (activeTool !== 'bulk') {
          setIsBulkEditActive(false);
      }
  }, [activeTool]);


  // --- State for Refs to allow synchronous access in batched AI actions ---
  const elementsRef = useRef<Element[]>([]);
  const relationshipsRef = useRef<Relationship[]>([]);

  // Keep refs in sync with state
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  useEffect(() => {
    relationshipsRef.current = relationships;
  }, [relationships]);

  // Reset default tags when scheme changes
  useEffect(() => {
      setDefaultTags([]);
  }, [activeSchemeId]);


  const [modelsIndex, setModelsIndex] = useState<ModelMetadata[]>([]);
  const [currentModelId, setCurrentModelId] = useState<string | null>(null);

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);
  
  // UI State
  const [focusMode, setFocusMode] = useState<'narrow' | 'wide' | 'zoom'>('narrow');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, elementId: string } | null>(null);
  const [canvasContextMenu, setCanvasContextMenu] = useState<{ x: number, y: number } | null>(null);

  const [panelState, setPanelState] = useState<PanelState>({
    view: 'details',
    sourceElementId: null,
    targetElementId: null,
    isNewTarget: false,
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCreateModelModalOpen, setIsCreateModelModalOpen] = useState(false);
  const [isOpenModelModalOpen, setIsOpenModelModalOpen] = useState(false);
  const [isMarkdownPanelOpen, setIsMarkdownPanelOpen] = useState(false);
  const [isJSONPanelOpen, setIsJSONPanelOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isReportPanelOpen, setIsReportPanelOpen] = useState(false);
  const [isMatrixPanelOpen, setIsMatrixPanelOpen] = useState(false);
  const [isTablePanelOpen, setIsTablePanelOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isPatternGalleryModalOpen, setIsPatternGalleryModalOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<{ localMetadata: ModelMetadata, diskMetadata: ModelMetadata, localData: any, diskData: any } | null>(null);
  
  // SCAMPER State
  const [isScamperModalOpen, setIsScamperModalOpen] = useState(false);
  const [isScamperLoading, setIsScamperLoading] = useState(false);
  const [currentScamperOperator, setCurrentScamperOperator] = useState<{ name: string, letter: string } | null>(null);
  const [scamperSuggestions, setScamperSuggestions] = useState<ScamperSuggestion[]>([]);
  
  const helpMenuRef = useRef<HTMLDivElement>(null);
  useClickOutside(helpMenuRef, () => setIsHelpMenuOpen(false));

  const [tagFilter, setTagFilter] = useState<{ included: Set<string>, excluded: Set<string> }>({
    included: new Set(),
    excluded: new Set(),
  });
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    createdAfter: '',
    createdBefore: '',
    updatedAfter: '',
    updatedBefore: '',
  });

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isPhysicsModeActive, setIsPhysicsModeActive] = useState(false);
  const [originalElements, setOriginalElements] = useState<Element[] | null>(null);
  const graphCanvasRef = useRef<GraphCanvasRef>(null);

  const importFileRef = useRef<HTMLInputElement>(null);
  const currentFileHandleRef = useRef<any>(null); // Ref to store FileSystemFileHandle

  const currentModelName = useMemo(() => modelsIndex.find(m => m.id === currentModelId)?.name || 'Loading...', [modelsIndex, currentModelId]);

  // --- Filtering Logic ---
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    elements.forEach(element => {
      element.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [elements]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    elements.forEach(element => {
      element.tags.forEach(tag => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });
    return counts;
  }, [elements]);

  useEffect(() => {
    setTagFilter(prevFilter => {
        const allTagsSet = new Set(allTags);
        const newIncluded = new Set<string>();
        for (const tag of allTags) {
            const wasPreviouslyIncluded = prevFilter.included.has(tag);
            const wasPreviouslyExcluded = prevFilter.excluded.has(tag);
            if (wasPreviouslyIncluded) {
                newIncluded.add(tag);
            } else if (!wasPreviouslyExcluded) {
                newIncluded.add(tag);
            }
        }
        const newExcluded = new Set<string>();
        for (const tag of prevFilter.excluded) {
            if (allTagsSet.has(tag)) {
                newExcluded.add(tag);
            }
        }
        return { included: newIncluded, excluded: newExcluded };
    });
  }, [allTags]);


  const filteredElements = useMemo(() => {
    const { included, excluded } = tagFilter;

    const matchesDate = (element: Element) => {
      const createdDate = element.createdAt.substring(0, 10);
      const updatedDate = element.updatedAt.substring(0, 10);

      if (dateFilter.createdAfter && createdDate < dateFilter.createdAfter) return false;
      if (dateFilter.createdBefore && createdDate > dateFilter.createdBefore) return false;
      if (dateFilter.updatedAfter && updatedDate < dateFilter.updatedAfter) return false;
      if (dateFilter.updatedBefore && updatedDate > dateFilter.updatedBefore) return false;
      return true;
    };

    return elements.filter(element => {
      if (!matchesDate(element)) return false;
      if (excluded.size === 0 && included.size === allTags.length) return true;
      if (element.tags.some(tag => excluded.has(tag))) return false;
      if (element.tags.length === 0) return true; 
      return element.tags.some(tag => included.has(tag));
    });
  }, [elements, tagFilter, allTags, dateFilter]);

  const filteredRelationships = useMemo(() => {
    const { included, excluded } = tagFilter;
    
    const visibleElementIds = new Set(filteredElements.map(f => f.id));
    return relationships.filter(rel =>
      visibleElementIds.has(rel.source as string) && visibleElementIds.has(rel.target as string)
    );
  }, [relationships, filteredElements, tagFilter, allTags]);


  // --- Model Management ---

  const migrateLegacySchemes = useCallback((loadedSchemes: ColorScheme[]): ColorScheme[] => {
      return loadedSchemes.map(s => {
          // If the scheme has the old string[] array but no definitions, convert it.
          if (s.relationshipLabels && !s.relationshipDefinitions) {
              // Check if this looks like a default scheme we know about
              const defaultScheme = DEFAULT_COLOR_SCHEMES.find(d => d.id === s.id);
              if (defaultScheme && defaultScheme.relationshipDefinitions) {
                  // If it's a default scheme, prefer the robust definitions from constants
                  const defaultLabels = new Set(defaultScheme.relationshipDefinitions.map(d => d.label));
                  const extraLabels = s.relationshipLabels.filter(l => !defaultLabels.has(l));
                  
                  return {
                      ...s,
                      relationshipDefinitions: [
                          ...defaultScheme.relationshipDefinitions,
                          ...extraLabels.map(l => ({ label: l, description: '' }))
                      ],
                      relationshipLabels: undefined // Clear legacy
                  };
              } else {
                  // It's a purely custom scheme, just map strings to objects
                  return {
                      ...s,
                      relationshipDefinitions: s.relationshipLabels.map(l => ({ label: l, description: '' })),
                      relationshipLabels: undefined
                  };
              }
          }
          return s;
      });
  }, []);

  const loadModelData = useCallback((data: any, modelId: string, modelMetadata?: ModelMetadata) => {
      setElements(data.elements || []);
      setRelationships(data.relationships || []);
      
      // Load schemas and migrate if necessary
      let loadedSchemes = data.colorSchemes || DEFAULT_COLOR_SCHEMES;
      loadedSchemes = migrateLegacySchemes(loadedSchemes);

      setColorSchemes(loadedSchemes);
      setActiveSchemeId(data.activeSchemeId || DEFAULT_COLOR_SCHEMES[0]?.id || null);
      
      setCurrentModelId(modelId);
      localStorage.setItem(LAST_OPENED_MODEL_ID_KEY, modelId);
      setIsOpenModelModalOpen(false);
      setTagFilter({ included: new Set(), excluded: new Set() });
      setDateFilter({ createdAfter: '', createdBefore: '', updatedAfter: '', updatedBefore: '' });
      
      // Clear file handle when loading from local storage to avoid accidental overwrites of wrong file
      // The handle is only set during explicit file open or save operations
      if (modelMetadata && !modelMetadata.filename) {
           currentFileHandleRef.current = null;
      }

      if (modelMetadata) {
        // Update index with new metadata (e.g. update filename/timestamp/hash)
         setModelsIndex(prevIndex => {
            const exists = prevIndex.find(m => m.id === modelId);
            if (exists) {
                return prevIndex.map(m => m.id === modelId ? { ...m, ...modelMetadata } : m);
            } else {
                return [...prevIndex, modelMetadata];
            }
         });
      }
  }, [migrateLegacySchemes]);

  const handleLoadModel = useCallback((modelId: string) => {
    const modelDataString = localStorage.getItem(`${MODEL_DATA_PREFIX}${modelId}`);
    if (modelDataString) {
      const data = JSON.parse(modelDataString);
      // Clear handle since we are loading from local storage
      currentFileHandleRef.current = null;
      loadModelData(data, modelId);
    }
  }, [loadModelData]);

  useEffect(() => {
    if (!isInitialLoad) return;

    try {
      const indexStr = localStorage.getItem(MODELS_INDEX_KEY);
      const index = indexStr ? JSON.parse(indexStr) : [];
      setModelsIndex(index);
      
    } catch (error) {
        console.error("Failed to load models index:", error);
        setModelsIndex([]);
    }
    
    setIsInitialLoad(false);
  }, [isInitialLoad]);

  useEffect(() => {
    if (!isInitialLoad) {
      localStorage.setItem(MODELS_INDEX_KEY, JSON.stringify(modelsIndex));
    }
  }, [modelsIndex, isInitialLoad]);


  useEffect(() => {
    if (currentModelId && !isInitialLoad) {
      const modelData = { elements, relationships, colorSchemes, activeSchemeId };
      const currentContentHash = computeContentHash(modelData);
      
      const currentMeta = modelsIndex.find(m => m.id === currentModelId);
      
      // Only autosave if the content hash has changed from what is stored in metadata
      // If currentMeta is missing or contentHash differs, proceed to save
      if (!currentMeta || currentMeta.contentHash !== currentContentHash) {
          localStorage.setItem(`${MODEL_DATA_PREFIX}${currentModelId}`, JSON.stringify(modelData));

          setModelsIndex(prevIndex => {
            const now = new Date().toISOString();
            return prevIndex.map(m =>
              m.id === currentModelId ? { ...m, updatedAt: now, contentHash: currentContentHash } : m
            );
          });
      }
    }
  }, [elements, relationships, colorSchemes, activeSchemeId, currentModelId, isInitialLoad, modelsIndex]);

  const handleCreateModel = useCallback((name: string, description: string) => {
    const now = new Date().toISOString();
    
    const newModelData = {
      elements: [],
      relationships: [],
      colorSchemes: DEFAULT_COLOR_SCHEMES,
      activeSchemeId: DEFAULT_COLOR_SCHEMES[0]?.id || null,
    };
    const initialHash = computeContentHash(newModelData);

    const newModel: ModelMetadata = {
      id: generateUUID(),
      name,
      description,
      createdAt: now,
      updatedAt: now,
      filename: `${name.replace(/ /g, '_')}.json`,
      contentHash: initialHash,
      // lastDiskHash left undefined as it's not saved to disk yet
    };

    setModelsIndex(prevIndex => [...prevIndex, newModel]);

    localStorage.setItem(`${MODEL_DATA_PREFIX}${newModel.id}`, JSON.stringify(newModelData));
    
    // Clear any existing file handle
    currentFileHandleRef.current = null;

    handleLoadModel(newModel.id);
    setIsCreateModelModalOpen(false);
  }, [handleLoadModel]);
  

  const handleAddElement = useCallback((coords: { x: number; y: number }) => {
    const now = new Date().toISOString();
    const newElement: Element = {
      id: generateUUID(),
      name: 'New Element',
      notes: '',
      tags: [...defaultTags],
      createdAt: now,
      updatedAt: now,
      x: coords.x,
      y: coords.y,
      fx: coords.x,
      fy: coords.y,
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElementId(newElement.id);
    setSelectedRelationshipId(null);
    setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false });
  }, [defaultTags]);
  
  const handleAddElementFromName = useCallback((name: string) => {
      // Add element without explicit coordinates (e.g. from table view)
      // Default to center or random position
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const randomOffset = () => (Math.random() - 0.5) * 100;
      
      const now = new Date().toISOString();
      const newElement: Element = {
        id: generateUUID(),
        name: name,
        notes: '',
        tags: [...defaultTags],
        createdAt: now,
        updatedAt: now,
        x: centerX + randomOffset(),
        y: centerY + randomOffset(),
        fx: null,
        fy: null,
      };
      setElements(prev => [...prev, newElement]);
  }, [defaultTags]);

  const handleUpdateElement = useCallback((updatedElement: Element) => {
    setElements(prev => prev.map(f => f.id === updatedElement.id ? { ...updatedElement, updatedAt: new Date().toISOString() } : f));
  }, []);
  
  const handleDeleteElement = useCallback((elementId: string) => {
    setElements(prev => prev.filter(f => f.id !== elementId));
    setRelationships(prev => prev.filter(r => r.source !== elementId && r.target !== elementId));
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  }, [selectedElementId]);
  
  const handleBulkTagAction = useCallback((elementIds: string[], tag: string, mode: 'add' | 'remove') => {
      setElements(prev => prev.map(e => {
          if (elementIds.includes(e.id)) {
              let newTags = [...e.tags];
              if (mode === 'add') {
                  if (!newTags.includes(tag)) {
                      newTags.push(tag);
                  } else {
                      return e; // No change
                  }
              } else {
                   // mode === 'remove'
                   if (newTags.includes(tag)) {
                       newTags = newTags.filter(t => t !== tag);
                   } else {
                       return e; // No change
                   }
              }
              return { ...e, tags: newTags, updatedAt: new Date().toISOString() };
          }
          return e;
      }));
  }, []);

  const handleAddRelationship = useCallback((relationship: Omit<Relationship, 'id' | 'tags'>, newElementData?: Omit<Element, 'id' | 'createdAt' | 'updatedAt'>) => {
    let finalRelationship: Relationship = { ...relationship, id: generateUUID(), tags: [] };

    if (newElementData) {
      const now = new Date().toISOString();
      const newElement: Element = {
        ...newElementData,
        id: generateUUID(),
        createdAt: now,
        updatedAt: now,
      };
      setElements(prev => [...prev, newElement]);
      finalRelationship.target = newElement.id;
    }
    
    setRelationships(prev => [...prev, finalRelationship]);
    
    if (newElementData) {
        setSelectedElementId(panelState.sourceElementId || null);
        setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false });
    } else {
        setSelectedRelationshipId(finalRelationship.id);
        setSelectedElementId(null);
        setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false });
    }

  }, [panelState.sourceElementId]);
  
  // Wrapper for table view adding relationships directly
  const handleAddRelationshipDirect = useCallback((relationship: Omit<Relationship, 'id' | 'tags'>) => {
      const newRel: Relationship = { ...relationship, id: generateUUID(), tags: [] };
      setRelationships(prev => [...prev, newRel]);
  }, []);

  const handleCancelAddRelationship = useCallback(() => {
    if (panelState.isNewTarget && panelState.targetElementId) {
      handleDeleteElement(panelState.targetElementId);
    }
    
    setSelectedElementId(panelState.sourceElementId || null);
    setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false });
  }, [panelState, handleDeleteElement]);

  const handleUpdateRelationship = useCallback((updatedRelationship: Relationship) => {
    setRelationships(prev => prev.map(r => r.id === updatedRelationship.id ? updatedRelationship : r));
  }, []);
  
  const handleDeleteRelationship = useCallback((relationshipId: string) => {
    setRelationships(prev => prev.filter(r => r.id !== relationshipId));
    setSelectedRelationshipId(null);
  }, []);


  // --- AI Actions Adapter ---
  const aiActions: ModelActions = useMemo(() => {
    const findElementByName = (name: string): Element | undefined => {
      return elementsRef.current.find(e => e.name.toLowerCase() === name.toLowerCase());
    };

    return {
      addElement: (data) => {
        const now = new Date().toISOString();
        const id = generateUUID();
        const count = elementsRef.current.length;
        const angle = count * 0.5;
        const radius = 50 + (5 * count);
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        const newElement: Element = {
          id,
          name: data.name,
          notes: data.notes || '',
          tags: data.tags || [],
          createdAt: now,
          updatedAt: now,
          x, y, fx: x, fy: y
        };
        
        // Update Ref immediately for subsequent batched calls
        elementsRef.current = [...elementsRef.current, newElement];
        
        setElements(prev => [...prev, newElement]);
        return id;
      },
      updateElement: (name, data) => {
        const element = findElementByName(name);
        if (!element) return false;
        
        const updatedElement = {
          ...element,
          ...data,
          updatedAt: new Date().toISOString()
        };
        if (data.tags) {
           updatedElement.tags = Array.from(new Set([...element.tags, ...data.tags]));
        }
        
        // Update Ref immediately
        elementsRef.current = elementsRef.current.map(e => e.id === element.id ? updatedElement : e);
        
        setElements(prev => prev.map(e => e.id === element.id ? updatedElement : e));
        return true;
      },
      deleteElement: (name) => {
        const element = findElementByName(name);
        if (!element) return false;
        
        // Update Refs immediately
        elementsRef.current = elementsRef.current.filter(f => f.id !== element.id);
        relationshipsRef.current = relationshipsRef.current.filter(r => r.source !== element.id && r.target !== element.id);
        
        handleDeleteElement(element.id);
        return true;
      },
      addRelationship: (sourceName, targetName, label, directionStr) => {
        const source = findElementByName(sourceName);
        const target = findElementByName(targetName);
        
        if (!source || !target) return false;

        let direction = RelationshipDirection.To;
        if (directionStr) {
            if (directionStr.toUpperCase() === 'FROM') direction = RelationshipDirection.From;
            if (directionStr.toUpperCase() === 'NONE') direction = RelationshipDirection.None;
        }

        const newRel: Relationship = {
          id: generateUUID(),
          source: source.id,
          target: target.id,
          label: label,
          direction: direction,
          tags: []
        };
        
        // Update Ref immediately
        relationshipsRef.current = [...relationshipsRef.current, newRel];
        
        setRelationships(prev => [...prev, newRel]);
        return true;
      },
      deleteRelationship: (sourceName, targetName) => {
        const source = findElementByName(sourceName);
        const target = findElementByName(targetName);
        if (!source || !target) return false;

        // Update Ref immediately
        relationshipsRef.current = relationshipsRef.current.filter(r => {
             const isMatch = (r.source === source.id && r.target === target.id) || 
                            (r.source === target.id && r.target === source.id);
            return !isMatch;
        });

        setRelationships(prev => prev.filter(r => {
            const isMatch = (r.source === source.id && r.target === target.id) || 
                            (r.source === target.id && r.target === source.id);
            return !isMatch;
        }));
        return true;
      }
    };
  }, [handleDeleteElement]);


  // SCAMPER Actions
  const handleScamperGenerate = async (operator: string, letter: string) => {
      if (!selectedElementId) return;
      const sourceElement = elements.find(e => e.id === selectedElementId);
      if (!sourceElement) return;

      setIsScamperModalOpen(true);
      setIsScamperLoading(true);
      setCurrentScamperOperator({ name: operator, letter });
      setScamperSuggestions([]);

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const prompt = `
        Apply the SCAMPER technique '${letter} - ${operator}' to the concept: "${sourceElement.name}" (Notes: ${sourceElement.notes}).
        Generate 4-8 distinct, creative ideas that emerge from applying this operator.
        For each idea, provide a name, a short description/rationale, and a short relationship label that connects the original concept to the new idea (e.g. "can be replaced by", "combined with", "adapted to").
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "The name of the new idea node." },
                            description: { type: Type.STRING, description: "Rationale or explanation." },
                            relationshipLabel: { type: Type.STRING, description: "Label for the link from original node to this new node." }
                        }
                    }
                }
            }
        });

        const results = JSON.parse(response.text || "[]");
        const suggestions: ScamperSuggestion[] = results.map((r: any) => ({
            id: generateUUID(),
            name: r.name,
            description: r.description,
            relationshipLabel: r.relationshipLabel,
            status: 'pending'
        }));
        setScamperSuggestions(suggestions);

      } catch (e) {
          console.error("SCAMPER generation failed", e);
          alert("Failed to generate ideas. Please try again.");
          setIsScamperModalOpen(false);
      } finally {
          setIsScamperLoading(false);
      }
  };

  const handleScamperAccept = (id: string) => {
      const suggestion = scamperSuggestions.find(s => s.id === id);
      const sourceElement = elements.find(e => e.id === selectedElementId);
      
      if (suggestion && sourceElement) {
          // 1. Add Node
          const newId = generateUUID();
          const now = new Date().toISOString();
          
          // Randomize position near source
          const angle = Math.random() * Math.PI * 2;
          const distance = 150 + Math.random() * 50;
          const x = (sourceElement.x || 0) + Math.cos(angle) * distance;
          const y = (sourceElement.y || 0) + Math.sin(angle) * distance;

          const newElement: Element = {
              id: newId,
              name: suggestion.name,
              notes: suggestion.description,
              tags: ['Idea', ...defaultTags], // Auto-tag as Idea
              createdAt: now,
              updatedAt: now,
              x, y, fx: x, fy: y
          };
          
          // 2. Add Relationship
          const newRel: Relationship = {
              id: generateUUID(),
              source: sourceElement.id,
              target: newId,
              label: suggestion.relationshipLabel,
              direction: RelationshipDirection.To,
              tags: []
          };

          setElements(prev => [...prev, newElement]);
          setRelationships(prev => [...prev, newRel]);

          // 3. Update Suggestion Status
          setScamperSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'accepted' } : s));
      }
  };

  const handleScamperReject = (id: string) => {
      setScamperSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'rejected' } : s));
  };

  const handleScamperAcceptAll = () => {
      scamperSuggestions.forEach(s => {
          if (s.status === 'pending') handleScamperAccept(s.id);
      });
  };

  const handleScamperRejectAll = () => {
       setScamperSuggestions(prev => prev.map(s => s.status === 'pending' ? { ...s, status: 'rejected' } : s));
  };


  const handleDiskSave = useCallback(async () => {
    if (!currentModelId) {
        alert("No active model to save.");
        return;
    }
    const modelMetadata = modelsIndex.find(m => m.id === currentModelId);

    if (!modelMetadata) {
        alert("Could not find model metadata to save.");
        return;
    }
    
    // Update the UpdatedAt timestamp for the save
    const now = new Date().toISOString();
    
    const modelData = {
        elements,
        relationships,
        colorSchemes,
        activeSchemeId,
    };
    const currentHash = computeContentHash(modelData);

    const updatedMetadata = { 
        ...modelMetadata, 
        updatedAt: now, 
        filename: modelMetadata.filename || `${modelMetadata.name.replace(/ /g, '_')}.json`,
        contentHash: currentHash,
        lastDiskHash: currentHash // Track that the disk state matches this hash
    };

    const exportData = {
        metadata: updatedMetadata,
        data: modelData,
    };

    const jsonString = JSON.stringify(exportData, null, 2);

    try {
        // Try to use File System Access API to overwrite if we have a handle
        // BUT ONLY IF NOT IN IFRAME (security restriction)
        if (!isInIframe() && currentFileHandleRef.current && 'createWritable' in currentFileHandleRef.current) {
            const writable = await currentFileHandleRef.current.createWritable();
            await writable.write(jsonString);
            await writable.close();
        } 
        // If no handle, or overwrite not supported, try "Save As" picker
        // BUT ONLY IF NOT IN IFRAME
        else if (!isInIframe() && 'showSaveFilePicker' in window) {
            const options = {
                suggestedName: updatedMetadata.filename,
                types: [{
                    description: 'JSON Files',
                    accept: {'application/json': ['.json']},
                }],
            };
            // @ts-ignore
            const fileHandle = await window.showSaveFilePicker(options);
            currentFileHandleRef.current = fileHandle; // Store handle for next time
            const writable = await fileHandle.createWritable();
            await writable.write(jsonString);
            await writable.close();
        } 
        // Fallback for environments where File System Access is blocked/unavailable (like iframes)
        else {
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = updatedMetadata.filename!;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        
        // Update local index and storage to reflect that we just saved to disk
        setModelsIndex(prev => prev.map(m => m.id === currentModelId ? updatedMetadata : m));
        localStorage.setItem(MODELS_INDEX_KEY, JSON.stringify(
            modelsIndex.map(m => m.id === currentModelId ? updatedMetadata : m)
        ));
        localStorage.setItem(`${MODEL_DATA_PREFIX}${currentModelId}`, JSON.stringify(modelData));
        
    } catch (err: any) {
        if (err.name !== 'AbortError') {
            console.error("Save failed:", err);
            alert("Failed to save file. You can try using the 'Export' feature in JSON view as a backup.");
        }
    }
    
  }, [currentModelId, modelsIndex, elements, relationships, colorSchemes, activeSchemeId]);


  const processImportedData = useCallback((text: string, filename?: string) => {
        try {
            const imported = JSON.parse(text);

            let dataToImport: any = null;
            let nameToUse = 'Imported Model';
            let descToUse = '';
            let existingId: string | null = null;
            let importedHash: string = '';

            // Check for full export structure (metadata + data)
            if (imported.metadata && imported.data && Array.isArray(imported.data.elements)) {
                dataToImport = imported.data;
                nameToUse = imported.metadata.name || nameToUse;
                descToUse = imported.metadata.description || '';
                existingId = imported.metadata.id;
                // Compute hash of the data being imported
                importedHash = computeContentHash(dataToImport);
            } 
            // Check for raw data structure
            else if (imported.elements && Array.isArray(imported.elements)) {
                dataToImport = imported;
                importedHash = computeContentHash(dataToImport);
            }

            if (!dataToImport) {
                throw new Error('Invalid file format.');
            }
            
            // Ensure relationships array exists
            if (!dataToImport.relationships) dataToImport.relationships = [];
            
            // CONFLICT CHECK: Does a model with this ID already exist in localStorage?
            if (existingId) {
                const localDataStr = localStorage.getItem(`${MODEL_DATA_PREFIX}${existingId}`);
                if (localDataStr) {
                    const localIndex = modelsIndex.find(m => m.id === existingId);
                    if (localIndex) {
                        // If metadata has contentHash, use it. Otherwise compute it from raw local data.
                        const localHash = localIndex.contentHash || computeContentHash(JSON.parse(localDataStr));
                        
                        // If the content hashes are different, we have a conflict.
                        if (localHash !== importedHash) {
                            setPendingImport({
                                localMetadata: localIndex,
                                diskMetadata: { 
                                    ...imported.metadata, 
                                    filename: filename || imported.metadata.filename,
                                    contentHash: importedHash,
                                    lastDiskHash: importedHash // Ensure disk version tracks this hash
                                },
                                localData: JSON.parse(localDataStr),
                                diskData: dataToImport
                            });
                            return; 
                        }
                    }
                }
            }
            
            // If no conflict, or raw data (new model), proceed to load
            const now = new Date().toISOString();
            const newModelId = existingId || generateUUID();
            
            // Handle name uniqueness if it's treated as a NEW model (no ID in file)
            if (!existingId) {
                let finalModelName = nameToUse;
                let i = 1;
                while(modelsIndex.some(m => m.name === finalModelName)) {
                    i++;
                    finalModelName = `${nameToUse} ${i}`;
                }
                nameToUse = finalModelName;
            }
            
            const newMetadata: ModelMetadata = {
                id: newModelId,
                name: nameToUse,
                description: descToUse,
                createdAt: imported.metadata?.createdAt || now,
                updatedAt: imported.metadata?.updatedAt || now,
                filename: filename,
                contentHash: importedHash,
                lastDiskHash: importedHash // Track that loaded content is from disk
            };
            
            const newModelData = {
                elements: dataToImport.elements || [],
                relationships: dataToImport.relationships || [],
                colorSchemes: dataToImport.colorSchemes || DEFAULT_COLOR_SCHEMES,
                activeSchemeId: dataToImport.activeSchemeId || DEFAULT_COLOR_SCHEMES[0]?.id || null,
            };
            
            loadModelData(newModelData, newModelId, newMetadata);

        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            alert(`Failed to import file: ${message}`);
            console.error("Import failed:", error);
        }
  }, [modelsIndex, loadModelData]);

  const handleImportClick = useCallback(async () => {
      // Try File System Access API first to allow overwrite capability later
      // Check if NOT in iframe to avoid cross-origin security errors
      if (!isInIframe() && 'showOpenFilePicker' in window) {
          try {
              const pickerOptions = {
                  types: [{
                      description: 'JSON Files',
                      accept: { 'application/json': ['.json'] }
                  }],
              };
              // @ts-ignore
              const [fileHandle] = await window.showOpenFilePicker(pickerOptions);
              currentFileHandleRef.current = fileHandle;
              
              const file = await fileHandle.getFile();
              const text = await file.text();
              processImportedData(text, file.name);
              return;
          } catch (err: any) {
              // Security errors (cross-origin) or cancellation
              if (err.name !== 'AbortError') {
                   console.warn("File System Access API failed, falling back to input.", err);
                   // Fallback to input below
              } else {
                  // User cancelled, do nothing
                  return;
              }
          }
      }

      // Fallback for standard input
      if (importFileRef.current) {
          importFileRef.current.value = '';
          importFileRef.current.click();
      }
  }, [processImportedData]);

  const handleImportInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Standard input does not provide a handle, so we can't overwrite this file later
    currentFileHandleRef.current = null;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        processImportedData(text, file.name);
    };
    reader.readAsText(file);
  }, [processImportedData]);
  
  const handleApplyJSON = useCallback((data: any) => {
      try {
          if (data.elements && Array.isArray(data.elements)) {
              setElements(data.elements);
          }
          if (data.relationships && Array.isArray(data.relationships)) {
              setRelationships(data.relationships);
          }
          if (data.colorSchemes && Array.isArray(data.colorSchemes)) {
              const migrated = migrateLegacySchemes(data.colorSchemes);
              setColorSchemes(migrated);
          }
          if (data.activeSchemeId) {
              setActiveSchemeId(data.activeSchemeId);
          }
          setIsJSONPanelOpen(false);
      } catch (e) {
          alert("Failed to apply JSON data: " + (e instanceof Error ? e.message : String(e)));
      }
  }, [migrateLegacySchemes]);
  
  const handleNewModelClick = useCallback(async () => {
      if (currentModelId) {
          const currentMeta = modelsIndex.find(m => m.id === currentModelId);
          const modelData = { elements, relationships, colorSchemes, activeSchemeId };
          const currentHash = computeContentHash(modelData);
          
          // Check if dirty: current state differs from last successful disk save state.
          // If lastDiskHash is missing (new unsaved model), we assume dirty unless empty.
          const isDirty = currentMeta?.lastDiskHash !== currentHash;
          const isEmpty = elements.length === 0;
          
          if (isDirty && !isEmpty) {
             if (confirm("You have unsaved changes. Do you want to save your current model before creating a new one?")) {
                 await handleDiskSave();
             }
          }
      }
      setIsCreateModelModalOpen(true);
  }, [currentModelId, modelsIndex, elements, relationships, colorSchemes, activeSchemeId, handleDiskSave]);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);
  const closeCanvasContextMenu = useCallback(() => setCanvasContextMenu(null), []);

  const handleNodeClick = useCallback((elementId: string) => {
    // BULK EDIT INTERCEPTION
    if (isBulkEditActive) {
        if (bulkTagsToAdd.length === 0 && bulkTagsToRemove.length === 0) return;
        
        setElements(prev => prev.map(el => {
            if (el.id === elementId) {
                const currentTags = el.tags;
                let newTags = [...currentTags];
                let changed = false;
                
                // Remove tags (case-insensitive)
                const lowerToRemove = bulkTagsToRemove.map(t => t.toLowerCase());
                const filteredTags = newTags.filter(t => !lowerToRemove.includes(t.toLowerCase()));
                
                if (filteredTags.length !== newTags.length) {
                    newTags = filteredTags;
                    changed = true;
                }

                // Add tags (prevent duplicates case-insensitive)
                const lowerCurrent = newTags.map(t => t.toLowerCase());
                const toAdd = bulkTagsToAdd.filter(t => !lowerCurrent.includes(t.toLowerCase()));
                
                if (toAdd.length > 0) {
                    newTags = [...newTags, ...toAdd];
                    changed = true;
                }
                
                if (changed) {
                    return { ...el, tags: newTags, updatedAt: new Date().toISOString() };
                }
            }
            return el;
        }));
        
        // Do not select the node if in bulk mode
        return;
    }

    // Normal Selection
    setSelectedElementId(elementId);
    setSelectedRelationshipId(null);
    setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false });
    closeContextMenu();
  }, [closeContextMenu, isBulkEditActive, bulkTagsToAdd, bulkTagsToRemove]);
  
  const handleLinkClick = useCallback((relationshipId: string) => {
    setSelectedRelationshipId(relationshipId);
    setSelectedElementId(null);
    setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false });
    closeContextMenu();
  }, [closeContextMenu]);

  const handleCanvasClick = useCallback(() => {
    setSelectedElementId(null);
    setSelectedRelationshipId(null);
    setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false });
    closeContextMenu();
    closeCanvasContextMenu();
  }, [closeContextMenu, closeCanvasContextMenu]);
  
  const handleNodeContextMenu = useCallback((event: React.MouseEvent, elementId: string) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, elementId });
    closeCanvasContextMenu();
  }, [closeCanvasContextMenu]);
  
  const handleCanvasContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setCanvasContextMenu({ x: event.clientX, y: event.clientY });
    closeContextMenu();
  }, [closeContextMenu]);

  const handleNodeConnect = useCallback((sourceId: string, targetId: string) => {
    const currentScheme = colorSchemes.find(s => s.id === activeSchemeId);
    let defaultLabel = '';
    
    if (currentScheme && currentScheme.defaultRelationshipLabel) {
        defaultLabel = currentScheme.defaultRelationshipLabel;
    }
    
    const newRelId = generateUUID();
    const newRel: Relationship = {
        id: newRelId,
        source: sourceId,
        target: targetId,
        label: defaultLabel,
        direction: RelationshipDirection.To,
        tags: []
    };

    setRelationships(prev => [...prev, newRel]);
    
    setSelectedRelationshipId(newRelId);
    setSelectedElementId(null);
    setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false });
    
    closeContextMenu();
  }, [activeSchemeId, colorSchemes, closeContextMenu]);

  const handleNodeConnectToNew = useCallback((sourceId: string, coords: { x: number; y: number }) => {
    const now = new Date().toISOString();
    const newElement: Element = {
      id: generateUUID(),
      name: 'New Element',
      notes: '',
      tags: [...defaultTags],
      createdAt: now,
      updatedAt: now,
      x: coords.x,
      y: coords.y,
      fx: coords.x,
      fy: coords.y,
    };
    setElements(prev => [...prev, newElement]);
    
    setPanelState({ view: 'addRelationship', sourceElementId: sourceId, targetElementId: newElement.id, isNewTarget: true });
    setSelectedElementId(null);
    setSelectedRelationshipId(null);
    closeContextMenu();
  }, [defaultTags, closeContextMenu]);
  
  const handleUpdateDefaultRelationship = (newLabel: string) => {
      if (!activeSchemeId) return;
      setColorSchemes(prev => prev.map(s => 
         s.id === activeSchemeId
         ? { ...s, defaultRelationshipLabel: newLabel }
         : s
      ));
  };

  const handleToggleFocusMode = () => {
    setFocusMode(prev => {
      if (prev === 'narrow') return 'wide';
      if (prev === 'wide') return 'zoom';
      return 'narrow';
    });
  };

  const handleApplyMarkdown = (markdown: string, shouldMerge: boolean = false) => {
    let processedMarkdown = markdown;
    
    // Pre-process shorthand: Relationship operators
    // Replace /> with -[Counteracts]->
    processedMarkdown = processedMarkdown.replace(/\s*\/>\s*/g, ' -[Counteracts]-> ');
    // Replace > with -[Produces]->, but careful not to replace -> or -[...]->
    // We use negative lookbehind and lookahead to avoid matching existing arrow syntax
    processedMarkdown = processedMarkdown.replace(/(?<!\-|\[)>(?!\-|\])/g, ' -[Produces]-> ');

    const lines = processedMarkdown.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed !== '' && !trimmed.startsWith('#');
    });
    
    const parsedElements = new Map<string, { tags: string[] }>();
    const parsedRels: { sourceName: string, targetName: string, label: string, direction: RelationshipDirection }[] = [];

    const parseElementStr = (str: string) => {
        let workStr = str.trim();
        if (!workStr) return null;

        let name: string;
        let tags: string[] = [];

        // Standard tag parsing :tag,tag
        const lastColonIndex = workStr.lastIndexOf(':');
        const lastParenOpenIndex = workStr.lastIndexOf('(');
        if (lastColonIndex > -1 && lastColonIndex > lastParenOpenIndex) {
            const tagsStr = workStr.substring(lastColonIndex + 1);
            tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
            workStr = workStr.substring(0, lastColonIndex).trim();
        }

        // Shorthand tag parsing (suffix + or -)
        if (workStr.endsWith('+')) {
            workStr = workStr.slice(0, -1).trim();
            tags.push('Useful');
        } else if (workStr.endsWith('-')) {
            workStr = workStr.slice(0, -1).trim();
            tags.push('Harmful');
        }

        name = workStr;
        if (name.startsWith('"') && name.endsWith('"')) {
            name = name.substring(1, name.length - 1);
        }

        if (!name) return null;

        return { name, tags };
    };

    const updateParsedElement = (elementData: { name: string, tags: string[] }) => {
      const existing = parsedElements.get(elementData.name);
      if (existing) {
        const newTags = [...new Set([...existing.tags, ...elementData.tags])];
        parsedElements.set(elementData.name, { tags: newTags });
      } else {
        parsedElements.set(elementData.name, { tags: elementData.tags });
      }
    };

    for (const line of lines) {
      const relSeparatorRegex = /(<?-\[.*?]->?)/g;
      const parts = line.split(relSeparatorRegex);
      const tokens = parts.map(p => p.trim()).filter(Boolean);

      if (tokens.length === 0) continue;

      if (tokens.length === 1) { 
          const element = parseElementStr(tokens[0]);
          if (element) {
              updateParsedElement(element);
          }
          continue;
      }

      let currentSourceElementStr = tokens.shift();
      while (tokens.length > 0) {
          const relStr = tokens.shift();
          const targetsStr = tokens.shift();
          if (!currentSourceElementStr || !relStr || !targetsStr) break;

          const sourceElementData = parseElementStr(currentSourceElementStr);
          if (!sourceElementData) {
              console.warn(`Could not parse source element: ${currentSourceElementStr}`);
              break;
          }
          updateParsedElement(sourceElementData);

          const singleRelRegex = /<?-\[(.*?)]->?/;
          const relMatch = relStr.match(singleRelRegex);
          if (!relMatch) {
              console.warn(`Could not parse relationship: ${relStr}`);
              break;
          }
          const label = relMatch[1];
          let direction = RelationshipDirection.None;
          if (relStr.startsWith('<-')) direction = RelationshipDirection.From;
          else if (relStr.endsWith('->')) direction = RelationshipDirection.To;

          const targetElementStrs = targetsStr.split(';').map(t => t.trim()).filter(Boolean);

          for (const targetElementStr of targetElementStrs) {
              const targetElementData = parseElementStr(targetElementStr);
              if (targetElementData) {
                  updateParsedElement(targetElementData);
                  parsedRels.push({ sourceName: sourceElementData.name, targetName: targetElementData.name, label, direction });
              } else {
                   console.warn(`Could not parse target element: ${targetElementStr}`);
              }
          }
          
          if (targetElementStrs.length === 1) {
              currentSourceElementStr = targetElementStrs[0];
          } else {
              break; 
          }
      }
    }
    
    // PREPARE STATE UPDATES
    
    let nextElements: Element[] = [];
    let nextRelationships: Relationship[] = [];
    const newElementNames = new Set<string>();
    
    if (shouldMerge) {
        // MERGE MODE
        nextElements = [...elements];
        nextRelationships = [...relationships];
        
        const existingMap = new Map<string, Element>();
        const nameToIdMap = new Map<string, string>();
        
        nextElements.forEach(e => {
            existingMap.set(e.name.toLowerCase(), e);
            nameToIdMap.set(e.name.toLowerCase(), e.id);
        });
        
        parsedElements.forEach(({ tags }, name) => {
            const lowerName = name.toLowerCase();
            const existing = existingMap.get(lowerName);
            
            if (existing) {
                // Update tags (union)
                const mergedTags = Array.from(new Set([...existing.tags, ...tags]));
                if (mergedTags.length !== existing.tags.length || !mergedTags.every(t => existing.tags.includes(t))) {
                    const updated = { ...existing, tags: mergedTags, updatedAt: new Date().toISOString() };
                    const idx = nextElements.findIndex(e => e.id === existing.id);
                    if (idx !== -1) nextElements[idx] = updated;
                    existingMap.set(lowerName, updated);
                }
            } else {
                // Create New
                const now = new Date().toISOString();
                const newId = generateUUID();
                const newEl: Element = {
                    id: newId,
                    name, // Original casing
                    tags,
                    notes: '',
                    createdAt: now,
                    updatedAt: now
                };
                nextElements.push(newEl);
                existingMap.set(lowerName, newEl);
                nameToIdMap.set(lowerName, newId);
                newElementNames.add(name);
            }
        });
        
        parsedRels.forEach(rel => {
             const sId = nameToIdMap.get(rel.sourceName.toLowerCase());
             const tId = nameToIdMap.get(rel.targetName.toLowerCase());
             
             if (sId && tId) {
                 // Duplicate check
                 const exists = nextRelationships.some(r => 
                    r.source === sId && 
                    r.target === tId && 
                    r.label === rel.label && 
                    r.direction === rel.direction
                 );
                 
                 if (!exists) {
                     nextRelationships.push({
                        id: generateUUID(),
                        source: sId,
                        target: tId,
                        label: rel.label,
                        direction: rel.direction,
                        tags: []
                     });
                 }
             }
        });

    } else {
        // REPLACE MODE
        const nameToIdMap = new Map<string, string>();
        
        parsedElements.forEach(({ tags }, name) => {
            // Check existing (case insensitive) to try and preserve IDs if possible
            const existing = elements.find(e => e.name.toLowerCase() === name.toLowerCase());
            if (existing) {
                const updated = { ...existing, tags, updatedAt: new Date().toISOString() };
                nextElements.push(updated);
                nameToIdMap.set(name.toLowerCase(), existing.id);
            } else {
                const now = new Date().toISOString();
                const newId = generateUUID();
                const newEl: Element = {
                    id: newId,
                    name,
                    tags,
                    notes: '',
                    createdAt: now,
                    updatedAt: now,
                };
                nextElements.push(newEl);
                nameToIdMap.set(name.toLowerCase(), newId);
                newElementNames.add(name);
            }
        });

        parsedRels.forEach(rel => {
             const sId = nameToIdMap.get(rel.sourceName.toLowerCase());
             const tId = nameToIdMap.get(rel.targetName.toLowerCase());
             if (sId && tId) {
                nextRelationships.push({
                    id: generateUUID(),
                    source: sId,
                    target: tId,
                    label: rel.label,
                    direction: rel.direction,
                    tags: []
                });
             }
        });
    }
    
    // POSITIONING LOGIC
    let placedNewElementsCount = 0;
    const positionNewElements = () => {
        nextElements.forEach(element => {
            if (newElementNames.has(element.name) && element.x === undefined) {
                let connectedAnchor: Element | undefined;
                
                for (const rel of nextRelationships) {
                    let anchorId: string | undefined;
                    if (rel.source === element.id) anchorId = rel.target as string;
                    else if (rel.target === element.id) anchorId = rel.source as string;

                    if (anchorId) {
                       const potentialAnchor = nextElements.find(f => f.id === anchorId && f.x !== undefined);
                       if (potentialAnchor) {
                           connectedAnchor = potentialAnchor;
                           break;
                       }
                    }
                }

                if (connectedAnchor && connectedAnchor.x && connectedAnchor.y) {
                    element.x = connectedAnchor.x + (Math.random() - 0.5) * 300;
                    element.y = connectedAnchor.y + (Math.random() - 0.5) * 300;
                } else {
                    element.x = 200 + (placedNewElementsCount * 50);
                    element.y = 200 + (placedNewElementsCount * 50);
                    placedNewElementsCount++;
                }
                element.fx = element.x;
                element.fy = element.y;
            }
        });
    }
    
    positionNewElements();
    positionNewElements(); // Second pass helps with chains

    setElements(nextElements);
    setRelationships(nextRelationships);
    
    if (!shouldMerge) {
        setIsMarkdownPanelOpen(false);
    }
  };
  
  const handleStartPhysicsLayout = () => {
    setOriginalElements(elements);
    setElements(prev => prev.map(f => ({ ...f, fx: null, fy: null })));
    setIsPhysicsModeActive(true);
  };

  const handleAcceptLayout = () => {
    const finalPositions = graphCanvasRef.current?.getFinalNodePositions();
    if (finalPositions) {
      const positionsMap = new Map(finalPositions.map((p: { id: string; x: number; y: number; }) => [p.id, p]));
      setElements(prev => prev.map(element => {
        const pos = positionsMap.get(element.id);
        return pos ? { ...element, x: pos.x, y: pos.y, fx: pos.x, fy: pos.y } : element;
      }));
    }
    setIsPhysicsModeActive(false);
    setOriginalElements(null);
  };

  const handleRejectLayout = () => {
    if (originalElements) {
      setElements(originalElements);
    }
    setIsPhysicsModeActive(false);
    setOriginalElements(null);
  };

  const handleZoomToFit = () => {
    graphCanvasRef.current?.zoomToFit();
  };


  const selectedElement = useMemo(() => elements.find(f => f.id === selectedElementId), [elements, selectedElementId]);
  const selectedRelationship = useMemo(() => relationships.find(r => r.id === selectedRelationshipId), [relationships, selectedRelationshipId]);
  const addRelationshipSourceElement = useMemo(() => elements.find(f => f.id === panelState.sourceElementId), [elements, panelState.sourceElementId]);
  
  // ACTIVE SCHEMA COMPUTATION
  const activeColorScheme = useMemo(() => {
    const current = colorSchemes.find(s => s.id === activeSchemeId);
    if (!current) return undefined;

    const defaultScheme = DEFAULT_COLOR_SCHEMES.find(d => d.id === current.id);
    if (defaultScheme) {
        const mergedTags = { ...defaultScheme.tagColors, ...current.tagColors };
        
        // Merge standard definitions with any definitions present in the current model
        // Note: Migrated models will have relationshipDefinitions in 'current'
        const currentDefs = current.relationshipDefinitions || [];
        const defaultDefs = defaultScheme.relationshipDefinitions || [];
        
        // Combine unique definitions by label
        const combinedDefsMap = new Map<string, RelationshipDefinition>();
        defaultDefs.forEach(d => combinedDefsMap.set(d.label, d));
        currentDefs.forEach(d => combinedDefsMap.set(d.label, d)); // User overrides win if labels match (though we usually just append)

        const mergedDefinitions = Array.from(combinedDefsMap.values());
        
        const mergedDefaultLabel = current.defaultRelationshipLabel || defaultScheme.defaultRelationshipLabel;

        return {
            ...current,
            tagColors: mergedTags,
            relationshipDefinitions: mergedDefinitions,
            defaultRelationshipLabel: mergedDefaultLabel
        };
    }
    return current;
  }, [colorSchemes, activeSchemeId]);
  
  // Flatten definitions for components that just need labels
  const activeRelationshipLabels = useMemo(() => {
      return activeColorScheme?.relationshipDefinitions?.map(d => d.label) || [];
  }, [activeColorScheme]);


  if (isInitialLoad && !isCreateModelModalOpen) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  const focusButtonTitle = () => {
    if (focusMode === 'narrow') return 'Switch to Wide Focus';
    if (focusMode === 'wide') return 'Switch to Zoom Focus';
    return 'Switch to Narrow Focus';
  };


  return (
    <div className="w-screen h-screen overflow-hidden flex relative">
      <input
        type="file"
        ref={importFileRef}
        onChange={handleImportInputChange}
        accept=".json"
        className="hidden"
      />
      
      {currentModelId && (
        <div className="absolute top-4 left-4 z-50 bg-gray-800 bg-opacity-80 p-2 rounded-lg flex items-center space-x-2">
            <div className="flex items-center space-x-2 text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 8c2-2 4-2 6 0s4 2 6 0" />
                    <path d="M4 12c2-2 4-2 6 0s4 2 6 0" />
                    <path d="M4 16c2-2 4-2 6 0s4 2 6 0" />
                </svg>
                <span className="text-xl font-bold">Tapestry</span>
            </div>
            <div className="border-l border-gray-600 h-6 mx-1"></div>
            <button onClick={handleNewModelClick} title="New Model..." className="p-2 rounded-md hover:bg-gray-700 transition">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
            <button onClick={handleImportClick} title="Open Model..." className="p-2 rounded-md hover:bg-gray-700 transition">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            </button>
            <button onClick={handleDiskSave} title="Save to Disk" className="p-2 rounded-md hover:bg-gray-700 transition">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            </button>
            <button onClick={() => setIsSettingsModalOpen(true)} title="Settings" className="p-2 rounded-md hover:bg-gray-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <button onClick={() => setIsFilterPanelOpen(prev => !prev)} title="Filter by Tag" className="p-2 rounded-md hover:bg-gray-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            </button>
            <button onClick={handleToggleFocusMode} title={focusButtonTitle()} className="p-2 rounded-md hover:bg-gray-700 transition">
                {focusMode === 'narrow' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                )}
                {focusMode === 'wide' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                    </svg>
                )}
                {focusMode === 'zoom' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 6V2h4 M22 6V2h-4 M2 18v4h4 M22 18v4h-4" />
                    </svg>
                )}
            </button>
            <button onClick={() => setIsTablePanelOpen(prev => !prev)} title="Table View" className="p-2 rounded-md hover:bg-gray-700 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7-4h14M4 6h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
                </svg>
            </button>
            <button onClick={() => setIsMatrixPanelOpen(prev => !prev)} title="Matrix View" className="p-2 rounded-md hover:bg-gray-700 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            </button>
            <button onClick={() => setIsMarkdownPanelOpen(prev => !prev)} title="Markdown View" className="p-2 rounded-md hover:bg-gray-700 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            </button>
            <button onClick={() => setIsJSONPanelOpen(prev => !prev)} title="JSON View" className="p-2 rounded-md hover:bg-gray-700 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
            </button>
            <button onClick={() => setIsReportPanelOpen(prev => !prev)} title="Report View" className="p-2 rounded-md hover:bg-gray-700 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </button>
            <button onClick={() => setIsChatPanelOpen(prev => !prev)} title="AI Assistant" className="p-2 rounded-md hover:bg-gray-700 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
            </button>
            <button onClick={handleZoomToFit} title="Zoom to Fit" className="p-2 rounded-md hover:bg-gray-700 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
                </svg>
            </button>
            <div className="bg-gray-700 rounded-md flex">
                {!isPhysicsModeActive ? (
                    <button onClick={handleStartPhysicsLayout} title="Auto-Layout" className="p-2 hover:bg-gray-600 rounded-md transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} fill="currentColor">
                            <circle cx="6" cy="18" r="3" />
                            <circle cx="18" cy="6" r="3" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M 8 16 Q 4 12, 12 12 T 16 8" />
                        </svg>
                    </button>
                ) : (
                    <div className="flex items-center">
                        <button onClick={handleAcceptLayout} title="Accept Layout" className="p-2 hover:bg-gray-600 rounded-md transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </button>
                        <button onClick={handleRejectLayout} title="Reject Layout" className="p-2 hover:bg-gray-600 rounded-md transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}
            </div>
            <div className="relative" ref={helpMenuRef}>
            <button onClick={() => setIsHelpMenuOpen(p => !p)} title="Help" className="p-2 rounded-md hover:bg-gray-700 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>
            {isHelpMenuOpen && (
                <HelpMenu 
                    onClose={() => setIsHelpMenuOpen(false)} 
                    onAbout={() => setIsAboutModalOpen(true)}
                    onPatternGallery={() => setIsPatternGalleryModalOpen(true)}
                />
            )}
            </div>
            <div className="border-l border-gray-600 h-6 mx-2"></div>
            <span className="text-gray-400 text-sm font-semibold pr-2">Current Model: {currentModelName}</span>
        </div>
      )}
      
      {currentModelId && (
        <div className="absolute top-20 left-4 z-40 max-w-[90vw] pointer-events-none">
            <div className="flex flex-wrap items-start gap-2">
                <ToolsBar>
                    <SchemaToolbar
                        schemes={colorSchemes}
                        activeSchemeId={activeSchemeId}
                        onSchemeChange={setActiveSchemeId}
                        activeColorScheme={activeColorScheme}
                        onDefaultRelationshipChange={handleUpdateDefaultRelationship}
                        defaultTags={defaultTags}
                        onDefaultTagsChange={setDefaultTags}
                        elements={elements}
                        isCollapsed={activeTool !== 'schema'}
                        onToggle={() => toggleTool('schema')}
                    />
                    <LayoutToolbar
                        linkDistance={layoutParams.linkDistance}
                        repulsion={layoutParams.repulsion}
                        onLinkDistanceChange={(val) => setLayoutParams(p => ({...p, linkDistance: val}))}
                        onRepulsionChange={(val) => setLayoutParams(p => ({...p, repulsion: val}))}
                        onJiggle={() => setJiggleTrigger(prev => prev + 1)}
                        isPhysicsActive={isPhysicsModeActive}
                        isCollapsed={activeTool !== 'layout'}
                        onToggle={() => toggleTool('layout')}
                    />
                    <AnalysisToolbar 
                        elements={elements} 
                        relationships={relationships}
                        onBulkTag={handleBulkTagAction} 
                        isCollapsed={activeTool !== 'analysis'}
                        onToggle={() => toggleTool('analysis')}
                    />
                    <ScamperToolbar
                        selectedElementId={selectedElementId}
                        onScamper={handleScamperGenerate}
                        isCollapsed={activeTool !== 'scamper'}
                        onToggle={() => toggleTool('scamper')}
                    />
                    <BulkEditToolbar
                        activeColorScheme={activeColorScheme}
                        tagsToAdd={bulkTagsToAdd}
                        tagsToRemove={bulkTagsToRemove}
                        onTagsToAddChange={setBulkTagsToAdd}
                        onTagsToRemoveChange={setBulkTagsToRemove}
                        isActive={isBulkEditActive}
                        onToggleActive={() => setIsBulkEditActive(p => !p)}
                        isCollapsed={activeTool !== 'bulk'}
                        onToggle={() => toggleTool('bulk')}
                    />
                </ToolsBar>
                
                <CommandBar onExecute={(md) => handleApplyMarkdown(md, true)} />
            </div>
        </div>
      )}

      {isFilterPanelOpen && currentModelId && (
        <FilterPanel
            allTags={allTags}
            tagCounts={tagCounts}
            tagFilter={tagFilter}
            dateFilter={dateFilter}
            onTagFilterChange={setTagFilter}
            onDateFilterChange={setDateFilter}
            onClose={() => setIsFilterPanelOpen(false)}
        />
      )}
      
      {currentModelId && (
        <RightPanelContainer
            activeModelName={currentModelName}
            isReportOpen={isReportPanelOpen}
            isMarkdownOpen={isMarkdownPanelOpen}
            isJSONOpen={isJSONPanelOpen}
            isMatrixOpen={isMatrixPanelOpen}
            isTableOpen={isTablePanelOpen}
            onToggleReport={() => setIsReportPanelOpen(p => !p)}
            onToggleMarkdown={() => setIsMarkdownPanelOpen(p => !p)}
            onToggleJSON={() => setIsJSONPanelOpen(p => !p)}
            onToggleMatrix={() => setIsMatrixPanelOpen(p => !p)}
            onToggleTable={() => setIsTablePanelOpen(p => !p)}
        >
            {isReportPanelOpen && (
                <ReportPanel
                    elements={filteredElements}
                    relationships={filteredRelationships}
                    onClose={() => setIsReportPanelOpen(false)}
                    onNodeClick={handleNodeClick}
                />
            )}
            {isMarkdownPanelOpen && (
                <MarkdownPanel
                    initialText={generateMarkdownFromGraph(elements, relationships)}
                    onApply={(md) => handleApplyMarkdown(md, false)}
                    onClose={() => setIsMarkdownPanelOpen(false)}
                    modelName={currentModelName}
                />
            )}
            {isJSONPanelOpen && (
                <JSONPanel
                    initialData={{ elements, relationships, colorSchemes, activeSchemeId }}
                    onApply={handleApplyJSON}
                    onClose={() => setIsJSONPanelOpen(false)}
                    modelName={currentModelName}
                />
            )}
             {isMatrixPanelOpen && (
                <MatrixPanel
                    elements={filteredElements}
                    relationships={filteredRelationships}
                    onClose={() => setIsMatrixPanelOpen(false)}
                />
            )}
            {isTablePanelOpen && (
                <TablePanel
                    elements={filteredElements}
                    relationships={filteredRelationships}
                    onUpdateElement={handleUpdateElement}
                    onDeleteElement={handleDeleteElement}
                    onAddElement={handleAddElementFromName}
                    onAddRelationship={handleAddRelationshipDirect}
                    onDeleteRelationship={handleDeleteRelationship}
                    onClose={() => setIsTablePanelOpen(false)}
                />
            )}
        </RightPanelContainer>
      )}
      
      <ChatPanel
          className={(!isChatPanelOpen || !currentModelId) ? 'hidden' : ''}
          isOpen={isChatPanelOpen}
          elements={elements}
          relationships={relationships}
          colorSchemes={colorSchemes}
          activeSchemeId={activeSchemeId}
          onClose={() => setIsChatPanelOpen(false)}
          currentModelId={currentModelId}
          modelActions={aiActions}
      />
      
      <ScamperModal
        isOpen={isScamperModalOpen}
        isLoading={isScamperLoading}
        operator={currentScamperOperator ? `${currentScamperOperator.letter} - ${currentScamperOperator.name}` : ''}
        sourceNodeName={selectedElement ? selectedElement.name : ''}
        suggestions={scamperSuggestions}
        onAccept={handleScamperAccept}
        onReject={handleScamperReject}
        onAcceptAll={handleScamperAcceptAll}
        onRejectAll={handleScamperRejectAll}
        onRegenerate={() => handleScamperGenerate(currentScamperOperator?.name || '', currentScamperOperator?.letter || '')}
        onClose={() => setIsScamperModalOpen(false)}
      />

      {currentModelId ? (
        <GraphCanvas
          ref={graphCanvasRef}
          elements={filteredElements}
          relationships={filteredRelationships}
          onNodeClick={handleNodeClick}
          onLinkClick={handleLinkClick}
          onCanvasClick={handleCanvasClick}
          onCanvasDoubleClick={handleAddElement}
          onNodeContextMenu={handleNodeContextMenu}
          onCanvasContextMenu={handleCanvasContextMenu}
          onNodeConnect={handleNodeConnect}
          onNodeConnectToNew={handleNodeConnectToNew}
          activeColorScheme={activeColorScheme}
          selectedElementId={selectedElementId}
          selectedRelationshipId={selectedRelationshipId}
          focusMode={focusMode}
          setElements={setElements}
          isPhysicsModeActive={isPhysicsModeActive}
          layoutParams={layoutParams}
          onJiggleTrigger={jiggleTrigger}
          isBulkEditActive={isBulkEditActive}
        />
      ) : (
        <div className="w-full h-full flex-col items-center justify-center bg-gray-900 text-white space-y-10 p-8 flex">
             <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-4">
                    <TapestryAnimator />
                    <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">Tapestry</h1>
                </div>
                <div className="text-xl text-gray-400 font-light tracking-wide min-w-[300px]">
                    <TextAnimator />
                </div>
             </div>
             
             <div className="flex space-x-8">
                <button
                    onClick={() => setIsCreateModelModalOpen(true)}
                    className="flex flex-col items-center justify-center w-56 h-56 bg-gray-800 border-2 border-gray-700 rounded-2xl hover:border-blue-500 hover:bg-gray-750 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 transition-all group"
                >
                    <div className="bg-gray-700 rounded-full p-4 mb-4 group-hover:bg-blue-900 group-hover:bg-opacity-30 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <span className="text-xl font-semibold text-gray-300 group-hover:text-white transition-colors">Create Model</span>
                    <span className="text-sm text-gray-500 mt-2 text-center px-4 group-hover:text-gray-400">Start a new blank canvas</span>
                </button>
                
                <button
                    onClick={handleImportClick}
                    className="flex flex-col items-center justify-center w-56 h-56 bg-gray-800 border-2 border-gray-700 rounded-2xl hover:border-green-500 hover:bg-gray-750 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20 transition-all group"
                >
                     <div className="bg-gray-700 rounded-full p-4 mb-4 group-hover:bg-green-900 group-hover:bg-opacity-30 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 group-hover:text-green-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    </div>
                    <span className="text-xl font-semibold text-gray-300 group-hover:text-white transition-colors">Open Model</span>
                    <span className="text-sm text-gray-500 mt-2 text-center px-4 group-hover:text-gray-400">Open a JSON file from Disk</span>
                </button>
             </div>

             {modelsIndex.length > 0 && (
                 <div className="mt-8 w-full max-w-2xl">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-lg font-semibold text-gray-400">Recent Models (Recovered)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {modelsIndex.slice(0, 4).map(model => (
                             <button 
                                key={model.id} 
                                onClick={() => handleLoadModel(model.id)}
                                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 p-4 rounded-lg text-left transition group flex flex-col"
                             >
                                <span className="font-medium text-gray-200 group-hover:text-blue-400 transition-colors">{model.name}</span>
                                <span className="text-xs text-gray-500 mt-1">Last updated: {new Date(model.updatedAt).toLocaleDateString()}</span>
                             </button>
                        ))}
                    </div>
                     <div className="text-center mt-4">
                        <button 
                            onClick={() => setIsOpenModelModalOpen(true)}
                            className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                        >
                            View All Recovered Models
                        </button>
                     </div>
                 </div>
             )}
        </div>
      )}
      
      <div className="flex-shrink-0 z-20">
        {panelState.view === 'addRelationship' && addRelationshipSourceElement && currentModelId ? (
            <AddRelationshipPanel
            sourceElement={addRelationshipSourceElement}
            targetElementId={panelState.targetElementId}
            isNewTarget={panelState.isNewTarget}
            allElements={elements}
            onCreate={handleAddRelationship}
            onUpdateElement={handleUpdateElement}
            onCancel={handleCancelAddRelationship}
            suggestedLabels={activeRelationshipLabels}
            defaultLabel={activeColorScheme?.defaultRelationshipLabel}
            suggestedTags={Object.keys(activeColorScheme?.tagColors || {})}
            />
        ) : selectedRelationship && currentModelId ? (
            <RelationshipDetailsPanel
                relationship={selectedRelationship}
                elements={elements}
                onUpdate={handleUpdateRelationship}
                onDelete={handleDeleteRelationship}
                suggestedLabels={activeRelationshipLabels}
            />
        ) : selectedElement && currentModelId ? (
            <ElementDetailsPanel
                element={selectedElement}
                allElements={elements}
                relationships={relationships}
                onUpdate={handleUpdateElement}
                onDelete={handleDeleteElement}
                onClose={() => setSelectedElementId(null)}
                suggestedTags={Object.keys(activeColorScheme?.tagColors || {})}
            />
        ) : null}
      </div>

      {contextMenu && currentModelId && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          onAddRelationship={() => {
            setPanelState({ view: 'addRelationship', sourceElementId: contextMenu.elementId, targetElementId: null, isNewTarget: false });
            setSelectedElementId(null);
            setSelectedRelationshipId(null);
            closeContextMenu();
          }}
          onDeleteElement={() => {
             handleDeleteElement(contextMenu.elementId);
             closeContextMenu();
          }}
        />
      )}

      {canvasContextMenu && currentModelId && (
        <CanvasContextMenu
            x={canvasContextMenu.x}
            y={canvasContextMenu.y}
            onClose={closeCanvasContextMenu}
            onZoomToFit={handleZoomToFit}
            onAutoLayout={handleStartPhysicsLayout}
            onToggleReport={() => setIsReportPanelOpen(p => !p)}
            onToggleMarkdown={() => setIsMarkdownPanelOpen(p => !p)}
            onToggleJSON={() => setIsJSONPanelOpen(p => !p)}
            onToggleFilter={() => setIsFilterPanelOpen(p => !p)}
            onToggleMatrix={() => setIsMatrixPanelOpen(p => !p)}
            onToggleTable={() => setIsTablePanelOpen(p => !p)}
            onOpenModel={handleImportClick}
            onSaveModel={handleDiskSave}
            onCreateModel={handleNewModelClick}
            isReportOpen={isReportPanelOpen}
            isMarkdownOpen={isMarkdownPanelOpen}
            isJSONOpen={isJSONPanelOpen}
            isFilterOpen={isFilterPanelOpen}
            isMatrixOpen={isMatrixPanelOpen}
            isTableOpen={isTablePanelOpen}
        />
      )}

      {isSettingsModalOpen && (
        <SettingsModal 
          initialSchemes={colorSchemes}
          initialActiveSchemeId={activeSchemeId}
          onClose={() => setIsSettingsModalOpen(false)}
          onSave={(newSchemes, newActiveId) => {
            setColorSchemes(newSchemes);
            setActiveSchemeId(newActiveId);
            setIsSettingsModalOpen(false);
          }}
        />
      )}

      {isCreateModelModalOpen && (
        <CreateModelModal
          onCreate={handleCreateModel}
          onClose={() => setIsCreateModelModalOpen(false)}
          isInitialSetup={!modelsIndex || modelsIndex.length === 0}
        />
      )}

      {isOpenModelModalOpen && (
        <OpenModelModal
          models={modelsIndex}
          onLoad={handleLoadModel}
          onClose={() => setIsOpenModelModalOpen(false)}
          onTriggerCreate={() => {
            setIsOpenModelModalOpen(false);
            setIsCreateModelModalOpen(true);
          }}
        />
      )}
      
      {pendingImport && (
          <ConflictResolutionModal 
            localMetadata={pendingImport.localMetadata}
            diskMetadata={pendingImport.diskMetadata}
            localData={pendingImport.localData}
            diskData={pendingImport.diskData}
            onCancel={() => setPendingImport(null)}
            onChooseLocal={() => {
                handleLoadModel(pendingImport.localMetadata.id);
                setPendingImport(null);
            }}
            onChooseDisk={() => {
                loadModelData(pendingImport.diskData, pendingImport.diskMetadata.id, pendingImport.diskMetadata);
                setPendingImport(null);
            }}
          />
      )}

      {isAboutModalOpen && <AboutModal onClose={() => setIsAboutModalOpen(false)} />}
      {isPatternGalleryModalOpen && <PatternGalleryModal onClose={() => setIsPatternGalleryModalOpen(false)} />}
    </div>
  );
}