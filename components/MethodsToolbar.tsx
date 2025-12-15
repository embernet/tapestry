
import React, { useState, useRef } from 'react';

interface MethodsToolbarProps {
  onSelectTool: (method: string, tool: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
}

const METHODS_DATA = [
  {
    id: 'scamper',
    name: 'SCAMPER',
    desc: 'Ideation & Modification',
    color: 'text-cyan-400',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    subItems: [
      {
        id: 'S', name: 'Substitute', desc: 'Replace parts, materials, or people.', color: 'text-cyan-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
      },
      {
        id: 'C', name: 'Combine', desc: 'Merge functions, units, or ideas.', color: 'text-blue-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
      },
      {
        id: 'A', name: 'Adapt', desc: 'Adjust to new contexts or purposes.', color: 'text-purple-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
      },
      {
        id: 'M', name: 'Modify', desc: 'Change shape, scale, or attributes.', color: 'text-pink-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
      },
      {
        id: 'P', name: 'Put to another use', desc: 'Repurpose for different problems.', color: 'text-red-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      },
      {
        id: 'E', name: 'Eliminate', desc: 'Remove non-essentials or waste.', color: 'text-orange-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      },
      {
        id: 'R', name: 'Reverse', desc: 'Invert processes or rearrange.', color: 'text-green-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
      }
    ]
  },
  {
    id: 'triz',
    name: 'TRIZ',
    desc: 'Inventive Problem Solving',
    color: 'text-indigo-400',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    subItems: [
      {
        id: 'contradiction', name: 'Contradiction Matrix', desc: 'Solve technical conflicts.', color: 'text-indigo-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M10 8h4M8 10v4M10 16h4M16 10v4" opacity="0.5" /></svg>
      },
      {
        id: 'principles', name: '40 Principles', desc: 'Apply inventive patterns.', color: 'text-violet-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
      },
      {
        id: 'ariz', name: 'ARIZ', desc: 'Complex problem algorithm.', color: 'text-pink-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
      },
      {
        id: 'sufield', name: 'Su-Field', desc: 'Substance-Field Analysis.', color: 'text-rose-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
      },
      {
        id: 'trends', name: 'Evolution Trends', desc: 'Predict system future.', color: 'text-teal-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
      }
    ]
  },
  {
    id: 'lss',
    name: 'Lean Six Sigma',
    desc: 'Process Improvement',
    color: 'text-blue-400',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    subItems: [
      {
        id: 'charter', name: 'Project Charter', desc: 'Problem, Scope, Goals', color: 'text-indigo-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      },
      {
        id: 'sipoc', name: 'SIPOC', desc: 'Suppliers, Inputs, Process...', color: 'text-teal-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
      },
      {
        id: 'voc', name: 'Voice of Customer', desc: 'Customer Needs', color: 'text-pink-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3" /></svg>
      },
      {
        id: 'ctq', name: 'CTQ Tree', desc: 'Critical-to-Quality', color: 'text-emerald-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
      },
      {
        id: 'stakeholder', name: 'Stakeholder Analysis', desc: 'Influence & Interest', color: 'text-amber-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
      },
      {
        id: 'dmaic', name: 'DMAIC', desc: 'Improvement Cycle', color: 'text-blue-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
      },
      {
        id: '5whys', name: '5 Whys', desc: 'Root Cause Analysis', color: 'text-orange-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      },
      {
        id: 'fishbone', name: 'Fishbone', desc: 'Ishikawa Diagram', color: 'text-emerald-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M4 12l6-6M4 12l6 6M20 12l-6-6M20 12l-6 6" /></svg>
      },
      {
        id: 'fmea', name: 'FMEA', desc: 'Failure Modes & Effects', color: 'text-red-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      },
      {
        id: 'vsm', name: 'VSM', desc: 'Value Stream Mapping', color: 'text-violet-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
      }
    ]
  },
  {
    id: 'toc',
    name: 'Theory of Constraints',
    desc: 'Constraint Management',
    color: 'text-amber-400',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    subItems: [
      {
        id: 'crt', name: 'Current Reality Tree', desc: 'Identify Core Constraints', color: 'text-amber-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      },
      {
        id: 'ec', name: 'Evaporating Cloud', desc: 'Resolve Conflicts', color: 'text-blue-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
      },
      {
        id: 'frt', name: 'Future Reality Tree', desc: 'Visualize Solutions', color: 'text-emerald-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      },
      {
        id: 'tt', name: 'Transition Tree', desc: 'Implementation Plan', color: 'text-violet-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      }
    ]
  },
  {
    id: 'ssm',
    name: 'Soft Systems',
    desc: 'Complex Problem Solving',
    color: 'text-cyan-400',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    subItems: [
      {
        id: 'rich_picture', name: 'Rich Picture', desc: 'Explore Relationships', color: 'text-cyan-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      },
      {
        id: 'catwoe', name: 'CATWOE', desc: 'Worldview Analysis', color: 'text-purple-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      },
      {
        id: 'activity_models', name: 'Activity Models', desc: 'Root Definitions', color: 'text-pink-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
      },
      {
        id: 'comparison', name: 'Comparison', desc: 'Debate & Accommodate', color: 'text-green-400',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
      }
    ]
  }
];

const MethodsToolbar: React.FC<MethodsToolbarProps> = ({
  onSelectTool,
  isCollapsed,
  onToggle,
  isDarkMode
}) => {
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [submenuTop, setSubmenuTop] = useState(0);

  const handleMethodMouseEnter = (e: React.MouseEvent, methodId: string) => {
    setHoveredMethod(methodId);
    // Calculate top position relative to the container
    if (containerRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      setSubmenuTop(rect.top - containerRect.top);
    }
  };

  const handleMouseLeave = () => {
    setHoveredMethod(null);
  };

  const bgClass = isDarkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-600' : 'bg-white hover:bg-gray-50 border-gray-200';
  const dropdownBg = isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-200';
  const submenuBg = isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-200';
  const headerBg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
  const itemHover = isDarkMode ? 'hover:bg-gray-800 border-gray-700' : 'hover:bg-gray-50 border-gray-100';
  const textMain = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const textHeader = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const textItem = isDarkMode ? 'text-gray-200 group-hover:text-white' : 'text-gray-800 group-hover:text-black';
  const textDesc = isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-700';
  const activeItemClass = isDarkMode ? 'bg-gray-800' : 'bg-gray-50';

  const activeSubItems = METHODS_DATA.find(m => m.id === hoveredMethod)?.subItems || [];

  return (
    <div className="relative pointer-events-auto" onMouseLeave={handleMouseLeave}>
      {/* Collapse Toggle / Main Button */}
      <div className="relative">
        <button
          onClick={onToggle}
          className={`h-20 w-20 border shadow-lg rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${bgClass} ${!isCollapsed ? 'ring-2 ring-indigo-500' : ''}`}
          title={isCollapsed ? "Expand Methods" : "Close Methods"}
        >
          <div className="relative w-8 h-8 flex items-center justify-center text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <span className={`text-xs font-bold tracking-wider ${textMain}`}>METHODS</span>
        </button>
      </div>

      {!isCollapsed && (
        <div className="relative">
          {/* Main Dropdown */}
          <div
            ref={containerRef}
            className={`absolute top-2 left-0 w-64 border rounded-lg shadow-2xl z-[940] flex flex-col overflow-hidden animate-fade-in-down ${dropdownBg}`}
          >
            <div className={`p-2 border-b flex justify-between items-center ${headerBg}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider pl-1 ${textHeader}`}>
                Problem Solving Methods
              </span>
            </div>

            {METHODS_DATA.map(method => (
              <div
                key={method.id}
                onMouseEnter={(e) => handleMethodMouseEnter(e, method.id)}
                className={`flex items-center text-left p-3 border-b last:border-0 transition-colors cursor-pointer group ${method.id === hoveredMethod ? activeItemClass : itemHover}`}
              >
                <div className={`mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 ${method.color}`}>
                  {method.icon}
                </div>
                <div className="flex-grow">
                  <div className={`font-bold text-sm mb-0.5 ${textItem}`}>{method.name}</div>
                  <p className={`text-xs leading-tight ${textDesc}`}>
                    {method.desc}
                  </p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>

          {/* Side Submenu */}
          {hoveredMethod && activeSubItems.length > 0 && (
            <div
              className={`absolute left-64 w-60 border rounded-lg shadow-2xl z-[950] flex flex-col overflow-hidden animate-fade-in ${submenuBg}`}
              style={{ top: submenuTop }}
              onMouseEnter={() => setHoveredMethod(hoveredMethod)} // Keep open when moving to submenu
            >
              <div className={`p-2 border-b flex justify-between items-center ${headerBg}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider pl-1 ${textHeader}`}>
                  {METHODS_DATA.find(m => m.id === hoveredMethod)?.name} Tools
                </span>
              </div>
              {activeSubItems.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => onSelectTool(hoveredMethod!, sub.id)}
                  className={`flex items-start text-left p-3 border-b last:border-0 transition-colors group ${itemHover}`}
                >
                  <div className={`mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 ${sub.color || METHODS_DATA.find(m => m.id === hoveredMethod)?.color}`}>
                    {sub.icon}
                  </div>
                  <div>
                    <div className={`font-bold text-sm mb-0.5 ${textItem}`}>{sub.name}</div>
                    <p className={`text-xs leading-tight ${textDesc}`}>
                      {sub.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MethodsToolbar;
