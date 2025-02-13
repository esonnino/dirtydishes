/** @jsxImportSource react */
import { ReactNode, useState } from 'react';
import { cn } from '../../lib/utils';
import { Header } from '../navigation/Header';
import { Sidebar } from '../navigation/Sidebar';
import { AIPanel } from '../ui/AIPanel';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  selectedText?: string;
}

export function MainLayout({ children, className, selectedText }: MainLayoutProps) {
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);

  const toggleAiPanel = () => {
    setIsAiPanelOpen(!isAiPanelOpen);
  };

  return (
    <div className={cn("min-h-screen bg-[#F9FAFB]", className)}>
      <Header />
      <div className="flex h-screen pt-[48px]">
        <Sidebar />
        <div 
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 11h16v2H4z" fill="currentColor"/>
                <path d="M4 6h16v2H4zM4 16h16v2H4z" fill="currentColor"/>
              </svg>
            </button>
            <button className="w-9 h-9 flex items-center justify-center text-[#42526E] hover:bg-[#F4F5F7] rounded-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 11v2h-8v8h-2v-8H3v-2h8V3h2v8h8z" fill="currentColor"/>
              </svg>
            </button>
            <button className="w-9 h-9 flex items-center justify-center text-[#42526E] hover:bg-[#F4F5F7] rounded-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" fill="currentColor"/>
                <path d="M7 12h10v2H7z" fill="currentColor"/>
              </svg>
            </button>
            <button className="w-9 h-9 flex items-center justify-center text-[#42526E] hover:bg-[#F4F5F7] rounded-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <button className="w-9 h-9 flex items-center justify-center text-[#42526E] hover:bg-[#F4F5F7] rounded-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="currentColor"/>
              </svg>
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
          selectedText={selectedText}
        />
      </div>
    </div>
  );
} 