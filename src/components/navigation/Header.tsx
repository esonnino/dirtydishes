/** @jsxImportSource react */
import Link from 'next/link';
import Button from '@atlaskit/button/new';
import { IconButton } from '@atlaskit/button/new';
import AddIcon from '@atlaskit/icon/glyph/add';
import NotificationIcon from '@atlaskit/icon/core/notification';
import QuestionCircleIcon from '@atlaskit/icon/core/question-circle';
import SettingsIcon from '@atlaskit/icon/core/settings';

export function Header() {
  return (
    <header className="h-[48px] bg-white border-b border-[#DFE1E6] fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center h-full px-3 py-2">
        {/* Left section */}
        <div className="flex items-center space-x-6 w-[240px]">
          <div className="flex items-center">
            <button className="p-1.5 text-[#42526E] hover:bg-[#EBECF0] rounded">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M0 2C0 0.895431 0.895431 0 2 0H4C5.10457 0 6 0.895431 6 2V4C6 5.10457 5.10457 6 4 6H2C0.895431 6 0 5.10457 0 4V2ZM2 1.5C1.72386 1.5 1.5 1.72386 1.5 2V4C1.5 4.27614 1.72386 4.5 2 4.5H4C4.27614 4.5 4.5 4.27614 4.5 4V2C4.5 1.72386 4.27614 1.5 4 1.5H2ZM8 2C8 0.895431 8.89543 0 10 0H12C13.1046 0 14 0.895431 14 2V4C14 5.10457 13.1046 6 12 6H10C8.89543 6 8 5.10457 8 4V2ZM10 1.5C9.72386 1.5 9.5 1.72386 9.5 2V4C9.5 4.27614 9.72386 4.5 10 4.5H12C12.2761 4.5 12.5 4.27614 12.5 4V2C12.5 1.72386 12.2761 1.5 12 1.5H10ZM0 10C0 8.89543 0.895431 8 2 8H4C5.10457 8 6 8.89543 6 10V12C6 13.1046 5.10457 14 4 14H2C0.895431 14 0 13.1046 0 12V10ZM2 9.5C1.72386 9.5 1.5 9.72386 1.5 10V12C1.5 12.2761 1.72386 12.5 2 12.5H4C4.27614 12.5 4.5 12.2761 4.5 12V10C4.5 9.72386 4.27614 9.5 4 9.5H2ZM8 10C8 8.89543 8.89543 8 10 8H12C13.1046 8 14 8.89543 14 10V12C14 13.1046 13.1046 14 12 14H10C8.89543 14 8 13.1046 8 12V10ZM10 9.5C9.72386 9.5 9.5 9.72386 9.5 10V12C9.5 12.2761 9.72386 12.5 10 12.5H12C12.2761 12.5 12.5 12.2761 12.5 12V10C12.5 9.72386 12.2761 9.5 12 9.5H10Z" fill="currentColor"/>
              </svg>
            </button>
            <Link href="/" className="flex items-center space-x-[5px] ml-[13px]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 5C0 2.23858 2.23858 0 5 0H19C21.7614 0 24 2.23858 24 5V19C24 21.7614 21.7614 24 19 24H5C2.23858 24 0 21.7614 0 19V5Z" fill="#1868DB"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M6.40902 6.44842C6.14909 6.99723 5.78428 7.77404 5.59824 8.17477L5.25993 8.90327L7.52822 9.98503C10.4588 11.3826 10.6209 11.4495 11.5295 11.6372C12.4772 11.8329 12.9729 11.8338 13.8897 11.6414C15.5367 11.2956 17.0204 10.1929 18.1391 8.4834C18.4753 7.96949 18.7503 7.50286 18.75 7.44637C18.7492 7.2856 15.5809 5.40556 15.4883 5.51106C15.4434 5.56223 15.1902 5.93553 14.9255 6.34046C14.1731 7.4917 13.5673 7.90676 12.6394 7.90656C12.2263 7.90645 11.7469 7.7153 9.56136 6.67857C8.13761 6.00328 6.9522 5.45068 6.92712 5.45068C6.90205 5.45068 6.66884 5.89962 6.40902 6.44842ZM10.0805 12.3524C8.39048 12.7379 6.88629 13.9506 5.67335 15.9059L5.25 16.5882L5.73239 16.8924C7.11531 17.7643 8.43049 18.5492 8.50836 18.5492C8.55666 18.5492 8.78261 18.2357 9.0102 17.8524C9.49833 17.0308 10.1723 16.3755 10.7124 16.1972C11.4582 15.9511 11.9239 16.0907 14.5788 17.3563C15.9551 18.0124 17.1035 18.5492 17.1308 18.5492C17.2534 18.5492 18.7772 15.1585 18.6912 15.0772C18.4888 14.8859 13.7854 12.708 13.1406 12.507C12.2554 12.231 10.9106 12.1631 10.0805 12.3524Z" fill="white"/>
              </svg>
              <span className="font-medium text-[#42526E] text-[14px]">Confluence</span>
            </Link>
          </div>
        </div>

        {/* Center section - Search */}
        <div className="flex-1 flex justify-center items-center gap-2">
          <div className="w-[540px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="w-full h-[32px] pl-10 pr-4 text-[14px] bg-white border border-[#0B1228]/[0.14] rounded-[6px] placeholder-[#7A869A] hover:bg-[#FAFBFC] hover:border-[#0B1228]/[0.14] focus:bg-white focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF]/30 focus:outline-none transition-colors"
              />
              <svg className="absolute left-3 top-[9px] w-[14px] h-[14px]" width="14" height="14" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M6.5 1.5C4.01472 1.5 2 3.51472 2 6C2 8.48528 4.01472 10.5 6.5 10.5C7.74285 10.5 8.86682 9.99714 9.68198 9.18198C10.4971 8.36682 11 7.24285 11 6C11 3.51472 8.98528 1.5 6.5 1.5ZM0.5 6C0.5 2.68629 3.18629 0 6.5 0C9.81371 0 12.5 2.68629 12.5 6C12.5 7.38622 12.0292 8.66348 11.2399 9.67919L14.5303 12.9697L13.4697 14.0303L10.1792 10.7399C9.16348 11.5292 7.88622 12 6.5 12C3.18629 12 0.5 9.31371 0.5 6Z" fill="#44546F"/>
              </svg>
            </div>
          </div>
          <Button
            iconBefore={() => <AddIcon label="" size="small" />}
            appearance="primary"
            spacing="compact"
          >
            Create
          </Button>
        </div>

        {/* Right section */}
        <div className="flex items-center w-[240px] justify-end pr-2 gap-[4px]">
          <div className="w-8 h-8 flex items-center justify-center">
            <IconButton
              appearance="subtle"
              icon={NotificationIcon}
              label="Notifications"
              spacing="compact"
            />
          </div>
          <div className="w-8 h-8 flex items-center justify-center">
            <IconButton
              appearance="subtle"
              icon={QuestionCircleIcon}
              label="Help"
              spacing="compact"
            />
          </div>
          <div className="w-8 h-8 flex items-center justify-center">
            <IconButton
              appearance="subtle"
              icon={SettingsIcon}
              label="Settings"
              spacing="compact"
            />
          </div>
          <button className="w-8 h-8 rounded-full bg-[#0052CC] text-white text-sm font-medium flex items-center justify-center hover:bg-[#0065FF]">
            ES
          </button>
        </div>
      </div>
    </header>
  );
} 