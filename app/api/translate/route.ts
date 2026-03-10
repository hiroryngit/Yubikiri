import { NextRequest, NextResponse } from "next/server";
import { translateAgreement } from "@/lib/ai-translate";
import { locales, type Locale } from "@/i18n/config";

export async function POST(req: NextRequest) {
  try {
    const { title, content, targetLocale } = await req.json();

    if (!title || !content || !targetLocale) {
      return NextResponse.json(
        { error: "title, content, and targetLocale are required" },
        { status: 400 },
      );
    }

    if (!locales.includes(targetLocale as Locale)) {
      return NextResponse.json(
        { error: "Invalid locale" },
        { status: 400 },
      );
    }

    const result = await translateAgreement(
      title,
      content,
      targetLocale as Locale,
    );

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Translation failed";
    console.error("Translation error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
