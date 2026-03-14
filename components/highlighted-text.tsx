"use client";

export function HighlightedText({
  text,
  words,
}: {
  text: string;
  words: string[];
}) {
  if (words.length === 0) return <>{text}</>;

  const pattern = words
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length)
    .join("|");
  const regex = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = words.some(
          (w) => part.toLowerCase() === w.toLowerCase(),
        );
        return isMatch ? (
          <mark
            key={i}
            className="bg-yellow-200 dark:bg-yellow-700/60 rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}
