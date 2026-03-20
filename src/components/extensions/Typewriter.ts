import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export interface TypewriterOptions {
  enabled: boolean;
}

export const Typewriter = Extension.create<TypewriterOptions>({
  name: "typewriter",

  addOptions() {
    return {
      enabled: false,
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("typewriter"),
        view: () => ({
          update: (view, prevState) => {
            if (!this.options.enabled) return;

            // Only scroll if the selection has actually changed
            if (
              prevState.doc.eq(view.state.doc) &&
              prevState.selection.eq(view.state.selection)
            ) {
              return;
            }

            // Get coordinates of the current cursor position
            const head = view.state.selection.head;

            try {
              const coords = view.coordsAtPos(head);
              const container =
                (view.dom.closest(".overflow-y-auto") as HTMLElement) ||
                view.dom.parentElement;

              if (container) {
                const containerRect = container.getBoundingClientRect();

                // Calculate the offset needed to put the cursor in the middle of the container
                const offset =
                  coords.top - containerRect.top - containerRect.height / 2;

                // Smooth scroll to the offset
                container.scrollBy({
                  top: offset,
                  behavior: "smooth",
                });
              }
            } catch (e) {
              // Ignore errors if coordsAtPos fails (e.g. node not yet rendered)
            }
          },
        }),
      }),
    ];
  },
});
