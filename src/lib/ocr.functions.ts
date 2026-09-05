/**
 * OCR / text-extraction server function.
 *
 * Runs on the server so the model key never reaches the browser. We use a
 * vision-capable model instead of a classic OCR API because packaging text is
 * curved, glossy and multi-script — a vision model transcribes Devanagari and
 * Latin script in a single pass and copes with glare far better.
 *
 * Provider: Google Gemini through its OpenAI-compatible endpoint by default.
 * Any other OpenAI-compatible chat-completions API (OpenAI, OpenRouter, Groq…)
 * works by setting OCR_API_KEY, OCR_API_URL and OCR_MODEL — see .env.example.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  /** data:image/...;base64,... */
  imageDataUrl: z.string().min(32),
  language: z.enum(["eng", "hin"]).default("eng"),
});

const PROMPT: Record<string, string> = {
  eng: `You are an OCR engine for Indian packaged-product labels.
Transcribe EVERY piece of text visible on this label, exactly as printed, preserving line breaks and the original order.
Keep numbers, units, currency symbols (₹), dates and punctuation exactly as printed. Do not translate. Do not summarise.
Do not add commentary, headings or explanations. Output the raw transcription only.`,
  hin: `You are an OCR engine for Indian packaged-product labels.
Transcribe EVERY piece of text visible on this label exactly as printed, preserving line breaks and order.
The label may contain Hindi (Devanagari) and English text — transcribe both in their original script, do NOT translate.
Keep numbers, units, currency symbols (₹), dates and punctuation exactly as printed.
Output the raw transcription only, with no commentary.`,
};

const DEFAULT_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const DEFAULT_MODEL = "gemini-2.5-flash";

export const extractLabelText = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    // Read inside the handler so the value is taken from the running server's env.
    const apiKey = process.env["OCR_API_KEY"] || process.env["GEMINI_API_KEY"];
    if (!apiKey) {
      throw new Error("Text extraction is not configured: set OCR_API_KEY on the server.");
    }
    const apiUrl = process.env["OCR_API_URL"] || DEFAULT_API_URL;
    const model = process.env["OCR_MODEL"] || DEFAULT_MODEL;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT[data.language] ?? PROMPT["eng"] },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[LabelCheck OCR] ${model} @ ${apiUrl} → ${response.status}: ${body}`);
      if (response.status === 429) {
        throw new Error("Too many scans right now — please wait a few seconds and try again.");
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error("The OCR API key was rejected. Check OCR_API_KEY on the server.");
      }
      throw new Error(
        `Text extraction failed (${response.status}). Please retry with a clearer photo.`,
      );
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = payload.choices?.[0]?.message?.content?.trim() ?? "";

    return { text };
  });
