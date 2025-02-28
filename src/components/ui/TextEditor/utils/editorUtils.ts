/**
 * TextEditor utility functions
 */

/**
 * Gets the current line element in the editor that contains the cursor
 */
export const getCurrentLine = (editor: HTMLDivElement): HTMLElement | null => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  let currentNode = range.startContainer as Node;
  
  if (currentNode.nodeType === Node.TEXT_NODE) {
    currentNode = currentNode.parentElement as HTMLElement;
  }
  
  // Find the element that is a direct child of the editor
  while (currentNode && currentNode.parentElement !== editor) {
    currentNode = currentNode.parentElement as HTMLElement;
    
    // Bail if we somehow exit the editor
    if (!currentNode || !editor.contains(currentNode)) {
      return null;
    }
  }
  
  return currentNode as HTMLElement;
};

/**
 * Gets the caret position in the editor
 */
export interface CaretPosition {
  node: Node;
  offset: number;
}

export const getCaretPosition = (editor: HTMLDivElement): CaretPosition | null => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  
  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(editor);
  preCaretRange.setEnd(range.startContainer, range.startOffset);
  
  return {
    node: range.startContainer,
    offset: range.startOffset
  };
};

/**
 * Checks if a line is empty
 */
export const isLineEmpty = (line: HTMLElement): boolean => {
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

/**
 * Gets information about the current selection
 */
export interface SelectionInfo {
  selectedText: string;
  range: Range | null;
}

export const getSelectionInfo = (editor: HTMLDivElement): SelectionInfo => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return { selectedText: '', range: null };
  }
  
  const range = selection.getRangeAt(0);
  const isInEditor = editor.contains(range.commonAncestorContainer);
  
  if (!isInEditor) {
    return { selectedText: '', range: null };
  }
  
  return {
    selectedText: selection.toString().trim(),
    range
  };
};

/**
 * Updates the editor state and calls the onChange handler
 */
export const updateEditorState = (
  editor: HTMLDivElement, 
  setValue: (value: string) => void,
  onChange?: (value: string) => void
) => {
  const content = editor.innerHTML;
  setValue(content);
  if (onChange) onChange(content);
};

/**
 * Normalizes HTML content
 */
export const normalizeHtml = (html: string): string => {
  // Create a div to parse and normalize the HTML
  const div = document.createElement('div');
  div.innerHTML = html;
  
  // Remove empty paragraphs
  const emptyParagraphs = div.querySelectorAll('p:empty:not([data-placeholder])');
  emptyParagraphs.forEach(p => {
    // Replace with a paragraph with a <br>
    const newP = document.createElement('p');
    newP.innerHTML = '<br>';
    p.parentNode?.replaceChild(newP, p);
  });
  
  // Replace <div> elements that are not special containers with <p>
  const divs = div.querySelectorAll('div:not(.ai-prompt-container):not(.ai-prompt-content)');
  divs.forEach(div => {
    const p = document.createElement('p');
    p.innerHTML = div.innerHTML;
    div.parentNode?.replaceChild(p, div);
  });
  
  return div.innerHTML;
}; 