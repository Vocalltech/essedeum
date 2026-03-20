import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import { useEffect, useRef, useCallback, useState } from "react";
import { Save, AlignCenterVertical, Ghost } from "lucide-react";
import { Typewriter } from "./extensions/Typewriter";
import { GhostNote } from "./extensions/GhostNote"; // updated to .tsx
import tippy, { Instance as TippyInstance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import { MentionList, MentionListRef, MentionItem } from "./MentionList";
import { Lore } from "../lib/db";

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  loreEntries?: Lore[];
}

export function Editor({
  content,
  onChange,
  placeholder = "Start writing your story...",
  loreEntries = [],
}: EditorProps) {
  const [typewriterMode, setTypewriterMode] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loreEntriesRef = useRef<Lore[]>(loreEntries);

  // Keep ref updated with latest lore entries
  useEffect(() => {
    loreEntriesRef.current = loreEntries;
  }, [loreEntries]);

  const getSuggestionItems = useCallback(
    ({ query }: { query: string }): MentionItem[] => {
      const items = loreEntriesRef.current
        .filter((item) =>
          item.title.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 10)
        .map((item) => ({
          id: item.id!,
          title: item.title,
          type: item.type,
        }));
      return items;
    },
    [],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typewriter.configure({
        enabled: typewriterMode,
      }),
      GhostNote,
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        renderHTML({ options, node }) {
          return [
            "span",
            {
              ...options.HTMLAttributes,
              "data-type": node.attrs.type || "Character",
              "data-id": node.attrs.id,
            },
            `@${node.attrs.label}`,
          ];
        },
        suggestion: {
          items: getSuggestionItems,
          render: () => {
            let component: ReactRenderer<MentionListRef> | null = null;
            let popup: TippyInstance[] | null = null;

            return {
              onStart: (props) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }

                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                  theme: "dark",
                });
              },

              onUpdate(props) {
                component?.updateProps(props);

                if (!props.clientRect) {
                  return;
                }

                popup?.[0]?.setProps({
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                });
              },

              onKeyDown(props) {
                if (props.event.key === "Escape") {
                  popup?.[0]?.hide();
                  return true;
                }

                return component?.ref?.onKeyDown(props) || false;
              },

              onExit() {
                popup?.[0]?.destroy();
                component?.destroy();
              },
            };
          },
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-zinc max-w-none focus:outline-none min-h-full px-8 py-6",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce save for 2 seconds
      saveTimeoutRef.current = setTimeout(() => {
        console.log("Saving...");
      }, 2000);
    },
  });

  // Update editor content when prop changes (e.g., switching chapters)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Update typewriter mode option
  useEffect(() => {
    if (editor) {
      const extension = editor.extensionManager.extensions.find(
        (e) => e.name === "typewriter",
      );
      if (extension) {
        extension.options.enabled = typewriterMode;
      }
    }
  }, [typewriterMode, editor]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!editor) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto bg-zinc-950">
      <style>{`
        .mention {
          background-color: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
          border-radius: 0.25rem;
          padding: 0.125rem 0.375rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.15s;
        }
        .mention:hover {
          background-color: rgba(59, 130, 246, 0.3);
        }
        .mention[data-type="Character"] {
          background-color: rgba(244, 63, 94, 0.2);
          color: #fb7185;
        }
        .mention[data-type="Character"]:hover {
          background-color: rgba(244, 63, 94, 0.3);
        }
        .mention[data-type="Location"] {
          background-color: rgba(34, 197, 94, 0.2);
          color: #4ade80;
        }
        .mention[data-type="Location"]:hover {
          background-color: rgba(34, 197, 94, 0.3);
        }
        .mention[data-type="Item"] {
          background-color: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
        }
        .mention[data-type="Item"]:hover {
          background-color: rgba(245, 158, 11, 0.3);
        }
        .mention[data-type="Event"] {
          background-color: rgba(168, 85, 247, 0.2);
          color: #c084fc;
        }
        .mention[data-type="Event"]:hover {
          background-color: rgba(168, 85, 247, 0.3);
        }
        .mention[data-type="Concept"] {
          background-color: rgba(6, 182, 212, 0.2);
          color: #22d3ee;
        }
        .mention[data-type="Concept"]:hover {
          background-color: rgba(6, 182, 212, 0.3);
        }
        .tippy-box[data-theme~='dark'] {
          background-color: transparent;
          border: none;
          box-shadow: none;
        }
        .tippy-box[data-theme~='dark'] > .tippy-content {
          padding: 0;
        }
      `}</style>
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 w-full max-w-sm shadow-xl">
            <h3 className="text-sm font-medium text-zinc-200 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Ghost className="w-4 h-4 text-amber-500" />
                Edit Ghost Note
              </span>
              <button
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .extendMarkRange("ghostNote")
                    .unsetGhostNote()
                    .run();
                  setShowNoteModal(false);
                }}
                className="text-zinc-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-zinc-800 text-xs"
              >
                Delete Note
              </button>
            </h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-zinc-300 focus:outline-none focus:border-amber-500/50 resize-none mb-3"
              placeholder="Write a note about this text..."
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteText("");
                  editor.commands.focus();
                }}
                className="px-3 py-1.5 rounded text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .extendMarkRange("ghostNote")
                    .setGhostNote({ comment: noteText })
                    .run();
                  setShowNoteModal(false);
                  setNoteText("");
                }}
                className="px-3 py-1.5 rounded text-sm bg-amber-600/20 text-amber-500 hover:bg-amber-600/30 font-medium transition-colors"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-8 py-3 border-b border-zinc-800 sticky top-0 bg-zinc-950/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTypewriterMode(!typewriterMode)}
            className={`p-1.5 rounded transition-colors ${
              typewriterMode
                ? "bg-zinc-700 text-zinc-100"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
            }`}
            title="Toggle Typewriter Mode"
          >
            <AlignCenterVertical className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-zinc-700" />
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              editor.isActive("bold")
                ? "bg-zinc-700 text-zinc-100"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
            }`}
          >
            Bold
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              editor.isActive("italic")
                ? "bg-zinc-700 text-zinc-100"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
            }`}
          >
            Italic
          </button>
          <div className="w-px h-6 bg-zinc-700" />
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`px-3 py-1 rounded text-sm transition-colors ${
              editor.isActive("heading", { level: 1 })
                ? "bg-zinc-700 text-zinc-100"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
            }`}
          >
            H1
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`px-3 py-1 rounded text-sm transition-colors ${
              editor.isActive("heading", { level: 2 })
                ? "bg-zinc-700 text-zinc-100"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
            }`}
          >
            H2
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={`px-3 py-1 rounded text-sm transition-colors ${
              editor.isActive("heading", { level: 3 })
                ? "bg-zinc-700 text-zinc-100"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
            }`}
          >
            H3
          </button>
          <div className="w-px h-6 bg-zinc-700" />
          <button
            onClick={() => {
              if (editor.isActive("ghostNote")) {
                setNoteText(editor.getAttributes("ghostNote").comment || "");
                setShowNoteModal(true);
              } else if (!editor.state.selection.empty) {
                setNoteText("");
                setShowNoteModal(true);
              }
            }}
            className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1.5 ${
              editor.isActive("ghostNote")
                ? "bg-amber-500/20 text-amber-400"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-amber-400"
            }`}
            title="Add Ghost Note (Mod+Shift+G)"
          >
            <Ghost className="w-3.5 h-3.5" />
            Note
          </button>
          <div className="w-px h-6 bg-zinc-700" />
          <span className="text-xs text-zinc-500">
            Type{" "}
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">
              @
            </kbd>{" "}
            to mention
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Save className="w-4 h-4" />
          <span>Auto-saving</span>
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
