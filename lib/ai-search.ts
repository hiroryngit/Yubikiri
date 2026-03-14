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
      model: "llama-3.1-8b-instant",
    });
  }
  if (process.env.CEREBRAS_API_KEY) {
    providers.push({
      name: "cerebras",
      baseUrl: "https://api.cerebras.ai/v1/chat/completions",
      apiKey: process.env.CEREBRAS_API_KEY,
      model: "llama3.1-8b",
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

export type SearchMatch = {
  id: string;
  matchedWords: string[];
};

async function callProvider(
  provider: Provider,
  query: string,
  items: { id: string; title: string; content: string }[],
): Promise<SearchMatch[]> {
  const summaries = items.map(
    (item) => `[${item.id}] ${item.title}: ${item.content.slice(0, 200)}`,
  );

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
          content: `You are a search engine. Given a search query and a list of documents, find documents that are semantically relevant to the query. Consider synonyms, related concepts, and similar meanings across languages.

For each matching document, identify the specific words/phrases in the document that are semantically similar or related to the search query. These are the words that justify why the document matched.

Output ONLY valid JSON array. Each element: {"id": "document_id", "matchedWords": ["word1", "word2"]}
If no documents match, output an empty array: []
Do not add any explanation or markdown formatting.`,
        },
        {
          role: "user",
          content: `Search query: "${query}"\n\nDocuments:\n${summaries.join("\n")}`,
        },
      ],
      temperature: 0,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${provider.name}: ${res.status} ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error(`${provider.name}: empty response`);

  let jsonStr = raw;
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1].trim();

  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed)) throw new Error(`${provider.name}: not array`);

  return parsed.filter(
    (m: unknown): m is SearchMatch =>
      typeof m === "object" &&
      m !== null &&
      "id" in m &&
      "matchedWords" in m &&
      Array.isArray((m as SearchMatch).matchedWords),
  );
}

export async function aiSearch(
  query: string,
  items: { id: string; title: string; content: string }[],
): Promise<SearchMatch[]> {
  const providers = getProviders();
  if (providers.length === 0) {
    return [];
  }

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      return await callProvider(provider, query, items);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(msg);
      console.warn(`Search failed with ${provider.name}: ${msg}`);
    }
  }

  console.error(`All search providers failed: ${errors.join("; ")}`);
  return [];
}
