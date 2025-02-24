'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { token } from '@atlaskit/tokens';

const Avatar = dynamic(() => import('@atlaskit/avatar'), {
  ssr: false,
});

interface AuthorAvatarProps {
  name: string;
}

export function AuthorAvatar({ name }: AuthorAvatarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return a placeholder during SSR and initial mount
  if (!mounted) {
    return (
      <div 
        className="w-6 h-6 rounded-full"
        style={{ backgroundColor: '#FF5630' }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="rounded-full" style={{ backgroundColor: token('color.background.accent.red.bolder', '#FF5630') }}>
      <Avatar
        appearance="circle"
        size="small"
        name={name}
      />
    </div>
  );
} 