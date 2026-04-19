import { GoogleGenerativeAI } from "@google/generative-ai";

const FALLBACK_TIPS = [
  "Drop, cover, and hold on immediately.",
  "Move away from windows and exterior walls.",
  "Stay low until shaking completely stops.",
  "Walk calmly to the nearest marked exit.",
] as const;

function normalizeTips(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...FALLBACK_TIPS];
  const strings = raw
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean);
  if (strings.length < 4) return [...FALLBACK_TIPS];
  return strings.slice(0, 4);
}

function extractJsonArray(text: string): unknown {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        /* fall through */
      }
    }
  }
  return null;
}

export async function getGeminiSafetyTips(
  waypointLabel: string,
  waypointDescription: string,
  magnitude: number,
  riskTier: string,
): Promise<string[]> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey?.trim()) {
    return [...FALLBACK_TIPS];
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are an earthquake safety expert. Give exactly 4 short, specific safety tips for someone in this exact situation:

Location: ${waypointLabel} — ${waypointDescription}
Building: HSS Room 1345, a 1970s brutalist concrete building at UCSD, 8 floors, known concrete spalling history, desks in research rooms
Earthquake magnitude: ${magnitude}
Risk level: ${riskTier}

Rules:
- Each tip must be 1 sentence, under 15 words
- Be specific to this exact location and magnitude — not generic advice
- Start each tip with an action verb
- Return ONLY a JSON array of 4 strings, no other text, no markdown

Example format: ["Drop under the desk immediately.", "Move away from the concrete walls.", "Watch for ceiling tile debris.", "Locate the door before shaking intensifies."]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = extractJsonArray(text);
    return normalizeTips(parsed);
  } catch {
    return [...FALLBACK_TIPS];
  }
}
