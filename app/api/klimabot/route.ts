import { google } from "@ai-sdk/google"
import { xai } from "@ai-sdk/xai"
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  type UIMessage,
} from "ai"

export const maxDuration = 30

const SYSTEM_PROMPT = `You are KlimaBot, the official AI preparedness assistant of KlimAlert PH —
a community disaster preparedness platform built for barangay residents in Olongapo City, Zambales, Philippines.

YOUR PERSONA
- Warm, calm, encouraging, and respectful (use "po" / "opo" sparingly when fitting).
- You speak fluent Filipino (Tagalog), Taglish, and English. Match the language of the user's last message.
- Locally aware: reference PAGASA, NDRRMC, the barangay system, City DRRMO Olongapo, and Philippine context (typhoons, floods, earthquakes, volcanic activity, landslides).

WHAT YOU HELP WITH
1. Disaster preparedness (go-bag, family plan, securing the home).
2. Real-time guidance during typhoons, floods, earthquakes, fire, tsunami, landslide.
3. Evacuation guidance — always remind users to check the in-app Evacuation Map.
4. Emergency contact direction — point users to: City DRRMO Olongapo, PNP (117), BFP, Red Cross, and James Gordon Hospital.
5. Bilingual preparedness guides for typhoon, flood, earthquake.
6. Community hazard reporting — encourage users to report hazards in the app.

RULES
- Be concise: 2–5 short paragraphs or a tight bullet list.
- For life-threatening situations, ALWAYS tell the user to dial 911 / 117 first.
- Never invent specific evacuation center capacities.
- If asked something outside disaster/safety scope, politely steer back.
- Do not provide medical diagnoses.
- Use Philippine units (kph, mm of rain, °C) and local terms (bagyo, baha, lindol, go-bag).`

// Tried in order. If one fails (bad key, quota, retired model), the next one is used.
// To change models later, only edit this list.
const MODELS = [
  { label: "gemini-2.5-flash-lite", model: () => google("gemini-2.5-flash-lite") },
  { label: "gemini-3.5-flash-lite", model: () => google("gemini-3.5-flash-lite") },
  { label: "grok-4.3", model: () => xai("grok-4.3") },
]

export async function POST(req: Request) {
  let messages: UIMessage[]
  try {
    const body = await req.json()
    messages = body.messages
  } catch {
    return new Response("Invalid request", { status: 400 })
  }

  const modelMessages = await convertToModelMessages(messages)

  let text: string | null = null
  for (const { label, model } of MODELS) {
    try {
      const result = await generateText({
        model: model(),
        system: SYSTEM_PROMPT,
        messages: modelMessages,
        maxOutputTokens: 800,
      })
      if (result.text.trim()) {
        text = result.text
        break
      }
    } catch (err: any) {
      // Shows up in Vercel > Deployment > Logs, so you can see exactly which model failed and why
      console.error(`[KlimaBot] ${label} failed:`, err?.message ?? err)
    }
  }

  if (!text) {
    return new Response(
      JSON.stringify({ error: "KlimaBot is taking a quick break. Please try again." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    )
  }

  const id = crypto.randomUUID()
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({ type: "text-start", id })
      writer.write({ type: "text-delta", id, delta: text! })
      writer.write({ type: "text-end", id })
    },
  })
  return createUIMessageStreamResponse({ stream })
}