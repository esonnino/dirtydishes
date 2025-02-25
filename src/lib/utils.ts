import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine multiple class names using clsx and tailwind-merge
 * This allows for dynamic class name generation without duplicates
 * 
 * @param inputs - List of class names or conditional class expressions
 * @returns Merged className string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
