'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface TextLoopProps {
  children: React.ReactNode[];
  className?: string;
  interval?: number;
}

export function TextLoop({ children, className = '', interval = 2000 }: TextLoopProps) {
  const [index, setIndex] = useState(0);
  const items = React.Children.toArray(children);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, interval);

    return () => clearInterval(timer);
  }, [items.length, interval]);

  return (
    <div className={`relative h-6 w-full ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ 
            duration: 0.5,
            ease: "easeInOut"
          }}
          className="absolute w-full"
        >
          {items[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
} 