'use client';

import { useState } from "react";
import dynamic from "next/dynamic";

const PasswordProtection = dynamic(
  () => import("./PasswordProtection"),
  { ssr: false }
);

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isUnlocked, setIsUnlocked] = useState(false);

  return (
    <>
      <PasswordProtection onUnlock={() => setIsUnlocked(true)} />
      {isUnlocked && children}
    </>
  );
} 