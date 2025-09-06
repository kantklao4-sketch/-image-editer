/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { LockClosedIcon, LockOpenIcon } from './icons';

interface ResizePanelProps {
  onApplyResize: (width: number, height: number) => void;
  isLoading: boolean;
  originalWidth: number;
  originalHeight: number;
}

const ResizePanel: React.FC<ResizePanelProps> = ({ onApplyResize, isLoading, originalWidth, originalHeight }) => {
  const [width, setWidth] = useState(originalWidth.toString());
  const [height, setHeight] = useState(originalHeight.toString());
  const [isLocked, setIsLocked] = useState(true);

  const aspectRatio = originalWidth > 0 && originalHeight > 0 ? originalWidth / originalHeight : 1;

  useEffect(() => {
    setWidth(originalWidth.toString());
    setHeight(originalHeight.toString());
  }, [originalWidth, originalHeight]);

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = e.target.value;
    setWidth(newWidth);
    if (isLocked && newWidth) {
      const newWidthNum = parseInt(newWidth, 10);
      if (!isNaN(newWidthNum) && newWidthNum > 0) {
        const newHeight = Math.round(newWidthNum / aspectRatio);
        setHeight(newHeight.toString());
      }
    }
  };
  
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = e.target.value;
    setHeight(newHeight);
    if (isLocked && newHeight) {
        const newHeightNum = parseInt(newHeight, 10);
        if (!isNaN(newHeightNum) && newHeightNum > 0) {
            const newWidth = Math.round(newHeightNum * aspectRatio);
            setWidth(newWidth.toString());
        }
    }
  };

  const handleApply = () => {
    const numWidth = parseInt(width, 10);
    const numHeight = parseInt(height, 10);
    if (!isNaN(numWidth) && !isNaN(numHeight) && numWidth > 0 && numHeight > 0) {
      onApplyResize(numWidth, numHeight);
    }
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col items-center gap-4 animate-tool-panel backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-gray-300">ปรับขนาดภาพ</h3>
      <p className="text-sm text-gray-400 -mt-2">กำหนดความกว้างและความสูงใหม่สำหรับรูปภาพของคุณ</p>
      
      <div className="flex items-center justify-center gap-2">
        <div className="flex flex-col">
          <label htmlFor="width" className="text-xs text-gray-400 mb-1 ml-1">กว้าง (px)</label>
          <input
            id="width"
            type="number"
            value={width}
            onChange={handleWidthChange}
            disabled={isLoading}
            min="1"
            className="w-32 bg-gray-900/50 border border-gray-600 text-gray-200 rounded-lg p-3 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none transition disabled:opacity-60"
          />
        </div>

        <button onClick={() => setIsLocked(!isLocked)} className="p-2 mt-5 text-gray-400 hover:text-white transition-colors" aria-label={isLocked ? "ปลดล็อกอัตราส่วน" : "ล็อกอัตราส่วน"}>
          {isLocked ? <LockClosedIcon className="w-6 h-6" /> : <LockOpenIcon className="w-6 h-6" />}
        </button>
        
        <div className="flex flex-col">
          <label htmlFor="height" className="text-xs text-gray-400 mb-1 ml-1">สูง (px)</label>
          <input
            id="height"
            type="number"
            value={height}
            onChange={handleHeightChange}
            disabled={isLoading}
            min="1"
            className="w-32 bg-gray-900/50 border border-gray-600 text-gray-200 rounded-lg p-3 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none transition disabled:opacity-60"
          />
        </div>
      </div>
      
      <button
        onClick={handleApply}
        disabled={isLoading || !width || !height || parseInt(width, 10) <= 0 || parseInt(height, 10) <= 0}
        className="w-full max-w-xs mt-2 bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-green-800 disabled:to-green-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
      >
        ใช้ขนาดใหม่
      </button>
    </div>
  );
};

export default ResizePanel;