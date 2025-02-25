import { useEffect, RefObject } from 'react';

/**
 * Hook for detecting clicks outside of a specified element
 * @param ref - Reference to the element to detect clicks outside of
 * @param handler - Callback function to run when a click outside is detected
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // Do nothing if the ref is not set or if the click was inside the element
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      
      handler(event);
    };
    
    // Add event listeners for both mouse and touch events
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    
    // Clean up event listeners on unmount
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
} 