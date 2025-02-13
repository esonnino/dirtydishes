'use client';

import { useEffect, useState } from 'react';
import { CollaboratorAvatars } from './CollaboratorAvatars';

const collaborators = [
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
];

export function HeaderAvatars() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[72px] h-[32px]" />;
  }

  return (
    <div className="mx-2">
      <CollaboratorAvatars collaborators={collaborators} />
    </div>
  );
} 