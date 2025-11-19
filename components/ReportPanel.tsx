
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Element, Relationship, RelationshipDirection } from '../types';
import { generateElementMarkdown } from '../utils';

interface ReportPanelProps {
  elements: Element[];
  relationships: Relationship[];
  onClose: () => void;
  onNodeClick: (elementId: string) => void;
}

// Sub-component for a clickable element link
const ElementLink: React.FC<{ element: Element; onNodeClick: (elementId: string) => void; isIndex?: boolean; relCount?: number }> = ({ element, onNodeClick, isIndex = false, relCount }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onNodeClick(element.id);
    if (isIndex) {
      document.getElementById(`element-report-${element.id}`)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const linkText = (isIndex && relCount !== undefined) ? `${element.name} (${relCount})` : element.name;

  return (
    <a href={`#element-report-${element.id}`} onClick={handleClick} className="text-blue-400 hover:underline hover:text-blue-300">
      {isIndex ? linkText : <code className="bg-gray-700 text-blue-300 px-2 py-0.5 rounded-md text-sm">{element.name}</code>}
    </a>
  );
};

// Sub-component for a single relationship line in the report
const RelationshipItem: React.FC<{ rel: Relationship; elementMap: Map<string, Element>; onNodeClick: (elementId: string) => void }> = ({ rel, elementMap, onNodeClick }) => {
  const sourceElement = elementMap.get(rel.source as string);
  const targetElement = elementMap.get(rel.target as string);
  if (!sourceElement || !targetElement) return null;

  let arrow = '';
  switch (rel.direction) {
    case RelationshipDirection.From: arrow = `<--[${rel.label}]--`; break;
    case RelationshipDirection.None: arrow = `---[${rel.label}]---`; break;
    default: arrow = `--[${rel.label}]-->`; break;
  }

  return (
    <li className="flex items-center space-x-2 ml-4">
      <ElementLink element={sourceElement} onNodeClick={onNodeClick} />
      <span className="text-gray-500 text-xs font-mono">{arrow}</span>
      <ElementLink element={targetElement} onNodeClick={onNodeClick} />
    </li>
  );
};

// Sub-component for a element's detailed report section
const ElementReportSection: React.FC<{
  element: Element;
  elementRels: Relationship[];
  elementMap: Map<string, Element>;
  onNodeClick: (elementId: string) => void;
}> = ({ element, elementRels, elementMap, onNodeClick }) => {
  return (
    <div id={`element-report-${element.id}`} className="py-4 scroll-mt-4">
      <h2 className="text-xl font-bold text-white mb-2 border-b border-gray-700 pb-1">{element.name}</h2>
      <div className="pl-2 space-y-2 text-gray-300">
        {element.tags.length > 0 && <p><strong className="font-semibold text-gray-400 w-20 inline-block">Tags:</strong> {element.tags.join(', ')}</p>}
        {element.notes && (
          <div>
            <strong className="font-semibold text-gray-400 w-20 inline-block align-top">Notes:</strong>
            <p className="whitespace-pre-wrap inline-block w-[calc(100%-5rem)]">{element.notes}</p>
          </div>
        )}
        {elementRels.length > 0 && (
          <div className="pt-2">
            <strong className="font-semibold text-gray-400 block mb-1">Relationships:</strong>
            <ul className="space-y-1">
              {elementRels.map(rel => <RelationshipItem key={rel.id} rel={rel} elementMap={elementMap} onNodeClick={onNodeClick} />)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// Main WYSIWYG view component
const WysiwigReport: React.FC<{
  elements: Element[];
  relationships: Relationship[];
  elementMap: Map<string, Element>;
  relStats: Map<string, number>;
  tagStats: Map<string, number>;
  onNodeClick: (elementId: string) => void;
  elementRelCounts: Map<string, number>;
}> = ({ elements, relationships, elementMap, relStats, tagStats, onNodeClick, elementRelCounts }) => {
  if (elements.length === 0) {
    return <p className="text-gray-500 p-4">No elements to display based on the current filter.</p>;
  }

  return (
    <div>
      {/* Index */}
      <div className="py-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white mb-2">Element Index</h2>
        <ul className="list-disc list-inside columns-2 text-gray-300">
          {elements.map(element => (
            <li key={`index-${element.id}`}>
                <ElementLink 
                    element={element} 
                    onNodeClick={onNodeClick} 
                    isIndex 
                    relCount={elementRelCounts.get(element.id) || 0}
                />
            </li>
          ))}
        </ul>
      </div>

      {/* Details */}
      <div className="divide-y divide-gray-700">
        {elements.map(element => {
          const elementRels = relationships.filter(r => r.source === element.id || r.target === element.id);
          return <ElementReportSection key={element.id} element={element} elementRels={elementRels} elementMap={elementMap} onNodeClick={onNodeClick} />;
        })}
      </div>
      
      {/* Appendix */}
      <div className="py-4 mt-4 border-t border-gray-600 text-gray-300">
        <h2 className="text-xl font-bold text-white mb-3">Appendix</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Relationship Types</h3>
                {relStats.size > 0 ? (
                    <ul className="list-disc list-inside">
                        {Array.from(relStats.entries()).map(([label, count]) => <li key={label}>{label}: {count}</li>)}
                    </ul>
                ) : <p className="text-gray-500">No relationships.</p>}
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Tag Usage</h3>
                {tagStats.size > 0 ? (
                    <ul className="list-disc list-inside">
                        {Array.from(tagStats.entries()).map(([tag, count]) => <li key={tag}>{tag}: {count}</li>)}
                    </ul>
                ) : <p className="text-gray-500">No tags used.</p>}
            </div>
        </div>
      </div>
    </div>
  );
};

const generateMarkdownReport = (
  elements: Element[],
  relationships: Relationship[],
  elementMap: Map<string, Element>,
  relStats: Map<string, number>,
  tagStats: Map<string, number>,
  elementRelCounts: Map<string, number>
): string => {
  if (elements.length === 0) {
    return "No elements to display based on the current filter.";
  }

  const sections: string[] = [];

  // Index
  const indexLines = ["# Element Index", ...elements.map(e => `- ${e.name} (${elementRelCounts.get(e.id) || 0})`)];
  sections.push(indexLines.join('\n'));

  // Details
  const detailLines: string[] = ["# Element Details"];
  elements.forEach(element => {
    // Use shared helper for consistency
    const elementMarkdown = generateElementMarkdown(element, relationships, elements);
    detailLines.push(elementMarkdown);
  });
  sections.push(detailLines.join('\n\n---\n\n'));

  // Appendix
  const appendixLines = ["# Appendix"];
  appendixLines.push("## Relationship Types");
  if (relStats.size > 0) {
      Array.from(relStats.entries()).forEach(([label, count]) => appendixLines.push(`- ${label}: ${count}`));
  } else {
      appendixLines.push("No relationships.");
  }

  appendixLines.push("\n## Tag Usage");
  if (tagStats.size > 0) {
      Array.from(tagStats.entries()).forEach(([tag, count]) => appendixLines.push(`- ${tag}: ${count}`));
  } else {
      appendixLines.push("No tags used.");
  }
  sections.push(appendixLines.join('\n'));

  return sections.join('\n\n====================\n\n');
};


export const ReportPanel: React.FC<ReportPanelProps> = ({ elements, relationships, onClose, onNodeClick }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'wysiwig' | 'markdown'>('wysiwig');

  const [searchTerm, setSearchTerm] = useState('');
  const [matches, setMatches] = useState<HTMLElement[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const reportContentRef = useRef<HTMLDivElement>(null);
  
  const { sortedElements, elementMap, relStats, tagStats, elementRelCounts } = useMemo(() => {
    const sortedElements = [...elements].sort((a, b) => a.name.localeCompare(b.name));
    const elementMap = new Map(elements.map(f => [f.id, f]));
    
    const relStats = new Map<string, number>();
    relationships.forEach(rel => {
      relStats.set(rel.label, (relStats.get(rel.label) || 0) + 1);
    });

    const tagStats = new Map<string, number>();
    elements.forEach(element => {
      element.tags.forEach(tag => {
        tagStats.set(tag, (tagStats.get(tag) || 0) + 1);
      });
    });
    
    const elementRelCounts = new Map<string, number>();
    // Initialize all visible elements with a count of 0
    elements.forEach(f => elementRelCounts.set(f.id, 0));
    // The relationships prop is already filtered, so this counts only visible relationships
    relationships.forEach(rel => {
        const sourceId = rel.source as string;
        const targetId = rel.target as string;
        // Increment count for both source and target of the relationship
        elementRelCounts.set(sourceId, (elementRelCounts.get(sourceId) || 0) + 1);
        elementRelCounts.set(targetId, (elementRelCounts.get(targetId) || 0) + 1);
    });

    return { sortedElements, elementMap, relStats, tagStats, elementRelCounts };
  }, [elements, relationships]);

  const reportText = useMemo(() => {
    return generateMarkdownReport(sortedElements, relationships, elementMap, relStats, tagStats, elementRelCounts);
  }, [sortedElements, relationships, elementMap, relStats, tagStats, elementRelCounts]);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleNextMatch = () => {
    if (matches.length > 0) {
      setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
    }
  };

  const handlePreviousMatch = () => {
    if (matches.length > 0) {
      setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchTerm('');
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePreviousMatch();
      } else {
        handleNextMatch();
      }
    }
  };

  useEffect(() => {
    if (!reportContentRef.current) return;
    const content = reportContentRef.current;

    const unwrapHighlights = () => {
        const highlights = content.querySelectorAll('span.search-highlight, span.current-search-highlight');
        highlights.forEach(el => {
            const parent = el.parentNode;
            if (parent) {
                while (el.firstChild) {
                    parent.insertBefore(el.firstChild, el);
                }
                parent.removeChild(el);
            }
        });
        content.normalize();
    };
    
    unwrapHighlights();

    if (searchTerm.length < 3) {
      setMatches([]);
      setCurrentMatchIndex(0);
      return;
    }

    const regex = new RegExp(searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, null);
    const textNodes: Text[] = [];
    let currentNode = walker.nextNode();
    while (currentNode) {
        textNodes.push(currentNode as Text);
        currentNode = walker.nextNode();
    }

    textNodes.reverse().forEach(node => {
        if (node.textContent && regex.test(node.textContent)) {
            const text = node.textContent;
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            let match;
            regex.lastIndex = 0;
            
            while ((match = regex.exec(text)) !== null) {
                if (match.index > lastIndex) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                }
                const span = document.createElement('span');
                span.className = 'search-highlight bg-yellow-500 bg-opacity-50';
                span.textContent = match[0];
                fragment.appendChild(span);
                lastIndex = regex.lastIndex;
            }
            if (lastIndex < text.length) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            }
            node.parentNode?.replaceChild(fragment, node);
        }
    });
    setMatches(Array.from(content.querySelectorAll<HTMLElement>('span.search-highlight')));
    setCurrentMatchIndex(0);

  }, [searchTerm, reportText, viewMode]);

  useEffect(() => {
    matches.forEach((match, index) => {
        match.className = index === currentMatchIndex ? 'current-search-highlight bg-orange-500 rounded' : 'search-highlight bg-yellow-500 bg-opacity-50 rounded';
    });
    if (matches[currentMatchIndex]) {
        matches[currentMatchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentMatchIndex, matches]);

  return (
    <div className="bg-gray-800 border-l border-gray-700 h-full w-[576px] flex-shrink-0 z-20 flex flex-col">
      <div className="p-4 flex-shrink-0 flex justify-between items-center border-b border-gray-700">
        <h2 className="text-2xl font-bold text-white">Report</h2>
        <div className="flex items-center space-x-1">
            <div className="flex items-center space-x-1">
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-32 transition-all focus:w-40"
                />
                <button onClick={handlePreviousMatch} disabled={matches.length === 0} title="Previous (Shift+Enter)" className="p-2 rounded-md text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                </button>
                <button onClick={handleNextMatch} disabled={matches.length === 0} title="Next (Enter)" className="p-2 rounded-md text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {searchTerm.length >= 3 && (
                  <span className="text-xs text-gray-500 w-16 text-center">
                      {matches.length > 0 ? `${currentMatchIndex + 1} / ${matches.length}` : '0 results'}
                  </span>
                )}
            </div>
            <div className="border-l border-gray-600 h-6 mx-2"></div>
            <button
                onClick={() => setViewMode(prev => prev === 'wysiwig' ? 'markdown' : 'wysiwig')}
                title={viewMode === 'wysiwig' ? "Switch to Markdown View" : "Switch to Rendered View"}
                className="p-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition"
            >
                {viewMode === 'wysiwig' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                )}
            </button>
            <button
                onClick={handleCopy}
                title={isCopied ? "Copied!" : "Copy Report"}
                className="p-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition disabled:opacity-50"
                disabled={isCopied}
            >
                {isCopied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                )}
            </button>
            <button onClick={onClose} className="p-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
      </div>
      <div ref={reportContentRef} className="flex-grow p-6 overflow-y-auto">
        {viewMode === 'wysiwig' ? (
          <WysiwigReport
            elements={sortedElements}
            relationships={relationships}
            elementMap={elementMap}
            relStats={relStats}
            tagStats={tagStats}
            onNodeClick={onNodeClick}
            elementRelCounts={elementRelCounts}
          />
        ) : (
          <textarea
            readOnly
            value={reportText}
            className="w-full h-full flex-grow bg-gray-900 border border-gray-600 rounded-md p-4 text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>
    </div>
  );
};
