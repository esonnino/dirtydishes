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
import Breadcrumbs, { BreadcrumbsItem } from '@atlaskit/breadcrumbs';
import { HeaderAvatars } from './HeaderAvatars';

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
    <div className="sticky top-0 z-40 bg-white">
      <div className="h-[56px] px-5 flex items-center justify-between border-b border-[#DFE1E6]">
        <div className="flex items-center space-x-2">
          <Breadcrumbs>
            {breadcrumbItems.map((item) => (
              <BreadcrumbsItem key={item.href} href={item.href} text={item.label} />
            ))}
          </Breadcrumbs>
          <div className="bg-[#FFF0B3] px-2 py-0.5 rounded">
            <Badge appearance="default">Confidential</Badge>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-[#42526E]">
            <span>Last updated just now</span>
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