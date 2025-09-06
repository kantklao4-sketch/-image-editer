/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import PromptInput from './PromptInput';
import { UploadIcon, PlusCircleIcon, TrashIcon } from './icons';

interface AdjustmentPanelProps {
  onApplyAdjustment: (prompt: string) => void;
  isLoading: boolean;
  secondaryImage: File | null;
  onSecondaryImageUpload: (file: File) => void;
  onClearSecondaryImage: () => void;
}

const LOCAL_STORAGE_KEY = 'pixshop_saved_adjustment_presets';

const adjustmentSuggestions = [
    'เบลอพื้นหลัง',
    'เปลี่ยนพื้นหลังเป็นชายหาด',
    'เปลี่ยนพื้นหลังเป็นภูเขาหิมะ',
    'เพิ่มแสงแดดยามเช้า',
    'ทำให้ภาพคมชัดขึ้น',
    'ลบวัตถุที่ไม่ต้องการ',
    'เปลี่ยนสีเสื้อเป็นสีแดง',
    'ปรับโทนสีให้อบอุ่นเหมือนฟิล์ม',
    'เพิ่มเอฟเฟกต์แสงโบเก้',
    'ทำให้ท้องฟ้าดูน่าทึ่งขึ้น',
    'จัดแสงแบบสตูดิโอ'
];


const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({ onApplyAdjustment, isLoading, secondaryImage, onSecondaryImageUpload, onClearSecondaryImage }) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [secondaryImageUrl, setSecondaryImageUrl] = useState<string | null>(null);
  const [savedPresets, setSavedPresets] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setSavedPresets(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load saved adjustment presets:", error);
    }
  }, []);

  useEffect(() => {
    if (secondaryImage) {
      const url = URL.createObjectURL(secondaryImage);
      setSecondaryImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setSecondaryImageUrl(null);
  }, [secondaryImage]);


  const presets = [
    { name: 'เบลอพื้นหลัง', prompt: 'Apply a realistic depth-of-field effect, making the background blurry while keeping the main subject in sharp focus.' },
    { name: 'เพิ่มความคมชัด', prompt: 'Slightly enhance the sharpness and details of the image without making it look unnatural.' },
    { name: 'ปรับแสงให้อบอุ่น', prompt: 'Adjust the color temperature to give the image warmer, golden-hour style lighting.' },
    { name: 'จัดแสงสตูดิโอ', prompt: 'Add dramatic, professional studio lighting to the main subject.' },
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
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        onSecondaryImageUpload(e.target.files[0]);
    }
    e.target.value = ''; // Reset file input
  };

  const updateAndSavePresets = (updatedPresets: string[]) => {
    setSavedPresets(updatedPresets);
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedPresets));
    } catch (error) {
        console.error("Failed to save presets to localStorage:", error);
    }
  };
  
  const handleSavePreset = () => {
    const trimmedPrompt = customPrompt.trim();
    if (trimmedPrompt && !savedPresets.includes(trimmedPrompt)) {
      const updatedPresets = [...savedPresets, trimmedPrompt];
      updateAndSavePresets(updatedPresets);
      setCustomPrompt('');
    }
  };

  const handleDeletePreset = (presetToDelete: string) => {
    const updatedPresets = savedPresets.filter(p => p !== presetToDelete);
    updateAndSavePresets(updatedPresets);
    if (selectedPresetPrompt === presetToDelete) {
        setSelectedPresetPrompt(null);
    }
  };


  const handleApply = () => {
    if (activePrompt || secondaryImage) {
      onApplyAdjustment(activePrompt);
    }
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-4 animate-tool-panel backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-center text-gray-300">ปรับแต่งภาพระดับมืออาชีพ</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {presets.map(preset => (
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
      
      <div className="w-full bg-gray-900/40 border border-gray-700/60 rounded-lg p-3">
        <h4 className="text-base font-semibold text-center text-gray-300 mb-3">ใช้ภาพอ้างอิง (ไม่บังคับ)</h4>
        {secondaryImageUrl ? (
          <div className="flex items-center gap-3 p-2 bg-white/5 rounded-md">
            <img src={secondaryImageUrl} alt="Reference" className="w-14 h-14 object-cover rounded-md flex-shrink-0" />
            <div className="flex-grow overflow-hidden">
              <p className="text-sm font-medium text-gray-200 truncate">{secondaryImage?.name}</p>
              <p className="text-xs text-gray-400">{secondaryImage && `${(secondaryImage.size / 1024).toFixed(1)} KB`}</p>
            </div>
            <button
              onClick={onClearSecondaryImage}
              disabled={isLoading}
              className="text-sm font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-md transition-colors disabled:opacity-50"
            >
              ลบ
            </button>
          </div>
        ) : (
          <label htmlFor="ref-image-upload" className="relative flex items-center justify-center w-full px-4 py-4 text-sm font-semibold text-gray-300 bg-white/5 rounded-md cursor-pointer group hover:bg-white/10 transition-colors border-2 border-dashed border-gray-600 hover:border-gray-500">
            <UploadIcon className="w-5 h-5 mr-2" />
            อัปโหลดภาพอ้างอิง
            <input id="ref-image-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isLoading} />
          </label>
        )}
      </div>
      
      {savedPresets.length > 0 && (
        <div className="w-full pt-2">
            <h4 className="text-base font-semibold text-center text-gray-400 mb-2">การปรับแต่งที่บันทึกไว้</h4>
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
                        aria-label={`ลบการปรับแต่ง ${preset}`}
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
            </div>
        </div>
        )}

      <div className="flex items-center gap-2">
        <PromptInput
            value={customPrompt}
            onChange={handleCustomChange}
            placeholder="หรืออธิบายการปรับแต่ง (เช่น 'เปลี่ยนพื้นหลังเป็นป่า')"
            suggestions={adjustmentSuggestions}
            disabled={isLoading}
        />
        <button 
            onClick={handleSavePreset}
            disabled={isLoading || !customPrompt.trim() || savedPresets.includes(customPrompt.trim())}
            className="p-3 text-gray-400 rounded-lg transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="บันทึกการปรับแต่งที่กำหนดเอง"
            title="บันทึกการปรับแต่งนี้"
        >
            <PlusCircleIcon className="w-7 h-7" />
        </button>
      </div>

      {(activePrompt || secondaryImage) && (
        <div className="animate-fade-in flex flex-col gap-4 pt-2">
            <button
                onClick={handleApply}
                className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                disabled={isLoading || (!activePrompt?.trim() && !secondaryImage)}
            >
                ใช้การปรับแต่งนี้
            </button>
        </div>
      )}
    </div>
  );
};

export default AdjustmentPanel;