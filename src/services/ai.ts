import { GoogleGenAI } from "@google/genai";
import { hfAnalyzeSentiment, hfSummarize, hfExtractKeywords } from "./huggingface";

// We'll use Gemini for AI features as it's already integrated in the environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AIAnalysisResult {
  mood: 'good' | 'neutral' | 'low' | 'stressed' | 'concerning';
  keywords: string[];
  summary: string;
  adherenceScore: number;
}

export async function analyzeDailyCheckin(text: string, mood: string): Promise<string[]> {
  try {
    // Try Hugging Face first
    try {
      const hfKeywords = await hfExtractKeywords(text);
      if (hfKeywords.length > 0) return hfKeywords;
    } catch (e) {
      console.warn("HF Keyword Extraction failed, falling back to Gemini");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this healthcare check-in text and extract important health-related keywords (e.g., pain, fever, headache, tired, weak, dizzy, stressed, anxious). Return ONLY a comma-separated list of keywords.
      
      Text: "${text}"
      User Mood: "${mood}"`,
    });

    const result = response.text || '';
    return result.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
  } catch (error) {
    console.error('AI Analysis Error:', error);
    // Fallback to simple regex if AI fails
    const keywords = ['pain', 'fever', 'headache', 'tired', 'weak', 'dizzy', 'stressed', 'anxious'];
    return keywords.filter(k => text.toLowerCase().includes(k));
  }
}

export async function generateDailySummary(checkins: any[], meds: any[]): Promise<string> {
  try {
    const checkinText = checkins.map(c => `Mood: ${c.mood}, Symptoms: ${c.symptoms_text}`).join('\n');
    const medText = meds.map(m => `Med: ${m.medicine_name}, Status: ${m.status}`).join('\n');
    const combinedText = `Check-ins:\n${checkinText}\n\nMedication Adherence:\n${medText}`;

    // Try Hugging Face first
    try {
      const summary = await hfSummarize(combinedText);
      if (summary && summary.length > 20) return summary;
    } catch (e) {
      console.warn("HF Summarization failed, falling back to Gemini");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a short, professional, and empathetic caregiver-friendly summary based on these patient logs. Keep it under 100 words.
      
      Check-ins:
      ${checkinText}
      
      Medication Adherence:
      ${medText}`,
    });

    return response.text || "Patient is doing well today. No major concerns reported.";
  } catch (error) {
    console.error('AI Summary Error:', error);
    return "Patient completed their daily check-in. Mood seems stable and medications are being tracked.";
  }
}

export async function detectSentiment(text: string): Promise<'good' | 'neutral' | 'low' | 'stressed' | 'concerning'> {
  try {
    // Try Hugging Face first
    try {
      const hfLabel = await hfAnalyzeSentiment(text);
      if (hfLabel === 'POSITIVE') return 'good';
      if (hfLabel === 'NEGATIVE') return 'concerning';
    } catch (e) {
      console.warn("HF Sentiment Analysis failed, falling back to Gemini");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Categorize the sentiment of this patient's health check-in as exactly one of: good, neutral, low, stressed, concerning.
      
      Text: "${text}"`,
    });

    const result = response.text?.toLowerCase().trim();
    if (result?.includes('good')) return 'good';
    if (result?.includes('neutral')) return 'neutral';
    if (result?.includes('low')) return 'low';
    if (result?.includes('stressed')) return 'stressed';
    if (result?.includes('concerning')) return 'concerning';
    
    return 'neutral';
  } catch (error) {
    console.error('AI Sentiment Error:', error);
    return 'neutral';
  }
}
