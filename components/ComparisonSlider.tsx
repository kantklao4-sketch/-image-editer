/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SliderHandleIcon } from './icons';

interface ComparisonSliderProps {
  originalImageUrl: string;
  editedImageUrl: string;
}

const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ originalImageUrl, editedImageUrl }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging.current || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDragging.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientX);
  }, [handleMove]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    handleMove(e.touches[0].clientX);
  }, [handleMove]);
  
  // Attach global listeners to handle dragging outside the component
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseMove, handleTouchMove, handleMouseUp]);

  return (
    <div
      ref={imageContainerRef}
      className="relative w-full h-auto object-contain max-h-[60vh] cursor-ew-resize select-none overflow-hidden rounded-xl animate-fade-in"
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      {/* Base Image (Original) */}
      <img
        src={originalImageUrl}
        alt="Original"
        className="block w-full h-auto object-contain max-h-[60vh] pointer-events-none"
        draggable={false}
      />

      {/* Clipped Image (Edited) */}
      <div
        className="absolute top-0 left-0 h-full w-full overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={editedImageUrl}
          alt="Edited"
          className="block w-full h-auto object-contain max-h-[60vh] pointer-events-none"
          draggable={false}
        />
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white/80 cursor-ew-resize backdrop-blur-sm"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg pointer-events-none ring-2 ring-gray-900/10">
          <SliderHandleIcon className="w-6 h-6 text-gray-800 transform -rotate-90" />
        </div>
      </div>
    </div>
  );
};

export default ComparisonSlider;