import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { PlusIcon } from '@/components/ui/icons/PlusIcon';
import { SparkleIcon } from '@/components/ui/icons/SparkleIcon';

interface PlusButtonProps {
  position: { top: number };
  isHovering: boolean;
  setIsHovering: (isHovering: boolean) => void;
  onClick: () => void;
  isAIMode?: boolean;
}

export const PlusButton = forwardRef<HTMLButtonElement, PlusButtonProps>(({
  position,
  isHovering,
  setIsHovering,
  onClick,
  isAIMode = false
}, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "absolute w-6 h-6 flex items-center justify-center rounded-full transition-colors inset-x-0 mx-auto",
        isAIMode ? "ai-button" : "bg-gray-100 hover:bg-gray-200 plus-button"
      )}
      style={{
        top: `${position.top}px`,
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      aria-label="Insert content"
    >
      <div className={`icon-morph-container ${isAIMode ? 'morph-to-sparkle' : 'morph-to-plus'}`}>
        <div className="plus-icon">
          <PlusIcon className="w-3.5 h-3.5 text-gray-600" />
        </div>
        <div className="sparkle-icon">
          <SparkleIcon className="w-3.5 h-3.5 text-blue-600" />
        </div>
      </div>
    </button>
  );
}); 