/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// 1. นำเข้าไลบรารีที่จำเป็นจาก @google/genai
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

/**
 * ไฟล์นี้เป็นตัวอย่างการเรียกใช้ Gemini API ด้วย TypeScript
 * 
 * ขั้นตอนหลัก:
 * 1. ตรวจสอบว่า API Key ถูกตั้งค่าใน environment variables แล้ว
 * 2. สร้างฟังก์ชัน async เพื่อห่อหุ้มการเรียก API
 * 3. เริ่มต้น Gemini AI client ด้วย API Key
 * 4. เรียกใช้ `ai.models.generateContent` พร้อมระบุ model และ prompt
 * 5. จัดการผลลัพธ์ที่ได้จาก `response.text`
 * 6. ดักจับและจัดการข้อผิดพลาดที่อาจเกิดขึ้น
 */

// ตรวจสอบให้แน่ใจว่า API Key ถูกกำหนดค่าไว้ใน environment variables
// แอปพลิเคชันจะหยุดทำงานทันทีพร้อมข้อความที่ชัดเจนหากไม่มี key
if (!process.env.API_KEY) {
    throw new Error("ไม่ได้ตั้งค่าตัวแปรสภาพแวดล้อม API_KEY กรุณาตรวจสอบให้แน่ใจว่าได้กำหนดค่าในสภาพแวดล้อมของแอปพลิเคชันของคุณแล้ว");
}

/**
 * ฟังก์ชันตัวอย่างสำหรับเรียก Gemini API เพื่อถามคำถาม
 * @param question คำถามที่ต้องการส่งไปยังโมเดล
 * @returns Promise<string> ที่จะ resolve เป็นคำตอบจาก AI
 */
async function askGemini(question: string): Promise<string> {
  console.log(`กำลังส่งคำถามไปยัง Gemini: "${question}"`);
  
  try {
    // 2. เริ่มต้น GoogleGenAI client
    // ใช้ `process.env.API_KEY` โดยตรง
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 3. เรียก API ด้วย `generateContent`
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // ใช้โมเดลที่แนะนำ
      contents: question,
    });

    // 4. ดึงข้อความตอบกลับจาก property 'text' โดยตรง
    const answer = response.text;
    
    console.log("ได้รับคำตอบจาก Gemini:", answer);
    return answer;

  } catch (error) {
    // 5. จัดการข้อผิดพลาดที่อาจเกิดขึ้น
    console.error("เกิดข้อผิดพลาดขณะเรียกใช้ Gemini API:", error);

    // สร้างข้อความแสดงข้อผิดพลาดที่เป็นประโยชน์มากขึ้น
    const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่รู้จัก";
    
    // ส่งต่อข้อผิดพลาดเพื่อให้ส่วนอื่นของโปรแกรมจัดการได้
    throw new Error(`ไม่สามารถรับคำตอบจาก Gemini ได้: ${errorMessage}`);
  }
}

// --- ตัวอย่างการใช้งาน ---
// หากต้องการทดสอบฟังก์ชันนี้ สามารถ uncomment บรรทัดด้านล่างได้
/*
(async () => {
  try {
    const question = "ทำไมท้องฟ้าถึงเป็นสีฟ้า?";
    const answer = await askGemini(question);
    console.log(`\n--- ผลลัพธ์สุดท้าย ---`);
    console.log(`คำถาม: ${question}`);
    console.log(`คำตอบ: ${answer}`);
    console.log(`---------------------\n`);
  } catch (e) {
    console.error("การทดสอบฟังก์ชัน askGemini ล้มเหลว");
  }
})();
*/

// Export ฟังก์ชันเพื่อให้สามารถนำไปใช้ในไฟล์อื่นได้
export { askGemini };
