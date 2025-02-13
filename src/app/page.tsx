'use client';

/** @jsxImportSource react */
import { useState, useEffect, useRef } from 'react';
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

// Define interfaces for our editor
interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onTextSelect: (text: string) => void;
  className?: string;
}

const RichTextEditor = ({ value, onChange, onTextSelect, className }: EditorProps) => {
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorContent, setEditorContent] = useState(value);
  const [selectedText, setSelectedText] = useState('');

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

  return (
    <div className="relative">
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

export default function Home() {
  const [content, setContent] = useState(`<div class="section">
  <h2>✨ Mission</h2>
  <p>Our mission is to reliably deliver critical medical supplies, vaccines, and medications to all people, efficiently and quickly, regardless of location.</p>
</div>

<div class="section">
  <h2>🎯 Goals</h2>
  
  <div class="objective">
    <strong>Objective:</strong> Successful Adoption of the Current Web Portal App
  </div>
  <ul>
    <li class="kr"><strong>KR:</strong> <span>Achieve a 30% increase in user sign-ups within the first quarter following the launch.</span></li>
    <li class="kr"><strong>KR:</strong> <span>Reach a 70% user engagement rate (measured by active sessions per week) within three months.</span></li>
    <li class="kr"><strong>KR:</strong> <span>Secure a 90% satisfaction rate in customer feedback surveys regarding the portal's usability and functionality.</span></li>
  </ul>

  <div class="objective">
    <strong>Objective:</strong> Effective Preparation and Launch of FleetFlow
  </div>
  <ul>
    <li class="kr"><strong>KR:</strong> <span>Develop and execute a comprehensive marketing campaign that generates 50,000 impressions before the FleetFlow launch.</span></li>
    <li class="kr"><strong>KR:</strong> <span>Engage with at least 20 industry influencers or thought leaders to review or mention FleetFlow in their publications or platforms.</span></li>
    <li class="kr"><strong>KR:</strong> <span>Organize three successful pre-launch webinars or demos with a total attendance of at least 500 potential customers.</span></li>
  </ul>

  <div class="objective">
    <strong>Objective:</strong> Increased Brand Awareness and Market Penetration
  </div>
  <ul>
    <li class="kr"><strong>KR:</strong> <span>Increase VitaFleet's social media following by 25% across all platforms within the next quarter.</span></li>
    <li class="kr"><strong>KR:</strong> <span>Achieve a 15% increase in website traffic through VitaFleet's improved FleetFlow marketing campaign.</span></li>
  </ul>
</div>

<div class="section">
  <h2>👥 Teams</h2>
  <ul>
    <li><strong>Global Marketing:</strong> (a.k.a FleetLeads) - Oversees the global marketing footprint and aligns the various marketing teams across the org.</li>
    <li>EMEA Marketing</li>
    <li>Americas Marketing</li>
    <li>Customer Support and Success Teams</li>
    <li>Market Research Analysts</li>
    <li>Event Coordinators</li>
    <li>Brand Strategy Development</li>
    <li>Brand Identity Management</li>
    <li>Content Creation</li>
  </ul>
</div>

<div class="section">
  <h2>📚 Additional Reading</h2>
  <ul>
    <li><a href="#">Add net new customers through product + marketing</a></li>
    <li><a href="#">New signups as we raise awareness</a></li>
    <li><a href="#">Gross new customers as we supercharge our growth</a></li>
  </ul>
</div>`);

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
