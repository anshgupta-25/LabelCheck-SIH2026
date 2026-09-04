/**
 * OCR / text-extraction server function.
 *
 * The image never touches the browser's network beyond this same-origin call:
 * the model credential lives server-side only. We use a vision-capable model
 * through the Lovable AI Gateway instead of a classic OCR API because packaging
 * text is curved, glossy and multi-script — a vision model transcribes Devanagari
 * and Latin script in a single pass and copes with glare far better.
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

export const extractLabelText = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      throw new Error("Text extraction is not configured on this deployment.");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
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
      console.error(`[LabelCheck OCR] gateway ${response.status}: ${body}`);
      if (response.status === 429) {
        throw new Error("Too many scans right now — please wait a few seconds and try again.");
      }
      if (response.status === 402) {
        throw new Error("AI credits are exhausted for this workspace. Add credits to keep scanning.");
      }
      throw new Error(`Text extraction failed (${response.status}). Please retry with a clearer photo.`);
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = payload.choices?.[0]?.message?.content?.trim() ?? "";

    return { text };
  });
