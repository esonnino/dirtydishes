import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { InsertionOption } from '../TextEditor';

interface EditorDropdownProps {
  position: { top: number; left: number };
  options: InsertionOption[];
  selectedIndex: number;
  filterText: string;
  onOptionClick: (option: InsertionOption) => void;
  onOptionHover: (index: number) => void;
}

export const EditorDropdown = forwardRef<HTMLDivElement, EditorDropdownProps>(({
  position,
  options,
  selectedIndex,
  filterText,
  onOptionClick,
  onOptionHover
}, ref) => {
  return (
    <div
      ref={ref}
      className="absolute z-10 w-64 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden dropdown"
      style={{
        top: `${position.top + 5}px`,
        left: `${position.left + 40}px`,
      }}
    >
      {options.length > 0 ? (
        <div className="max-h-72 overflow-y-auto py-1">
          {options.map((option, index) => {
            const label = option.label;
            let highlightedLabel;
            
            if (filterText && label.toLowerCase().includes(filterText.toLowerCase()) && option.id !== 'ask-rovo-dynamic') {
              const regex = new RegExp(`(${filterText})`, 'i');
              highlightedLabel = label.split(regex).map((part, i) => 
                regex.test(part) ? <span key={i} className="highlight">{part}</span> : part
              );
            } else {
              highlightedLabel = label;
            }
            
            return (
              <button
                key={option.id}
                className={cn(
                  "w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-3",
                  selectedIndex === index ? "bg-gray-100" : "",
                  (option.id === 'ai-prompt' || option.id === 'ask-rovo-dynamic') ? "ai-option" : ""
                )}
                onClick={() => onOptionClick(option)}
                onMouseEnter={() => onOptionHover(index)}
              >
                <span className="flex-shrink-0">{option.icon}</span>
                <span className="dropdown-label">{highlightedLabel}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="py-2 px-3 text-sm text-gray-500">
          No matching options found
        </div>
      )}
    </div>
  );
}); 