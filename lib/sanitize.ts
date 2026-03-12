import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "s", "del",
  "h1", "h2", "h3",
  "ul", "ol", "li",
  "blockquote", "a",
  "span", "mark",
];

const ALLOWED_ATTR = ["href", "target", "rel", "style", "class", "data-color"];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}
