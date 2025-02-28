import { useState, useRef, RefObject } from 'react';
import { SparkleIcon } from '@/components/ui/icons/SparkleIcon';
import { InsertionOption } from '../TextEditor';

interface UseEditorDropdownProps {
  insertionOptions: InsertionOption[];
  editorRef: RefObject<HTMLDivElement>;
  activeLine: HTMLElement | null;
  debugLog: (message: string, ...args: any[]) => void;
  updateAiMode: (newState: 'inactive' | 'active' | 'typing', line?: HTMLElement | null) => void;
}

export const useEditorDropdown = ({
  insertionOptions,
  editorRef,
  activeLine,
  debugLog,
  updateAiMode
}: UseEditorDropdownProps) => {
  // Dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [filterText, setFilterText] = useState('');
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [dropdownOpenedBy, setDropdownOpenedBy] = useState<'slash' | 'plus' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on the current filterText
  const filteredOptions = insertionOptions.filter(option => 
    option.label.toLowerCase().includes(filterText.toLowerCase()) ||
    option.description?.toLowerCase().includes(filterText.toLowerCase())
  );

  // Handle special dynamic options
  const getOptionsToDisplay = () => {
    const displayOptions = [...filteredOptions];
    
    // Add dynamic "Ask Rovo" option when there's filter text but no matches
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

  // List of options to display
  const optionsToDisplay = getOptionsToDisplay();

  // Remove slash character from text
  const removeSlashCharacter = (): boolean => {
    if (!activeLine) return false;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    
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
    
    // Fallback: try to find any node with a slash
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

  // Handle option click
  const handleOptionClick = (option: InsertionOption) => {
    if (!editorRef.current || !activeLine) return;
    
    try {
      if (dropdownOpenedBy === 'slash') {
        removeSlashCharacter();
      }
      
      if (option.id === 'ai-prompt') {
        const isCurrentLineEmpty = !activeLine.textContent?.trim();
        
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
        }
      } else {
        // Create a new paragraph for the insertion
        const newParagraph = document.createElement('p');
        
        // Find the direct child of editor
        let directChild = activeLine;
        while (directChild.parentElement !== editorRef.current && directChild.parentElement !== null) {
          directChild = directChild.parentElement;
        }
        
        // Insert new paragraph
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
      }
    } catch (error) {
      console.error('Error in handleOptionClick:', error);
    }
    
    // Close dropdown
    setShowDropdown(false);
    setFilterText('');
    setDropdownOpenedBy(null);
  };

  return {
    showDropdown,
    setShowDropdown,
    dropdownPosition,
    setDropdownPosition,
    filterText,
    setFilterText,
    selectedOptionIndex,
    setSelectedOptionIndex,
    dropdownOpenedBy,
    setDropdownOpenedBy,
    dropdownRef,
    optionsToDisplay,
    handleOptionClick,
    removeSlashCharacter
  };
}; 