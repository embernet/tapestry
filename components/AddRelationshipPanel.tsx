import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Fact, Relationship, RelationshipDirection } from '../types';
import FactEditor from './FactEditor';

// Define a type for the data needed to create a new fact.
type NewFactData = Omit<Fact, 'id' | 'createdAt' | 'updatedAt'>;

interface AddRelationshipPanelProps {
  sourceFact: Fact;
  allFacts: Fact[];
  onCreate: (relationship: Omit<Relationship, 'id' | 'tags'>, newFact?: NewFactData) => void;
  onUpdateFact: (fact: Fact) => void;
  onCancel: () => void;
  targetFactId?: string | null;
  isNewTarget?: boolean;
}

const AddRelationshipPanel: React.FC<AddRelationshipPanelProps> = ({
  sourceFact,
  allFacts,
  onCreate,
  onUpdateFact,
  onCancel,
  targetFactId,
  isNewTarget,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string>(targetFactId || 'NEW_FACT');
  const [factEditorData, setFactEditorData] = useState<Partial<Fact>>({
    name: '',
    type: 'Default',
    notes: '',
    tags: []
  });
  const [label, setLabel] = useState('');
  const [direction, setDirection] = useState<RelationshipDirection>(RelationshipDirection.To);
  const labelInputRef = useRef<HTMLInputElement>(null);

  const targetFact = useMemo(() => allFacts.find(f => f.id === targetFactId), [allFacts, targetFactId]);

  useEffect(() => {
    // If a target is pre-selected from a drag-connect action, focus the label input.
    if (targetFactId && labelInputRef.current) {
        setTimeout(() => {
            labelInputRef.current?.focus();
        }, 100);
    }

    if (isNewTarget && targetFact) {
        setFactEditorData(targetFact);
    } else {
        setFactEditorData({ name: '', type: 'Default', notes: '', tags: [] });
    }
  }, [targetFactId, isNewTarget, targetFact]);

  const handleSubmit = () => {
    if (!label.trim()) {
        alert("Please provide a label for the relationship.");
        return;
    }

    if (isNewTarget && targetFactId) {
        if (!factEditorData.name?.trim()) {
            alert("Please provide a name for the new fact.");
            return;
        }
        // Update the newly created fact, then create the relationship to it
        onUpdateFact(factEditorData as Fact);
        onCreate({ source: sourceFact.id, target: targetFactId, label: label.trim(), direction });
    } else if (selectedTargetId === 'NEW_FACT') {
      if (!factEditorData.name?.trim()) {
        alert("Please provide a name for the new fact.");
        return;
      }
      onCreate(
        { source: sourceFact.id, target: 'new-fact-placeholder', label: label.trim(), direction },
        { ...factEditorData, name: factEditorData.name.trim(), type: factEditorData.type?.trim() || 'Default' } as NewFactData
      );
    } else {
      onCreate(
        { source: sourceFact.id, target: selectedTargetId, label: label.trim(), direction }
      );
    }
  };

  const handleFactEditorChange = (updatedData: Partial<Fact>) => {
    setFactEditorData(prev => ({...prev, ...updatedData}));
  };

  const availableTargets = useMemo(() => allFacts.filter(f => f.id !== sourceFact.id), [allFacts, sourceFact.id]);

  const showFactEditor = isNewTarget || selectedTargetId === 'NEW_FACT';

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Pressing Enter in any field (except textarea) should submit the form.
    if (event.key === 'Enter' && (event.target as HTMLElement).tagName.toLowerCase() !== 'textarea') {
      event.preventDefault();
      handleSubmit();
    }
    // Pressing Escape should cancel.
    if (event.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="bg-gray-800 border-l border-gray-700 h-full w-96 flex-shrink-0 z-20" onKeyDown={handleKeyDown}>
      <div className="p-6 flex flex-col h-full">
        <div className="flex-shrink-0 mb-6">
          <h2 className="text-2xl font-bold text-white">Add Relationship</h2>
          <p className="text-gray-400 mt-1">From: <span className="font-semibold text-blue-400">{sourceFact.name}</span></p>
        </div>

        <div className="flex-grow space-y-4 text-gray-300 overflow-y-auto pr-2">
          {/* Relationship Fields */}
          <div>
            <label className="block text-sm font-medium">Label</label>
            <input
              ref={labelInputRef}
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., works at, is related to"
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as RelationshipDirection)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={RelationshipDirection.To}>{sourceFact.name} → Target</option>
              <option value={RelationshipDirection.From}>Target → {sourceFact.name}</option>
              <option value={RelationshipDirection.None}>{sourceFact.name} — Target</option>
            </select>
          </div>
          
          {isNewTarget ? (
             <div>
                <label className="block text-sm font-medium">Target</label>
                <p className="mt-1 p-2 bg-gray-700 rounded-md font-semibold">{targetFact?.name}</p>
             </div>
          ) : (
             <div>
              <label className="block text-sm font-medium">Target</label>
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="NEW_FACT">-- Create New Fact --</option>
                {availableTargets.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          )}
          
          {/* New Fact Fields (using FactEditor) */}
          {showFactEditor && (
            <div className="pt-4 mt-4 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                {isNewTarget ? `Edit New Fact` : `New Fact Details`}
              </h3>
              <FactEditor
                factData={factEditorData}
                onDataChange={handleFactEditorChange}
              />
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 mt-auto pt-6 flex justify-end items-center space-x-4">
          <button
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRelationshipPanel;