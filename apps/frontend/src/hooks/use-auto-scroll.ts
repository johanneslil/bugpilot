import { useEffect, useRef } from 'react';

/**
 * Auto-scrolls to a ref element when dependencies change.
 * Useful for chat messages, notifications, or any auto-updating list.
 * 
 * @param dependencies - Array of dependencies that trigger the scroll
 * @returns Ref to attach to the scroll target element
 * 
 * @example
 * const bottomRef = useAutoScroll([messages]);
 * return <div><MessageList /><div ref={bottomRef} /></div>
 */
export function useAutoScroll<T extends HTMLElement = HTMLDivElement>(
  dependencies: unknown[]
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  }, dependencies);

  return ref;
}

