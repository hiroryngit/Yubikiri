import { localeNames, type Locale } from "@/i18n/config";

type Provider = {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
};

function getProviders(): Provider[] {
  const providers: Provider[] = [];

  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: "groq",
      baseUrl: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile",
    });
  }
  if (process.env.CEREBRAS_API_KEY) {
    providers.push({
      name: "cerebras",
      baseUrl: "https://api.cerebras.ai/v1/chat/completions",
      apiKey: process.env.CEREBRAS_API_KEY,
      model: "llama-3.3-70b",
    });
  }
  if (process.env.SILICONFLOW_API_KEY) {
    providers.push({
      name: "siliconflow",
      baseUrl: "https://api.siliconflow.cn/v1/chat/completions",
      apiKey: process.env.SILICONFLOW_API_KEY,
      model: "Qwen/Qwen2.5-7B-Instruct",
    });
  }
  if (process.env.GITHUB_MODELS_API_KEY) {
    providers.push({
      name: "github-models",
      baseUrl: "https://models.inference.ai.azure.com/chat/completions",
      apiKey: process.env.GITHUB_MODELS_API_KEY,
      model: "gpt-4o-mini",
    });
  }

  return providers;
}

async function callProvider(
  provider: Provider,
  title: string,
  content: string,
  targetLocale: Locale,
): Promise<{ title: string; content: string }> {
  const langName = localeNames[targetLocale];

  const res = await fetch(provider.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        {
          role: "system",
          content: `You are a professional ${langName} language expert with deep understanding of cultural nuances and idiomatic expressions. You can grasp the subtle nuances behind any given text. Translate the following title and content into natural, fluent ${langName} (${targetLocale}), preserving the original tone, intent, and nuance as faithfully as possible. The translation should read as if it were originally written in ${langName} by a native speaker. Output ONLY valid JSON with "title" and "content" keys. Do not add any explanation, commentary, or markdown formatting.`,
        },
        {
          role: "user",
          content: JSON.stringify({ title, content }),
        },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${provider.name}: ${res.status} ${text.slice(0, 200)}`);
  }

  const text = await res.text();
  if (!text) throw new Error(`${provider.name}: empty response body`);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${provider.name}: invalid JSON response: ${text.slice(0, 200)}`);
  }

  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error(`${provider.name}: empty message content`);

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = raw;
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1].trim();

  const parsed = JSON.parse(jsonStr);
  if (!parsed.title || !parsed.content) {
    throw new Error(`${provider.name}: invalid JSON structure`);
  }

  return { title: parsed.title, content: parsed.content };
}

export async function translateAgreement(
  title: string,
  content: string,
  targetLocale: Locale,
): Promise<{ title: string; content: string }> {
  const providers = getProviders();
  if (providers.length === 0) {
    throw new Error("No AI providers configured");
  }

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      return await callProvider(provider, title, content, targetLocale);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(msg);
      console.warn(`Translation failed with ${provider.name}: ${msg}`);
    }
  }

  throw new Error(`All providers failed: ${errors.join("; ")}`);
}
