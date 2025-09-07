/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

/**
 * คอมโพเนนต์ตัวอย่างที่แสดงปุ่มและข้อความ
 * เมื่อคลิกปุ่ม ข้อความจะถูกอัปเดต
 */
const ButtonWithText: React.FC = () => {
  // ใช้ useState hook เพื่อจัดการสถานะของข้อความ
  // ค่าเริ่มต้นคือ 'ข้อความเริ่มต้น'
  const [message, setMessage] = useState('ข้อความเริ่มต้น');

  // ฟังก์ชันที่จะทำงานเมื่อมีการคลิกปุ่ม
  const handleButtonClick = () => {
    // อัปเดตสถานะของข้อความ
    setMessage('ปุ่มถูกคลิกแล้ว!');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      padding: '2rem',
      backgroundColor: '#2d3748',
      borderRadius: '8px',
      color: 'white'
    }}>
      {/* แสดงข้อความปัจจุบันจาก state */}
      <p style={{ fontSize: '1.2rem', margin: 0 }}>{message}</p>
      
      {/* ปุ่มที่เรียกใช้ handleButtonClick เมื่อถูกคลิก */}
      <button 
        onClick={handleButtonClick}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          color: 'white',
          backgroundColor: '#4299e1',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
      >
        กดปุ่มนี้
      </button>
    </div>
  );
};

export default ButtonWithText;
