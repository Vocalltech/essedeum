import { useEffect, useState } from "react";
import { Command } from "cmdk";
import {
  Search,
  Book,
  List,
  Plus,
  Map,
  Sparkles,
  FolderOpen,
} from "lucide-react";
import { Chapter, Lore, Project } from "../lib/db";

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  chapters: Chapter[];
  loreEntries: Lore[];
  projects: Project[];
  onSelectChapter: (chapter: Chapter) => void;
  onSelectLore: (lore: Lore) => void;
  onSelectProject: (project: Project) => void;
  onCreateChapter: () => void;
  onCreateLore: () => void;
  onOpenProjectSelector: () => void;
  onNavigateTab: (tab: "wiki" | "map" | "ai") => void;
}

export function CommandPalette({
  open,
  setOpen,
  chapters,
  loreEntries,
  onSelectChapter,
  onSelectLore,
  onCreateChapter,
  onCreateLore,
  onOpenProjectSelector,
  onNavigateTab,
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    setSearch("");
    callback();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 bg-black/50 backdrop-blur-sm p-4">
      <div className="fixed inset-0" onClick={() => setOpen(false)} />

      <Command
        className="relative w-full max-w-2xl bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 overflow-hidden text-zinc-100 flex flex-col"
        shouldFilter={true}
      >
        <div className="flex items-center px-4 py-3 border-b border-zinc-800">
          <Search className="w-5 h-5 text-zinc-500 mr-3 shrink-0" />
          <Command.Input
            autoFocus
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-zinc-500"
            value={search}
            onValueChange={setSearch}
          />
          <div className="text-xs text-zinc-500 font-mono bg-zinc-800 px-2 py-1 rounded">
            esc
          </div>
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2 scroll-py-2 custom-scrollbar">
          <Command.Empty className="py-6 text-center text-sm text-zinc-500">
            No results found.
          </Command.Empty>

          <Command.Group
            heading="Actions"
            className="px-2 py-1.5 text-xs font-medium text-zinc-500 [&_[cmdk-group-items]]:mt-2"
          >
            <Command.Item
              onSelect={() => handleSelect(onCreateChapter)}
              className="flex items-center px-3 py-2 text-sm rounded-md aria-selected:bg-indigo-600/20 aria-selected:text-indigo-400 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4 mr-3" />
              Create New Chapter
            </Command.Item>
            <Command.Item
              onSelect={() => handleSelect(onCreateLore)}
              className="flex items-center px-3 py-2 text-sm rounded-md aria-selected:bg-indigo-600/20 aria-selected:text-indigo-400 cursor-pointer transition-colors mt-1"
            >
              <Plus className="w-4 h-4 mr-3" />
              Create New Lore Entry
            </Command.Item>
            <Command.Item
              onSelect={() => handleSelect(onOpenProjectSelector)}
              className="flex items-center px-3 py-2 text-sm rounded-md aria-selected:bg-zinc-800 cursor-pointer transition-colors mt-1"
            >
              <FolderOpen className="w-4 h-4 mr-3" />
              Switch Projects
            </Command.Item>
          </Command.Group>

          {chapters.length > 0 && (
            <Command.Group
              heading="Chapters"
              className="px-2 py-1.5 mt-2 text-xs font-medium text-zinc-500 border-t border-zinc-800 pt-4 [&_[cmdk-group-items]]:mt-2"
            >
              {chapters.map((chapter) => (
                <Command.Item
                  key={`chapter-${chapter.id}`}
                  onSelect={() => handleSelect(() => onSelectChapter(chapter))}
                  className="flex items-center px-3 py-2 text-sm rounded-md aria-selected:bg-zinc-800 cursor-pointer transition-colors mt-1"
                >
                  <Book className="w-4 h-4 mr-3 text-zinc-400" />
                  {chapter.title}
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {loreEntries.length > 0 && (
            <Command.Group
              heading="Wiki Entries"
              className="px-2 py-1.5 mt-2 text-xs font-medium text-zinc-500 border-t border-zinc-800 pt-4 [&_[cmdk-group-items]]:mt-2"
            >
              {loreEntries.map((lore) => (
                <Command.Item
                  key={`lore-${lore.id}`}
                  onSelect={() => handleSelect(() => onSelectLore(lore))}
                  className="flex flex-col px-3 py-2 text-sm rounded-md aria-selected:bg-zinc-800 cursor-pointer transition-colors mt-1"
                >
                  <div className="flex items-center text-zinc-100">
                    <List className="w-4 h-4 mr-3 text-zinc-400" />
                    {lore.title}
                  </div>
                  <div className="text-xs text-zinc-500 ml-7 mt-0.5">
                    {lore.type}
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          <Command.Group
            heading="Navigation"
            className="px-2 py-1.5 mt-2 text-xs font-medium text-zinc-500 border-t border-zinc-800 pt-4 [&_[cmdk-group-items]]:mt-2"
          >
            <Command.Item
              onSelect={() => handleSelect(() => onNavigateTab("wiki"))}
              className="flex items-center px-3 py-2 text-sm rounded-md aria-selected:bg-zinc-800 cursor-pointer transition-colors mt-1"
            >
              <List className="w-4 h-4 mr-3" />
              Open Wiki Panel
            </Command.Item>
            <Command.Item
              onSelect={() => handleSelect(() => onNavigateTab("map"))}
              className="flex items-center px-3 py-2 text-sm rounded-md aria-selected:bg-zinc-800 cursor-pointer transition-colors mt-1"
            >
              <Map className="w-4 h-4 mr-3" />
              Open Map Panel
            </Command.Item>
            <Command.Item
              onSelect={() => handleSelect(() => onNavigateTab("ai"))}
              className="flex items-center px-3 py-2 text-sm rounded-md aria-selected:bg-zinc-800 cursor-pointer transition-colors mt-1"
            >
              <Sparkles className="w-4 h-4 mr-3" />
              Open AI Chat Panel
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
