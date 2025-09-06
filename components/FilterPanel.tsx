/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import PromptInput from './PromptInput';
import { PlusCircleIcon, TrashIcon } from './icons';

interface FilterPanelProps {
  onApplyFilter: (prompt: string) => void;
  onApplyClientFilter: (filter: 'grayscale' | 'sepia') => void;
  isLoading: boolean;
}

const LOCAL_STORAGE_KEY = 'pixshop_saved_filter_presets';

const filterSuggestions = [
    'สไตล์วินเทจ',
    'ฟิล์มนัวร์ ขาวดำ',
    'ภาพวาดสีน้ำมัน',
    'แสงนีออนยุค 80',
    'ขาวดำคอนทราสต์สูง',
    'เอฟเฟกต์ภาพยนตร์เก่า',
    'โทนสีพาสเทล',
    'สไตล์การ์ตูนอนิเมะ',
    'ศิลปะแบบป๊อปอาร์ต',
    'เอฟเฟกต์กลิตช์',
    'ภาพถ่ายโลโม่',
    'โฮโลแกรมแห่งอนาคต'
];

const FilterPanel: React.FC<FilterPanelProps> = ({ onApplyFilter, onApplyClientFilter, isLoading }) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [savedPresets, setSavedPresets] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setSavedPresets(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load saved filter presets:", error);
    }
  }, []);

  const clientPresets = [
    { name: 'ขาว-ดำ', type: 'grayscale' as const },
    { name: 'ซีเปีย', type: 'sepia' as const },
  ];

  const aiPresets = [
    { name: 'ซินธ์เวฟ', prompt: 'Apply a vibrant 80s synthwave aesthetic with neon magenta and cyan glows, and subtle scan lines.' },
    { name: 'อนิเมะ', prompt: 'Give the image a vibrant Japanese anime style, with bold outlines, cel-shading, and saturated colors.' },
    { name: 'โลโม่', prompt: 'Apply a Lomography-style cross-processing film effect with high-contrast, oversaturated colors, and dark vignetting.' },
    { name: 'กลิตช์', prompt: 'Transform the image into a futuristic holographic projection with digital glitch effects and chromatic aberration.' },
  ];
  
  const activePrompt = selectedPresetPrompt || customPrompt;

  const handlePresetClick = (prompt: string) => {
    setSelectedPresetPrompt(prompt);
    setCustomPrompt('');
  };
  
  const handleCustomChange = (value: string) => {
    setCustomPrompt(value);
    setSelectedPresetPrompt(null);
  };
  
  const handleSavePreset = () => {
    const trimmedPrompt = customPrompt.trim();
    if (trimmedPrompt && !savedPresets.includes(trimmedPrompt)) {
      const updatedPresets = [...savedPresets, trimmedPrompt];
      setSavedPresets(updatedPresets);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedPresets));
      setCustomPrompt(''); // Clear input after saving
    }
  };

  const handleDeletePreset = (presetToDelete: string) => {
    const updatedPresets = savedPresets.filter(p => p !== presetToDelete);
    setSavedPresets(updatedPresets);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedPresets));
    if (selectedPresetPrompt === presetToDelete) {
      setSelectedPresetPrompt(null);
    }
  };


  const handleApply = () => {
    if (activePrompt) {
      onApplyFilter(activePrompt);
    }
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-4 animate-tool-panel backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-center text-gray-300">ฟิลเตอร์พื้นฐาน (เร็ว)</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {clientPresets.map(preset => (
          <button
            key={preset.name}
            onClick={() => onApplyClientFilter(preset.type)}
            disabled={isLoading}
            className="w-full text-center bg-white/10 border border-transparent text-gray-200 font-semibold py-3 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/20 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-600" />
        </div>
        <div className="relative flex justify-center">
            <span className="bg-gray-800/50 px-2 text-sm text-gray-400 backdrop-blur-sm">หรือใช้ AI</span>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-center text-gray-300">ฟิลเตอร์ AI</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {aiPresets.map(preset => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset.prompt)}
            disabled={isLoading}
            className={`w-full text-center bg-white/10 border border-transparent text-gray-200 font-semibold py-3 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/20 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed ${selectedPresetPrompt === preset.prompt ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-blue-500' : ''}`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {savedPresets.length > 0 && (
        <div className="w-full pt-2">
            <h4 className="text-base font-semibold text-center text-gray-400 mb-2">ฟิลเตอร์ที่บันทึกไว้</h4>
            <div className="flex flex-wrap gap-2 justify-center">
            {savedPresets.map(preset => (
                <div key={preset} className="relative group">
                    <button
                        onClick={() => handlePresetClick(preset)}
                        disabled={isLoading}
                        className={`text-center bg-white/5 border border-transparent text-gray-300 font-medium py-2 pl-4 pr-8 rounded-md transition-all duration-200 ease-in-out hover:bg-white/15 hover:border-white/10 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${selectedPresetPrompt === preset ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-blue-500' : ''}`}
                    >
                        {preset}
                    </button>
                    <button
                        onClick={() => handleDeletePreset(preset)}
                        disabled={isLoading}
                        className="absolute top-1/2 right-1 -translate-y-1/2 p-1 text-gray-500 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-300 transition-all disabled:opacity-0"
                        aria-label={`ลบฟิลเตอร์ ${preset}`}
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
            </div>
        </div>
        )}

      <div className="flex items-center gap-2 mt-2">
        <PromptInput
            value={customPrompt}
            onChange={handleCustomChange}
            placeholder="หรืออธิบายฟิลเตอร์ AI ที่ต้องการ (เช่น 'แสงนีออนยุค 80')"
            suggestions={filterSuggestions}
            disabled={isLoading}
        />
        <button 
            onClick={handleSavePreset}
            disabled={isLoading || !customPrompt.trim() || savedPresets.includes(customPrompt.trim())}
            className="p-3 text-gray-400 rounded-lg transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="บันทึกฟิลเตอร์ที่กำหนดเอง"
            title="บันทึกฟิลเตอร์นี้"
        >
            <PlusCircleIcon className="w-7 h-7" />
        </button>
      </div>
      
      {activePrompt && (
        <div className="animate-fade-in flex flex-col gap-4 pt-2">
          <button
            onClick={handleApply}
            className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading || !activePrompt.trim()}
          >
            ใช้ฟิลเตอร์ AI
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;