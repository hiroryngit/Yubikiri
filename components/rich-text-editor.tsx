"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Quote,
  Undo,
  Redo,
  Palette,
  Highlighter,
} from "lucide-react";
import { useRef, useState } from "react";

type Props = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-muted transition-colors ${
        active ? "bg-muted text-foreground" : "text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="w-px h-5 bg-border mx-0.5 shrink-0" />;
}

// --- カラーパレット ---
const TEXT_COLORS = [
  // Row 1: Darks
  { label: "Black", value: "#000000" },
  { label: "Dark Gray", value: "#374151" },
  { label: "Gray", value: "#6b7280" },
  { label: "Light Gray", value: "#9ca3af" },
  { label: "Silver", value: "#d1d5db" },
  { label: "White", value: "#ffffff" },
  // Row 2: Vivid
  { label: "Red", value: "#dc2626" },
  { label: "Orange", value: "#ea580c" },
  { label: "Amber", value: "#d97706" },
  { label: "Yellow", value: "#ca8a04" },
  { label: "Lime", value: "#65a30d" },
  { label: "Green", value: "#16a34a" },
  // Row 3: Cool + Warm
  { label: "Teal", value: "#0d9488" },
  { label: "Cyan", value: "#0891b2" },
  { label: "Blue", value: "#2563eb" },
  { label: "Indigo", value: "#4f46e5" },
  { label: "Purple", value: "#9333ea" },
  { label: "Pink", value: "#db2777" },
  // Row 4: Dark variants
  { label: "Dark Red", value: "#991b1b" },
  { label: "Dark Orange", value: "#9a3412" },
  { label: "Dark Green", value: "#166534" },
  { label: "Dark Blue", value: "#1e3a8a" },
  { label: "Dark Purple", value: "#581c87" },
  { label: "Rose", value: "#be185d" },
];

const HIGHLIGHT_COLORS = [
  { label: "Yellow", value: "#fef08a" },
  { label: "Lime", value: "#d9f99d" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Cyan", value: "#a5f3fc" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Purple", value: "#e9d5ff" },
  { label: "Pink", value: "#fbcfe8" },
  { label: "Rose", value: "#fecdd3" },
  { label: "Orange", value: "#fed7aa" },
  { label: "Warm Gray", value: "#e7e5e4" },
];

const FONTS = [
  { label: "Default", value: "", family: "" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif", family: "Arial, sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif", family: "Verdana, sans-serif" },
  { label: "Trebuchet MS", value: "Trebuchet MS, sans-serif", family: "'Trebuchet MS', sans-serif" },
  { label: "Georgia", value: "Georgia, serif", family: "Georgia, serif" },
  { label: "Times New Roman", value: "Times New Roman, serif", family: "'Times New Roman', serif" },
  { label: "Palatino", value: "Palatino Linotype, Palatino, serif", family: "'Palatino Linotype', serif" },
  { label: "Courier New", value: "Courier New, monospace", family: "'Courier New', monospace" },
  { label: "Lucida Console", value: "Lucida Console, monospace", family: "'Lucida Console', monospace" },
  { label: "Comic Sans MS", value: "Comic Sans MS, cursive", family: "'Comic Sans MS', cursive" },
  { label: "Impact", value: "Impact, sans-serif", family: "Impact, sans-serif" },
];

function ColorPicker({
  colors,
  currentColor,
  onSelect,
  onClear,
  icon,
  title,
}: {
  colors: { label: string; value: string }[];
  currentColor: string;
  onSelect: (color: string) => void;
  onClear: () => void;
  icon: React.ReactNode;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="relative" ref={ref}>
      <ToolbarButton
        onClick={() => setOpen(!open)}
        active={!!currentColor}
        title={title}
      >
        {icon}
      </ToolbarButton>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg p-2">
            <div className="grid grid-cols-6 gap-1 mb-1.5">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  className={`w-6 h-6 rounded-sm border transition-all hover:scale-110 ${
                    currentColor === c.value ? "ring-2 ring-ring ring-offset-1" : "border-border/50"
                  }`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => {
                    onSelect(c.value);
                    setOpen(false);
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              className="w-full text-xs text-muted-foreground hover:text-foreground py-1 border-t border-border"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
            >
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function RichTextEditor({ content, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      TextStyle,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[140px] px-3 py-2.5 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const iconSize = "h-4 w-4";

  function setLink() {
    const previousUrl = editor!.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  const currentTextColor = editor.getAttributes("textStyle").color || "";
  const currentHighlight = editor.getAttributes("highlight").color || "";

  return (
    <div className="rounded-md border border-input shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-input bg-muted/30">
        {/* Text style */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <Bold className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <Italic className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline"
        >
          <UnderlineIcon className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough"
        >
          <Strikethrough className={iconSize} />
        </ToolbarButton>

        <Separator />

        {/* Color & Highlight */}
        <ColorPicker
          colors={TEXT_COLORS}
          currentColor={currentTextColor}
          onSelect={(color) => editor.chain().focus().setColor(color).run()}
          onClear={() => editor.chain().focus().unsetColor().run()}
          icon={
            <div className="relative">
              <Palette className={iconSize} />
              {currentTextColor && (
                <div
                  className="absolute -bottom-0.5 left-0 right-0 h-1 rounded"
                  style={{ backgroundColor: currentTextColor }}
                />
              )}
            </div>
          }
          title="Text Color"
        />
        <ColorPicker
          colors={HIGHLIGHT_COLORS}
          currentColor={currentHighlight}
          onSelect={(color) => editor.chain().focus().toggleHighlight({ color }).run()}
          onClear={() => editor.chain().focus().unsetHighlight().run()}
          icon={<Highlighter className={iconSize} />}
          title="Highlight"
        />

        <Separator />

        {/* Font */}
        <select
          value={editor.getAttributes("textStyle").fontFamily || ""}
          onChange={(e) => {
            const val = e.target.value;
            if (val) {
              editor.chain().focus().setFontFamily(val).run();
            } else {
              editor.chain().focus().unsetFontFamily().run();
            }
          }}
          className="h-7 text-xs bg-background border border-input rounded px-1.5 text-foreground cursor-pointer max-w-[120px]"
          title="Font"
        >
          {FONTS.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.family || undefined }}>
              {f.label}
            </option>
          ))}
        </select>

        <Separator />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className={iconSize} />
        </ToolbarButton>

        <Separator />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Ordered List"
        >
          <ListOrdered className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Blockquote"
        >
          <Quote className={iconSize} />
        </ToolbarButton>

        <Separator />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="Align Left"
        >
          <AlignLeft className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="Align Center"
        >
          <AlignCenter className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="Align Right"
        >
          <AlignRight className={iconSize} />
        </ToolbarButton>

        <Separator />

        {/* Link */}
        <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Link">
          <LinkIcon className={iconSize} />
        </ToolbarButton>

        <Separator />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <Undo className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <Redo className={iconSize} />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
