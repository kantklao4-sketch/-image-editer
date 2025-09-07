/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

/**
 * คอมโพเนนต์ที่แสดงปุ่ม
 * เมื่อผู้ใช้คลิกปุ่ม ข้อความทักทาย 'พี่กันต์ สวัสดีครับ' จะปรากฏขึ้น
 */
const GreetingButton: React.FC = () => {
  // ใช้ useState เพื่อจัดการสถานะของข้อความทักทาย
  // ค่าเริ่มต้นเป็นสตริงว่าง
  const [greetingMessage, setGreetingMessage] = useState('');

  // ฟังก์ชันที่จะทำงานเมื่อปุ่มถูกคลิก
  const handleShowGreeting = () => {
    // อัปเดต state เพื่อแสดงข้อความทักทาย
    setGreetingMessage('พี่กันต์ สวัสดีครับ');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      padding: '2rem',
      backgroundColor: '#2d3748', // Dark background
      borderRadius: '8px',
      color: 'white'
    }}>
      {/* ปุ่มที่เรียกใช้ handleShowGreeting เมื่อถูกคลิก */}
      <button 
        onClick={handleShowGreeting}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          color: 'white',
          backgroundColor: '#4299e1', // Blue button
          border: 'none',
          borderRaa
      {/* 
        แสดงข้อความทักทายก็ต่อเมื่อ greetingMessage ไม่ใช่สตริงว่าง
        ใช้ Short-circuit evaluation (&&) เพื่อการแสดงผลแบบมีเงื่อนไข
      */}
      {greetingMessage && (
        <p style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold',
          margin: '1rem 0 0 0',
          color: '#90cdf4' // Light blue text
        }}>
          {greetingMessage}
        </p>
      )}
    </div>
  );
};

export default GreetingButton;
