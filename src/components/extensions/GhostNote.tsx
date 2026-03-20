import { Mark, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    ghostNote: {
      setGhostNote: (attributes?: { comment: string }) => ReturnType;
      toggleGhostNote: (attributes?: { comment: string }) => ReturnType;
      unsetGhostNote: () => ReturnType;
    };
  }
}

export const GhostNote = Mark.create({
  name: "ghostNote",

  inclusive: false,

  addAttributes() {
    return {
      comment: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-comment"),
        renderHTML: (attributes) => {
          if (!attributes.comment) {
            return {};
          }
          return {
            "data-comment": attributes.comment,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="ghost-note"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-type": "ghost-note",
        class:
          "bg-amber-500/30 text-amber-200 border-b-2 border-dashed border-amber-500/70 rounded-sm px-1 cursor-pointer transition-colors hover:bg-amber-500/50",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setGhostNote:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      toggleGhostNote:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
      unsetGhostNote:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-g": () => this.editor.commands.toggleGhostNote(),
    };
  },
});
