import { useState, useCallback, useRef, useEffect } from 'react';

const MIN_PERCENT = 15;
const MAX_PERCENT = 85;

/**
 * A resizable split pane hook.
 * @param {number} initialPercent - Initial size of the first pane (0–100)
 * @param {'horizontal' | 'vertical'} direction
 *   'horizontal' → left/right split (dragging by X)
 *   'vertical'   → top/bottom split (dragging by Y)
 * @param {React.RefObject} containerRef - The container element to measure against
 */
export default function useResizableSplit(initialPercent = 50, direction = 'horizontal', containerRef) {
  const [splitPercent, setSplitPercent] = useState(initialPercent);
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [direction]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      let percent;

      if (direction === 'horizontal') {
        percent = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        percent = ((e.clientY - rect.top) / rect.height) * 100;
      }

      setSplitPercent(Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, percent)));
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [direction, containerRef]);

  return [splitPercent, handleMouseDown];
}
