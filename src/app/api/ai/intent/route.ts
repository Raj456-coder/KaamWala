import { NextRequest, NextResponse } from "next/server";
import { extractIntent } from "@/lib/ai/intentExtractor";
import { ExtractedIntent, SessionContext } from "@/lib/ai/types";
import { getCityCoordinates } from "@/lib/location";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const context: SessionContext | undefined = body.context;
    const userLocation = body.userLocation as { city?: string; latitude?: number; longitude?: number } | undefined;

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    let intent: ExtractedIntent;

    // Check if Gemini API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        intent = await callGeminiIntent(query, apiKey, context);
      } catch (geminiError) {
        console.warn("Gemini intent extraction failed, falling back to local NLP engine:", geminiError);
        intent = extractIntent(query, context);
      }
    } else {
      // Deterministic, high-speed local NLP engine
      intent = extractIntent(query, context);
    }

    // Attach resolved coordinates if location entity was extracted from query or provided
    if (intent.extractedEntities.location) {
      const coords = getCityCoordinates(intent.extractedEntities.location);
      if (coords) {
        intent.extractedEntities.coordinates = coords;
      }
    } else if (userLocation?.city) {
      // If query didn't specify city, but user has location context
      const coords = userLocation.latitude && userLocation.longitude
        ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
        : getCityCoordinates(userLocation.city);
      
      intent.extractedEntities.location = userLocation.city;
      if (coords) {
        intent.extractedEntities.coordinates = coords;
      }
    }

    return NextResponse.json({
      success: true,
      intent,
      source: apiKey ? "gemini_with_nlp_fallback" : "local_nlp_engine"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function callGeminiIntent(
  query: string,
  apiKey: string,
  context?: SessionContext
): Promise<ExtractedIntent> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const prompt = `You are KaamWala's service extraction AI for India.
Given a user query, extract service intent into valid JSON matching this schema:
{
  "intent": "find_worker" | "service_inquiry" | "clarification_needed" | "unknown",
  "canonicalCategory": string or null (allowed: carpenter, electrician, plumber, painter, house-maid, ac-repair, mason, mechanic, cleaner, cook, driver, welder, ro-repair, tutor, photographer, internet-technician),
  "serviceName": string or null (display name in English, e.g. "Carpenter"),
  "detectedLanguage": "hi" | "hinglish" | "en",
  "extractedEntities": {
    "service": string or null,
    "location": string or null (e.g. Mathura, Agra, etc.),
    "date": string or null (YYYY-MM-DD or today/tomorrow),
    "time": string or null,
    "urgency": "immediate" | "today" | "flexible",
    "budget": number or null
  },
  "confidence": number between 0 and 1,
  "clarificationNeeded": boolean,
  "clarificationQuestion": string or null,
  "replyMessage": string (natural response in customer's language)
}

Important Indian Vernacular Rules:
- "badhai" -> carpenter
- "bijli wala", "light wala", "fan repair" -> electrician
- "nal wala", "pipe leak", "plumber" -> plumber
- "kaamwali", "bai", "maid" -> house-maid
- "mistri" without qualifier -> ambiguous! Set intent: "clarification_needed", clarificationNeeded: true, replyMessage: "Aapko kis tarah ke mistri ki zaroorat hai? (Raj Mistri / Carpenter / Mechanic)"
- "raj mistri", "plaster" -> mason
- "gadi mistri", "bike repair" -> mechanic
- "AC wala", "cooling nahi ho rahi" -> ac-repair
- "rang wala", "putty" -> painter

User Query: "${query}"
${context?.lastCategory ? `Previous Context Category: ${context.lastCategory}` : ""}
${context?.lastLocation ? `Previous Context Location: ${context.lastLocation}` : ""}

Output ONLY raw valid JSON, no markdown codeblocks, no commentary.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Empty response from Gemini");
    }

    const parsed = JSON.parse(rawText.trim());
    return parsed as ExtractedIntent;
  } catch {
    clearTimeout(timeoutId);
    // Fall back to local regex/NLP parser
    return extractIntent(query, context);
  }
}
