/** @jsxImportSource react */
import { ReactNode, useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Header } from '../navigation/Header';
import { Sidebar } from '../navigation/Sidebar';
import { AIPanel } from '../ui/AIPanel';
import CommentIcon from '@atlaskit/icon/core/comment';
import AlignLeftIcon from '@atlaskit/icon/core/align-left';
import VideoIcon from '@atlaskit/icon/core/video';
import AutomationIcon from '@atlaskit/icon/core/automation';
import AppsIcon from '@atlaskit/icon/core/apps';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  selectedText?: string;
  onTextSelect?: (text: string) => void;
  editorContent?: string;
  isAiPanelOpen: boolean;
  setIsAiPanelOpen: (open: boolean) => void;
}

interface SelectionState {
  text: string;
  range: Range | null;
  highlightElement: HTMLElement | null;
}

export function MainLayout({ 
  children, 
  className, 
  selectedText, 
  onTextSelect, 
  editorContent,
  isAiPanelOpen,
  setIsAiPanelOpen 
}: MainLayoutProps) {
  const [referenceState, setReferenceState] = useState<SelectionState>({ text: '', range: null, highlightElement: null });
  const mainContentRef = useRef<HTMLDivElement>(null);
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const captureSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    
    if (!text) return false;

    try {
      // Create highlight element
      const highlightSpan = document.createElement('span');
      highlightSpan.className = 'reference-highlight';
      
      // Clone the range to avoid modifying the original selection
      const clonedRange = range.cloneRange();
      
      // Surround the selected content with our highlight span
      clonedRange.surroundContents(highlightSpan);
      
      // Store the reference state
      setReferenceState({
        text,
        range: clonedRange,
        highlightElement: highlightSpan
      });
      
      // Notify parent components
      if (onTextSelect) {
        onTextSelect(text);
      }
      
      return true;
    } catch (error) {
      console.error('Error applying highlight:', error);
      return false;
    }
  };

  const handleClearSelection = () => {
    if (referenceState.highlightElement) {
      try {
        const parent = referenceState.highlightElement.parentNode;
        if (parent) {
          // Insert the text content before the highlight span
          const textNode = document.createTextNode(referenceState.highlightElement.textContent || '');
          parent.insertBefore(textNode, referenceState.highlightElement);
          // Remove the highlight span
          parent.removeChild(referenceState.highlightElement);
          // Normalize to merge adjacent text nodes
          parent.normalize();
        }
      } catch (error) {
        console.error('Error clearing highlight:', error);
      }
    }

    setReferenceState({ text: '', range: null, highlightElement: null });
    if (onTextSelect) {
      onTextSelect('');
    }
  };

  const toggleAiPanel = () => {
    if (!isAiPanelOpen) {
      // Try to capture selection if it exists
      const selection = window.getSelection();
      const hasSelection = selection && selection.toString().trim().length > 0;
      
      if (hasSelection) {
        // Capture the selection before opening the panel
        captureSelection();
      }
      
      // Open the panel
      setIsAiPanelOpen(true);
    } else {
      // When closing, always clear selection and highlight
      handleClearSelection();
      // Clear any existing selection
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
      setIsAiPanelOpen(false);
    }
  };

  // Add effect to clear highlight when panel is closed
  useEffect(() => {
    if (!isAiPanelOpen) {
      handleClearSelection();
      // Clear any existing selection
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
    }
  }, [isAiPanelOpen]);

  // Prevent selection changes when panel is open, except in the editor
  useEffect(() => {
    if (isAiPanelOpen) {
      const handleSelectionChange = (e: Event) => {
        // Get the target element
        const target = e.target as Node;
        const mainContent = mainContentRef.current;

        // Allow selection if the target is within the main content area
        if (mainContent && (mainContent === target || mainContent.contains(target))) {
          // Clear any existing timeout
          if (selectionTimeoutRef.current) {
            clearTimeout(selectionTimeoutRef.current);
          }

          // Set a new timeout to handle the selection
          selectionTimeoutRef.current = setTimeout(() => {
            const selection = window.getSelection();
            const hasSelection = selection && selection.toString().trim().length > 0;
            
            if (hasSelection) {
              handleClearSelection();
              captureSelection();
            }
          }, 100); // Small delay to allow selection to stabilize

          return true;
        }

        // Prevent selection everywhere else
        e.preventDefault();
        e.stopPropagation();
        return false;
      };

      const handleClearHighlight = () => {
        handleClearSelection();
      };

      document.addEventListener('selectstart', handleSelectionChange, true);
      document.addEventListener('selectionchange', handleSelectionChange, true);
      window.addEventListener('clearReferenceHighlight', handleClearHighlight);
      
      return () => {
        document.removeEventListener('selectstart', handleSelectionChange, true);
        document.removeEventListener('selectionchange', handleSelectionChange, true);
        window.removeEventListener('clearReferenceHighlight', handleClearHighlight);
        // Clear any existing timeout on cleanup
        if (selectionTimeoutRef.current) {
          clearTimeout(selectionTimeoutRef.current);
        }
      };
    }
  }, [isAiPanelOpen]);

  return (
    <div className={cn("min-h-screen bg-[#F9FAFB]", className)}>
      <Header 
        isAiPanelOpen={isAiPanelOpen}
        onTextSelect={onTextSelect}
      />
      <div className="flex h-screen pt-[48px]">
        <Sidebar />
        <div 
          ref={mainContentRef}
          className={cn(
            "flex-1 overflow-auto main-content relative transition-all duration-300 ease-in-out",
            isAiPanelOpen ? "mr-[400px]" : "mr-0"
          )}
        >
          {children}

          {/* Floating Toolbar */}
          <div className="fixed bottom-[72px] flex flex-col items-center gap-2 z-50 transition-all duration-300 ease-in-out shadow-[0_4px_24px_0_rgba(0,0,0,0.24)] bg-white rounded-[64px] p-1 w-[48px]"
            style={{
              right: isAiPanelOpen ? "412px" : "20px"
            }}
          >
            <button className="w-9 h-9 flex items-center justify-center text-[#42526E] hover:bg-[#F4F5F7] rounded-md">
              <CommentIcon label="" />
            </button>
            <button className="w-9 h-9 flex items-center justify-center text-[#42526E] hover:bg-[#F4F5F7] rounded-md">
              <AlignLeftIcon label="" />
            </button>
            <button className="w-9 h-9 flex items-center justify-center text-[#42526E] hover:bg-[#F4F5F7] rounded-md">
              <VideoIcon label="" />
            </button>
            <button className="w-9 h-9 flex items-center justify-center text-[#42526E] hover:bg-[#F4F5F7] rounded-md">
              <AutomationIcon label="" />
            </button>
            <button className="w-9 h-9 flex items-center justify-center text-[#42526E] hover:bg-[#F4F5F7] rounded-md">
              <AppsIcon label="" />
            </button>
          </div>

          {/* AI Menu Button */}
          <div 
            className={cn(
              "fixed bottom-6 w-[42px] h-[42px] rounded-full bg-gradient-to-r from-[#0065FF] via-[#BF63F3] to-[#FFA900] p-[1px] z-50 transition-all duration-300 ease-in-out shadow-[0_4px_24px_0_rgba(0,0,0,0.24)]",
              isAiPanelOpen ? "right-[416px]" : "right-6"
            )}
          >
            <button
              onClick={toggleAiPanel}
              className="w-full h-full bg-[#1F1F21] hover:bg-[#2C2C2E] rounded-full flex items-center justify-center overflow-hidden"
            >
              <div className={cn(
                "transition-all duration-300 ease-in-out transform",
                isAiPanelOpen ? "rotate-90 scale-0" : "rotate-0 scale-100"
              )}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M1.5 3V4.5H3V3H4.5V1.5H3V0H1.5V1.5H0V3H1.5ZM8 1C8.30931 1 8.58689 1.18989 8.699 1.47817L10.3294 5.6706L14.5218 7.301C14.8101 7.41311 15 7.69069 15 8C15 8.30931 14.8101 8.58689 14.5218 8.699L10.3294 10.3294L8.699 14.5218C8.58689 14.8101 8.30931 15 8 15C7.69069 15 7.41311 14.8101 7.301 14.5218L5.6706 10.3294L1.47817 8.699C1.18989 8.58689 1 8.30931 1 8C1 7.69069 1.18989 7.41311 1.47817 7.301L5.6706 5.6706L7.301 1.47817C7.41311 1.18989 7.69069 1 8 1ZM8 3.81927L6.949 6.52183C6.87279 6.71781 6.71781 6.87279 6.52183 6.949L3.81927 8L6.52183 9.051C6.71781 9.12721 6.87279 9.28219 6.949 9.47817L8 12.1807L9.051 9.47817C9.12721 9.28219 9.28219 9.12721 9.47817 9.051L12.1807 8L9.47817 6.949C9.28219 6.87279 9.12721 6.71781 9.051 6.52183L8 3.81927ZM13 14.5V16H14.5V14.5H16V13H14.5V11.5H13V13H11.5V14.5H13Z" fill="#CECFD2"/>
                </svg>
              </div>
              <div className={cn(
                "absolute transition-all duration-300 ease-in-out transform",
                isAiPanelOpen ? "rotate-0 scale-100" : "-rotate-90 scale-0"
              )}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 1L1 13M1 1L13 13" stroke="#CECFD2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* AI Panel */}
        <AIPanel 
          isOpen={isAiPanelOpen}
          onClose={toggleAiPanel}
          selectedText={referenceState.text || selectedText}
          onClearSelection={handleClearSelection}
          editorContent={editorContent}
        />
      </div>
    </div>
  );
} 