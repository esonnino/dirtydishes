'use client';

import { cn } from '../../lib/utils';
import Button, { IconButton, SplitButton } from '@atlaskit/button/new';
import Badge from '@atlaskit/badge';
import StarIcon from '@atlaskit/icon/glyph/star';
import UnlockIcon from '@atlaskit/icon/glyph/unlock';
import LinkIcon from '@atlaskit/icon/glyph/link';
import MoreIcon from '@atlaskit/icon/glyph/more';
import WatchIcon from '@atlaskit/icon/glyph/watch';
import PageIcon from '@atlaskit/icon/glyph/page';
import AvatarGroup from '@atlaskit/avatar-group';
import Link from 'next/link';
import Toggle from '@atlaskit/toggle';
import DropdownMenu, { DropdownItem, DropdownItemGroup } from '@atlaskit/dropdown-menu';

interface PageHeaderProps {
  title: string;
  breadcrumbItems: Array<{ label: string; href: string }>;
  metadata: {
    author: {
      name: string;
      avatar: string;
    };
    timeAgo: string;
    readingTime: string;
    views: number;
    reactions: number;
  };
  isAiPanelOpen?: boolean;
  onTextSelect?: (text: string) => void;
}

export function PageHeader({ 
  title, 
  breadcrumbItems, 
  metadata,
  isAiPanelOpen,
  onTextSelect 
}: PageHeaderProps) {
  const avatarUsers = [
    { name: metadata.author.name, src: metadata.author.avatar },
    { name: 'Collaborator', src: 'https://i.pravatar.cc/32?img=2' }
  ];

  const handleSelectionChange = () => {
    if (isAiPanelOpen && onTextSelect) {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      if (selectedText) {
        onTextSelect(selectedText);
      }
    }
  };

  return (
    <div 
      className="sticky top-0 z-40 bg-white h-[56px]"
      onMouseUp={handleSelectionChange}
    >
      <div className="h-full px-5 flex items-center justify-between border-b border-[#DFE1E6]">
        <div className="flex items-center">
          <nav className="flex items-center">
            {breadcrumbItems.map((item, index) => (
              <div key={item.href} className="flex items-center">
                {index > 0 && (
                  <span className="mx-2 text-[#626F86]">/</span>
                )}
                <Link 
                  href={item.href}
                  className="text-[#626F86] hover:text-[#0052CC] hover:underline font-['SF Pro'] text-[14px] font-medium"
                >
                  {item.label}
                </Link>
              </div>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-[#42526E]">
            <AvatarGroup
              appearance="stack"
              size="small"
              data={avatarUsers}
            />
            <span>2</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[#505258] font-['SF Pro'] font-medium text-[14px]">Editing</span>
            <div className="scale-75 origin-center">
              <Toggle
                isChecked={true}
              />
            </div>
          </div>
          <div className="h-8 w-px bg-[#091E42]/[0.14]"></div>
          <div className="h-8 border border-[#091E42]/[0.14] rounded flex">
            <SplitButton>
              <Button iconBefore={UnlockIcon} appearance="subtle">Share</Button>
              <DropdownMenu<HTMLButtonElement>
                trigger={({ triggerRef, ...triggerProps }) => (
                  <IconButton
                    ref={triggerRef}
                    {...triggerProps}
                    icon={LinkIcon}
                    label="Copy link"
                    appearance="subtle"
                  />
                )}
              >
                <DropdownItemGroup>
                  <DropdownItem>Copy link</DropdownItem>
                </DropdownItemGroup>
              </DropdownMenu>
            </SplitButton>
          </div>
          <IconButton
            icon={MoreIcon}
            label="More"
            appearance="subtle"
          />
        </div>
      </div>
    </div>
  );
} 