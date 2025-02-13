'use client';

import React, { ElementType } from 'react';
import { motion } from 'framer-motion';

interface TextEffectProps {
  children: string;
  per?: 'word' | 'character';
  preset?: 'blur';
  as?: ElementType;
  className?: string;
}

export function TextEffect({
  children,
  per = 'word',
  preset = 'blur',
  as: Component = 'div',
  className = '',
}: TextEffectProps) {
  const items = per === 'word' ? children.split(' ') : children.split('');
  
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.015, delayChildren: 0.01 * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300,
        duration: 0.1,
      },
    },
    hidden: {
      opacity: 0,
      filter: 'blur(2px)',
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300,
        duration: 0.1,
      },
    },
  };

  return (
    <Component className={className}>
      <motion.div
        style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25em' }}
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {items.map((item, i) => (
          <motion.span
            key={i}
            variants={child}
            style={{ display: 'inline-block' }}
          >
            {item}
            {per === 'word' && i !== items.length - 1 ? ' ' : ''}
          </motion.span>
        ))}
      </motion.div>
    </Component>
  );
} 