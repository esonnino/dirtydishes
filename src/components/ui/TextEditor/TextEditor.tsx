'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { PlusIcon } from '@/components/ui/icons/PlusIcon';
import { SparkleIcon } from '@/components/ui/icons/SparkleIcon';
import { useClickOutside } from '@/hooks/useClickOutside';
import './TextEditor.css';

export interface InsertionOption {
  id: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
  action: (editor: HTMLDivElement, line: HTMLElement) => void;
}

export interface TextEditorProps {
  initialValue?: string;
  onChange?: (value: string) => void;
  onSelect?: (selectedText: string) => void;
  className?: string;
  placeholder?: string;
  emptyLinePlaceholder?: string;
  insertionOptions?: InsertionOption[];
}

export const TextEditor: React.FC<TextEditorProps> = ({
  initialValue = '',
  onChange,
  onSelect,
  className,
  placeholder = 'Start typing...',
  emptyLinePlaceholder = 'Press the + button or type / to insert',
  insertionOptions = []
}) => {
  const [value, setValue] = useState(initialValue);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [filterText, setFilterText] = useState('');
  const [hoverLine, setHoverLine] = useState<HTMLElement | null>(null);
  const [showPlusButton, setShowPlusButton] = useState(false);
  const [plusButtonPosition, setPlusButtonPosition] = useState({ top: 0 });
  const [activeLine, setActiveLine] = useState<HTMLElement | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [isHoveringPlusButton, setIsHoveringPlusButton] = useState(false);
  const [dropdownOpenedBy, setDropdownOpenedBy] = useState<'slash' | 'plus' | null>(null);
  
  // AI Mode State - now with a more explicit state machine approach
  const [aiModeState, setAiModeState] = useState<'inactive' | 'active' | 'typing'>('inactive');
  const [aiModeLine, setAiModeLine] = useState<HTMLElement | null>(null);
  const aiModeActive = aiModeState !== 'inactive';
  
  // Timers, counters and refs for higher stability
  const editorRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const lastBackspaceTime = useRef<number>(0);
  const lastInputTime = useRef<number>(0);
  const inputTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mutationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingActivityCountRef = useRef<number>(0);
  const aiUpdateQueuedRef = useRef<boolean>(false);
  
  const DEBUG_MODE = true;
  const debugLog = (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[TextEditor] ${message}`, ...args);
    }
  };

  // COMPLETELY REBUILT: AI Mode management with state machine approach
  const updateAiMode = (newState: 'inactive' | 'active' | 'typing', line?: HTMLElement | null) => {
    debugLog(`updateAiMode(${newState}, line)`, {newState, line, previousState: {aiModeState, aiModeLine}});
    
    // First validate the state transition
    if (newState === aiModeState && line === aiModeLine) {
      debugLog('No state change needed, skipping update');
      return; // No change needed
    }
    
    // If we're currently typing, don't allow AI mode to be disabled
    // This prevents flickering when contentEditable restructures DOM during typing
    if (aiModeState === 'typing' && newState === 'inactive' && typingActivityCountRef.current > 0) {
      debugLog('PROTECTED: Cannot exit AI mode during active typing, queueing update for later');
      aiUpdateQueuedRef.current = true;
      return;
    }
    
    setAiModeState(newState);
    
    if (newState === 'active' || newState === 'typing') {
      if (line) {
        setAiModeLine(line);
        
        // Update line DOM
        line.setAttribute('data-ai-prompt', 'true');
        line.className = newState === 'typing' ? 'ai-prompt-line typing' : 'ai-prompt-line';
        line.setAttribute('data-placeholder', 'Write what Rovo should do');
      }
    } else {
      // Clean up previous AI line if it exists
      if (aiModeLine) {
        aiModeLine.removeAttribute('data-ai-prompt');
        aiModeLine.className = '';
        aiModeLine.setAttribute('data-placeholder', emptyLinePlaceholder);
      }
      setAiModeLine(null);
    }
    
    // Update button visuals
    updateButtonState(newState !== 'inactive');
    
    // Ensure plus button is visible
    setShowPlusButton(true);
    
    debugLog(`AI mode updated to ${newState}`);
  };
  
  // Separate function to handle button state updates - no DOM manipulation
  const updateButtonState = (active: boolean) => {
    const button = plusButtonRef.current;
    if (!button) return;
    
    // Update attributes
    button.setAttribute('data-ai-mode', active ? 'active' : 'inactive');
    
    // Update classes via React's class name approach
    if (active) {
      button.className = "absolute w-6 h-6 flex items-center justify-center rounded-full transition-colors inset-x-0 mx-auto ai-button";
    } else {
      button.className = "absolute w-6 h-6 flex items-center justify-center rounded-full transition-colors inset-x-0 mx-auto bg-gray-100 hover:bg-gray-200 plus-button";
    }
    
    // Update icon container - always use requestAnimationFrame for visual updates
    requestAnimationFrame(() => {
      const iconContainer = button.querySelector('.icon-morph-container');
      if (iconContainer) {
        // Force a reflow
        void (iconContainer as HTMLElement).offsetWidth;
        
        iconContainer.className = active 
          ? 'icon-morph-container morph-to-sparkle' 
          : 'icon-morph-container morph-to-plus';
      }
    });
  };

  // Improved empty line check with more context
  const isLineEmpty = (line: HTMLElement, duringTyping: boolean = false): boolean => {
    // During active typing with multiple characters, don't consider it empty
    if (duringTyping && typingActivityCountRef.current > 1) {
      return false;
    }
    
    // Check for any meaningful text content
    const hasTextContent = line.textContent?.trim();
    if (hasTextContent && hasTextContent.length > 0) {
      return false;
    }
    
    // More comprehensive check for empty states
    return (
      !line.textContent || 
      line.textContent.trim() === '' || 
      line.innerHTML === '<br>' ||
      line.innerHTML === '' ||
      line.childNodes.length === 0 ||
      (line.childNodes.length === 1 && line.firstChild?.nodeName === 'BR')
    );
  };

  useClickOutside(dropdownRef, () => {
    setShowDropdown(false);
    setFilterText('');
    setDropdownOpenedBy(null);
  });

  const filteredOptions = insertionOptions.filter(option => 
    option.label.toLowerCase().includes(filterText.toLowerCase()) ||
    option.description?.toLowerCase().includes(filterText.toLowerCase())
  );

  const getOptionsToDisplay = () => {
    const displayOptions = [...filteredOptions];
    
    if (filterText.trim().length > 0 && displayOptions.length === 0) {
      const askRovoOption: InsertionOption = {
        id: 'ask-rovo-dynamic',
        icon: <SparkleIcon />,
        label: `Ask Rovo to ${filterText}...`,
        description: 'Create an AI prompt with your text',
        action: (editor, line) => {
          const promptContainer = document.createElement('div');
          promptContainer.className = 'ai-prompt-container';
          
          const promptContent = document.createElement('div');
          promptContent.className = 'ai-prompt-content';
          promptContent.setAttribute('contenteditable', 'true');
          promptContent.innerHTML = filterText;
          
          const iconDiv = document.createElement('div');
          iconDiv.className = 'ai-prompt-icon';
          iconDiv.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" width="16" height="16">
              <path d="M12 1L9.5 8.5L2 11L9.5 13.5L12 21L14.5 13.5L22 11L14.5 8.5L12 1Z" />
              <path d="M5 14.5L4 19L7 17L10 19L8.5 14.5" opacity="0.5" />
              <path d="M19 14.5L20 19L17 17L14 19L15.5 14.5" opacity="0.5" />
            </svg>
          `;
          
          promptContainer.appendChild(promptContent);
          promptContainer.appendChild(iconDiv);
          
          if (line.nextSibling) {
            editor.insertBefore(promptContainer, line.nextSibling);
          } else {
            editor.appendChild(promptContainer);
          }
          
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(promptContent);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
          
          promptContent.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              
              const promptText = promptContent.textContent || '';
              if (promptText.trim()) {
                promptContent.innerHTML = `<em style="color: #6b7280;">Processing your request...</em>`;
                
                setTimeout(() => {
                  promptContent.innerHTML = `<div style="color: #3b82f6;">
                    <p>Here's a response to your prompt: "${promptText}"</p>
                    <p>In a real implementation, this would be connected to an AI service.</p>
                  </div>`;
                }, 1500);
              }
            }
          });
        }
      };
      
      displayOptions.push(askRovoOption);
    }
    
    return displayOptions;
  };

  const optionsToDisplay = getOptionsToDisplay();

  const removeSlashCharacter = () => {
    if (!activeLine) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    let currentNode = range.startContainer;
    
    // Only process text nodes
    if (currentNode.nodeType === Node.TEXT_NODE) {
      const currentText = currentNode.textContent || '';
      const caretPos = range.startOffset;
      
      // Find the slash command
      const slashCommandMatch = currentText.substring(0, caretPos).match(/\/([^\/\s]*)$/);
      
      if (slashCommandMatch) {
        debugLog('Removing slash command', slashCommandMatch);
        
        // Get the start and end positions of the slash command
        const matchStart = slashCommandMatch.index!;
        const matchEnd = matchStart + slashCommandMatch[0].length;
        
        // Create a new text without the slash command
        const newText = currentText.substring(0, matchStart) + currentText.substring(matchEnd);
        
        // Update the node's text content
        currentNode.textContent = newText;
        
        // Set the selection to where the slash command was
        const newRange = document.createRange();
        newRange.setStart(currentNode, matchStart);
        newRange.setEnd(currentNode, matchStart);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        return true;
      }
    }
    
    // Old behavior as fallback
    const textNodes: Node[] = [];
    const findTextNodes = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node);
      } else {
        node.childNodes.forEach(child => findTextNodes(child));
      }
    };
    
    findTextNodes(activeLine);
    
    const slashNode = textNodes.find(node => node.textContent?.includes('/'));
    
    if (slashNode && slashNode.textContent) {
      slashNode.textContent = slashNode.textContent.replace(/\/\S*/, '');
      return true;
    }
    
    return false;
  };

  // COMPLETELY REBUILT: Input handler with better typing detection
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    setValue(content);
    if (onChange) onChange(content);
    
    // Register typing activity
    typingActivityCountRef.current += 1;
    debugLog(`Typing activity count increased to ${typingActivityCountRef.current}`);
    
    // Clear any existing timeout
    if (inputTimeoutRef.current) {
      clearTimeout(inputTimeoutRef.current);
    }
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    let currentNode = range.startContainer as Node;
    
    if (currentNode.nodeType === Node.TEXT_NODE) {
      currentNode = currentNode.parentElement as HTMLElement;
    }
    
    // Find the AI prompt line, if any
    let foundAiLine = false;
    let aiPromptLine = currentNode as HTMLElement;
    
    while (aiPromptLine && aiPromptLine.parentElement !== editorRef.current) {
      if (aiPromptLine.hasAttribute('data-ai-prompt')) {
        foundAiLine = true;
        debugLog('Input detected in AI prompt line', aiPromptLine);
        
        // Only transition to typing state if we're not already in it
        if (aiModeState !== 'typing') {
          updateAiMode('typing', aiPromptLine);
        }
        
        // Add typing class for visual indication
        aiPromptLine.classList.add('typing');
        
        break;
      }
      aiPromptLine = aiPromptLine.parentElement as HTMLElement;
    }
    
    // Handle initial input that might add the first character
    if (!foundAiLine && aiModeActive) {
      // Use a mutation observer callback to check if the structure changed
      if (mutationTimeoutRef.current) {
        clearTimeout(mutationTimeoutRef.current);
      }
      
      mutationTimeoutRef.current = setTimeout(() => {
        // Attempt to find the AI line again after DOM has settled
        if (!editorRef.current) return;
        
        const aiLines = editorRef.current.querySelectorAll('[data-ai-prompt="true"]');
        if (aiLines.length > 0) {
          // Found it after DOM update
          foundAiLine = true;
          debugLog('Found AI line after DOM mutation');
        } else if (aiModeActive) {
          // AI line not found after mutation, something went wrong
          debugLog('Lost track of AI line after mutation, attempting to recover');
          
          // Try to recover by checking if our aiModeLine is still in the DOM
          if (aiModeLine && document.contains(aiModeLine)) {
            // Element still exists, reset its attributes
            debugLog('Element still exists, resetting AI attributes');
            aiModeLine.setAttribute('data-ai-prompt', 'true');
            aiModeLine.className = 'ai-prompt-line typing';
          } else {
            // Element is gone, exit AI mode
            debugLog('Element no longer in DOM, exiting AI mode');
            updateAiMode('inactive');
          }
        }
      }, 10); // Very small timeout to let event loop process DOM changes
    }
    
    // Schedule a timeout to check for typing activity completion
    inputTimeoutRef.current = setTimeout(() => {
      // Decrement typing activity counter
      typingActivityCountRef.current = Math.max(0, typingActivityCountRef.current - 1);
      debugLog(`Typing activity count decreased to ${typingActivityCountRef.current}`);
      
      // If we're no longer actively typing
      if (typingActivityCountRef.current === 0) {
        debugLog('Typing activity complete, checking state');
        
        // Process any queued AI mode updates
        if (aiUpdateQueuedRef.current) {
          aiUpdateQueuedRef.current = false;
          debugLog('Processing queued AI mode update');
          
          // Check if we should exit AI mode
          if (aiModeLine && isLineEmpty(aiModeLine, false)) {
            debugLog('AI line is empty after typing, exiting AI mode');
            updateAiMode('inactive');
          } else if (aiModeState === 'typing') {
            // Transition back to active if we still have content
            updateAiMode('active', aiModeLine);
          }
        }
        
        // Remove typing visual styles
        if (aiModeLine) {
          aiModeLine.classList.remove('typing');
        }
      }
    }, 800); // Increased timeout to ensure typing has fully settled
    
    // IMPROVED: Slash command detection and handling
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;
      
      // Find the current line element
      let lineElement = range.startContainer as Node;
      if (lineElement.nodeType === Node.TEXT_NODE) {
        lineElement = lineElement.parentElement as HTMLElement;
      }
      
      while (lineElement && lineElement.parentElement !== editorRef.current) {
        lineElement = lineElement.parentElement as Node;
      }
      
      const currentLine = lineElement as HTMLElement;
      
      if (!activeLine) {
        setActiveLine(currentLine);
      }
      
      // Only process text nodes for slash commands
      if (textNode.nodeType === Node.TEXT_NODE) {
        const currentText = textNode.textContent || '';
        const caretPos = range.startOffset;
        
        // Check if we just typed a slash
        const justTypedSlash = currentText.charAt(caretPos - 1) === '/' && 
                             (caretPos === 1 || /\s/.test(currentText.charAt(caretPos - 2)));
        
        // Check if we're in a slash command
        const slashCommandMatch = currentText.substring(0, caretPos).match(/(?:^|\s)(\/[^\/\s]*)$/);
        const inSlashCommand = !!slashCommandMatch;
        
        debugLog('Slash command detection', {
          caretPos,
          currentText,
          justTypedSlash,
          inSlashCommand,
          slashCommandMatch
        });
        
        if (justTypedSlash && !showDropdown) {
          // Just typed a slash, open the dropdown
          debugLog('Just typed slash, opening dropdown');
          
          setActiveLine(currentLine);
          
          // Calculate dropdown position based on caret position
          const rect = range.getBoundingClientRect();
          const editorRect = editorRef.current?.getBoundingClientRect() || { top: 0, left: 0 };
          
          setDropdownPosition({
            top: rect.bottom - editorRect.top + 5,
            left: rect.left - editorRect.left
          });
          
          setShowDropdown(true);
          setFilterText('');
          setSelectedOptionIndex(0);
          setDropdownOpenedBy('slash');
          
        } else if (inSlashCommand && showDropdown && dropdownOpenedBy === 'slash') {
          // Already in a slash command, update the filter
          const commandText = slashCommandMatch ? slashCommandMatch[1].substring(1) : '';
          
          if (commandText !== filterText) {
            debugLog('Updating filter text:', commandText);
            setFilterText(commandText);
            setSelectedOptionIndex(0);
          }
          
        } else if (!inSlashCommand && showDropdown && dropdownOpenedBy === 'slash') {
          // No longer in a slash command, close the dropdown
          debugLog('No longer in a slash command, closing dropdown');
          setShowDropdown(false);
          setFilterText('');
          setDropdownOpenedBy(null);
        }
      }
    }
  };

  // REBUILT: Handle backspace with better state checks
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // First handle dropdown navigation and selection
    if (showDropdown && optionsToDisplay.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedOptionIndex(prev => 
          prev < optionsToDisplay.length - 1 ? prev + 1 : prev
        );
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedOptionIndex(prev => 
          prev > 0 ? prev - 1 : 0
        );
        return;
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const selectedOption = optionsToDisplay[selectedOptionIndex];
        if (selectedOption && editorRef.current && activeLine) {
          debugLog('Selected option with Enter key', selectedOption);
          
          try {
            if (dropdownOpenedBy === 'slash') {
              const removed = removeSlashCharacter();
              debugLog('Removed slash character', { success: removed });
            }
            
            if (selectedOption.id === 'ai-prompt') {
              const isCurrentLineEmpty = isLineEmpty(activeLine);
              
              if (isCurrentLineEmpty) {
                debugLog('Transforming current empty line to AI prompt');
                
                // Focus the line first
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(activeLine);
                range.collapse(true);
                selection?.removeAllRanges();
                selection?.addRange(range);
                
                // Enter AI mode on the current line
                updateAiMode('active', activeLine);
                
                // Close dropdown
                setShowDropdown(false);
                setFilterText('');
                
                return;
              } else {
                debugLog('Creating new AI prompt line below non-empty line');
                
                // Create a new line
                const newPromptLine = document.createElement('p');
                
                // Find the direct child of editor to insert after
                let directChild = activeLine;
                while (directChild.parentElement !== editorRef.current && directChild.parentElement !== null) {
                  directChild = directChild.parentElement;
                }
                
                // Insert new line in DOM
                if (directChild.nextSibling) {
                  editorRef.current.insertBefore(newPromptLine, directChild.nextSibling);
                } else {
                  editorRef.current.appendChild(newPromptLine);
                }
                
                // Focus the new line
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(newPromptLine);
                range.collapse(true);
                selection?.removeAllRanges();
                selection?.addRange(range);
                
                // Enter AI mode with the new line
                updateAiMode('active', newPromptLine);
                
                // Close dropdown
                setShowDropdown(false);
                setFilterText('');
                
                return;
              }
            }
            
            const newParagraph = document.createElement('p');
            
            let directChild = activeLine;
            while (directChild.parentElement !== editorRef.current && directChild.parentElement !== null) {
              directChild = directChild.parentElement;
            }
            
            if (directChild.parentElement === editorRef.current) {
              if (directChild.nextSibling) {
                editorRef.current.insertBefore(newParagraph, directChild.nextSibling);
              } else {
                editorRef.current.appendChild(newParagraph);
              }
              
              selectedOption.action(editorRef.current, newParagraph);
            } else {
              console.log('Could not find direct child, appending at the end');
              editorRef.current.appendChild(newParagraph);
              selectedOption.action(editorRef.current, newParagraph);
            }
          } catch (error) {
            console.error('Error inserting element:', error);
            const newParagraph = document.createElement('p');
            editorRef.current.appendChild(newParagraph);
            selectedOption.action(editorRef.current, newParagraph);
          }
          
          setShowDropdown(false);
          setFilterText('');
          
          setTimeout(() => {
            if (onChange && editorRef.current) {
              onChange(editorRef.current.innerHTML);
              setValue(editorRef.current.innerHTML);
            }
          }, 0);
        }
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowDropdown(false);
        setFilterText('');
        setDropdownOpenedBy(null);
        return;
      } else if (e.key === 'Tab') {
        // Tab key should also select the currently highlighted option
        e.preventDefault();
        const selectedOption = optionsToDisplay[selectedOptionIndex];
        if (selectedOption) {
          handleOptionClick(selectedOption);
        }
        return;
      }
    }
    
    if (e.key === 'Backspace') {
      debugLog('Backspace pressed', e);
      
      // Track timing for double backspace detection
      const now = Date.now();
      const isDoubleBackspace = (now - lastBackspaceTime.current) < 300;
      lastBackspaceTime.current = now;
      
      // Find AI line if we're in AI mode
      if (aiModeActive) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        let currentNode = range.startContainer as Node;
        
        if (currentNode.nodeType === Node.TEXT_NODE) {
          currentNode = currentNode.parentElement as HTMLElement;
        }
        
        // Find the AI line we're in
        let aiPromptLine = currentNode as HTMLElement;
        let foundAiLine = false;
        
        while (aiPromptLine && aiPromptLine.parentElement !== editorRef.current) {
          if (aiPromptLine.hasAttribute('data-ai-prompt')) {
            foundAiLine = true;
            debugLog('Backspace in AI prompt line', aiPromptLine);
            
            // Get information about the line content
            const caretAt = range.startOffset;
            const currentContent = aiPromptLine.textContent || '';
            const isAtBeginning = caretAt === 0;
            const isEmptyOrNearlyEmpty = isLineEmpty(aiPromptLine) || currentContent.trim().length <= 1;
            
            debugLog('Backspace evaluation', {
              content: currentContent,
              caretAt,
              isAtBeginning,
              isEmptyOrNearlyEmpty,
              innerHTML: aiPromptLine.innerHTML,
              isDoubleBackspace
            });
            
            // Exit conditions: empty line, at beginning, double backspace
            if (isEmptyOrNearlyEmpty || isAtBeginning || isDoubleBackspace) {
              debugLog('Conditions met for exiting AI mode');
              
              // Prevent default action in special cases
              if (isAtBeginning || isDoubleBackspace) {
                e.preventDefault();
              }
              
              // Force the line to be empty - more consistent than letting browser handle it
              aiPromptLine.innerHTML = '<br>';
              
              // Exit AI mode
              updateAiMode('inactive');
              
              // Set cursor position
              const newRange = document.createRange();
              newRange.setStart(aiPromptLine, 0);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
              
              return;
            }
            
            // Register backspace as a typing activity
            typingActivityCountRef.current += 1;
            
            // This is just backspace in a non-empty line, mark as typing
            updateAiMode('typing', aiPromptLine);
            
            // Extra check after DOM has updated
            requestAnimationFrame(() => {
              // Decrement typing counter after checking
              setTimeout(() => {
                typingActivityCountRef.current = Math.max(0, typingActivityCountRef.current - 1);
                
                if (aiPromptLine && isLineEmpty(aiPromptLine)) {
                  debugLog('Line became empty after backspace, exiting AI mode');
                  updateAiMode('inactive');
                }
              }, 50);
            });
            
            break;
          }
          aiPromptLine = aiPromptLine.parentElement as HTMLElement;
        }
        
        // We're in AI mode but couldn't find AI line - DOM structure changed
        if (!foundAiLine && aiModeActive) {
          debugLog('In AI mode but no AI line found, searching entire DOM');
          
          // Attempt to find with direct selector as fallback
          const aiLines = editorRef.current?.querySelectorAll('[data-ai-prompt="true"], .ai-prompt-line');
          
          if (aiLines && aiLines.length > 0) {
            debugLog('Found AI line with direct selector');
            
            // Check if the first line is empty
            const firstAiLine = aiLines[0] as HTMLElement;
            if (isLineEmpty(firstAiLine)) {
              debugLog('Found AI line is empty, exiting AI mode');
              
              // Clear AI attributes from element
              firstAiLine.removeAttribute('data-ai-prompt');
              firstAiLine.className = '';
              
              // Exit AI mode
              updateAiMode('inactive');
            } else {
              // Re-sync our state to point to the found element
              updateAiMode('active', firstAiLine);
            }
          } else {
            // No AI line found anywhere, exit AI mode
            debugLog('No AI line found anywhere, exiting AI mode');
            updateAiMode('inactive');
          }
        }
      }
    }
    
    // Handle Enter key in AI mode
    if (e.key === 'Enter' && !e.shiftKey) {
      // Check if we're in AI mode first
      if (aiModeActive && aiModeLine) {
        debugLog('Enter key pressed in AI mode');
        
        // Prevent default immediately for AI mode
        e.preventDefault();
        e.stopPropagation();
        
        // If we have active AI line, use it directly instead of searching
        if (aiModeLine) {
          const promptText = aiModeLine.textContent || '';
          
          if (promptText.trim()) {
            debugLog('Processing AI prompt:', promptText);
            // Gather context from surrounding text
            const contextAbove: string[] = [];
            const contextBelow: string[] = [];
            
            // Get context above the AI prompt line
            let previousElement = aiModeLine.previousElementSibling;
            let contextLinesCollected = 0;
            
            while (previousElement && contextLinesCollected < 3) {
              const text = previousElement.textContent?.trim();
              if (text) {
                contextAbove.unshift(text); // Add to beginning of array to maintain correct order
                contextLinesCollected++;
              }
              previousElement = previousElement.previousElementSibling;
            }
            
            // Get context below the AI prompt line
            let nextElement = aiModeLine.nextElementSibling;
            contextLinesCollected = 0;
            
            while (nextElement && contextLinesCollected < 3) {
              const text = nextElement.textContent?.trim();
              if (text) {
                contextBelow.push(text);
                contextLinesCollected++;
              }
              nextElement = nextElement.nextElementSibling;
            }
            
            // Build the full prompt with context
            const fullPrompt = [
              contextAbove.length > 0 ? "Context above:\n" + contextAbove.join('\n') : '',
              "Prompt: " + promptText,
              contextBelow.length > 0 ? "Context below:\n" + contextBelow.join('\n') : ''
            ].filter(Boolean).join('\n\n');
            
            debugLog('Enhanced prompt with context:', fullPrompt);
            
            const promptContainer = document.createElement('div');
            promptContainer.className = 'ai-prompt-container';
            
            const promptContent = document.createElement('div');
            promptContent.className = 'ai-prompt-content';
            promptContent.setAttribute('contenteditable', 'false');
            
            const iconDiv = document.createElement('div');
            iconDiv.className = 'ai-prompt-icon';
            iconDiv.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" width="16" height="16">
                <path d="M12 1L9.5 8.5L2 11L9.5 13.5L12 21L14.5 13.5L22 11L14.5 8.5L12 1Z" />
                <path d="M5 14.5L4 19L7 17L10 19L8.5 14.5" opacity="0.5" />
                <path d="M19 14.5L20 19L17 17L14 19L15.5 14.5" opacity="0.5" />
              </svg>
            `;
            
            aiModeLine.innerHTML = '';
            aiModeLine.removeAttribute('data-ai-prompt');
            aiModeLine.className = '';
            aiModeLine.appendChild(promptContainer);
            
            promptContainer.appendChild(promptContent);
            promptContainer.appendChild(iconDiv);
            
            // Add loading state
            promptContent.innerHTML = `
              <div class="ai-loading-state">
                <div class="ai-loading-spinner"></div>
                <em>Generating response with OpenAI...</em>
              </div>
            `;
            
            // Make a real API call to our OpenAI endpoint
            const generateAIResponse = async () => {
              try {
                debugLog('Sending prompt to OpenAI API endpoint:', fullPrompt);
                
                // First, add the growing class to the container for animation
                promptContainer.classList.add('growing');
                
                const response = await fetch('/api/ai-prompt', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ prompt: fullPrompt }),
                });
                
                if (!response.ok) {
                  throw new Error(`API error: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Display the response with word-by-word animation
                const responseHtml = data.text || `<p>Error: Failed to generate a response.</p>`;
                promptContent.innerHTML = renderTextWithAnimation(responseHtml);
                
                // Add buttons container
                const buttonsContainer = document.createElement('div');
                buttonsContainer.className = 'ai-response-buttons';
                promptContent.appendChild(buttonsContainer);
                
                // Add Accept button
                const acceptButton = document.createElement('button');
                acceptButton.className = 'ai-accept-button';
                acceptButton.textContent = 'Accept';
                acceptButton.onclick = () => {
                  // Handle acceptance - keep the response
                  debugLog('AI response accepted');
                  
                  // Remove buttons
                  buttonsContainer.remove();
                  
                  // Apply the accepted class to make it look like regular text
                  promptContainer.classList.add('accepted');
                  
                  // Create a new paragraph after the response
                  const newP = document.createElement('p');
                  
                  if (aiModeLine.nextSibling) {
                    editorRef.current?.insertBefore(newP, aiModeLine.nextSibling);
                  } else {
                    editorRef.current?.appendChild(newP);
                  }
                  
                  // Set focus to the new paragraph
                  const selection = window.getSelection();
                  if (selection) {
                    const newRange = document.createRange();
                    newRange.selectNodeContents(newP);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                  }
                  
                  // Update editor value
                  if (onChange && editorRef.current) {
                    onChange(editorRef.current.innerHTML);
                    setValue(editorRef.current.innerHTML);
                  }
                };
                
                // Add Dismiss button
                const dismissButton = document.createElement('button');
                dismissButton.className = 'ai-dismiss-button';
                dismissButton.textContent = 'Dismiss';
                dismissButton.onclick = () => {
                  // Handle dismissal - remove the container
                  debugLog('AI response dismissed');
                  
                  // Remove the entire prompt container
                  aiModeLine.innerHTML = '';
                  
                  // Create a new paragraph
                  const newP = document.createElement('p');
                  
                  if (aiModeLine.nextSibling) {
                    editorRef.current?.insertBefore(newP, aiModeLine);
                  } else {
                    editorRef.current?.appendChild(newP);
                  }
                  
                  // Remove the empty aiModeLine
                  aiModeLine.remove();
                  
                  // Set focus to the new paragraph
                  const selection = window.getSelection();
                  if (selection) {
                    const newRange = document.createRange();
                    newRange.selectNodeContents(newP);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                  }
                  
                  // Update editor value
                  if (onChange && editorRef.current) {
                    onChange(editorRef.current.innerHTML);
                    setValue(editorRef.current.innerHTML);
                  }
                };
                
                // Add buttons to the container
                buttonsContainer.appendChild(acceptButton);
                buttonsContainer.appendChild(dismissButton);
                
                // Update editor value
                if (onChange && editorRef.current) {
                  onChange(editorRef.current.innerHTML);
                  setValue(editorRef.current.innerHTML);
                }
              } catch (error) {
                console.error('Error generating AI response:', error);
                
                // Make sure the container grows even for error messages
                promptContainer.classList.add('growing');
                
                const errorHtml = `
                  <div>
                    <p><strong>Error generating response</strong></p>
                    <p>Sorry, there was an error while generating the AI response. Please try again later.</p>
                    <p class="text-red-500 text-sm">${error instanceof Error ? error.message : 'Unknown error'}</p>
                  </div>
                `;
                promptContent.innerHTML = renderTextWithAnimation(errorHtml);
                
                // Add a try again button
                const tryAgainButton = document.createElement('button');
                tryAgainButton.className = 'ai-dismiss-button';
                tryAgainButton.textContent = 'Try Again';
                tryAgainButton.style.marginTop = '8px';
                promptContent.appendChild(tryAgainButton);
                
                tryAgainButton.onclick = () => {
                  aiModeLine.innerHTML = '';
                  
                  // Create a new AI prompt line
                  const newP = document.createElement('p');
                  newP.textContent = promptText;
                  
                  if (aiModeLine.nextSibling) {
                    editorRef.current?.insertBefore(newP, aiModeLine);
                  } else {
                    editorRef.current?.appendChild(newP);
                  }
                  
                  // Remove the error line
                  aiModeLine.remove();
                  
                  // Focus and set AI mode on the new line
                  const selection = window.getSelection();
                  if (selection) {
                    const range = document.createRange();
                    range.selectNodeContents(newP);
                    range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                  }
                  
                  updateAiMode('active', newP);
                  
                  // Update editor
                  if (onChange && editorRef.current) {
                    onChange(editorRef.current.innerHTML);
                    setValue(editorRef.current.innerHTML);
                  }
                };
              }
            };
            
            // Exit AI mode since we're now processing the request
            updateAiMode('inactive');
            
            // Execute the API call
            generateAIResponse();
          }
          
          return;
        }
      }
      
      // If we reach here, continue with original implementation
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let currentNode = range.startContainer as Node;
        
        if (currentNode.nodeType === Node.TEXT_NODE) {
          currentNode = currentNode.parentElement as HTMLElement;
        }
        
        let aiPromptLine = currentNode as HTMLElement;
        while (aiPromptLine && aiPromptLine.parentElement !== editorRef.current) {
          if (aiPromptLine.hasAttribute('data-ai-prompt')) {
            e.preventDefault(); // Prevent default Enter behavior to avoid breaking the line
            
            const promptText = aiPromptLine.textContent || '';
            
            if (promptText.trim()) {
              // Gather context from surrounding text
              const contextAbove: string[] = [];
              const contextBelow: string[] = [];
              
              // Get context above the AI prompt line
              let previousElement = aiPromptLine.previousElementSibling;
              let contextLinesCollected = 0;
              
              while (previousElement && contextLinesCollected < 3) {
                const text = previousElement.textContent?.trim();
                if (text) {
                  contextAbove.unshift(text); // Add to beginning of array to maintain correct order
                  contextLinesCollected++;
                }
                previousElement = previousElement.previousElementSibling;
              }
              
              // Get context below the AI prompt line
              let nextElement = aiPromptLine.nextElementSibling;
              contextLinesCollected = 0;
              
              while (nextElement && contextLinesCollected < 3) {
                const text = nextElement.textContent?.trim();
                if (text) {
                  contextBelow.push(text);
                  contextLinesCollected++;
                }
                nextElement = nextElement.nextElementSibling;
              }
              
              // Build the full prompt with context
              const fullPrompt = [
                contextAbove.length > 0 ? "Context above:\n" + contextAbove.join('\n') : '',
                "Prompt: " + promptText,
                contextBelow.length > 0 ? "Context below:\n" + contextBelow.join('\n') : ''
              ].filter(Boolean).join('\n\n');
              
              debugLog('Enhanced prompt with context:', fullPrompt);
              
              const promptContainer = document.createElement('div');
              promptContainer.className = 'ai-prompt-container';
              
              const promptContent = document.createElement('div');
              promptContent.className = 'ai-prompt-content';
              promptContent.setAttribute('contenteditable', 'false');
              
              const iconDiv = document.createElement('div');
              iconDiv.className = 'ai-prompt-icon';
              iconDiv.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" width="16" height="16">
                  <path d="M12 1L9.5 8.5L2 11L9.5 13.5L12 21L14.5 13.5L22 11L14.5 8.5L12 1Z" />
                  <path d="M5 14.5L4 19L7 17L10 19L8.5 14.5" opacity="0.5" />
                  <path d="M19 14.5L20 19L17 17L14 19L15.5 14.5" opacity="0.5" />
                </svg>
              `;
              
              aiPromptLine.innerHTML = '';
              aiPromptLine.removeAttribute('data-ai-prompt');
              aiPromptLine.className = '';
              aiPromptLine.appendChild(promptContainer);
              
              promptContainer.appendChild(promptContent);
              promptContainer.appendChild(iconDiv);
              
              // Add loading state
              promptContent.innerHTML = `
                <div class="ai-loading-state">
                  <div class="ai-loading-spinner"></div>
                  <em>Generating response with OpenAI...</em>
                </div>
              `;
              
              // Make a real API call to our OpenAI endpoint
              const generateAIResponse = async () => {
                try {
                  debugLog('Sending prompt to OpenAI API endpoint:', fullPrompt);
                  
                  // First, add the growing class to the container for animation
                  promptContainer.classList.add('growing');
                  
                  const response = await fetch('/api/ai-prompt', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ prompt: fullPrompt }),
                  });
                  
                  if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                  }
                  
                  const data = await response.json();
                  
                  // Display the response with word-by-word animation
                  const responseHtml = data.text || `<p>Error: Failed to generate a response.</p>`;
                  promptContent.innerHTML = renderTextWithAnimation(responseHtml);
                  
                  // Add buttons container
                  const buttonsContainer = document.createElement('div');
                  buttonsContainer.className = 'ai-response-buttons';
                  promptContent.appendChild(buttonsContainer);
                  
                  // Add Accept button
                  const acceptButton = document.createElement('button');
                  acceptButton.className = 'ai-accept-button';
                  acceptButton.textContent = 'Accept';
                  acceptButton.onclick = () => {
                    // Handle acceptance - keep the response
                    debugLog('AI response accepted');
                    
                    // Remove buttons
                    buttonsContainer.remove();
                    
                    // Apply the accepted class to make it look like regular text
                    promptContainer.classList.add('accepted');
                    
                    // Create a new paragraph after the response
                    const newP = document.createElement('p');
                    
                    if (aiPromptLine.nextSibling) {
                      editorRef.current?.insertBefore(newP, aiPromptLine.nextSibling);
                    } else {
                      editorRef.current?.appendChild(newP);
                    }
                    
                    // Set focus to the new paragraph
                    const selection = window.getSelection();
                    if (selection) {
                      const newRange = document.createRange();
                      newRange.selectNodeContents(newP);
                      newRange.collapse(true);
                      selection.removeAllRanges();
                      selection.addRange(newRange);
                    }
                    
                    // Update editor value
                    if (onChange && editorRef.current) {
                      onChange(editorRef.current.innerHTML);
                      setValue(editorRef.current.innerHTML);
                    }
                  };
                  
                  // Add Dismiss button
                  const dismissButton = document.createElement('button');
                  dismissButton.className = 'ai-dismiss-button';
                  dismissButton.textContent = 'Dismiss';
                  dismissButton.onclick = () => {
                    // Handle dismissal - remove the container
                    debugLog('AI response dismissed');
                    
                    // Remove the entire prompt container
                    aiPromptLine.innerHTML = '';
                    
                    // Create a new paragraph
                    const newP = document.createElement('p');
                    
                    if (aiPromptLine.nextSibling) {
                      editorRef.current?.insertBefore(newP, aiPromptLine);
                    } else {
                      editorRef.current?.appendChild(newP);
                    }
                    
                    // Remove the empty aiPromptLine
                    aiPromptLine.remove();
                    
                    // Set focus to the new paragraph
                    const selection = window.getSelection();
                    if (selection) {
                      const newRange = document.createRange();
                      newRange.selectNodeContents(newP);
                      newRange.collapse(true);
                      selection.removeAllRanges();
                      selection.addRange(newRange);
                    }
                    
                    // Update editor value
                    if (onChange && editorRef.current) {
                      onChange(editorRef.current.innerHTML);
                      setValue(editorRef.current.innerHTML);
                    }
                  };
                  
                  // Add buttons to the container
                  buttonsContainer.appendChild(acceptButton);
                  buttonsContainer.appendChild(dismissButton);
                  
                  // Update editor value
                  if (onChange && editorRef.current) {
                    onChange(editorRef.current.innerHTML);
                    setValue(editorRef.current.innerHTML);
                  }
                } catch (error) {
                  console.error('Error generating AI response:', error);
                  
                  // Make sure the container grows even for error messages
                  promptContainer.classList.add('growing');
                  
                  const errorHtml = `
                    <div>
                      <p><strong>Error generating response</strong></p>
                      <p>Sorry, there was an error while generating the AI response. Please try again later.</p>
                      <p class="text-red-500 text-sm">${error instanceof Error ? error.message : 'Unknown error'}</p>
                    </div>
                  `;
                  promptContent.innerHTML = renderTextWithAnimation(errorHtml);
                  
                  // Add a try again button
                  const tryAgainButton = document.createElement('button');
                  tryAgainButton.className = 'ai-dismiss-button';
                  tryAgainButton.textContent = 'Try Again';
                  tryAgainButton.style.marginTop = '8px';
                  promptContent.appendChild(tryAgainButton);
                  
                  tryAgainButton.onclick = () => {
                    aiPromptLine.innerHTML = '';
                    
                    // Create a new AI prompt line
                    const newP = document.createElement('p');
                    newP.textContent = promptText;
                    
                    if (aiPromptLine.nextSibling) {
                      editorRef.current?.insertBefore(newP, aiPromptLine);
                    } else {
                      editorRef.current?.appendChild(newP);
                    }
                    
                    // Remove the error line
                    aiPromptLine.remove();
                    
                    // Focus and set AI mode on the new line
                    const selection = window.getSelection();
                    if (selection) {
                      const range = document.createRange();
                      range.selectNodeContents(newP);
                      range.collapse(false);
                      selection.removeAllRanges();
                      selection.addRange(range);
                    }
                    
                    updateAiMode('active', newP);
                    
                    // Update editor
                    if (onChange && editorRef.current) {
                      onChange(editorRef.current.innerHTML);
                      setValue(editorRef.current.innerHTML);
                    }
                  };
                }
              };
              
              // Execute the API call
              generateAIResponse();
            }
            
            return;
          }
          aiPromptLine = aiPromptLine.parentElement as HTMLElement;
        }
      }
    }
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && onSelect) {
      const selectedText = selection.toString().trim();
      if (selectedText) {
        onSelect(selectedText);
      }
    }
  };

  const handlePlusButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (aiModeActive || aiModeLine) return;
    
    if (!hoverLine || !editorRef.current) return;
    
    setActiveLine(hoverLine);
    
    const rect = hoverLine.getBoundingClientRect();
    const editorRect = editorRef.current.getBoundingClientRect();
    
    setDropdownPosition({
      top: rect.top - editorRect.top + 30,
      left: rect.left - editorRect.left
    });
    
    setShowDropdown(true);
    setFilterText('');
    setSelectedOptionIndex(0);
    setDropdownOpenedBy('plus');
    
    if (editorRef.current) {
      editorRef.current.focus();
      
      const selection = window.getSelection();
      const range = document.createRange();
      
      const textNodes: Node[] = [];
      const findTextNodes = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          textNodes.push(node);
        } else {
          node.childNodes.forEach(child => findTextNodes(child));
        }
      };
      
      findTextNodes(hoverLine);
      
      if (textNodes.length > 0) {
        const lastTextNode = textNodes[textNodes.length - 1];
        range.setStart(lastTextNode, lastTextNode.textContent?.length || 0);
        range.setEnd(lastTextNode, lastTextNode.textContent?.length || 0);
        selection?.removeAllRanges();
        selection?.addRange(range);
      } else {
        range.selectNodeContents(hoverLine);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  };

  const handleMouseLeave = () => {
    if (!isHoveringPlusButton && !aiModeActive && !aiModeLine && !showDropdown) {
      setShowPlusButton(false);
    }
  };

  const handlePlusButtonMouseEnter = () => {
    setIsHoveringPlusButton(true);
    setShowPlusButton(true);
  };

  const handlePlusButtonMouseLeave = () => {
    setIsHoveringPlusButton(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editorRef.current) return;
    
    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (!range) return;
    
    let lineElement = range.startContainer as HTMLElement;
    
    if (lineElement.nodeType === Node.TEXT_NODE) {
      lineElement = lineElement.parentElement as HTMLElement;
    }
    
    while (lineElement && lineElement !== editorRef.current) {
      if (['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI'].includes(lineElement.tagName)) {
        break;
      }
      lineElement = lineElement.parentElement as HTMLElement;
    }
    
    if (lineElement && lineElement !== editorRef.current) {
      setHoverLine(lineElement);
      const rect = lineElement.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();
      
      setPlusButtonPosition({
        top: rect.top - editorRect.top + rect.height / 2 - 10
      });
      
      // Check if we're currently in AI mode
      if (aiModeActive) {
        // If we're in AI mode, don't exit it when just moving the mouse
        // Only check if we've moved to a new AI line
        const isAiLine = lineElement.hasAttribute('data-ai-prompt');
        
        if (isAiLine && lineElement !== aiModeLine) {
          // We've moved to a different AI line, update our reference
          updateAiMode('active', lineElement);
        }
        // Otherwise, preserve the current AI mode state
      } else {
        // We're not in AI mode, so we can follow normal behavior
        const isAiLine = lineElement.hasAttribute('data-ai-prompt');
        
        if (isAiLine) {
          // Only enter AI mode if the line is explicitly an AI line
          updateAiMode('active', lineElement);
        }
        // If it's not an AI line, we stay in inactive mode
      }
      
      setShowPlusButton(true);
    }
  };

  const handleOptionClick = (option: InsertionOption) => {
    if (editorRef.current && activeLine) {
      try {
        if (option.id === 'ai-prompt') {
          const isCurrentLineEmpty = isLineEmpty(activeLine);
          
          if (isCurrentLineEmpty) {
            debugLog('Transforming current empty line to AI prompt');
            
            // Focus the line first
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(activeLine);
            range.collapse(true);
            selection?.removeAllRanges();
            selection?.addRange(range);
            
            // Enter AI mode on the current line
            updateAiMode('active', activeLine);
            
            // Close dropdown
            setShowDropdown(false);
            setFilterText('');
            
            return;
          } else {
            debugLog('Creating new AI prompt line below non-empty line');
            
            // Create a new line
            const newPromptLine = document.createElement('p');
            
            // Find the direct child of editor to insert after
            let directChild = activeLine;
            while (directChild.parentElement !== editorRef.current && directChild.parentElement !== null) {
              directChild = directChild.parentElement;
            }
            
            // Insert new line in DOM
            if (directChild.nextSibling) {
              editorRef.current.insertBefore(newPromptLine, directChild.nextSibling);
            } else {
              editorRef.current.appendChild(newPromptLine);
            }
            
            // Focus the new line
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(newPromptLine);
            range.collapse(true);
            selection?.removeAllRanges();
            selection?.addRange(range);
            
            // Enter AI mode with the new line
            updateAiMode('active', newPromptLine);
            
            // Close dropdown
            setShowDropdown(false);
            setFilterText('');
            
            return;
          }
        }
        
        removeSlashCharacter();
        
        const newParagraph = document.createElement('p');
        
        let directChild = activeLine;
        while (directChild.parentElement !== editorRef.current && directChild.parentElement !== null) {
          directChild = directChild.parentElement;
        }
        
        if (directChild.parentElement === editorRef.current) {
          if (directChild.nextSibling) {
            editorRef.current.insertBefore(newParagraph, directChild.nextSibling);
          } else {
            editorRef.current.appendChild(newParagraph);
          }
          
          option.action(editorRef.current, newParagraph);
        } else {
          console.log('Could not find direct child, appending at the end');
          editorRef.current.appendChild(newParagraph);
          option.action(editorRef.current, newParagraph);
        }
      } catch (error) {
        console.error('Error in handleOptionClick:', error);
      }
      
      setShowDropdown(false);
      setFilterText('');
      
      setTimeout(() => {
        if (onChange && editorRef.current) {
          onChange(editorRef.current.innerHTML);
          setValue(editorRef.current.innerHTML);
        }
      }, 0);
    }
  };

  const ensureDefaultParagraph = () => {
    if (editorRef.current && editorRef.current.childNodes.length === 0) {
      const p = document.createElement('p');
      p.setAttribute('data-placeholder', placeholder);
      editorRef.current.appendChild(p);
    }
  };

  useEffect(() => {
    const handlePlaceholders = () => {
      if (!editorRef.current) return;
      
      const paragraphs = editorRef.current.querySelectorAll('p, div');
      
      if (paragraphs.length === 0) {
        ensureDefaultParagraph();
        return;
      }
      
      const selection = window.getSelection();
      const focusNode = selection?.focusNode;
      let focusedElement: Node | null = null;
      
      if (focusNode) {
        focusedElement = focusNode.nodeType === Node.TEXT_NODE ? focusNode.parentElement : focusNode;
        
        while (focusedElement && focusedElement.parentElement !== editorRef.current) {
          focusedElement = focusedElement.parentElement;
        }
      }
      
      paragraphs.forEach((p, index) => {
        const isEmpty = p.innerHTML === '' || p.innerHTML === '<br>' || !p.textContent?.trim();
        
        if (isEmpty) {
          const isFocused = focusedElement === p;
          
          if (isFocused) {
            p.setAttribute('data-placeholder', emptyLinePlaceholder);
          } else if (index === 0 && paragraphs.length === 1) {
            p.setAttribute('data-placeholder', placeholder);
          } else {
            p.removeAttribute('data-placeholder');
          }
        } else {
          p.removeAttribute('data-placeholder');
        }
      });
    };
    
    const observer = new MutationObserver(handlePlaceholders);
    if (editorRef.current) {
      observer.observe(editorRef.current, { childList: true, subtree: true, characterData: true });
    }
    
    document.addEventListener('selectionchange', handlePlaceholders);
    
    handlePlaceholders();
    
    return () => {
      observer.disconnect();
      document.removeEventListener('selectionchange', handlePlaceholders);
    };
  }, [emptyLinePlaceholder, placeholder]);

  useEffect(() => {
    if (editorRef.current) {
      if (initialValue) {
        editorRef.current.innerHTML = initialValue;
      } else {
        ensureDefaultParagraph();
      }
    }
  }, [initialValue]);

  useEffect(() => {
    const handleEnterKey = (e: globalThis.KeyboardEvent) => {
      if (!editorRef.current || e.key !== 'Enter') return;
      
      // Don't interfere with the AI prompt Enter handling
      if (aiModeState === 'active' || aiModeState === 'typing') {
        // Let the main handleKeyDown function handle this case
        return;
      }
      
      const selection = window.getSelection();
      if (!selection) return;
      
      const isInEditor = editorRef.current.contains(selection.anchorNode);
      if (!isInEditor) return;
      
      setShowPlusButton(false);
      
      setTimeout(() => {
        const focusEvent = new FocusEvent('focus', { bubbles: true });
        document.activeElement?.dispatchEvent(focusEvent);
      }, 0);
    };
    
    document.addEventListener('keydown', handleEnterKey);
    
    return () => {
      document.removeEventListener('keydown', handleEnterKey);
    };
  }, [aiModeState]);  // Add aiModeState as a dependency

  useEffect(() => {
    if (aiModeActive) {
      setShowPlusButton(true);
    }
  }, [aiModeActive]);

  useEffect(() => {
    if (showDropdown) {
      setShowPlusButton(true);
    }
  }, [showDropdown]);

  // REBUILT: Simpler version that doesn't manipulate DOM directly
  useEffect(() => {
    requestAnimationFrame(() => {
      updateButtonState(aiModeActive);
    });
  }, [aiModeActive]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (inputTimeoutRef.current) {
        clearTimeout(inputTimeoutRef.current);
      }
      if (mutationTimeoutRef.current) {
        clearTimeout(mutationTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Process HTML content to display text with a word-by-word blur animation
   * @param htmlContent The HTML content to animate
   * @returns HTML with animation spans wrapped around each word
   */
  const renderTextWithAnimation = (htmlContent: string): string => {
    // Create a temporary element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.classList.add('ai-animated-text');
    
    // Function to process text nodes
    const processTextNodes = (node: Node): void => {
      // Skip code blocks entirely - they'll be animated as whole blocks
      if (node.parentElement?.tagName === 'PRE' || 
          node.parentElement?.tagName === 'CODE') {
        return;
      }
      
      // Process text nodes only
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        const words = node.textContent.split(/(\s+)/);
        const fragment = document.createDocumentFragment();
        
        words.forEach((word, index) => {
          if (word.trim()) {
            // This is an actual word, wrap it in a span with animation
            const span = document.createElement('span');
            span.textContent = word;
            span.className = 'ai-word-animation';
            span.style.animationDelay = `${index * 30}ms`;
            fragment.appendChild(span);
          } else {
            // This is whitespace, preserve it as is
            fragment.appendChild(document.createTextNode(word));
          }
        });
        
        if (node.parentNode) {
          node.parentNode.replaceChild(fragment, node);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Process child elements
        Array.from(node.childNodes).forEach(child => {
          processTextNodes(child);
        });
      }
    };
    
    // Process all nodes inside the element
    Array.from(tempDiv.childNodes).forEach(child => {
      processTextNodes(child);
    });
    
    return tempDiv.outerHTML;
  };

  return (
    <div ref={editorWrapperRef} className="relative text-editor-container">
      <div className="flex">
        <div className="relative w-10 flex-shrink-0">
          {(showPlusButton || aiModeActive) && (
            <button
              ref={plusButtonRef}
              className={cn(
                "absolute w-6 h-6 flex items-center justify-center rounded-full transition-colors inset-x-0 mx-auto",
                aiModeActive ? "ai-button" : "bg-gray-100 hover:bg-gray-200 plus-button"
              )}
              style={{
                top: `${plusButtonPosition.top}px`,
              }}
              onClick={handlePlusButtonClick}
              onMouseEnter={handlePlusButtonMouseEnter}
              onMouseLeave={handlePlusButtonMouseLeave}
              aria-label="Insert content"
            >
              <div className={`icon-morph-container ${aiModeActive ? 'morph-to-sparkle' : 'morph-to-plus'}`}>
                <div className="plus-icon">
                  <PlusIcon className="w-3.5 h-3.5 text-gray-600" />
                </div>
                <div className="sparkle-icon">
                  <SparkleIcon className="w-3.5 h-3.5 text-blue-600" />
                </div>
              </div>
            </button>
          )}
        </div>
        
        <div
          ref={editorRef}
          className={cn(
            "text-editor flex-1 min-h-[150px] p-4 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none",
            className
          )}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleSelectionChange}
          suppressContentEditableWarning
        />
      </div>
      
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-64 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden dropdown"
          style={{
            top: `${dropdownPosition.top + 5}px`,
            left: `${dropdownPosition.left + 40}px`,
          }}
        >
          {optionsToDisplay.length > 0 ? (
            <div className="max-h-72 overflow-y-auto py-1">
              {optionsToDisplay.map((option, index) => {
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
                      selectedOptionIndex === index ? "bg-gray-100" : "",
                      (option.id === 'ai-prompt' || option.id === 'ask-rovo-dynamic') ? "ai-option" : ""
                    )}
                    onClick={() => handleOptionClick(option)}
                    onMouseEnter={() => setSelectedOptionIndex(index)}
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
      )}
    </div>
  );
}; 