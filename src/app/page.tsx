'use client';

/** @jsxImportSource react */
import { useState, useEffect, useRef, useCallback } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { token } from '@atlaskit/tokens';
import Button from '@atlaskit/button';
import CommentIcon from '@atlaskit/icon/glyph/comment';
import EditorSearchIcon from '@atlaskit/icon/glyph/editor/search';
import MenuIcon from '@atlaskit/icon/glyph/menu';
import CrossIcon from '@atlaskit/icon/glyph/cross';
import ShortcutIcon from '@atlaskit/icon/glyph/shortcut';
import Badge from '@atlaskit/badge';
import { PageHeader } from '../components/ui/PageHeader';
import StarIcon from '@atlaskit/icon/glyph/star';
import WatchIcon from '@atlaskit/icon/glyph/watch';
import PageIcon from '@atlaskit/icon/glyph/page';
import { CollaboratorAvatars } from '../components/ui/CollaboratorAvatars';
import { AuthorAvatar } from '../components/ui/AuthorAvatar';
import Heading from '@atlaskit/heading';
import styles from '../components/layout/Editor.module.css';
import BoldIcon from '@atlaskit/icon/glyph/editor/bold';
import ItalicIcon from '@atlaskit/icon/glyph/editor/italic';
import TextColorIcon from '@atlaskit/icon/glyph/editor/text-color';
import EditorAlignLeftIcon from '@atlaskit/icon/glyph/editor/align-left';
import IndentIcon from '@atlaskit/icon/glyph/editor/indent';
import BulletListIcon from '@atlaskit/icon/glyph/editor/bullet-list';
import LinkIcon from '@atlaskit/icon/glyph/editor/link';
import AddIcon from '@atlaskit/icon/glyph/add';
import MoreIcon from '@atlaskit/icon/glyph/more';
import ChevronDownIcon from '@atlaskit/icon/glyph/chevron-down';
import { css, SerializedStyles } from '@emotion/react';
import { TextEffect } from '../components/ui/text-effect';
import { formatText } from '../lib/text-formatting';
import { FormattingProgress, FormattingStep } from '../components/ui/FormattingProgress';
import { createRoot } from 'react-dom/client';

// Define interfaces for our editor
interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onTextSelect: (text: string) => void;
  className?: string;
}

// Add these interfaces before the RichTextEditor component
interface FormatChange {
  type: 'summary' | 'toc' | 'content';
  description: string;
  before: string;
  after: string;
}

interface ProcessedContent {
  summary: string;
  tableOfContents: string;
  content: string;
  changes: FormatChange[];
}

const RichTextEditor = ({ value, onChange, onTextSelect, className }: EditorProps) => {
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [showFormatSuggestion, setShowFormatSuggestion] = useState(false);
  const [currentStep, setCurrentStep] = useState<FormattingStep>('analyzing');
  const [showHighlights, setShowHighlights] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorContent, setEditorContent] = useState(value);
  const [selectedText, setSelectedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedContent, setProcessedContent] = useState<ProcessedContent | null>(null);
  const [isFormatComplete, setIsFormatComplete] = useState(false);
  const [showChanges, setShowChanges] = useState(false);
  const [originalContent, setOriginalContent] = useState(value);
  const mainContentRootRef = useRef<ReturnType<typeof createRoot> | null>(null);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML;
    setEditorContent(newContent);
    onChange(newContent);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    
    // Check if the pasted content is plain text and longer than 100 characters
    if (text && text.length > 100) {
      document.execCommand('insertText', false, text);
      setShowFormatSuggestion(true);
    } else {
      document.execCommand('insertText', false, text);
    }
  };

  const updateToolbarPosition = () => {
    const selection = window.getSelection();
    
    if (!selection || selection.isCollapsed || !toolbarRef.current || !editorRef.current) {
      setIsToolbarVisible(false);
      onTextSelect('');
      return;
    }

    // Update selected text
    onTextSelect(selection.toString());

    // Check if selection is within editor
    let node = selection.anchorNode;
    let isWithinEditor = false;
    while (node) {
      if (node === editorRef.current) {
        isWithinEditor = true;
        break;
      }
      node = node.parentNode;
    }

    if (!isWithinEditor) {
      setIsToolbarVisible(false);
      onTextSelect('');
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Calculate position relative to the viewport
    // Use the left edge of the selection instead of the center
    const x = rect.left;
    const y = rect.top;

    // Position the toolbar
    if (toolbarRef.current) {
      const toolbarRect = toolbarRef.current.getBoundingClientRect();
      const newX = x; // Don't center the toolbar anymore
      const newY = y - toolbarRect.height - 8; // 8px gap

      // Keep toolbar within viewport bounds
      const boundedX = Math.max(
        0,
        Math.min(newX, window.innerWidth - toolbarRect.width)
      );
      const boundedY = Math.max(0, newY);

      setToolbarPosition({ x: boundedX, y: boundedY });
      setIsToolbarVisible(true);
    }
  };

  useEffect(() => {
    // Hide toolbar when selection changes
    const handleSelectionChange = () => {
      setIsToolbarVisible(false);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', updateToolbarPosition);
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Escape') {
        setIsToolbarVisible(false);
      }
    });

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', updateToolbarPosition);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle heading keyboard shortcuts
    if (e.key >= '1' && e.key <= '6' && e.altKey) {
      e.preventDefault();
      const level = parseInt(e.key) * 100;
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const headingElement = document.createElement('div');
        headingElement.className = styles[`heading-${level}`];
        const content = range.extractContents();
        headingElement.appendChild(content);
        range.insertNode(headingElement);
      }
    }
    
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      // Insert a new line with a heading
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const newHeading = document.createElement('div');
        newHeading.innerHTML = '<br>';
        range.insertNode(newHeading);
        range.setStartAfter(newHeading);
        range.setEndAfter(newHeading);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  const applyHeading = (level: 100 | 200 | 300 | 400 | 500 | 600) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const headingElement = document.createElement('div');
      headingElement.className = styles[`heading-${level}`];
      const content = range.extractContents();
      headingElement.appendChild(content);
      range.insertNode(headingElement);
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      updateToolbarPosition(); // Update toolbar position after formatting
    }
  };

  const isFormatActive = (command: string) => {
    return document.queryCommandState(command);
  };

  const handleBoldClick = () => execCommand('bold');
  const handleItalicClick = () => execCommand('italic');
  const handleLinkClick = () => {
    const url = window.prompt('Enter URL:');
    if (url) execCommand('createLink', url);
  };
  const handleBulletListClick = () => execCommand('insertUnorderedList');
  const handleAlignLeftClick = () => execCommand('justifyLeft');
  const handleIndentClick = () => execCommand('indent');

  const handleImproveWriting = () => {
    const selection = window.getSelection();
    if (selection) {
      const text = selection.toString();
      // Here you would typically call your AI service
      console.log('Improving writing for:', text);
    }
  };

  // Add helper function to check if a line has meaningful content changes
  const hasLineChanged = (newLine: string, originalContent: string) => {
    // Remove HTML tags and markdown formatting for comparison
    const cleanNewLine = newLine
      .replace(/<[^>]*>/g, '')
      .replace(/^#+\s/, '') // Remove heading markers
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/\*/g, '') // Remove italic markers
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Replace links with just their text
      .replace(/^[-*]\s/, '') // Remove list markers
      .trim();

    const cleanOriginalContent = originalContent
      .replace(/<[^>]*>/g, '')
      .replace(/^#+\s/, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/^[-*]\s/, '')
      .trim();
    
    // Split original content into lines for comparison
    const originalLines = cleanOriginalContent.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Check if the cleaned new line exists in any form in the original content
    return !originalLines.some(line => {
      const similarity = calculateSimilarity(line, cleanNewLine);
      return similarity > 0.8; // Consider lines with 80% or more similarity as unchanged
    });
  };

  // Helper function to calculate text similarity (0 to 1)
  const calculateSimilarity = (str1: string, str2: string) => {
    if (str1 === str2) return 1;
    if (!str1 || !str2) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    // Early return for very different lengths
    if (longer.length === 0) return 1.0;
    if ((longer.length - shorter.length) / longer.length > 0.3) return 0;

    const costs = [];
    for (let i = 0; i <= shorter.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= longer.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else {
          if (j > 0) {
            let newValue = costs[j - 1];
            if (shorter[i - 1] !== longer[j - 1]) {
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            }
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0) costs[longer.length] = lastValue;
    }
    return (longer.length - costs[longer.length]) / longer.length;
  };

  // Add function to handle changes panel toggle
  const handleChangesClick = async () => {
    const newShowChanges = !showChanges;
    setShowChanges(newShowChanges);
    setShowHighlights(newShowChanges); // Show highlights when panel is open

    // Re-render content with updated highlights
    if (editorRef.current && processedContent) {
      const contentWrapper = editorRef.current.querySelector('div');
      if (!contentWrapper) return;

      // Find the main content section (the last section)
      const mainSection = contentWrapper.querySelector('section:last-child');
      if (!mainSection) return;

      // Clean up any existing root
      if (mainContentRootRef.current) {
        try {
          mainContentRootRef.current.unmount();
        } catch (e) {
          console.error('Error unmounting root:', e);
        }
        mainContentRootRef.current = null;
      }

      // Remove any existing content and React root
      while (mainSection.firstChild) {
        mainSection.removeChild(mainSection.firstChild);
      }

      // Create a new container for React content
      const container = document.createElement('div');
      mainSection.appendChild(container);

      // Create new root on the fresh container
      mainContentRootRef.current = createRoot(container);

      // Use the root to render
      mainContentRootRef.current.render(
        <div className="prose prose-slate max-w-none">
          <div dangerouslySetInnerHTML={{ 
            __html: processedContent.content
              .split('\n')
              .map(line => {
                const isChanged = hasLineChanged(line, originalContent);
                const highlightClass = isChanged && newShowChanges ? 'bg-blue-50 border-b border-dotted border-blue-500' : '';

                if (line.startsWith('# ')) {
                  const title = line.replace('# ', '');
                  return `<div class="text-[24px] font-semibold text-[#172B4D] mb-6 mt-8 ${highlightClass}">${title}</div>`;
                }
                if (line.startsWith('## ')) {
                  const title = line.replace('## ', '');
                  return `<div class="text-[20px] font-medium text-[#172B4D] mb-4 mt-6 ${highlightClass}">${title}</div>`;
                }
                if (line.startsWith('---')) {
                  return '<hr class="my-8 border-t border-[#DFE1E6]" />';
                }
                if (line.trim() && !line.startsWith('#') && !line.startsWith('---')) {
                  return `<p class="text-[15px] leading-[1.6] text-[#42526E] mb-4 ${highlightClass}">${line}</p>`;
                }
                return line;
              })
              .join('\n')
          }} />
        </div>
      );
    }
  };

  // Update handleUndoAll to clean up the root
  const handleUndoAll = () => {
    if (editorRef.current && originalContent) {
      // Clean up the React root
      if (mainContentRootRef.current) {
        mainContentRootRef.current.unmount();
        mainContentRootRef.current = null;
      }
      
      editorRef.current.innerHTML = originalContent;
      setEditorContent(originalContent);
      setShowFormatSuggestion(false);
      setIsFormatComplete(false);
      setShowChanges(false);
      setShowHighlights(false);
    }
  };

  // Update handleAcceptChanges to clean up the root
  const handleAcceptChanges = () => {
    // Clean up the React root
    if (mainContentRootRef.current) {
      mainContentRootRef.current.unmount();
      mainContentRootRef.current = null;
    }
    
    setShowFormatSuggestion(false);
    setIsFormatComplete(false);
    setShowChanges(false);
    setShowHighlights(false);
    setOriginalContent(editorContent);
  };

  // Add function to handle undoing individual changes
  const handleUndoChange = (changeType: FormatChange['type']) => {
    if (!processedContent || !editorRef.current) return;

    // Find the specific change
    const change = processedContent.changes.find(c => c.type === changeType);
    if (!change) return;

    // Clean up the React root before updating content
    if (mainContentRootRef.current) {
      mainContentRootRef.current.unmount();
      mainContentRootRef.current = null;
    }

    // Update the content based on the change type
    let newContent = editorContent;
    switch (changeType) {
      case 'summary':
        // Remove summary section using a more compatible regex
        newContent = newContent.replace(/<section class="summary[\s\S]*?<\/section>/, '');
        break;
      case 'toc':
        // Remove TOC section using a more compatible regex
        newContent = newContent.replace(/<section class="toc[\s\S]*?<\/section>/, '');
        break;
      case 'content':
        // Revert main content
        newContent = change.before;
        break;
    }

    editorRef.current.innerHTML = newContent;
    setEditorContent(newContent);
    setShowHighlights(false);
  };

  // Clean up the root when component unmounts
  useEffect(() => {
    return () => {
      if (mainContentRootRef.current) {
        mainContentRootRef.current.unmount();
        mainContentRootRef.current = null;
      }
    };
  }, []);

  // Modify the handleFormat function
  const handleFormat = useCallback(async () => {
    try {
      setIsProcessing(true);
      setOriginalContent(editorContent); // Store original content
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'py-8'; // Remove mx-auto and max-w classes
      
      // Step 1: Show analyzing state and make the OpenAI request
      setCurrentStep('analyzing');
      const formattedContent = await formatText(editorContent);
      
      if (editorRef.current) {
        // Now that we have the content, switch to summary step
        setCurrentStep('summary');
        
        // Fade out current content
        editorRef.current.style.opacity = '0';
        await new Promise(resolve => setTimeout(resolve, 300));

        // Clear and prepare container
        editorRef.current.innerHTML = '';
        editorRef.current.appendChild(contentWrapper);
        
        // Render Summary
        const summarySection = document.createElement('section');
        summarySection.className = 'mb-12 bg-[#F8F9FA] rounded-lg p-6 border border-[#DFE1E6] opacity-0 transition-opacity duration-300';
        const summaryRoot = createRoot(summarySection);
        summaryRoot.render(
          <>
            <TextEffect per="word" preset="blur" as="h2" className="text-[#172B4D] text-lg font-semibold mb-3">
              Summary
            </TextEffect>
            <TextEffect per="word" preset="blur" className="text-[#42526E] text-base leading-relaxed">
              {formattedContent.summary}
            </TextEffect>
          </>
        );
        
        contentWrapper.appendChild(summarySection);
        editorRef.current.style.opacity = '1';
        
        // Fade in summary
        await new Promise(resolve => setTimeout(resolve, 100));
        summarySection.style.opacity = '1';
        await new Promise(resolve => setTimeout(resolve, 1500)); // Increased delay after summary

        // Store the formatted content for later use
        setProcessedContent({
          summary: formattedContent.summary,
          tableOfContents: formattedContent.tableOfContents,
          content: formattedContent.content,
          changes: [
            {
              type: 'summary',
              description: 'Added document summary',
              before: '',
              after: formattedContent.summary
            },
            {
              type: 'toc',
              description: 'Generated table of contents',
              before: '',
              after: formattedContent.tableOfContents
            },
            {
              type: 'content',
              description: 'Formatted main content',
              before: editorContent,
              after: formattedContent.content
            }
          ]
        });

        // Start Table of Contents step with delay
        setCurrentStep('toc');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Add delay before TOC
        await renderTableOfContents(contentWrapper, formattedContent.tableOfContents);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Add delay after TOC

        // Start Content step with delay
        setCurrentStep('content');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Add delay before content
        await renderMainContent(contentWrapper, formattedContent.content);
        
        // Wait for final animations
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // After all formatting is complete
      setIsFormatComplete(true);
    } catch (error) {
      console.error('Error formatting text:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [editorContent, editorRef]);

  // Separate function to handle Table of Contents rendering
  const renderTableOfContents = async (contentWrapper: HTMLDivElement, tocContent: string) => {
    // Show "Generating table of contents..." for 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const tocSection = document.createElement('section');
    tocSection.className = 'mb-12 opacity-0 transition-opacity duration-300';

    // Convert markdown to HTML with proper styling
    const formattedTocContent = tocContent.split('\n').map(line => {
      if (line.startsWith('## ')) {
        // Main section
        const content = line.replace('## ', '');
        return `<div class="text-[#172B4D] font-medium text-[15px] mb-2">${content}</div>`;
      } else if (line.startsWith('### ')) {
        // Subsection with indent
        const content = line.replace('### ', '');
        return `<div class="text-[#42526E] text-[14px] ml-4 mb-1.5 hover:text-[#0052CC] cursor-pointer">${content}</div>`;
      }
      return line;
    }).join('');

    const tocRoot = createRoot(tocSection);
    tocRoot.render(
      <>
        <TextEffect per="word" preset="blur" as="h2" className="text-[#172B4D] text-xl font-semibold mb-4">
          Table of Contents
        </TextEffect>
        <div className="bg-[#FAFBFC] rounded-lg p-5 border-l-4 border-[#0052CC]">
          <div 
            className="space-y-1"
            dangerouslySetInnerHTML={{ __html: formattedTocContent }}
          />
        </div>
      </>
    );
    
    contentWrapper.appendChild(tocSection);
    
    // Fade in TOC
    await new Promise(resolve => setTimeout(resolve, 100));
    tocSection.style.opacity = '1';
  };

  // Modify the renderMainContent function to include highlights
  const renderMainContent = async (contentWrapper: HTMLDivElement, content: string) => {
    const mainSection = document.createElement('section');
    mainSection.className = 'opacity-0 transition-opacity duration-300';

    // Convert markdown headings to properly styled divs
    const formattedContent = content
      .split('\n')
      .map(line => {
        const isChanged = hasLineChanged(line, originalContent);
        const highlightClass = isChanged && showHighlights ? 'bg-blue-50 border-b border-dotted border-blue-500' : '';

        // Handle main headings (H1)
        if (line.startsWith('# ')) {
          const title = line.replace('# ', '');
          return `<div class="text-[24px] font-semibold text-[#172B4D] mb-6 mt-8 ${highlightClass}">${title}</div>`;
        }
        // Handle subheadings (H2)
        if (line.startsWith('## ')) {
          const title = line.replace('## ', '');
          return `<div class="text-[20px] font-medium text-[#172B4D] mb-4 mt-6 ${highlightClass}">${title}</div>`;
        }
        // Handle horizontal rules
        if (line.startsWith('---')) {
          return '<hr class="my-8 border-t border-[#DFE1E6]" />';
        }
        // Handle paragraphs (non-empty lines that don't start with # or ---)
        if (line.trim() && !line.startsWith('#') && !line.startsWith('---')) {
          return `<p class="text-[15px] leading-[1.6] text-[#42526E] mb-4 ${highlightClass}">${line}</p>`;
        }
        // Handle empty lines
        return line;
      })
      .join('\n');

    const mainRoot = createRoot(mainSection);
    mainRoot.render(
      <div className="prose prose-slate max-w-none">
        <div dangerouslySetInnerHTML={{ __html: formattedContent }} />
      </div>
    );
    
    contentWrapper.appendChild(mainSection);
    
    // Fade in main content
    await new Promise(resolve => setTimeout(resolve, 100));
    mainSection.style.opacity = '1';
  };

  const handleDismiss = () => {
    // If we're in the middle of processing, clean up and revert
    if (isProcessing) {
      // Clean up any React roots that might have been created
      if (mainContentRootRef.current) {
        mainContentRootRef.current.unmount();
        mainContentRootRef.current = null;
      }
      
      // Restore original content if editor was modified
      if (editorRef.current && originalContent) {
        editorRef.current.innerHTML = originalContent;
        setEditorContent(originalContent);
      }
      
      // Reset all states
      setIsProcessing(false);
      setCurrentStep('analyzing');
      setProcessedContent(null);
      setIsFormatComplete(false);
      setShowHighlights(false);
      setShowChanges(false);
    }
    
    // Close the format suggestion
    setShowFormatSuggestion(false);
  };

  return (
    <div className="relative">
      {/* Format suggestion button */}
      {showFormatSuggestion && (
        <div 
          className="fixed bottom-6 right-[72px] flex flex-col items-end gap-2"
          style={{
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          {isFormatComplete ? (
            <>
              <div className="flex items-center gap-2">
                <button 
                  className={`flex items-center gap-2 px-4 h-10 bg-white rounded-l-[8pt] shadow-lg border border-[#DFE1E6] hover:bg-[#F4F5F7] transition-all duration-300`}
                  onClick={handleChangesClick}
                >
                  <svg className="w-4 h-4 text-[#36B37E]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[14px] font-medium text-[#505258] font-['Inter var']">
                    {processedContent?.changes.length || 0} changes made
                  </span>
                  <svg className={`w-4 h-4 text-[#505258] transition-transform duration-200 ${showChanges ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex items-center justify-center w-10 h-10 bg-white rounded-r-[8pt] shadow-lg border border-l-0 border-[#DFE1E6] hover:bg-[#F4F5F7] transition-colors shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 1L1 13M1 1L13 13" stroke="#505258" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {!showChanges && (
                  <>
                    <button
                      onClick={handleAcceptChanges}
                      className="flex items-center gap-2 px-4 h-10 bg-[#0052CC] text-white rounded-[8pt] shadow-lg hover:bg-[#0065FF] transition-colors"
                    >
                      <span className="text-[14px] font-medium font-['Inter var']">Accept all</span>
                    </button>
                    <button
                      onClick={handleUndoAll}
                      className="flex items-center gap-2 px-4 h-10 bg-white rounded-[8pt] shadow-lg border border-[#DFE1E6] hover:bg-[#F4F5F7] transition-colors"
                    >
                      <span className="text-[14px] font-medium text-[#505258] font-['Inter var']">Undo all</span>
                    </button>
                  </>
                )}
              </div>

              {/* Changes panel */}
              {showChanges && processedContent && (
                <div className="w-[400px] bg-white rounded-lg shadow-xl border border-[#DFE1E6] p-4 mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[14px] font-medium text-[#172B4D]">Changes made</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAcceptChanges}
                        className="text-[13px] text-[#0052CC] font-medium hover:text-[#0065FF] hover:underline"
                      >
                        Accept all
                      </button>
                      <span className="text-[#DFE1E6]">|</span>
                      <button
                        onClick={handleUndoAll}
                        className="text-[13px] text-[#505258] font-medium hover:text-[#42526E] hover:underline"
                      >
                        Undo all
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {processedContent.changes.map((change) => (
                      <div key={change.type} className="flex items-center justify-between py-2 border-t border-[#DFE1E6] first:border-t-0">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#36B37E]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className="text-[13px] text-[#42526E]">{change.description}</span>
                        </div>
                        <button
                          onClick={() => handleUndoChange(change.type)}
                          className="text-[13px] text-[#505258] hover:text-[#42526E] hover:underline"
                        >
                          Undo
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center">
              <button 
                className={`flex items-center gap-2 px-4 h-10 bg-white rounded-l-[8pt] shadow-lg border border-[#DFE1E6] hover:bg-[#F4F5F7] transition-all duration-300 ${isProcessing ? 'min-w-[280px]' : ''}`}
                onClick={handleFormat}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2 w-full">
                    <FormattingProgress currentStep={currentStep} />
                  </div>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-[#357DE8] shrink-0" width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M10.623 2V0H12.123V2H10.623ZM8.54456 3.48223L7.13034 2.06802L8.191 1.00736L9.60522 2.42157L8.54456 3.48223ZM15.6156 2.06802L14.2014 3.48223L13.1407 2.42157L14.555 1.00736L15.6156 2.06802ZM9.40068 4.16161C9.93765 3.62464 10.8083 3.62464 11.3452 4.16161L12.4613 5.27773C12.9983 5.8147 12.9983 6.6853 12.4613 7.22227L4.34522 15.3384C3.80825 15.8754 2.93765 15.8754 2.40068 15.3384L1.28456 14.2223C0.747593 13.6853 0.747594 12.8147 1.28456 12.2777L9.40068 4.16161ZM10.373 5.31066L8.93361 6.75L9.87295 7.68934L11.3123 6.25L10.373 5.31066ZM8.81229 8.75L7.87295 7.81066L2.43361 13.25L3.37295 14.1893L8.81229 8.75ZM16.623 6H14.623V4.5H16.623V6ZM14.555 9.49264L13.1407 8.07843L14.2014 7.01777L15.6156 8.43198L14.555 9.49264Z" fill="currentColor"/>
                    </svg>
                    <span className="text-[14px] font-medium text-[#505258] font-['Inter var']">Format page</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDismiss}
                className="flex items-center justify-center w-10 h-10 bg-white rounded-r-[8pt] shadow-lg border border-l-0 border-[#DFE1E6] hover:bg-[#F4F5F7] transition-colors shrink-0"
                disabled={false} // Remove disabled state to allow dismissal during processing
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 1L1 13M1 1L13 13" stroke="#505258" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Toolbar */}
      <div
        ref={toolbarRef}
        className={`${styles.floatingToolbar} ${isToolbarVisible ? styles.visible : ''}`}
        style={{
          position: 'fixed',
          left: toolbarPosition.x,
          top: toolbarPosition.y,
        }}
      >
        <button 
          className={styles.aiButton}
          onClick={handleImproveWriting}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Improve writing
          <span className={styles.tooltip}>AI writing suggestions</span>
        </button>
        <div className={styles.divider} />
        <div className={styles.dropdown}>
          <button>
            T
            <ChevronDownIcon label="" size="medium" />
            <span className={styles.tooltip}>Text styles</span>
          </button>
        </div>
        <button
          onClick={handleBoldClick}
          data-active={isFormatActive('bold')}
        >
          <BoldIcon label="Bold" size="medium" />
          <span className={styles.tooltip}>Bold (⌘B)</span>
        </button>
        <button
          onClick={handleItalicClick}
          data-active={isFormatActive('italic')}
        >
          <ItalicIcon label="Italic" size="medium" />
          <span className={styles.tooltip}>Italic (⌘I)</span>
        </button>
        <button>
          <MoreIcon label="More" size="medium" />
          <span className={styles.tooltip}>More formatting</span>
        </button>
        <div className={styles.divider} />
        <div className={styles.dropdown}>
          <button
            onClick={handleAlignLeftClick}
            data-active={isFormatActive('justifyLeft')}
          >
            <EditorAlignLeftIcon label="Alignment" size="medium" />
            <ChevronDownIcon label="" size="medium" />
            <span className={styles.tooltip}>Alignment</span>
          </button>
        </div>
        <div className={styles.dropdown}>
          <button>
            <TextColorIcon label="Text color" size="medium" />
            <ChevronDownIcon label="" size="medium" />
            <span className={styles.tooltip}>Text color</span>
          </button>
        </div>
        <button
          onClick={handleIndentClick}
        >
          <IndentIcon label="Indent" size="medium" />
          <span className={styles.tooltip}>Indent</span>
        </button>
        <button
          onClick={handleBulletListClick}
          data-active={isFormatActive('insertUnorderedList')}
        >
          <BulletListIcon label="Bullet list" size="medium" />
          <span className={styles.tooltip}>Bullet list</span>
        </button>
        <button
          onClick={handleLinkClick}
        >
          <LinkIcon label="Link" size="medium" />
          <span className={styles.tooltip}>Link (⌘K)</span>
        </button>
        <button>
          <CommentIcon label="Comment" size="medium" />
          <span className={styles.tooltip}>Comment</span>
        </button>
        <button>
          <AddIcon label="Add" size="medium" />
          <span className={styles.tooltip}>Insert</span>
        </button>
      </div>

      {/* Editor */}
      <div 
        ref={editorRef}
        className={`${styles.editor} ${className || ''}`}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
    </div>
  );
};

interface EditorStyles {
  section: SerializedStyles;
  editor: SerializedStyles;
  floatingToolbar: SerializedStyles;
  visible: SerializedStyles;
  aiButton: SerializedStyles;
  tooltip: SerializedStyles;
  divider: SerializedStyles;
  dropdown: SerializedStyles;
  ['heading-100']: SerializedStyles;
  ['heading-200']: SerializedStyles;
  ['heading-300']: SerializedStyles;
  ['heading-400']: SerializedStyles;
  ['heading-500']: SerializedStyles;
  ['heading-600']: SerializedStyles;
}

const editorStyles: EditorStyles = {
  section: css`
    margin-bottom: 24px;
    
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 500;
      color: #172B4D;
      margin-bottom: 12px;
    }

    p {
      font-size: 15px;
      line-height: 1.714;
      color: #42526E;
      margin-bottom: 16px;
    }

    .objective {
      font-size: 15px;
      line-height: 1.714;
      color: #172B4D;
      margin-bottom: 8px;
      
      strong {
        font-weight: 500;
      }
    }

    ul {
      margin-bottom: 16px;
      
      li {
        font-size: 15px;
        line-height: 1.714;
        color: #42526E;
        margin-bottom: 4px;

        &.kr {
          display: flex;
          gap: 4px;
          
          strong {
            color: #172B4D;
            font-weight: 500;
          }
          
          span {
            color: #42526E;
          }
        }

        strong {
          color: #172B4D;
          font-weight: 500;
        }
      }
    }

    a {
      color: #0052CC;
      text-decoration: none;
      
      &:hover {
        color: #0065FF;
        text-decoration: underline;
      }
    }
  `,
  editor: css`
    width: 100%;
    outline: none;
    padding: 16px;
  `,
  floatingToolbar: css`
    position: absolute;
    background: white;
    border-radius: 4px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    padding: 8px;
  `,
  visible: css`
    display: block;
  `,
  aiButton: css`
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    &:hover {
      background: #F4F5F7;
    }
  `,
  tooltip: css`
    position: relative;
  `,
  divider: css`
    width: 1px;
    height: 16px;
    background: #DFE1E6;
    margin: 0 8px;
  `,
  dropdown: css`
    position: relative;
  `,
  'heading-100': css`font-size: 24px; font-weight: 500;`,
  'heading-200': css`font-size: 20px; font-weight: 500;`,
  'heading-300': css`font-size: 16px; font-weight: 500;`,
  'heading-400': css`font-size: 14px; font-weight: 500;`,
  'heading-500': css`font-size: 12px; font-weight: 500;`,
  'heading-600': css`font-size: 11px; font-weight: 500;`,
};

// Add animation keyframes to your CSS
const fadeInAnimation = css`
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export default function Home() {
  const [content, setContent] = useState('');
  const [showFormatSuggestion, setShowFormatSuggestion] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showChanges, setShowChanges] = useState(false);
  const [isFormatComplete, setIsFormatComplete] = useState(false);
  const [processedContent, setProcessedContent] = useState<{
    changes: Array<{
      type: string;
      description: string;
    }>;
    content: string;
  } | null>(null);

  const [selectedText, setSelectedText] = useState('');

  const breadcrumbItems = [
    { label: 'Vitafleet', href: '/vitafleet' },
    { label: 'Strategy planning', href: '/vitafleet/strategy-planning' }
  ];

  const metadata = {
    author: {
      name: 'Veronica Rodriguez',
      avatar: '',
    },
    timeAgo: '4 hours ago',
    readingTime: '12 minutes',
    views: 320,
    reactions: 24,
  };

  const collaborators = [
    {
      email: 'veronica@example.com',
      key: 'vr-avatar',
      name: 'Veronica Rodriguez',
      src: '',
      appearance: 'circle' as const,
      size: 'medium' as const,
      href: '#',
      presence: 'online' as const,
    },
    {
      email: 'elena@example.com',
      key: 'es-avatar',
      name: 'Elena Smith',
      src: '',
      appearance: 'circle' as const,
      size: 'medium' as const,
      href: '#',
      presence: 'online' as const,
    },
  ];

  const handleFormat = async () => {
    setIsProcessing(true);
    setCurrentStep(0);
    
    try {
      const response = await formatText(content);
      setProcessedContent({
        changes: [
          { type: 'headings', description: 'Fixed heading hierarchy' },
          { type: 'lists', description: 'Standardized list formatting' },
          { type: 'whitespace', description: 'Normalized whitespace' },
          { type: 'links', description: 'Fixed broken links' }
        ],
        content: response.content
      });
      setIsFormatComplete(true);
      setContent(response.content);
    } catch (error) {
      console.error('Error formatting text:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptChanges = () => {
    // Changes are already applied, just close the panel
    setShowChanges(false);
    setShowFormatSuggestion(false);
  };

  const handleUndoAll = () => {
    setContent(content); // Revert to original text
    setShowChanges(false);
    setShowFormatSuggestion(false);
    setIsFormatComplete(false);
    setProcessedContent(null);
  };

  const handleUndoChange = (changeType: string) => {
    // Remove the change from the list
    if (processedContent) {
      setProcessedContent({
        ...processedContent,
        changes: processedContent.changes.filter(c => c.type !== changeType)
      });
    }
  };

  return (
    <MainLayout selectedText={selectedText}>
      <PageHeader 
        title="Strategy Planning" 
        breadcrumbItems={breadcrumbItems}
        metadata={metadata}
      />
      
      <div className="flex">
        <main className="flex-1">
          <div className="px-10 py-6 bg-white flex justify-center">
            <div className="max-w-[1024px] w-full">
              <div className="relative">
                <div className="min-h-[calc(100vh-250px)]">
                  {/* Document metadata section */}
                  <div className="pb-4 mb-6 border-b border-[#DFE1E6]">
                    <div className="flex items-center gap-2 mb-2">
                        <AuthorAvatar name="VR" />
                      <span className="text-[13px] text-[#42526E]">By {metadata.author.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[13px] text-[#42526E]">
                          <span className="text-[#E2B203]">🔒</span>
                          <span>Confidential</span>
                        </div>
                        <div className="flex items-center gap-1 text-[13px] text-[#42526E]">
                          <span className="text-[#36B37E]">✓</span>
                          <span>Approved</span>
                        </div>
                        <div className="flex items-center gap-1 text-[13px] text-[#42526E]">
                          <PageIcon size="small" label="" primaryColor={token('color.icon.subtle', '#42526E')} />
                          <span>{metadata.readingTime}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[13px] text-[#42526E]">
                          <span>❤️ 🚀</span>
                          <span>{metadata.reactions}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center w-full">
                    <div className="max-w-[1024px] w-full">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#E3FCEF] flex items-center justify-center">
                              <span className="text-[#006644] text-sm">VF</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[#172B4D] text-sm font-medium">VitaFleet</span>
                              <span className="text-[#42526E] text-xs">Approved by John Smith</span>
                            </div>
                          </div>
                        </div>
                        
                        <RichTextEditor
                    value={content}
                          onChange={setContent}
                          onTextSelect={setSelectedText}
                          className={editorStyles.section.toString()}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}
