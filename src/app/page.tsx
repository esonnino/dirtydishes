'use client';

import { useState } from 'react';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to the Prototype
        </h1>
        <p className="text-gray-600">
          This is a protected page. You can only access it with the correct password.
        </p>
      </div>
    </main>
  );
}
