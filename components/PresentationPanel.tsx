
import React, { useState } from 'react';
import { StorySlide } from '../types';
import { generateUUID } from '../utils';

interface PresentationPanelProps {
  slides: StorySlide[];
  onSlidesChange: (slides: StorySlide[]) => void;
  onCaptureSlide: () => void;
  onPlay: () => void;
  onClose: () => void;
  isDarkMode: boolean;
}

const PresentationPanel: React.FC<PresentationPanelProps> = ({ slides, onSlidesChange, onCaptureSlide, onPlay, onClose, isDarkMode }) => {
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleEditClick = (slide: StorySlide) => {
      setEditingSlideId(slide.id);
      setEditTitle(slide.title);
      setEditDesc(slide.description);
  };

  const handleSaveEdit = () => {
      if (editingSlideId) {
          const updated = slides.map(s => s.id === editingSlideId ? { ...s, title: editTitle, description: editDesc } : s);
          onSlidesChange(updated);
          setEditingSlideId(null);
      }
  };

  const handleDelete = (id: string) => {
      if (confirm("Delete this slide?")) {
          onSlidesChange(slides.filter(s => s.id !== id));
      }
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
      const newSlides = [...slides];
      if (direction === 'up' && index > 0) {
          [newSlides[index], newSlides[index - 1]] = [newSlides[index - 1], newSlides[index]];
      } else if (direction === 'down' && index < slides.length - 1) {
          [newSlides[index], newSlides[index + 1]] = [newSlides[index + 1], newSlides[index]];
      }
      onSlidesChange(newSlides);
  };

  const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const headerBgClass = isDarkMode ? 'bg-gray-900' : 'bg-gray-100';
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const cardBgClass = isDarkMode ? 'bg-gray-700' : 'bg-gray-50';
  const cardBorderClass = isDarkMode ? 'border-gray-600' : 'border-gray-300';
  const subTextClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const inputBgClass = isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  return (
    <div className={`w-full h-full flex flex-col ${bgClass}`}>
        <div className={`p-4 border-b ${borderClass} flex justify-between items-center ${headerBgClass}`}>
            <h2 className={`text-xl font-bold ${textClass}`}>Story Mode</h2>
            <div className="flex gap-2">
                <button 
                    onClick={onPlay}
                    disabled={slides.length === 0}
                    className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                    Play
                </button>
                <button onClick={onClose} className={`${subTextClass} hover:text-blue-500 p-1`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>

        <div className={`p-4 ${bgClass} border-b ${borderClass}`}>
            <button 
                onClick={onCaptureSlide}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded flex justify-center items-center gap-2 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Capture Current View
            </button>
            <p className={`text-xs ${subTextClass} mt-2 text-center`}>
                Pan and zoom the graph to the desired view, select a node to focus (optional), then click Capture.
            </p>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-3">
            {slides.length === 0 && (
                <div className={`text-center ${subTextClass} mt-8 italic`}>No slides yet. Capture some views to tell a story.</div>
            )}
            
            {slides.map((slide, index) => (
                <div key={slide.id} className={`${cardBgClass} rounded border ${cardBorderClass} p-3 flex flex-col gap-2`}>
                    {editingSlideId === slide.id ? (
                        <div className="flex flex-col gap-2">
                            <input 
                                type="text" 
                                value={editTitle} 
                                onChange={e => setEditTitle(e.target.value)} 
                                className={`${inputBgClass} rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border`}
                                placeholder="Slide Title"
                            />
                            <textarea 
                                value={editDesc} 
                                onChange={e => setEditDesc(e.target.value)} 
                                className={`${inputBgClass} rounded px-2 py-1 text-sm focus:outline-none h-16 resize-none border`}
                                placeholder="Speaker notes / Description"
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingSlideId(null)} className={`text-xs ${subTextClass} hover:${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Cancel</button>
                                <button onClick={handleSaveEdit} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-500">Save</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-start">
                                <div className="flex gap-2 items-center">
                                    <span className={`${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'} text-xs px-1.5 py-0.5 rounded font-mono`}>{index + 1}</span>
                                    <h3 className={`font-bold ${textClass} text-sm`}>{slide.title}</h3>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => moveSlide(index, 'up')} disabled={index === 0} className={`${subTextClass} hover:${isDarkMode ? 'text-white' : 'text-gray-900'} disabled:opacity-30`}><svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg></button>
                                    <button onClick={() => moveSlide(index, 'down')} disabled={index === slides.length - 1} className={`${subTextClass} hover:${isDarkMode ? 'text-white' : 'text-gray-900'} disabled:opacity-30`}><svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                                </div>
                            </div>
                            {slide.description && <p className={`text-xs ${subTextClass} line-clamp-2`}>{slide.description}</p>}
                            <div className={`flex justify-end gap-2 mt-1 border-t ${borderClass} pt-2`}>
                                <button onClick={() => handleEditClick(slide)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                                <button onClick={() => handleDelete(slide.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
};

export default PresentationPanel;
