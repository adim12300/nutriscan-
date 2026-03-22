import { GoogleGenerativeAI } from '@google/generative-ai';
import { FoodItem } from '../types';

export async function analyzeImageWithGemini(
  base64Image: string, 
  mimeType: string, 
  apiKey: string
): Promise<FoodItem> {
  if (!apiKey) {
    throw new Error('Google Gemini API Key is required.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); // Best for multimodal fast responses

  const prompt = `
You are an expert nutritionist AI. Analyze the food in the provided image.
Estimate the nutritional values.
Respond ONLY with a valid JSON object matching this schema, without markdown formatting or code blocks:
{
  "name": "string (name of the food/meal)",
  "calories": number (estimated total calories),
  "macros": {
    "protein": number (in grams),
    "carbs": number (in grams),
    "fat": number (in grams),
    "fiber": number (in grams),
    "sugar": number (in grams)
  }
}
`;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ]);

    const responseText = result.response.text();
    // Clean up potential markdown formatting if model still adds it
    const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(jsonString);

    return {
      id: Math.random().toString(36).substr(2, 9),
      name: parsed.name || 'Unknown Food',
      calories: parsed.calories || 0,
      macros: {
        protein: parsed.macros?.protein || 0,
        carbs: parsed.macros?.carbs || 0,
        fat: parsed.macros?.fat || 0,
        fiber: parsed.macros?.fiber || 0,
        sugar: parsed.macros?.sugar || 0
      },
      imageUrl: '', // This will be set by the caller (local preview url or base64)
      timestamp: Date.now(),
      isVerified: true
    };
  } catch (error) {
    console.error("Gemini AI Analysis failed:", error);
    throw error;
  }
}

export async function generateMealSuggestionWithGemini(
  remainingCalories: number,
  remainingProtein: number,
  remainingCarbs: number,
  remainingFat: number,
  apiKey: string
): Promise<{ title: string; description: string; ingredients: string[] }> {
  if (!apiKey) {
    throw new Error('Google Gemini API Key is required.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
You are an expert fitness nutritionist. The user has the following remaining nutritional goals for today:
- Calories: ${remainingCalories} kcal
- Protein: ${remainingProtein} g
- Carbs: ${remainingCarbs} g
- Fat: ${remainingFat} g

Provide ONE meal or snack suggestion that perfectly matches (or comes very close to) these remaining macros.
Respond ONLY with a valid JSON object matching this schema, without markdown formatting or code blocks:
{
  "title": "string (name of the meal)",
  "description": "string (brief description of why this is a good choice)",
  "ingredients": ["string", "string"] (list of main ingredients with rough amounts)
}
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Gemini AI Suggestion failed:", error);
    throw error;
  }
}
