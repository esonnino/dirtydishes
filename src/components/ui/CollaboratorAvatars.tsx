'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const AvatarGroup = dynamic(() => import('@atlaskit/avatar-group'), {
  ssr: false,
});

interface CollaboratorAvatarsProps {
  collaborators: Array<{
    email: string;
    key: string;
    name: string;
    src: string;
    appearance: 'circle';
    size: 'medium';
    href: string;
    presence: 'online';
  }>;
}

export function CollaboratorAvatars({ collaborators }: CollaboratorAvatarsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[72px] h-[32px]" />;
  }

  return (
    <AvatarGroup
      appearance="stack"
      data={collaborators}
      maxCount={3}
      size="medium"
    />
  );
} 