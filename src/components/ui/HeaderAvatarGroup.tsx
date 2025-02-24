'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const AvatarGroup = dynamic(() => import('@atlaskit/avatar-group'), {
  ssr: false,
});

interface HeaderAvatarGroupProps {
  users: Array<{
    name: string;
    src: string;
  }>;
}

export function HeaderAvatarGroup({ users }: HeaderAvatarGroupProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center">
        <div className="w-6 h-6 rounded-full bg-[#DFE1E6]" aria-hidden="true" />
        <div className="w-6 h-6 -ml-1 rounded-full bg-[#DFE1E6]" aria-hidden="true" />
      </div>
    );
  }

  return (
    <AvatarGroup
      appearance="stack"
      size="small"
      data={users}
    />
  );
} 