'use client';

import { useState, useEffect } from 'react';

export default function PasswordProtection({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    // Check if already unlocked in session storage
    const unlocked = sessionStorage.getItem('prototype_unlocked');
    if (unlocked === 'true') {
      setIsUnlocked(true);
      onUnlock();
    }
  }, [onUnlock]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'up&go') {
      setIsUnlocked(true);
      sessionStorage.setItem('prototype_unlocked', 'true');
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setPassword(''); // Clear password field
      // Reset shake animation after it completes
      setTimeout(() => setShake(false), 500);
      // Reset error state after delay
      setTimeout(() => setError(false), 2000);
    }
  };

  if (isUnlocked) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="mb-4">
            <svg className="w-12 h-12 mx-auto text-[#0065FF]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M1.5 3V4.5H3V3H4.5V1.5H3V0H1.5V1.5H0V3H1.5ZM8 1C8.30931 1 8.58689 1.18989 8.699 1.47817L10.3294 5.6706L14.5218 7.301C14.8101 7.41311 15 7.69069 15 8C15 8.30931 14.8101 8.58689 14.5218 8.699L10.3294 10.3294L8.699 14.5218C8.58689 14.8101 8.30931 15 8 15C7.69069 15 7.41311 14.8101 7.301 14.5218L5.6706 10.3294L1.47817 8.699C1.18989 8.58689 1 8.30931 1 8C1 7.69069 1.18989 7.41311 1.47817 7.301L5.6706 5.6706L7.301 1.47817C7.41311 1.18989 7.69069 1 8 1Z" fill="currentColor"/>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome</h2>
          <p className="text-gray-600">Please enter the password to access the prototype</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className={`relative ${shake ? 'animate-shake' : ''}`}>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`
                    w-full px-4 py-3 
                    border rounded-lg 
                    ${error 
                      ? 'border-red-500 bg-red-50 ring-red-200' 
                      : 'border-gray-300 hover:border-gray-400'
                    }
                    transition-all duration-200 ease-in-out
                    focus:outline-none focus:ring-2 
                    ${error 
                      ? 'focus:ring-red-200 focus:border-red-500' 
                      : 'focus:ring-blue-100 focus:border-blue-500'
                    }
                    placeholder-gray-400
                  `}
                  placeholder="Enter password"
                  autoFocus
                />
                {error && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 animate-fade-in">
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              {error && (
                <div className="absolute -bottom-6 left-0 right-0 flex justify-center animate-fade-in">
                  <div className="bg-red-50 border border-red-100 rounded-md px-2 py-1 flex items-center space-x-1">
                    <svg className="w-3.5 h-3.5 text-red-500" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 12c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm1-3H7V4h2v5z"/>
                    </svg>
                    <span className="text-xs font-medium text-red-600">Incorrect password</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="
              w-full bg-[#0065FF] text-white py-3 px-4 
              rounded-lg font-medium
              transition-all duration-200 
              hover:bg-[#0052CC] active:bg-[#0747A6]
              focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
} 