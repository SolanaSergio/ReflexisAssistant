import { GoogleGenAI, Type } from "@google/genai";
import { Employee, EmployeeRole } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Scans a base64 image of a schedule and returns formatted text
 * compatible with the ZWS Parser.
 */
export const scanScheduleImage = async (base64Data: string, mimeType: string = 'image/png'): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `Analyze this image of a staff schedule. 
            Extract every shift visible.
            
            Return the data STRICTLY in this format for each line:
            Name: StartTime - EndTime
            
            Rules:
            1. Use 24-hour format for times (e.g. 13:00 instead of 1:00 PM).
            2. If a role is clearly visible (like Manager, Lead), put it in brackets before the name. Example: "[Mgr] Alice: 08:00 - 16:00".
            3. Ignore dates, headers, or total hours. Only extract the Name and Time Range.
            4. If a person has "OFF" or no time, ignore them.
            5. Return ONLY the list of text, no markdown code blocks.`
          }
        ]
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("OCR Scanning failed:", error);
    throw new Error("Failed to scan image. Please try again or type manually.");
  }
};

/**
 * Scans a base64 image of a staff roster/list and returns structured employee data.
 */
export const scanStaffList = async (base64Data: string, mimeType: string = 'image/png'): Promise<Partial<Employee>[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `Analyze this image of a staff list or roster.
            Extract names and roles if visible.
            
            Rules:
            1. If role is not clear, default to "PART_TIME".
            2. Map "Mgr", "Manager", "Lead" to "MANAGER".
            3. Map "Full Time", "FT" to "FULL_TIME".
            4. Map "Part Time", "PT", "Associate" to "PART_TIME".
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              role: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING }
            },
            required: ["name", "role"]
          }
        }
      }
    });

    const text = response.text || "[]";
    const data = JSON.parse(text);
    
    // Map string roles to Enum
    return data.map((item: any) => ({
      name: item.name,
      role: item.role === 'MANAGER' ? EmployeeRole.MANAGER : 
            item.role === 'FULL_TIME' ? EmployeeRole.FULL_TIME : 
            EmployeeRole.PART_TIME,
      email: item.email,
      phone: item.phone,
      maxHours: item.role === 'MANAGER' ? 40 : 30 // Default heuristics
    }));

  } catch (error) {
    console.error("Staff OCR failed:", error);
    throw new Error("Failed to parse staff list. Please ensure image is clear.");
  }
};