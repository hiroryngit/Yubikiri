"use client";

import { sanitizeHtml } from "@/lib/sanitize";

type Props = {
  html: string;
  className?: string;
};

export function RichTextContent({ html, className }: Props) {
  const isHtml = /<[a-z][\s\S]*>/i.test(html);

  if (!isHtml) {
    return <p className={`whitespace-pre-wrap ${className ?? ""}`}>{html}</p>;
  }

  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
