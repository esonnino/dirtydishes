'use client';

import { cn } from '../../lib/utils';
import Button from '@atlaskit/button';
import Badge from '@atlaskit/badge';
import StarIcon from '@atlaskit/icon/glyph/star';
import MoreIcon from '@atlaskit/icon/glyph/more';
import ShareIcon from '@atlaskit/icon/glyph/share';
import LinkIcon from '@atlaskit/icon/glyph/link';
import WatchIcon from '@atlaskit/icon/glyph/watch';
import PageIcon from '@atlaskit/icon/glyph/page';
import { HeaderAvatars } from './HeaderAvatars';
import Link from 'next/link';

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
}

export function PageHeader({ title, breadcrumbItems, metadata }: PageHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-white h-[56px]">
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
           
            <HeaderAvatars />
            <span>2</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 text-[#42526E]">
              <span>Editing</span>
              <div className="w-8 h-4 bg-[#36B37E] rounded-full flex items-center px-0.5">
                <div className="w-3 h-3 bg-white rounded-full ml-auto"></div>
              </div>
            </div>
            <div className="h-4 w-px bg-[#DFE1E6]"></div>
            <Button
              iconBefore={<ShareIcon label="Share" />}
              appearance="default"
              spacing="compact"
            >
              Share
            </Button>
            <Button
              iconBefore={<LinkIcon label="Copy link" />}
              appearance="subtle"
              spacing="compact"
            />
            <Button
              iconBefore={<MoreIcon label="More" />}
              appearance="subtle"
              spacing="compact"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 