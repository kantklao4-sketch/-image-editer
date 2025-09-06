/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface ColorAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
}

interface ColorAdjustmentPanelProps {
  adjustments: ColorAdjustments;
  onAdjustmentChange: (adjustments: ColorAdjustments) => void;
  onApply: () => void;
  isLoading: boolean;
}

const ColorAdjustmentPanel: React.FC<ColorAdjustmentPanelProps> = ({
  adjustments,
  onAdjustmentChange,
  onApply,
  isLoading,
}) => {
  const { brightness, contrast, saturation } = adjustments;

  const handleSliderChange = (key: keyof ColorAdjustments) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onAdjustmentChange({
      ...adjustments,
      [key]: parseInt(e.target.value, 10),
    });
  };

  const handleReset = () => {
    onAdjustmentChange({ brightness: 100, contrast: 100, saturation: 100 });
  };

  const hasChanges = brightness !== 100 || contrast !== 100 || saturation !== 100;

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col items-center gap-4 animate-tool-panel backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-gray-300">ปรับสี</h3>
      <p className="text-sm text-gray-400 -mt-2">ปรับความสว่าง, ความต่างสี, และความอิ่มตัวของสี</p>

      <div className="w-full max-w-md space-y-4 px-2">
        {/* Brightness */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="brightness" className="text-sm font-medium text-gray-300">ความสว่าง</label>
            <span className="text-sm font-mono text-cyan-300 bg-cyan-900/50 px-2 py-0.5 rounded">{brightness}%</span>
          </div>
          <input
            id="brightness"
            type="range"
            min="0"
            max="200"
            value={brightness}
            onChange={handleSliderChange('brightness')}
            disabled={isLoading}
            className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg transition-colors ${brightness !== 100 ? 'accent-blue-500' : 'accent-gray-500'}`}
          />
        </div>

        {/* Contrast */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="contrast" className="text-sm font-medium text-gray-300">ความต่างสี</label>
            <span className="text-sm font-mono text-cyan-300 bg-cyan-900/50 px-2 py-0.5 rounded">{contrast}%</span>
          </div>
          <input
            id="contrast"
            type="range"
            min="0"
            max="200"
            value={contrast}
            onChange={handleSliderChange('contrast')}
            disabled={isLoading}
            className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg transition-colors ${contrast !== 100 ? 'accent-blue-500' : 'accent-gray-500'}`}
          />
        </div>

        {/* Saturation */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="saturation" className="text-sm font-medium text-gray-300">ความอิ่มตัวของสี</label>
            <span className="text-sm font-mono text-cyan-300 bg-cyan-900/50 px-2 py-0.5 rounded">{saturation}%</span>
          </div>
          <input
            id="saturation"
            type="range"
            min="0"
            max="200"
            value={saturation}
            onChange={handleSliderChange('saturation')}
            disabled={isLoading}
            className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg transition-colors ${saturation !== 100 ? 'accent-blue-500' : 'accent-gray-500'}`}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-4 w-full max-w-md">
        <button
            onClick={handleReset}
            disabled={isLoading || !hasChanges}
            className="flex-1 text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/5"
        >
            รีเซ็ต
        </button>
        <button
            onClick={onApply}
            disabled={isLoading || !hasChanges}
            className="flex-1 bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-5 rounded-md transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-green-800 disabled:to-green-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
        >
            ใช้การปรับสีนี้
        </button>
      </div>

    </div>
  );
};

export default ColorAdjustmentPanel;