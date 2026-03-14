import { NextRequest, NextResponse } from "next/server";
import { aiSearch } from "@/lib/ai-search";

export async function POST(req: NextRequest) {
  try {
    const { query, items } = await req.json();

    if (!query || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "query and items are required" },
        { status: 400 },
      );
    }

    const results = await aiSearch(query, items);
    return NextResponse.json({ results });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed";
    console.error("Search error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
