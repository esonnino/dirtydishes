import { cn } from '../../lib/utils';
import { useState, useMemo } from 'react';
import React from 'react';

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

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText?: string;
}

export function AIPanel({ isOpen, onClose, selectedText }: AIPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  // Define all items
  const suggestions: Suggestion[] = [
    {
      id: 'find-work',
      icon: (
        <svg className="w-4 h-4 text-[#475467]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      title: 'Find work',
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
    },
    {
      id: 'find-figma',
      icon: (
        <svg className="w-4 h-4 text-[#475467]" viewBox="0 0 24 24">
          <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h2V7h-4v2h2z"/>
        </svg>
      ),
      title: 'Find the latest',
      subtitle: 'Figma file'
    }
  ];

  const actions: Action[] = [
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
          <svg className="w-4 h-4 text-[#475467]" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-3.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5zm-4-11.5c-.83 0-1.5.67-1.5 1.5S7.17 9 8 9s1.5-.67 1.5-1.5S8.83 5 8 5zm8 0c-.83 0-1.5.67-1.5 1.5S15.17 9 16 9s1.5-.67 1.5-1.5S16.83 5 16 5z"/>
          </svg>
        ),
        title: `Ask Rovo to "${searchQuery}"`,
        subtitle: 'Get AI assistance'
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
    const query = searchQuery.trim();
    if (!query) return;

    if (e.key === 'Enter' && selectedItemIndex !== null) {
      // Handle activation of selected item
      console.log('Activate selected item');
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
        selectedText ? "h-[96px] bg-[#F8F8F8]" : "h-[112px]"
      )}>
        {/* Sparkle icon - Fixed position */}
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
            <path fillRule="evenodd" clipRule="evenodd" transform="translate(6 6)" d="M1.5 3V4.5H3V3H4.5V1.5H3V0H1.5V1.5H0V3H1.5ZM8 1C8.30931 1 8.58689 1.18989 8.699 1.47817L10.3294 5.6706L14.5218 7.301C14.8101 7.41311 15 7.69069 15 8C15 8.30931 14.8101 8.58689 14.5218 8.699L10.3294 10.3294L8.699 14.5218C8.58689 14.8101 8.30931 15 8 15C7.69069 15 7.41311 14.8101 7.301 14.5218L5.6706 10.3294L1.47817 8.699C1.18989 8.58689 1 8.30931 1 8C1 7.69069 1.18989 7.41311 1.47817 7.301L5.6706 5.6706L7.301 1.47817C7.41311 1.18989 7.69069 1 8 1ZM8 3.81927L6.949 6.52183C6.87279 6.71781 6.71781 6.87279 6.52183 6.949L3.81927 8L6.52183 9.051C6.71781 9.12721 6.87279 9.28219 6.949 9.47817L8 12.1807L9.051 9.47817C9.12721 9.28219 9.28219 9.12721 9.47817 9.051L12.1807 8L9.47817 6.949C9.28219 6.87279 9.12721 6.71781 9.051 6.52183L8 3.81927ZM13 14.5V16H14.5V14.5H16V13H14.5V11.5H13V13H11.5V14.5H13Z" fill="url(#sparkleGradient)"/>
          </svg>
        </div>

        {/* Close button - Fixed position */}
        <button
          onClick={onClose}
          className="absolute right-6 top-3 p-1 text-[#98A2B3] hover:bg-[#F9FAFB] rounded-lg"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Content with transitions */}
        <div className="relative h-full">
          {/* Default greeting */}
          <div className={cn(
            "absolute w-full transition-all duration-300 ease-in-out",
            selectedText 
              ? "opacity-0 -translate-y-4" 
              : "opacity-100 translate-y-0"
          )}>
            <div className="mt-11">
              <h2 className="text-[24px] font-[600] leading-[28px] tracking-[0%] font-['SF Pro'] text-[#101828]">Hi Jane,<br></br>How can I help?</h2>
            </div>
          </div>

          {/* Referencing box */}
          <div className={cn(
            "absolute top-[52px] left-0 right-0 transition-all duration-300 ease-in-out",
            selectedText 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-4"
          )}>
            <div className="relative bg-white border border-[#DFE1E6] rounded-full shadow-sm">
              <div className="flex items-center pl-3 pr-8 py-1.5">
                <span className="text-[14px] font-medium font-['SF Pro'] text-[#344054] mr-2">Referencing</span>
                <span className="text-sm text-[#475467] line-clamp-1 flex-1">
                  {selectedText}
                </span>
                <button 
                  onClick={() => onClose()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#667085]"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 pt-2">
        {selectedText ? (
          <div className="space-y-8">
            {/* Actions section when text is selected */}
            <div>
              <h3 className="text-sm font-medium text-[#475467] mb-3">Actions</h3>
              <div className="space-y-1">
                <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-[#F9FAFB] rounded-md text-left">
                  <svg className="w-5 h-5 text-[#475467]" viewBox="0 0 20 20" fill="none">
                    <path d="M15.4 4.6A7.5 7.5 0 0 0 4.6 15.4 7.5 7.5 0 0 0 15.4 4.6ZM10 16.7a6.7 6.7 0 1 1 0-13.4 6.7 6.7 0 0 1 0 13.4Z" fill="currentColor"/>
                    <path d="M10 6.7v3.3l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-sm text-[#344054]">Change tone to...</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-[#F9FAFB] rounded-md text-left">
                  <svg className="w-5 h-5 text-[#475467]" viewBox="0 0 20 20" fill="none">
                    <path d="M17.5 10h-15M10 2.5v15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-sm text-[#344054]">Summarise writing</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-[#F9FAFB] rounded-md text-left">
                  <svg className="w-5 h-5 text-[#475467]" viewBox="0 0 20 20" fill="none">
                    <path d="m13.3 6.7-6.6 6.6M6.7 6.7l6.6 6.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-sm text-[#344054]">Improve writing</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-[#F9FAFB] rounded-md text-left">
                  <svg className="w-5 h-5 text-[#475467]" viewBox="0 0 20 20" fill="none">
                    <path d="M10 4.2V16m0-11.8L6.7 7.5M10 4.2l3.3 3.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm text-[#344054]">Fix spelling & grammar</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-[#F9FAFB] rounded-md text-left">
                  <svg className="w-5 h-5 text-[#475467]" viewBox="0 0 20 20" fill="none">
                    <path d="M10 10.8a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6Zm-4.2 0a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6Zm8.4 0a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6Z" fill="currentColor"/>
                  </svg>
                  <span className="text-sm text-[#344054]">Explore more</span>
                </button>
              </div>
            </div>

            {/* Starred Agents section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[#475467]">Starred agents</h3>
                <span className="text-xs text-[#475467]">(3)</span>
              </div>
              <div className="space-y-1">
                <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-[#F9FAFB] rounded-md text-left group">
                  <div className="w-8 h-8 rounded-lg bg-[#6941C6] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="none">
                      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#344054] group-hover:text-[#1D2939]">Comms crafter</div>
                    <p className="text-xs text-[#475467]">Crafting and refining all things blogs, press r...</p>
                  </div>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-[#F9FAFB] rounded-md text-left group">
                  <div className="w-8 h-8 rounded-lg bg-[#175CD3] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="none">
                      <path d="M13.3 2.7 2.7 13.3m0-10.6 10.6 10.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#344054] group-hover:text-[#1D2939]">Customer insights</div>
                    <p className="text-xs text-[#475467]">Convert customer feedback into actionable i...</p>
                  </div>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-[#F9FAFB] rounded-md text-left group">
                  <div className="w-8 h-8 rounded-lg bg-[#039855] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="none">
                      <path d="m3.3 8 3.4 3.4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#344054] group-hover:text-[#1D2939]">Decision directory</div>
                    <p className="text-xs text-[#475467]">Review decisions for clarity with decision fra...</p>
                  </div>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-[#F9FAFB] rounded-md text-left group">
                  <div className="w-8 h-8 rounded-lg border border-[#EAECF0] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#475467]" viewBox="0 0 16 16" fill="none">
                      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-[#344054] group-hover:text-[#1D2939]">Browse Agents</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Default state content */}
            <div>
              <h3 className="text-[14px] font-[600] leading-[20px] font-['SF_Pro'] text-[#6B6E76] mb-3">Suggestions</h3>
              <div className="grid grid-cols-3 gap-3">
                <button className="flex flex-col p-3 bg-white border border-[#EAECF0] rounded-lg hover:bg-[#F9FAFB] text-left">
                  <div className="flex items-center mb-2">
                    <svg className="w-4 h-4 text-[#475467]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <span className="text-[13px] font-medium text-[#344054]">Find work</span>
                  <span className="text-[12px] text-[#475467]">updated last week</span>
                </button>
                <button className="flex flex-col p-3 bg-white border border-[#EAECF0] rounded-lg hover:bg-[#F9FAFB] text-left">
                  <div className="flex items-center mb-2">
                    <svg className="w-4 h-4 text-[#475467]" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.88-11.71L10 14.17l-1.88-1.88a.996.996 0 1 0-1.41 1.41l2.59 2.59c.39.39 1.02.39 1.41 0L17.3 9.7a.996.996 0 0 0 0-1.41c-.39-.39-1.03-.39-1.42 0z"/>
                    </svg>
                  </div>
                  <span className="text-[13px] font-medium text-[#344054]">Draft me an OKR</span>
                </button>
                <button className="flex flex-col p-3 bg-white border border-[#EAECF0] rounded-lg hover:bg-[#F9FAFB] text-left">
                  <div className="flex items-center mb-2">
                    <svg className="w-4 h-4 text-[#475467]" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h2V7h-4v2h2z"/>
                    </svg>
                  </div>
                  <span className="text-[13px] font-medium text-[#344054]">Find the latest Figma file</span>
                </button>
              </div>
            </div>

            {/* Actions section */}
            <div>
              <h3 className="text-[14px] font-[600] leading-[20px] font-['SF_Pro'] text-[#6B6E76] mb-3">Actions</h3>
              <div className="space-y-1">
                <button className="w-full flex items-center px-3 py-2 hover:bg-[#F9FAFB] rounded-md text-left">
                  <svg className="w-5 h-5 text-[#475467] mr-3" viewBox="0 0 20 20" fill="none">
                    <path d="M10 4.2V16m0-11.8L6.7 7.5M10 4.2l3.3 3.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[14px] text-[#344054]">Change tone to...</span>
                </button>
                <button className="w-full flex items-center px-3 py-2 hover:bg-[#F9FAFB] rounded-md text-left">
                  <svg className="w-5 h-5 text-[#475467] mr-3" viewBox="0 0 20 20" fill="none">
                    <path d="M17.5 10h-15M10 2.5v15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[14px] text-[#344054]">Summarise writing</span>
                </button>
                <button className="w-full flex items-center px-3 py-2 hover:bg-[#F9FAFB] rounded-md text-left">
                  <svg className="w-5 h-5 text-[#475467] mr-3" viewBox="0 0 20 20" fill="none">
                    <path d="m13.3 6.7-6.6 6.6M6.7 6.7l6.6 6.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[14px] text-[#344054]">Improve writing</span>
                </button>
                <button className="w-full flex items-center px-3 py-2 hover:bg-[#F9FAFB] rounded-md text-left">
                  <svg className="w-5 h-5 text-[#475467] mr-3" viewBox="0 0 20 20" fill="none">
                    <path d="M10 4.2V16m0-11.8L6.7 7.5M10 4.2l3.3 3.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[14px] text-[#344054]">Fix spelling & grammar</span>
                </button>
                <button className="w-full flex items-center px-3 py-2 hover:bg-[#F9FAFB] rounded-md text-left">
                  <svg className="w-5 h-5 text-[#475467] mr-3" viewBox="0 0 20 20" fill="none">
                    <path d="M10 10.8a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6Zm-4.2 0a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6Zm8.4 0a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6Z" fill="currentColor"/>
                  </svg>
                  <span className="text-[14px] text-[#344054]">Explore more</span>
                </button>
              </div>
            </div>

            {/* Agents section */}
            <div>
              <h3 className="text-[14px] font-[600] leading-[20px] font-['SF_Pro'] text-[#6B6E76] mb-3">Agents</h3>
              <div className="space-y-1">
                <button className="w-full flex items-center px-3 py-2 hover:bg-[#F9FAFB] rounded-md text-left group">
                  <div className="w-8 h-8 rounded-lg bg-[#2970FF] flex items-center justify-center flex-shrink-0 mr-3">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="none">
                      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[14px] font-medium text-[#344054] group-hover:text-[#1D2939]">Rovo Expert</div>
                    <p className="text-[12px] text-[#475467]">Get to know the Rovo expert that helps you get started wi...</p>
                  </div>
                </button>
                <button className="w-full flex items-center px-3 py-2 hover:bg-[#F9FAFB] rounded-md text-left group">
                  <div className="w-8 h-8 rounded-lg bg-[#039855] flex items-center justify-center flex-shrink-0 mr-3">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="none">
                      <path d="m3.3 8 3.4 3.4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[14px] font-medium text-[#344054] group-hover:text-[#1D2939]">Decision Director</div>
                    <p className="text-[12px] text-[#475467]">Clearly communicate your decisions and make quick, well...</p>
                  </div>
                </button>
                <button className="w-full flex items-center px-3 py-2 hover:bg-[#F9FAFB] rounded-md text-left group">
                  <div className="w-8 h-8 rounded-lg bg-[#F79009] flex items-center justify-center flex-shrink-0 mr-3">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="none">
                      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[14px] font-medium text-[#344054] group-hover:text-[#1D2939]">Product Requirements Expert</div>
                    <p className="text-[12px] text-[#475467]">Get feedback on product requirements and inform your c...</p>
                  </div>
                </button>
                <button className="w-full flex items-center px-3 py-2 hover:bg-[#F9FAFB] rounded-md text-left group">
                  <div className="w-8 h-8 rounded-lg border border-[#EAECF0] flex items-center justify-center flex-shrink-0 mr-3">
                    <svg className="w-4 h-4 text-[#475467]" viewBox="0 0 16 16" fill="none">
                      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="text-[14px] font-medium text-[#344054] group-hover:text-[#1D2939]">Create agent</span>
                </button>
                <button className="w-full flex items-center px-3 py-2 hover:bg-[#F9FAFB] rounded-md text-left group">
                  <div className="w-8 h-8 rounded-lg border border-[#EAECF0] flex items-center justify-center flex-shrink-0 mr-3">
                    <svg className="w-4 h-4 text-[#475467]" viewBox="0 0 16 16" fill="none">
                      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="text-[14px] font-medium text-[#344054] group-hover:text-[#1D2939]">Browse agents</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Input */}
      <div className="p-4 border-t border-[#EAECF0]">
        <div className="flex items-center space-x-2 px-3 py-2 bg-white border border-[#D0D5DD] rounded-lg">
          <input
            type="text"
            placeholder="Ask AI or explore actions"
            className="flex-1 text-sm bg-transparent border-none focus:ring-0 placeholder-[#667085]"
          />
          <button className="p-1 text-[#98A2B3] hover:text-[#667085]">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 17.5v-5m0 0h5m-5 0L17.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="p-1 text-[#98A2B3] hover:text-[#667085]">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 18.3a8.3 8.3 0 1 0 0-16.6 8.3 8.3 0 0 0 0 16.6Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6.7h.008v.008H10V6.7Zm0 3.3h.008v3.3H10V10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 