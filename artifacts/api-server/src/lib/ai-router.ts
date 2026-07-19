import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "./logger";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIResponse {
  message: string;
  provider: string;
}

interface Provider {
  name: string;
  chat: (messages: ChatMessage[], systemPrompt?: string) => Promise<string>;
}

function buildGroqProvider(): Provider {
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) throw new Error("GROQ_API_KEY not set");
  const client = new Groq({ apiKey });
  return {
    name: "groq",
    chat: async (messages, systemPrompt) => {
      const groqMessages: Groq.Chat.ChatCompletionMessageParam[] = systemPrompt
        ? [{ role: "system", content: systemPrompt }, ...messages]
        : messages;
      const res = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        max_tokens: 2048,
      });
      return res.choices[0]?.message?.content ?? "";
    },
  };
}

function buildGeminiProvider(): Provider {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  const genAI = new GoogleGenerativeAI(apiKey);
  return {
    name: "gemini",
    chat: async (messages, systemPrompt) => {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
      });
      const history = messages.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      const lastMsg = messages[messages.length - 1];
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastMsg?.content ?? "");
      return result.response.text();
    },
  };
}

function buildCerebrasProvider(): Provider {
  const apiKey = process.env["CEREBRAS_API_KEY"];
  if (!apiKey) throw new Error("CEREBRAS_API_KEY not set");
  return {
    name: "cerebras",
    chat: async (messages, systemPrompt) => {
      const body = {
        model: "llama-3.3-70b",
        messages: systemPrompt
          ? [{ role: "system", content: systemPrompt }, ...messages]
          : messages,
        max_tokens: 2048,
      };
      const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`Cerebras error: ${res.status}`);
      }
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return data.choices?.[0]?.message?.content ?? "";
    },
  };
}

let providers: Provider[] | null = null;

function getProviders(): Provider[] {
  if (providers) return providers;
  const list: Provider[] = [];
  try {
    list.push(buildGroqProvider());
  } catch (e) {
    logger.warn({ err: e }, "Groq provider unavailable");
  }
  try {
    list.push(buildGeminiProvider());
  } catch (e) {
    logger.warn({ err: e }, "Gemini provider unavailable");
  }
  try {
    list.push(buildCerebrasProvider());
  } catch (e) {
    logger.warn({ err: e }, "Cerebras provider unavailable");
  }
  providers = list;
  return list;
}

export async function aiChat(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<AIResponse> {
  const providerList = getProviders();
  if (providerList.length === 0) {
    throw new Error("No AI providers configured");
  }
  for (const provider of providerList) {
    try {
      const message = await provider.chat(messages, systemPrompt);
      return { message, provider: provider.name };
    } catch (err) {
      logger.warn({ err, provider: provider.name }, "AI provider failed, trying next");
    }
  }
  throw new Error("All AI providers failed");
}

export interface ProcessedItem {
  type: "list" | "table" | "calculation" | "business_record" | "note";
  title: string;
  structuredData: Record<string, unknown>;
  total: number | null;
  provider: string;
}

export async function processNaturalLanguage(text: string, profileContext?: string): Promise<ProcessedItem> {
  const systemPrompt = [
    "You are Hearth's AI engine. Your job is to classify and structure natural language input.",
    profileContext ? `User context: ${profileContext}` : "",
    "",
    "Respond ONLY with a valid JSON object matching this schema exactly:",
    '{',
    '  "type": "list" | "table" | "calculation" | "business_record" | "note",',
    '  "title": "short descriptive title",',
    '  "structuredData": { ... depends on type ... },',
    '  "total": number | null',
    '}',
    "",
    "Rules:",
    "- type=list: structuredData has { items: string[] }",
    "- type=table: structuredData has { headers: string[], rows: (string|number)[][] }",
    "- type=calculation: structuredData has { expression: string, result: number }, total=result",
    "- type=business_record: structuredData has { fields: { key: string, value: string }[] }",
    "- type=note: structuredData has { content: string }",
    "- For tables with prices/amounts, set total to the sum",
    "- Detect Hindi and English — handle both",
    "- Return ONLY valid JSON, no markdown, no explanation",
  ].filter(Boolean).join("\n");

  const response = await aiChat([{ role: "user", content: text }], systemPrompt);

  try {
    const cleaned = response.message.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned) as {
      type: ProcessedItem["type"];
      title: string;
      structuredData: Record<string, unknown>;
      total: number | null;
    };
    return { ...parsed, provider: response.provider };
  } catch {
    logger.warn({ raw: response.message }, "Failed to parse AI JSON, returning note");
    return {
      type: "note",
      title: text.slice(0, 60),
      structuredData: { content: text },
      total: null,
      provider: response.provider,
    };
  }
}

export async function parseProfileText(rawText: string): Promise<{
  role: string;
  useCases: string[];
  tone: string;
}> {
  const systemPrompt = [
    "You are Hearth's profile parser.",
    "Parse the user's self-description into a structured profile.",
    "Respond ONLY with valid JSON:",
    '{ "role": "short role title", "useCases": ["use case 1", "use case 2"], "tone": "professional|casual|academic|home" }',
    "- role: 1-4 words (e.g. 'Business Owner', 'College Student', 'Home Manager')",
    "- useCases: 2-4 primary use cases based on what they described",
    "- tone: pick the best fit from the options",
    "Return ONLY valid JSON.",
  ].join("\n");

  const response = await aiChat([{ role: "user", content: rawText }], systemPrompt);
  try {
    const cleaned = response.message.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned) as { role: string; useCases: string[]; tone: string };
  } catch {
    return { role: "User", useCases: ["general"], tone: "casual" };
  }
}

export async function generateLinkSummary(url: string, label: string): Promise<string> {
  const response = await aiChat(
    [{ role: "user", content: `Generate a one-sentence summary for this business link:\nURL: ${url}\nLabel: ${label}` }],
    "You summarize business links in one concise sentence. Return only the sentence, no extra text."
  );
  return response.message.trim();
}
