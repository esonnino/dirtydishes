import { cn } from '../../lib/utils';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import React from 'react';
import Tag from '@atlaskit/tag';
import { TextLoop } from '@/components/core/text-loop';

interface AISuggestion {
  title: string;
  description: string;
  type: string;
}

interface Suggestion {
  id: string;
  icon: React.ReactElement;
  title: string;
  subtitle?: string;
}

interface Action {
  id: string;
  icon: React.ReactElement;
  title: string;
}

interface Agent {
  id: string;
  icon: React.ReactElement;
  title: string;
  description: string;
  color: string;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  animate?: boolean;
  initialPosition?: { x: number; y: number };
  isLoading?: boolean;
  tags?: Array<{
    text: string;
    appearance: 'rounded';
    color: 'standard';
  }>;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  expanded?: boolean;
  selectedAction?: 'accept' | 'undo';
}

type MessageStyle = {
  '--initial-x': string;
  '--initial-y': string;
} & React.CSSProperties;

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText?: string;
  onClearSelection?: () => void;
  editorContent?: string;
  breadcrumbItems?: Array<{ label: string }>;
}

// Add new interface for format steps
interface FormatStep {
  id: string;
  text: string;
  status: 'pending' | 'active' | 'completed';
}

export const AIPanel: React.FC<AIPanelProps> = ({ isOpen, onClose, selectedText, onClearSelection, editorContent, breadcrumbItems = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ title: string; description: string; type: string }>>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isChatMode, setIsChatMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [steps, setSteps] = useState<FormatStep[]>([
    { id: 'analyzing', text: 'Analyzing your document...', status: 'pending' },
    { id: 'summary', text: 'Generating document summary...', status: 'pending' },
    { id: 'toc', text: 'Generating table of contents...', status: 'pending' },
    { id: 'content', text: 'Formatting content...', status: 'pending' }
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Add effect to focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        const input = isChatMode ? chatInputRef.current : inputRef.current;
        if (input) {
          input.focus();
          const len = input.value.length;
          input.setSelectionRange(len, len);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, isChatMode]);

  // Add debounce utility
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Debounced version of fetchSuggestions
  const debouncedFetchSuggestions = useCallback(
    debounce((text: string) => {
      if (text) {
        setIsLoadingSuggestions(true);
        fetchSuggestions(text);
      }
    }, 500),
    []
  );

  // Update the useEffect to use the debounced version
  useEffect(() => {
    setSearchQuery(''); // Always reset search query when selectedText changes
    
    if (selectedText) {
      debouncedFetchSuggestions(selectedText);
    } else {
      setAiSuggestions([]); // Clear suggestions when no text is selected
      setIsLoadingSuggestions(false);
    }

    // Cleanup function
    return () => {
      setIsLoadingSuggestions(false);
    };
  }, [selectedText, debouncedFetchSuggestions]);

  // Separate fetchSuggestions function for better organization
  const fetchSuggestions = async (text: string) => {
    try {
      console.log('Fetching suggestions for text:', text.substring(0, 50) + '...');
      setIsLoadingSuggestions(true);

      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
        // Add these options to help with the fetch error
        cache: 'no-store',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received suggestions:', data);

      if (Array.isArray(data.suggestions)) {
        setAiSuggestions(data.suggestions.slice(0, 3));
      } else {
        console.error('Invalid suggestions format:', data);
        setAiSuggestions([
          {
            title: "Improve writing",
            description: "Enhance the clarity and impact of your text",
            type: "improve"
          },
          {
            title: "Fix grammar",
            description: "Check for grammatical improvements",
            type: "improve"
          },
          {
            title: "Summarize",
            description: "Create a concise summary",
            type: "analyze"
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setAiSuggestions([
        {
          title: "Improve writing",
          description: "Enhance the clarity and impact of your text",
          type: "improve"
        },
        {
          title: "Fix grammar",
          description: "Check for grammatical improvements",
          type: "improve"
        },
        {
          title: "Summarize",
          description: "Create a concise summary",
          type: "analyze"
        }
      ]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Define all items
  const suggestions: Suggestion[] = [
    {
      id: 'format-page',
      icon: (
        <svg className="w-4 h-4 text-[#357DE8]" width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M10.623 2V0H12.123V2H10.623ZM8.54456 3.48223L7.13034 2.06802L8.191 1.00736L9.60522 2.42157L8.54456 3.48223ZM15.6156 2.06802L14.2014 3.48223L13.1407 2.42157L14.555 1.00736L15.6156 2.06802ZM9.40068 4.16161C9.93765 3.62464 10.8083 3.62464 11.3452 4.16161L12.4613 5.27773C12.9983 5.8147 12.9983 6.6853 12.4613 7.22227L4.34522 15.3384C3.80825 15.8754 2.93765 15.8754 2.40068 15.3384L1.28456 14.2223C0.747593 13.6853 0.747594 12.8147 1.28456 12.2777L9.40068 4.16161ZM10.373 5.31066L8.93361 6.75L9.87295 7.68934L11.3123 6.25L10.373 5.31066ZM8.81229 8.75L7.87295 7.81066L2.43361 13.25L3.37295 14.1893L8.81229 8.75ZM16.623 6H14.623V4.5H16.623V6ZM14.555 9.49264L13.1407 8.07843L14.2014 7.01777L15.6156 8.43198L14.555 9.49264Z" fill="currentColor"/>
        </svg>
      ),
      title: 'Format page',
      subtitle: 'Improve structure and readability'
    },
    {
      id: 'find-work',
      icon: (
        <svg className="w-4 h-4 text-[#475467]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      title: 'Find work items',
      subtitle: 'updated last week'
    },
    {
      id: 'draft-okr',
      icon: (
        <svg className="w-4 h-4 text-[#475467]" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.88-11.71L10 14.17l-1.88-1.88a.996.996 0 1 0-1.41 1.41l2.59 2.59c.39.39 1.02.39 1.41 0L17.3 9.7a.996.996 0 0 0 0-1.41c-.39-.39-1.03-.39-1.42 0z"/>
        </svg>
      ),
      title: 'Draft an OKR'
    }
  ];

  const actions: Action[] = [
    {
      id: 'summarize-page',
      icon: (
        <svg className="w-5 h-5 text-[#475467]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 5h16v2H4zm0 6h16v2H4zm0 6h10v2H4z" fill="currentColor"/>
        </svg>
      ),
      title: 'Summarize page'
    },
    {
      id: 'change-tone',
      icon: (
        <svg className="w-5 h-5 text-[#475467]" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
        </svg>
      ),
      title: 'Change tone to...'
    },
    {
      id: 'summarize',
      icon: (
        <svg className="w-5 h-5 text-[#475467]" viewBox="0 0 24 24">
          <path fill="currentColor" d="M14 17H4v2h10v-2zm6-8H4v2h16V9zM4 15h16v-2H4v2zM4 5v2h16V5H4z"/>
        </svg>
      ),
      title: 'Summarise writing'
    },
    {
      id: 'improve',
      icon: (
        <svg className="w-5 h-5 text-[#475467]" viewBox="0 0 24 24">
          <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
      ),
      title: 'Improve writing'
    },
    {
      id: 'spelling',
      icon: (
        <svg className="w-5 h-5 text-[#475467]" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12.45 16h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L23 13l-4.99-5z"/>
        </svg>
      ),
      title: 'Fix spelling & grammar'
    },
    {
      id: 'explore',
      icon: (
        <svg className="w-5 h-5 text-[#475467]" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      ),
      title: 'Explore more'
    }
  ];

  const agents: Agent[] = [
    {
      id: 'rovo',
      icon: (
        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24">
          <path fill="currentColor" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      ),
      title: 'Rovo Expert',
      description: 'Get to know the Rovo expert that helps you get started with...',
      color: 'bg-[#2970FF]'
    },
    {
      id: 'decision',
      icon: (
        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24">
          <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
        </svg>
      ),
      title: 'Decision Director',
      description: 'Clearly communicate your decisions and make quick, well...',
      color: 'bg-[#039855]'
    },
    {
      id: 'product',
      icon: (
        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41z"/>
        </svg>
      ),
      title: 'Product Requirements Expert',
      description: 'Get feedback on product requirements and inform your c...',
      color: 'bg-[#F79009]'
    }
  ];

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = {
      suggestions: suggestions.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.subtitle?.toLowerCase().includes(query)
      ),
      actions: actions.filter(item => 
        item.title.toLowerCase().includes(query)
      ),
      agents: agents.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.description.toLowerCase().includes(query)
      )
    };

    // If no results and there's a search query, add the "Ask Rovo" suggestion
    if (query && 
        filtered.suggestions.length === 0 && 
        filtered.actions.length === 0 && 
        filtered.agents.length === 0) {
      filtered.suggestions = [{
        id: 'ask-rovo',
        icon: (
          <svg className="w-5 h-5 text-[#475467]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.25 7.5C5.25 6.25736 6.25736 5.25 7.5 5.25H16.5C17.7426 5.25 18.75 6.25736 18.75 7.5V13.5C18.75 14.7426 17.7426 15.75 16.5 15.75H13.0104L8.46109 18.795C8.19839 18.9733 7.84765 18.9338 7.62822 18.7005C7.40879 18.4672 7.39957 18.1113 7.60675 17.8671L9.75 15.75H7.5C6.25736 15.75 5.25 14.7426 5.25 13.5V7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        title: 'Ask Rovo',
        subtitle: query
      }];
    }

    // Set selected index to 0 only if there's a query and results
    if (query && (filtered.suggestions.length > 0 || filtered.actions.length > 0 || filtered.agents.length > 0)) {
      setSelectedItemIndex(0);
    } else {
      setSelectedItemIndex(null);
    }
    
    return filtered;
  }, [searchQuery]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isChatMode) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      } else if (e.key === 'Escape') {
        handleBackToMain();
      }
      return;
    }

    const query = searchQuery.trim();
    if (!query) return;

    if (e.key === 'Enter' && selectedItemIndex !== null) {
      // Handle activation of selected item
      const selectedItem = getSelectedItemInfo();
      if (selectedItem.type === 'suggestion') {
        const suggestion = filteredItems.suggestions[selectedItem.index];
        if (suggestion.id === 'ask-rovo') {
          handleAskRovoClick(suggestion.subtitle || '');
        }
      }
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      setSelectedItemIndex(prev => {
        if (prev === null) return 0;
        const totalItems = 
          filteredItems.suggestions.length + 
          filteredItems.actions.length + 
          filteredItems.agents.length;
        return (prev + 1) % totalItems;
      });
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setSelectedItemIndex(prev => {
        if (prev === null) return 0;
        const totalItems = 
          filteredItems.suggestions.length + 
          filteredItems.actions.length + 
          filteredItems.agents.length;
        return (prev - 1 + totalItems) % totalItems;
      });
      e.preventDefault();
    }
  };

  // Get the currently selected item type and index
  const getSelectedItemInfo = () => {
    if (selectedItemIndex === null) {
      return { type: null, index: null };
    }
    
    let index = selectedItemIndex;
    if (index < filteredItems.suggestions.length) {
      return { type: 'suggestion', index };
    }
    index -= filteredItems.suggestions.length;
    if (index < filteredItems.actions.length) {
      return { type: 'action', index };
    }
    index -= filteredItems.actions.length;
    return { type: 'agent', index };
  };

  // Add a handler for clearing selection
  const handleClearSelection = () => {
    if (onClearSelection) {
      onClearSelection();
    }
  };

  const handleBackToMain = () => {
    setIsChatMode(false);
    setSearchQuery('');
    setCurrentQuery('');
  };

  const handleSendMessage = async () => {
    if (!currentQuery.trim() || isSending) return;

    setIsSending(true);
    const newMessage: Message = {
      id: Date.now().toString(),
      content: currentQuery,
      sender: 'user',
      timestamp: new Date()
    };

    // Add loading message immediately
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      sender: 'assistant',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, newMessage, loadingMessage]);
    setCurrentQuery('');

    try {
      // Check if this is a response to format changes
      const lastAssistantMessage = messages[messages.length - 1];
      if (lastAssistantMessage?.content?.includes('<FormatChanges>')) {
        const changes = JSON.parse(
          lastAssistantMessage.content
            .split('<FormatChanges>')[1]
            .split('</FormatChanges>')[0]
        );

        let responseData;
        if (currentQuery === '1' || currentQuery.toLowerCase().includes('accept all')) {
          // Accept all changes
          responseData = {
            reply: "Great! I've applied all the formatting changes to your document. The page has been updated with improved structure and readability."
          };
          // Apply the changes here
          if (changes[2]?.after) {
            // Update the editor content with the formatted content
            const event = new CustomEvent('applyFormatChanges', {
              detail: { content: changes[2].after }
            });
            window.dispatchEvent(event);
          }
        } else if (currentQuery === '2' || currentQuery.toLowerCase().includes('review')) {
          // Show changes one by one
          responseData = {
            reply: `<FormatChanges>${JSON.stringify(changes)}</FormatChanges>`,
            expanded: true
          };
        } else if (currentQuery === '3' || currentQuery.toLowerCase().includes('undo all')) {
          // Undo all changes
          responseData = {
            reply: "I've reverted all formatting changes. The document has been restored to its original state."
          };
          // Trigger undo event
          const event = new CustomEvent('undoFormatChanges');
          window.dispatchEvent(event);
        } else {
          // Handle regular chat
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [...messages, newMessage],
              editorContent,
              selectedText
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to get response');
          }

          responseData = await response.json();
        }
        
        const assistantMessage: Message = {
          id: loadingMessage.id,
          content: responseData.reply,
          sender: 'assistant',
          timestamp: new Date()
        };

        setMessages(prev => prev.map(msg => msg.id === loadingMessage.id ? assistantMessage : msg));
      } else {
        // Handle regular chat message
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, newMessage],
            editorContent,
            selectedText
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const data = await response.json();
        
        const assistantMessage: Message = {
          id: loadingMessage.id,
          content: data.reply,
          sender: 'assistant',
          timestamp: new Date()
        };

        setMessages(prev => prev.map(msg => msg.id === loadingMessage.id ? assistantMessage : msg));
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: loadingMessage.id,
        content: "I apologize, but I'm having trouble responding right now. Please try again.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => prev.map(msg => msg.id === loadingMessage.id ? errorMessage : msg));
    } finally {
      setIsSending(false);
    }
  };

  const handleAskRovoClick = async (query: string, event?: React.MouseEvent<HTMLButtonElement>) => {
    // Get the clicked button's position if event exists
    let initialPosition;
    if (event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const chatContainer = document.querySelector('.chat-messages-container');
      if (chatContainer) {
        const chatRect = chatContainer.getBoundingClientRect();
        initialPosition = {
          x: rect.left - chatRect.left,
          y: rect.top - chatRect.top
        };
      }
    }

    setIsChatMode(true);
    setCurrentQuery('');
    
    const initialMessage: Message = {
      id: Date.now().toString(),
      content: query,
      sender: 'user',
      timestamp: new Date(),
      animate: true,
      initialPosition
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      sender: 'assistant',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages([initialMessage, loadingMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [initialMessage],
          editorContent,
          selectedText
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: loadingMessage.id,
        content: data.reply,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => prev.map(msg => msg.id === loadingMessage.id ? assistantMessage : msg));
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: loadingMessage.id,
        content: "I apologize, but I'm having trouble responding right now. Please try again.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => prev.map(msg => msg.id === loadingMessage.id ? errorMessage : msg));
    }
  };

  const handleSummarizePage = () => {
    setIsChatMode(true);
    setCurrentQuery('');
    
    const initialMessage: Message = {
      id: Date.now().toString(),
      content: "Summarize",
      sender: 'user',
      timestamp: new Date(),
      animate: true,
      tags: [
        {
          text: breadcrumbItems[breadcrumbItems.length - 1]?.label || 'Current page',
          appearance: 'rounded',
          color: 'standard'
        }
      ]
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      sender: 'assistant',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages([initialMessage, loadingMessage]);

    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [initialMessage],
        editorContent,
        selectedText
      }),
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to get response');
      return response.json();
    })
    .then(data => {
      const assistantMessage: Message = {
        id: loadingMessage.id,
        content: data.reply,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => prev.map(msg => msg.id === loadingMessage.id ? assistantMessage : msg));
    })
    .catch(error => {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: loadingMessage.id,
        content: "I apologize, but I'm having trouble responding right now. Please try again.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => prev.map(msg => msg.id === loadingMessage.id ? errorMessage : msg));
    });
  };

  const handleFormatPage = async () => {
    setIsChatMode(true);
    setCurrentQuery('');
    setCurrentStep(0);
    
    const initialMessage: Message = {
      id: Date.now().toString(),
      content: "Format page",
      sender: 'user',
      timestamp: new Date(),
      animate: true,
      tags: [
        {
          text: breadcrumbItems[breadcrumbItems.length - 1]?.label || 'Current page',
          appearance: 'rounded',
          color: 'standard'
        }
      ]
    };

    // Create progress message with TextLoop
    const progressMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '<FormatProgress>',
      sender: 'assistant',
      timestamp: new Date()
    };

    setMessages([initialMessage, progressMessage]);

    try {
      // First step: Analyzing
      setCurrentStep(0);
      const startEvent = new CustomEvent('startFormatting');
      window.dispatchEvent(startEvent);

      // Get summary
      setCurrentStep(1);
      const summaryResponse = await fetch('/api/format/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editorContent }),
      });
      if (!summaryResponse.ok) throw new Error('Failed to get summary');
      const summaryData = await summaryResponse.json();
      const summaryEvent = new CustomEvent('formatStep', {
        detail: { 
          step: 'summary',
          content: summaryData.summary
        }
      });
      window.dispatchEvent(summaryEvent);

      // Get table of contents
      setCurrentStep(2);
      const tocResponse = await fetch('/api/format/toc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editorContent }),
      });
      if (!tocResponse.ok) throw new Error('Failed to get table of contents');
      const tocData = await tocResponse.json();
      const tocEvent = new CustomEvent('formatStep', {
        detail: { 
          step: 'toc',
          content: tocData.tableOfContents
        }
      });
      window.dispatchEvent(tocEvent);

      // Get formatted content
      setCurrentStep(3);
      const contentResponse = await fetch('/api/format/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editorContent }),
      });
      if (!contentResponse.ok) throw new Error('Failed to format content');
      const contentData = await contentResponse.json();
      const contentEvent = new CustomEvent('formatStep', {
        detail: { 
          step: 'content',
          content: contentData.content
        }
      });
      window.dispatchEvent(contentEvent);

      // Prepare the changes summary
      const changes = [
        {
          type: 'summary',
          description: 'Added document summary',
          before: '',
          after: summaryData.summary
        },
        {
          type: 'toc',
          description: 'Generated table of contents',
          before: '',
          after: tocData.tableOfContents
        },
        {
          type: 'content',
          description: 'Formatted main content',
          before: editorContent,
          after: contentData.content
        }
      ];

      // Create the final interactive message
      const finalMessage: Message = {
        id: Date.now().toString(),
        content: `<FormatChanges>${JSON.stringify(changes)}</FormatChanges>`,
        sender: 'assistant' as const,
        timestamp: new Date(),
        tags: [
          {
            text: `${changes.length} changes made`,
            appearance: 'rounded',
            color: 'standard'
          }
        ]
      };

      setMessages(prev => [prev[0], finalMessage]);
    } catch (error) {
      console.error('Format error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "I apologize, but I'm having trouble formatting the document right now. Please try again.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [prev[0], errorMessage]);
    }
  };

  // Handle input focus without affecting selection
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Just move cursor to end of input
    requestAnimationFrame(() => {
      const target = e.target;
      const len = target.value.length;
      target.setSelectionRange(len, len);
    });
  };

  // Handle input click without affecting selection
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Let the click happen normally for cursor positioning
    e.stopPropagation(); // Prevent click from bubbling to document
  };

  return (
    <div
      className={cn(
        "fixed right-0 top-[48px] bottom-0 w-[400px] bg-white border-l border-[#DFE1E6] shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className={cn(
        "relative px-6 pt-3 pb-1 transition-all duration-300 ease-in-out",
        selectedText ? "h-[136px] bg-[#F8F8F8]" : "h-[112px]"
      )}>
        {/* Back button and chat header - Only show in chat mode */}
        <div className={cn(
          "absolute inset-x-0 px-6 transition-all duration-300 ease-in-out transform",
          isChatMode ? "opacity-100 translate-y-0 z-10" : "opacity-0 -translate-y-4 pointer-events-none"
        )}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToMain}
                className="p-1 text-[#98A2B3] hover:bg-[#F9FAFB] rounded-lg transition-colors cursor-pointer"
                aria-label="Back to main panel"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.8333 10H4.16666M4.16666 10L9.16666 15M4.16666 10L9.16666 5" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="sparkleGradient" gradientTransform="rotate(90)">
                    <stop offset="25%" stopColor="#0065FF" />
                    <stop offset="41%" stopColor="#4669FF" />
                    <stop offset="73%" stopColor="#BF63F3" />
                    <stop offset="86%" stopColor="#FFA900" />
                  </linearGradient>
                </defs>
                <path fillRule="evenodd" clipRule="evenodd" transform="translate(6 6)" d="M1.5 3V4.5H3V3H4.5V1.5H3V0H1.5V1.5H0V3H1.5ZM8 1C8.30931 1 8.58689 1.18989 8.699 1.47817L10.3294 5.6706L14.5218 7.301C14.8101 7.41311 15 7.69069 15 8C15 8.30931 14.8101 8.58689 14.5218 8.699L10.3294 10.3294L8.699 14.5218C8.58689 14.8101 8.30931 15 8 15C7.69069 15 7.41311 14.8101 7.301 14.5218L5.6706 10.3294L1.47817 8.699C1.18989 8.58689 1 8.30931 1 8C1 7.69069 1.18989 7.41311 1.47817 7.301L5.6706 5.6706L7.301 1.47817C7.41311 1.18989 7.69069 1 8 1Z" fill="url(#sparkleGradient)"/>
              </svg>
              <span className="text-[16px] font-medium text-[#101828]">Chat</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 text-[#42526E] hover:bg-[#F9FAFB] rounded-md transition-colors text-[14px] font-medium">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                New chat
              </button>
              <button
                onClick={onClose}
                type="button"
                className="p-1 text-[#98A2B3] hover:bg-[#F9FAFB] rounded-lg transition-colors cursor-pointer"
                aria-label="Close panel"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main mode header content */}
        <div className={cn(
          "absolute inset-x-0 px-6 transition-all duration-300 ease-in-out transform",
          !isChatMode ? "opacity-100 translate-y-0 z-10" : "opacity-0 translate-y-4 pointer-events-none"
        )}>
          <div className="absolute left-6 top-3">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="sparkleGradient" gradientTransform="rotate(90)">
                  <stop offset="25%" stopColor="#0065FF" />
                  <stop offset="41%" stopColor="#4669FF" />
                  <stop offset="73%" stopColor="#BF63F3" />
                  <stop offset="86%" stopColor="#FFA900" />
                </linearGradient>
              </defs>
              <path fillRule="evenodd" clipRule="evenodd" transform="translate(6 6)" d="M1.5 3V4.5H3V3H4.5V1.5H3V0H1.5V1.5H0V3H1.5ZM8 1C8.30931 1 8.58689 1.18989 8.699 1.47817L10.3294 5.6706L14.5218 7.301C14.8101 7.41311 15 7.69069 15 8C15 8.30931 14.8101 8.58689 14.5218 8.699L10.3294 10.3294L8.699 14.5218C8.58689 14.8101 8.30931 15 8 15C7.69069 15 7.41311 14.8101 7.301 14.5218L5.6706 10.3294L1.47817 8.699C1.18989 8.58689 1 8.30931 1 8C1 7.69069 1.18989 7.41311 1.47817 7.301L5.6706 5.6706L7.301 1.47817C7.41311 1.18989 7.69069 1 8 1Z" fill="url(#sparkleGradient)"/>
            </svg>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="absolute right-6 top-3 p-1 text-[#98A2B3] hover:bg-[#F9FAFB] rounded-lg transition-colors cursor-pointer z-20"
            aria-label="Close panel"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Content with transitions */}
          <div className="relative h-full">
            {/* Default greeting */}
            <div className={cn(
              "absolute w-full transition-all duration-300 ease-in-out",
              selectedText 
                ? "opacity-0 -translate-y-4 pointer-events-none" 
                : "opacity-100 translate-y-0"
            )}>
              <div className="mt-11">
                <h2 className="text-[24px] font-[600] leading-[28px] tracking-[0%] font-['SF Pro'] text-[#101828]">Hi Jane,<br></br>How can I help?</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Referencing box - Now always visible when there's selected text */}
        {selectedText && (
          <div className={cn(
            "absolute top-[64px] left-6 right-6 transition-all duration-300 ease-in-out",
            "opacity-100 translate-y-0"
          )}>
            <div className="relative bg-white border border-[#DFE1E6] rounded-md shadow-sm group">
              <button 
                onClick={handleClearSelection}
                className="absolute right-3 top-2 text-[12px] font-medium text-[#98A2B3] hover:text-[#667085] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                Clear
              </button>
              <div className="flex flex-col px-3 py-2">
                <span className="text-[12px] font-medium font-['SF Pro'] text-[#344054] mb-1">Referencing</span>
                <div className="relative">
                  <span className="text-sm text-[#475467] line-clamp-2">
                    {selectedText}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content - Scrollable */}
      <div className={cn(
        "flex-1 overflow-y-auto px-6 pt-2 transition-all duration-300 ease-in-out",
        isChatMode ? "opacity-100" : "opacity-100"
      )}>
        {isChatMode ? (
          <div className="space-y-4 chat-messages-container">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.sender === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] p-3 bg-white border border-[#EAECF0] hover:bg-[#F9FAFB] text-left group transition-all duration-200",
                    message.sender === 'user' ? "text-[#344054] rounded-l-lg rounded-tr-lg rounded-br-sm" : "text-[#344054] w-full rounded-lg",
                    message.animate && "animate-bubble-appear"
                  )}
                  style={message.animate && message.initialPosition ? {
                    ['--initial-x' as string]: `${message.initialPosition.x}px`,
                    ['--initial-y' as string]: `${message.initialPosition.y}px`
                  } : undefined}
                >
                  {message.isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-[#98A2B3] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-[#98A2B3] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-[#98A2B3] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-[12px] text-[#98A2B3]">{message.content}</span>
                    </div>
                  ) : message.content === '<FormatProgress>' ? (
                    <div className="flex items-center gap-2 text-[#505258] w-full">
                      <div className="w-5 h-5 shrink-0">
                        <svg className="animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                      <div className="text-[14px] font-medium font-['Inter var'] flex-1 whitespace-nowrap">
                        <TextLoop>
                          {[<div key="current-step">{steps[currentStep].text}</div>]}
                        </TextLoop>
                      </div>
                    </div>
                  ) : message.content.includes('<FormatChanges>') ? (
                    <div className="flex flex-col gap-3 w-[350px]">
                      <div className="flex flex-col gap-2">
                        <span className="text-[14px] text-[#344054] font-medium">The page was formatted to increase scannability</span>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => {
                              setMessages(prev => prev.map(msg => 
                                msg.id === message.id 
                                  ? { ...msg, expanded: !msg.expanded }
                                  : msg
                              ));
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 text-[14px] font-medium rounded-md text-[#475467] hover:bg-[#F9FAFB] transition-colors"
                          >
                            <span>3 changes made</span>
                            <svg 
                              className={cn(
                                "w-5 h-5 text-[#98A2B3] transition-transform duration-200",
                                message.expanded ? "transform rotate-180" : ""
                              )} 
                              viewBox="0 0 20 20" 
                              fill="none"
                            >
                              <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const event = new CustomEvent('undoFormatChanges');
                                window.dispatchEvent(event);
                                setMessages(prev => prev.map(msg => 
                                  msg.id === message.id 
                                    ? { ...msg, expanded: false, selectedAction: 'undo' }
                                    : msg
                                ));
                              }}
                              className={cn(
                                "px-4 py-1.5 text-[14px] font-medium rounded-md transition-colors whitespace-nowrap",
                                message.selectedAction === 'undo' 
                                  ? "bg-[#F9FAFB] text-[#344054]" 
                                  : "text-[#475467] hover:bg-[#F9FAFB]"
                              )}
                            >
                              Undo
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const changes = JSON.parse(message.content.split('<FormatChanges>')[1].split('</FormatChanges>')[0]);
                                const event = new CustomEvent('applyFormatChanges', {
                                  detail: { content: changes[2].after }
                                });
                                window.dispatchEvent(event);
                                setMessages(prev => prev.map(msg => 
                                  msg.id === message.id 
                                    ? { ...msg, expanded: false, selectedAction: 'accept' }
                                    : msg
                                ));
                              }}
                              className={cn(
                                "px-4 py-1.5 text-[14px] font-medium rounded-md transition-colors whitespace-nowrap",
                                message.selectedAction === 'accept'
                                  ? "bg-[#0052CC] text-white"
                                  : "bg-[#0065FF] text-white hover:bg-[#0052CC]"
                              )}
                            >
                              Accept all
                            </button>
                          </div>
                        </div>
                      </div>
                      {message.expanded && (
                        <div className="mt-1 pt-3 border-t border-[#EAECF0]">
                          <div className="space-y-3">
                            {JSON.parse(message.content.split('<FormatChanges>')[1].split('</FormatChanges>')[0]).map((change: any, index: number) => (
                              <div key={index} className="flex items-center justify-between">
                                <span className="text-[14px] text-[#475467]">{change.description}</span>
                                <button
                                  onClick={() => {
                                    if (change.type === 'content') {
                                      const event = new CustomEvent('undoFormatChanges');
                                      window.dispatchEvent(event);
                                    }
                                  }}
                                  className="text-[14px] text-[#475467] hover:text-[#344054] transition-colors"
                                >
                                  Undo
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-[12px] text-[#475467]">{message.content}</span>
                  )}
                  {!message.content.includes('<FormatChanges>') && message.tags && message.tags.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {message.tags.map((tag, index) => (
                        <Tag
                          key={index}
                          text={tag.text}
                          appearance={tag.appearance}
                          color={tag.color}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Suggestions section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[#475467]">Suggestions</h3>
                {isLoadingSuggestions && (
                  <span className="text-xs text-[#475467]">Loading...</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {isLoadingSuggestions ? (
                  <button 
                    className="flex flex-col p-3 bg-white border border-[#EAECF0] rounded-lg hover:bg-[#F9FAFB] text-left"
                  >
                    <div className="flex items-center mb-2">
                      <svg className="w-4 h-4 text-[#475467]" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/>
                      </svg>
                    </div>
                    <span className="text-[13px] font-medium text-[#344054]">Generating suggestions...</span>
                  </button>
                ) : (
                  filteredItems.suggestions.map((suggestion) => (
                    suggestion.id === 'ask-rovo' ? (
                      <button 
                        key={suggestion.id}
                        onClick={(e) => handleAskRovoClick(suggestion.subtitle || '', e)}
                        className={cn(
                          "col-span-3 flex flex-col p-3 bg-white border border-[#EAECF0] rounded-lg hover:bg-[#F9FAFB] text-left group transition-all duration-200",
                          getSelectedItemInfo().type === 'suggestion' && 
                          getSelectedItemInfo().index === filteredItems.suggestions.indexOf(suggestion) && 
                          'bg-[#F9FAFB]'
                        )}
                      >
                        <div className="flex items-center mb-2">
                          {suggestion.icon}
                        </div>
                        <span className="text-[13px] font-medium text-[#344054]">Ask Rovo to</span>
                        <span className="text-[12px] text-[#475467] mt-0.5">{suggestion.subtitle}</span>
                      </button>
                    ) : (
                      <button 
                        key={suggestion.id}
                        onClick={() => {
                          if (suggestion.id === 'format-page') {
                            handleFormatPage();
                          }
                        }}
                        className={cn(
                          "flex flex-col p-3 bg-white border border-[#EAECF0] rounded-lg hover:bg-[#F9FAFB] text-left",
                          getSelectedItemInfo().type === 'suggestion' && 
                          getSelectedItemInfo().index === filteredItems.suggestions.indexOf(suggestion) && 
                          'bg-[#F9FAFB]'
                        )}
                      >
                        <div className="flex items-center mb-2">
                          {suggestion.icon}
                        </div>
                        <span className="text-[14px] font-medium text-[#344054]">{suggestion.title}</span>
                      </button>
                    )
                  ))
                )}
              </div>
            </div>

            {/* Actions section when text is selected */}
            <div>
              <h3 className="text-sm font-medium text-[#475467] mb-3">Actions</h3>
              <div className="space-y-1">
                {filteredItems.actions.map((action) => (
                  <button 
                    key={action.id}
                    onClick={() => {
                      if (action.id === 'summarize-page') {
                        handleSummarizePage();
                      }
                    }}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 hover:bg-[#F9FAFB] rounded-md text-left",
                      getSelectedItemInfo().type === 'action' && 
                      getSelectedItemInfo().index === filteredItems.actions.indexOf(action) && 
                      'bg-[#F9FAFB]'
                    )}
                  >
                    {action.icon}
                    <span className="text-sm text-[#344054]">{action.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Starred Agents section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[#475467]">Starred agents</h3>
                <span className="text-xs text-[#475467]">({filteredItems.agents.length})</span>
              </div>
              <div className="space-y-1">
                {filteredItems.agents.map((agent) => (
                  <button 
                    key={agent.id}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 hover:bg-[#F9FAFB] rounded-md text-left group",
                      getSelectedItemInfo().type === 'agent' && 
                      getSelectedItemInfo().index === filteredItems.agents.indexOf(agent) && 
                      'bg-[#F9FAFB]'
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", agent.color)}>
                      {agent.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#344054] group-hover:text-[#1D2939]">{agent.title}</div>
                      <p className="text-xs text-[#475467]">{agent.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Input */}
      <div className="p-4 border-t border-[#EAECF0]">
        <div className="flex items-center space-x-2 px-3 py-2 bg-white border border-[#D0D5DD] rounded-lg focus-within:ring-2 focus-within:ring-[#0065FF] focus-within:border-[#0065FF] transition-all duration-200">
          {isChatMode ? (
            <textarea
              ref={chatInputRef}
              value={currentQuery}
              onChange={(e) => setCurrentQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onClick={handleInputClick}
              placeholder="Type your message..."
              className="w-full text-sm bg-transparent border-none focus:ring-0 focus:outline-none placeholder-[#667085] resize-none min-h-[24px] max-h-[120px]"
              rows={1}
              disabled={isSending}
            />
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onClick={handleInputClick}
              placeholder="Ask AI or explore actions"
              className="w-full text-sm bg-transparent border-none focus:ring-0 focus:outline-none placeholder-[#667085]"
            />
          )}
          <button 
            className={cn(
              "p-1 transition-colors",
              isSending ? "text-[#D0D5DD] cursor-not-allowed" : "text-[#98A2B3] hover:text-[#667085] cursor-pointer"
            )}
            onClick={isChatMode ? handleSendMessage : undefined}
            disabled={isSending}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 17.5v-5m0 0h5m-5 0L17.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {!isChatMode && (
            <button className="p-1 text-[#98A2B3] hover:text-[#667085]">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 18.3a8.3 8.3 0 1 0 0-16.6 8.3 8.3 0 0 0 0 16.6Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 6.7h.008v.008H10V6.7Zm0 3.3h.008v3.3H10V10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 