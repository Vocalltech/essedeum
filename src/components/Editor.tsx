import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import { useEffect, useRef, useCallback, useState } from "react";
import { Save, AlignCenterVertical, Ghost, Wand2, Loader2 } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Typewriter } from "./extensions/Typewriter";
import { GhostNote } from "./extensions/GhostNote"; // updated to .tsx
import tippy, { Instance as TippyInstance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import { MentionList, MentionListRef, MentionItem } from "./MentionList";
import { Lore } from "../lib/db";

//TODO: Implement the AI Wand well

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  loreEntries?: Lore[];
  apiKey?: string;
}

export function Editor({
  content,
  onChange,
  placeholder = "Start writing your story...",
  loreEntries = [],
  apiKey,
}: EditorProps) {
  const [typewriterMode, setTypewriterMode] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiSelection, setAiSelection] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const [originalText, setOriginalText] = useState("");
  const [suggestedText, setSuggestedText] = useState("");
  const aiRequestIdRef = useRef<number>(0);

  // Add state to track if there is an active selection for the button visibility
  const [hasSelection, setHasSelection] = useState(false);
  const [isGhostNote, setIsGhostNote] = useState(false);
  const [isAiMenuExpanded, setIsAiMenuExpanded] = useState(false);

  // Keep state accessible to Tiptap callbacks that might have stale closures
  const aiStateRef = useRef({
    isAiProcessing: false,
    suggestedText: "",
    isAiMenuExpanded: false,
  });

  useEffect(() => {
    aiStateRef.current = { isAiProcessing, suggestedText, isAiMenuExpanded };
  }, [isAiProcessing, suggestedText, isAiMenuExpanded]);

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
    onSelectionUpdate: ({ editor }) => {
      setHasSelection(!editor.state.selection.empty);
      setIsGhostNote(editor.isActive("ghostNote"));
      if (
        editor.isFocused &&
        !aiStateRef.current?.isAiProcessing &&
        !aiStateRef.current?.suggestedText
      ) {
        setIsAiMenuExpanded(false);
      }
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

  const handleCancelAi = () => {
    aiRequestIdRef.current = 0; // abort any pending
    setIsAiProcessing(false);
    setIsAiMenuExpanded(false);
    setAiPrompt("");
    setAiSelection(null);
    setOriginalText("");
    setSuggestedText("");
    editor?.commands.focus();
  };

  const handleAcceptAi = () => {
    if (editor && aiSelection && suggestedText) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from: aiSelection.from, to: aiSelection.to })
        .insertContent(suggestedText)
        .run();
    }
    handleCancelAi();
  };

  const handleAiAction = async (action: string, customPrompt?: string) => {
    if (!editor || !apiKey) {
      if (!apiKey) alert("Please set your API key in the AI Chat Panel first.");
      return;
    }

    const { from, to } = editor.state.selection;
    const selectionFrom = from !== to ? from : aiSelection?.from;
    const selectionTo = from !== to ? to : aiSelection?.to;

    if (
      selectionFrom === undefined ||
      selectionTo === undefined ||
      selectionFrom === selectionTo
    ) {
      return;
    }

    const selectedText = editor.state.doc.textBetween(
      selectionFrom,
      selectionTo,
      " ",
    );

    const requestId = Date.now();
    aiRequestIdRef.current = requestId;

    setIsAiProcessing(true);
    setAiSelection({ from: selectionFrom, to: selectionTo });
    setOriginalText(selectedText);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      let prompt = "";
      if (action === "custom" && customPrompt) {
        prompt = `Rewrite the following text according to these instructions: "${customPrompt}". Do not add any extra commentary or markdown formatting, just return the revised text:\n\n${selectedText}`;
      } else {
        switch (action) {
          case "shorter":
            prompt = `Make the following text shorter and more concise. Do not add any extra commentary or markdown formatting, just return the revised text:\n\n${selectedText}`;
            break;
          case "descriptive":
            prompt = `Make the following text more descriptive and vivid. Do not add any extra commentary or markdown formatting, just return the revised text:\n\n${selectedText}`;
            break;
          case "grammar":
            prompt = `Fix any grammar, spelling, or punctuation errors in the following text. Do not add any extra commentary or markdown formatting, just return the revised text:\n\n${selectedText}`;
            break;
          case "past_tense":
            prompt = `Rewrite the following text in the past tense. Do not add any extra commentary or markdown formatting, just return the revised text:\n\n${selectedText}`;
            break;
          default:
            return;
        }
      }

      const result = await model.generateContent(prompt);

      // If a new request was started or it was cancelled, ignore this result
      if (aiRequestIdRef.current !== requestId) return;

      const responseText = result.response.text().trim();

      if (responseText) {
        setSuggestedText(responseText);
      }
    } catch (err) {
      if (aiRequestIdRef.current !== requestId) return;
      console.error("AI Edit error:", err);
      alert(err instanceof Error ? err.message : "Failed to generate text");
      handleCancelAi();
    } finally {
      if (aiRequestIdRef.current === requestId) {
        setIsAiProcessing(false);
      }
    }
  };

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
      {editor && (
        <BubbleMenu
          editor={editor}
          options={{
            placement: "top-start",
          }}
          className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 shadow-xl rounded-lg overflow-hidden z-50"
          shouldShow={({ editor, from, to }: any) => {
            const state = aiStateRef.current;
            if (
              state?.isAiProcessing ||
              state?.suggestedText ||
              state?.isAiMenuExpanded
            )
              return true;
            return from !== to && !editor.isActive("ghostNote");
          }}
        >
          {isAiProcessing ? (
            <div className="flex flex-col gap-2 p-3 min-w-[200px]">
              <div className="flex items-center gap-2 text-sm text-indigo-400 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Processing...
              </div>
              {originalText && (
                <p className="text-xs text-zinc-500 truncate max-w-[250px] italic">
                  "{originalText}"
                </p>
              )}
            </div>
          ) : suggestedText ? (
            <div className="flex flex-col gap-2 p-2 w-80 max-h-[400px] overflow-y-auto">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span className="flex items-center gap-1 font-medium text-indigo-400">
                  <Wand2 className="w-3.5 h-3.5" /> AI Suggestion
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleCancelAi}
                  className="hover:text-zinc-200"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <div className="bg-zinc-950/50 border border-zinc-800/50 rounded p-2">
                  <div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">
                    Original
                  </div>
                  <p className="text-xs text-zinc-400 line-through decoration-red-500/50">
                    {originalText}
                  </p>
                </div>
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded p-2">
                  <div className="text-[10px] text-indigo-400 uppercase font-semibold mb-1">
                    Suggested
                  </div>
                  <p className="text-xs text-zinc-200">{suggestedText}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleCancelAi}
                  className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleAcceptAi}
                  className="px-3 py-1.5 rounded text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                >
                  Accept & Replace
                </button>
              </div>
            </div>
          ) : isAiMenuExpanded ? (
            <div className="flex flex-col gap-2 p-2 w-72">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span className="flex items-center gap-1 font-medium text-indigo-400">
                  <Wand2 className="w-3.5 h-3.5" /> AI Magic Wand
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setIsAiMenuExpanded(false)}
                  className="hover:text-zinc-200"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAiAction("shorter")}
                  className="px-2 py-1.5 bg-zinc-800 hover:bg-indigo-500/20 text-zinc-300 hover:text-indigo-300 rounded text-xs transition-colors text-left"
                >
                  Make Shorter
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAiAction("descriptive")}
                  className="px-2 py-1.5 bg-zinc-800 hover:bg-indigo-500/20 text-zinc-300 hover:text-indigo-300 rounded text-xs transition-colors text-left"
                >
                  More Descriptive
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAiAction("grammar")}
                  className="px-2 py-1.5 bg-zinc-800 hover:bg-indigo-500/20 text-zinc-300 hover:text-indigo-300 rounded text-xs transition-colors text-left"
                >
                  Fix Grammar
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAiAction("past_tense")}
                  className="px-2 py-1.5 bg-zinc-800 hover:bg-indigo-500/20 text-zinc-300 hover:text-indigo-300 rounded text-xs transition-colors text-left"
                >
                  Past Tense
                </button>
              </div>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., Rewrite this in the style of Edgar Allan Poe..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 resize-none"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (aiPrompt.trim()) {
                      handleAiAction("custom", aiPrompt);
                    }
                  }
                }}
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-zinc-500">
                  Press Enter to submit
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (aiPrompt.trim()) {
                      handleAiAction("custom", aiPrompt);
                    }
                  }}
                  disabled={!aiPrompt.trim()}
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-medium transition-colors disabled:opacity-50"
                >
                  Generate
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setIsAiMenuExpanded(true);
                setAiSelection({
                  from: editor.state.selection.from,
                  to: editor.state.selection.to,
                });
              }}
              className="px-2 py-1.5 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 rounded text-sm transition-colors flex items-center gap-1.5 font-medium"
              title="AI Magic Wand"
            >
              <Wand2 className="w-3.5 h-3.5" />
              AI
            </button>
          )}
        </BubbleMenu>
      )}

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

      <div className="flex items-center justify-between px-8 py-3 border-b border-zinc-800 sticky top-0 bg-zinc-950/95 backdrop-blur-sm z-10 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
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
              if (isGhostNote) {
                setNoteText(editor.getAttributes("ghostNote").comment || "");
                setShowNoteModal(true);
              } else if (hasSelection) {
                setNoteText("");
                setShowNoteModal(true);
              }
            }}
            className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1.5 ${
              isGhostNote
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
