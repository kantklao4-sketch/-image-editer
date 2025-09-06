/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import PromptInput from './PromptInput';

interface AiEditPanelProps {
  onApplyAiEdit: (prompt: string) => void;
  isLoading: boolean;
}

const aiEditSuggestions = [
    'เปลี่ยนให้เป็นภาพวาดสีน้ำ',
    'เพิ่มหมอกหนาในตอนเช้า',
    'ทำให้ฝนตกและมีเงาสะท้อนบนพื้น',
    'สไตล์ศิลปะแบบแวนโก๊ะ',
    'เปลี่ยนท้องฟ้าให้เป็นกาแล็กซี่ที่เต็มไปด้วยดวงดาว',
    'โลกแฟนตาซีเหนือจริง',
    'เอฟเฟกต์เหนือจริงและแฟนตาซี',
    'สุนทรียศาสตร์แบบไซเบอร์พังก์พร้อมแสงนีออน',
    'ภาพสเก็ตช์ด้วยถ่าน',
    'เพิ่มเอฟเฟกต์แสงเหนือ',
    'เปลี่ยนให้เป็นโลกใต้น้ำ',
    'ภาพโมเสกแก้วสี',
    'สไตล์ภาพยนตร์ไซไฟยุค 70',
    'สร้างบรรยากาศเหมือนฝัน',
    'เพิ่มเกาะลอยฟ้า',
    'เพิ่มสิ่งมีชีวิตที่ทำจากแสง',
    'ป่าเรืองแสงยามค่ำคืน',
    'มหาสมุทรบนท้องฟ้า',
    'เมืองที่สร้างจากคริสตัล'
];


const AiEditPanel: React.FC<AiEditPanelProps> = ({ onApplyAiEdit, isLoading }) => {
  const [customPrompt, setCustomPrompt] = useState('');

  const handleApply = () => {
    if (customPrompt) {
      onApplyAiEdit(customPrompt);
    }
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-4 animate-tool-panel backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-center text-gray-300">แก้ไขภาพด้วย AI</h3>
      <p className="text-sm text-center text-gray-400 -mt-2">อธิบายการเปลี่ยนแปลงที่คุณต้องการให้ AI สร้างสรรค์ขึ้นมาใหม่ทั้งภาพ</p>
      
      <div className="flex items-center gap-2">
        <PromptInput
            value={customPrompt}
            onChange={setCustomPrompt}
            placeholder="เช่น 'ทำให้ภาพดูเหมือนโลกแฟนตาซีเหนือจริง'"
            suggestions={aiEditSuggestions}
            disabled={isLoading}
        />
      </div>

      <div className="flex flex-col gap-4 pt-2">
        <button
            onClick={handleApply}
            className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading || !customPrompt.trim()}
        >
            สร้างภาพใหม่ด้วย AI
        </button>
      </div>
    </div>
  );
};

export default AiEditPanel;