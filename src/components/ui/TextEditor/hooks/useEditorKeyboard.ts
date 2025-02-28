import { useEffect, RefObject } from 'react';
import { isLineEmpty } from '../utils/editorUtils';

interface UseEditorKeyboardProps {
  editorRef: RefObject<HTMLDivElement>;
  aiModeActive: boolean;
  aiModeState: 'inactive' | 'active' | 'typing';
  handleExitAiMode: () => void;
  setShowPlusButton: (show: boolean) => void;
  onChange?: (value: string) => void;
  setValue: (value: string) => void;
}

export const useEditorKeyboard = ({
  editorRef,
  aiModeActive,
  aiModeState,
  handleExitAiMode,
  setShowPlusButton,
  onChange,
  setValue
}: UseEditorKeyboardProps) => {
  // Handle Enter key press globally
  useEffect(() => {
    const handleEnterKey = (e: KeyboardEvent) => {
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
  }, [aiModeState, editorRef, setShowPlusButton]);

  // Handle Enter key in AI mode
  const handleAIEnterKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && aiModeActive) {
      e.preventDefault();
      e.stopPropagation();
      
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || !editorRef.current) return;
      
      const range = selection.getRangeAt(0);
      let currentNode = range.startContainer as Node;
      
      // Find the AI line
      if (currentNode.nodeType === Node.TEXT_NODE) {
        currentNode = currentNode.parentElement as HTMLElement;
      }
      
      let aiPromptLine = currentNode as HTMLElement;
      while (aiPromptLine && aiPromptLine.parentElement !== editorRef.current) {
        if (aiPromptLine.hasAttribute('data-ai-prompt')) {
          const promptText = aiPromptLine.textContent || '';
          
          if (promptText.trim()) {
            processAIPrompt(aiPromptLine, promptText);
          }
          
          return true;
        }
        aiPromptLine = aiPromptLine.parentElement as HTMLElement;
      }
    }
    
    return false;
  };

  // Process an AI prompt
  const processAIPrompt = (promptLine: HTMLElement, promptText: string) => {
    if (!editorRef.current) return;
    
    // Gather context from surrounding text
    const contextAbove: string[] = [];
    const contextBelow: string[] = [];
    
    // Get context above the AI prompt line
    let previousElement = promptLine.previousElementSibling;
    let contextLinesCollected = 0;
    
    while (previousElement && contextLinesCollected < 3) {
      const text = previousElement.textContent?.trim();
      if (text) {
        contextAbove.unshift(text);
        contextLinesCollected++;
      }
      previousElement = previousElement.previousElementSibling;
    }
    
    // Get context below the AI prompt line
    let nextElement = promptLine.nextElementSibling;
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
    
    console.log('Enhanced prompt with context:', fullPrompt);
    
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
    
    promptLine.innerHTML = '';
    promptLine.removeAttribute('data-ai-prompt');
    promptLine.className = '';
    promptLine.appendChild(promptContainer);
    
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
    simulateAPICall(promptLine, fullPrompt, promptContainer, promptContent);
  };

  // Simulate an API call to OpenAI (to be replaced with actual API call)
  const simulateAPICall = async (
    aiModeLine: HTMLElement, 
    fullPrompt: string, 
    promptContainer: HTMLElement,
    promptContent: HTMLElement
  ) => {
    try {
      console.log('Sending prompt to OpenAI API endpoint:', fullPrompt);
      
      // First, add the growing class to the container for animation
      promptContainer.classList.add('growing');
      
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const responseHtml = `
        <p>This is a simulated AI response to your prompt:</p>
        <p><em>"${fullPrompt.substring(0, 100)}..."</em></p>
        <p>In a real implementation, this would connect to an AI service like OpenAI.</p>
      `;
      
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
        console.log('AI response accepted');
        
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
        console.log('AI response dismissed');
        
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
        newP.textContent = fullPrompt.split('\n\n')[1].replace('Prompt: ', '');
        
        if (aiModeLine.nextSibling) {
          editorRef.current?.insertBefore(newP, aiModeLine);
        } else {
          editorRef.current?.appendChild(newP);
        }
        
        // Remove the error line
        aiModeLine.remove();
        
        // Update editor
        if (onChange && editorRef.current) {
          onChange(editorRef.current.innerHTML);
          setValue(editorRef.current.innerHTML);
        }
      };
    }
  };

  /**
   * Process HTML content to display text with a word-by-word blur animation
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

  return {
    handleAIEnterKey
  };
}; 