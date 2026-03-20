import { useState, useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  Map as MapIcon,
  Network,
  Book,
  Search,
  Plus,
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  PanelRight,
  Users,
  MapPin,
  Box,
  Shield,
  Sparkles,
  Link as LinkIcon,
  BookOpen,
} from "lucide-react";
import { WikiPanel } from "../WikiPanel";
import { MapPanel } from "../MapPanel";
import { AIChatPanel } from "../AIChatPanel";
import { RelationshipWeb } from "./RelationshipWeb";
import { Lore, Chapter, RelationshipWithDetails } from "../../lib/db";

interface WorldWorkspaceProps {
  loreEntries: Lore[];
  selectedLore: Lore | null;
  onSelectLore: (lore: Lore | null) => void;
  onAddLore: (title: string, type: string) => void | Promise<void>;
  onUpdateLoreImage: (
    loreId: number,
    imageData: string,
  ) => void | Promise<void>;
  relationships: RelationshipWithDetails[];
  onAddRelationship: (sourceId: number, targetId: number, type: string) => void;
  onDeleteRelationship: (id: number) => void;
  chapters: Chapter[];
  projectId: string | number;
  mapImageData?: string;
  onMapUpload: (imageData: string) => void | Promise<void>;
  zenMode: boolean;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  apiKey?: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  Character: Users,
  Location: MapPin,
  Item: Box,
  Faction: Shield,
  Concept: BookOpen,
};

export function WorldWorkspace({
  loreEntries,
  selectedLore,
  onSelectLore,
  onAddLore,
  onUpdateLoreImage,
  relationships,
  onAddRelationship,
  onDeleteRelationship,
  chapters,
  projectId,
  mapImageData,
  onMapUpload,
  zenMode,
  leftSidebarOpen,
  rightSidebarOpen,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  apiKey,
}: WorldWorkspaceProps) {
  const [centerTab, setCenterTab] = useState<"wiki" | "map" | "graph">("wiki");
  const [rightTab, setRightTab] = useState<"mentions" | "ai">("mentions");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and group lore entries
  const groupedLore = useMemo(() => {
    const filtered = loreEntries.filter(
      (lore) =>
        lore.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lore.type.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const groups: Record<string, Lore[]> = {};
    filtered.forEach((lore) => {
      if (!groups[lore.type]) groups[lore.type] = [];
      groups[lore.type].push(lore);
    });

    return groups;
  }, [loreEntries, searchQuery]);

  // Find chapters where the selected lore is mentioned
  const mentions = useMemo(() => {
    if (!selectedLore) return [];
    return chapters.filter(
      (c) =>
        c.content &&
        c.content.toLowerCase().includes(selectedLore.title.toLowerCase()),
    );
  }, [selectedLore, chapters]);

  return (
    <PanelGroup direction="horizontal" className="flex-1 flex overflow-hidden">
      {/* Left Sidebar - Encyclopedia Navigation */}
      {!zenMode && leftSidebarOpen && (
        <>
          <Panel
            id="world-left-sidebar"
            order={1}
            defaultSize={20}
            minSize={15}
            maxSize={40}
            className="bg-zinc-900 border-r border-zinc-800 flex flex-col"
          >
            <div className="px-4 py-4 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Book className="w-5 h-5 text-zinc-400" />
                  <h2 className="text-lg font-semibold">Encyclopedia</h2>
                </div>
                <button
                  onClick={() => onAddLore("New Entry", "Character")}
                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                  title="Add new entry"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search lore..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
              {Object.entries(groupedLore).map(([type, entries]) => {
                const Icon = TYPE_ICONS[type] || BookOpen;
                return (
                  <div key={type} className="space-y-1">
                    <div className="px-2 py-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" />
                      {type}s
                    </div>
                    {entries.map((lore) => (
                      <button
                        key={lore.id}
                        onClick={() => {
                          onSelectLore(lore);
                          setCenterTab("wiki");
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedLore?.id === lore.id
                            ? "bg-indigo-600/20 text-indigo-300"
                            : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
                        }`}
                      >
                        {lore.title}
                      </button>
                    ))}
                  </div>
                );
              })}
              {Object.keys(groupedLore).length === 0 && (
                <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                  No entries found.
                </div>
              )}
            </div>
          </Panel>
          <PanelResizeHandle className="relative w-2 shrink-0 flex items-center justify-center bg-transparent hover:bg-zinc-800/50 active:bg-zinc-800/50 transition-colors cursor-col-resize group outline-none">
            <div className="w-0.5 h-8 bg-zinc-700 rounded-full group-hover:bg-zinc-400 group-active:bg-zinc-300 transition-colors" />
          </PanelResizeHandle>
        </>
      )}

      {/* Center Canvas - Viewer */}
      <Panel id="world-center" order={2} className="flex flex-col bg-zinc-950">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-2">
            {!zenMode && (
              <button
                onClick={onToggleLeftSidebar}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                {leftSidebarOpen ? (
                  <PanelLeftClose className="w-4 h-4" />
                ) : (
                  <PanelLeft className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          <div className="flex bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setCenterTab("wiki")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                centerTab === "wiki"
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              <Book className="w-4 h-4" />
              Wiki Database
            </button>
            <button
              onClick={() => setCenterTab("map")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                centerTab === "map"
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              <MapIcon className="w-4 h-4" />
              World Map
            </button>
            <button
              onClick={() => setCenterTab("graph")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                centerTab === "graph"
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              <Network className="w-4 h-4" />
              Relationship Web
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!zenMode && (
              <button
                onClick={onToggleRightSidebar}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                {rightSidebarOpen ? (
                  <PanelRightClose className="w-4 h-4" />
                ) : (
                  <PanelRight className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Canvas Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {centerTab === "wiki" && (
            <div className="w-full h-full overflow-hidden flex justify-center">
              <div className="w-full max-w-4xl h-full border-x border-zinc-800 bg-zinc-900 shadow-2xl">
                <WikiPanel
                  loreEntries={loreEntries}
                  chapters={chapters}
                  relationships={relationships}
                  onAddLore={onAddLore}
                  onSelectLore={onSelectLore}
                  onAddRelationship={onAddRelationship}
                  onDeleteRelationship={onDeleteRelationship}
                  onUpdateLoreImage={onUpdateLoreImage}
                  selectedLoreId={selectedLore?.id}
                  apiKey={apiKey || ""}
                />
              </div>
            </div>
          )}

          {centerTab === "map" && (
            <MapPanel
              projectId={Number(projectId)}
              mapImageData={mapImageData}
              onMapUpload={onMapUpload}
            />
          )}

          {centerTab === "graph" && (
            <RelationshipWeb
              loreEntries={loreEntries}
              relationships={relationships}
              onNodeClick={(loreId) => {
                const lore = loreEntries.find((l) => l.id === loreId);
                if (lore) {
                  onSelectLore(lore);
                  setCenterTab("wiki");
                }
              }}
            />
          )}
        </div>
      </Panel>

      {/* Right Sidebar - Inspector / Mentions / AI */}
      {!zenMode && rightSidebarOpen && (
        <>
          <PanelResizeHandle className="relative w-2 shrink-0 flex items-center justify-center bg-transparent hover:bg-zinc-800/50 active:bg-zinc-800/50 transition-colors cursor-col-resize group outline-none">
            <div className="w-0.5 h-8 bg-zinc-700 rounded-full group-hover:bg-zinc-400 group-active:bg-zinc-300 transition-colors" />
          </PanelResizeHandle>
          <Panel
            id="world-right-sidebar"
            order={3}
            defaultSize={25}
            minSize={20}
            maxSize={40}
            className="bg-zinc-900 border-l border-zinc-800 flex flex-col"
          >
            {/* Right Tabs */}
            <div className="px-2 py-2 border-b border-zinc-800">
              <div className="flex bg-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => setRightTab("mentions")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    rightTab === "mentions"
                      ? "bg-indigo-600 text-white"
                      : "text-zinc-400 hover:text-zinc-300"
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  Mentions
                </button>
                <button
                  onClick={() => setRightTab("ai")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    rightTab === "ai"
                      ? "bg-indigo-600 text-white"
                      : "text-zinc-400 hover:text-zinc-300"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  World AI
                </button>
              </div>
            </div>

            {/* Right Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {rightTab === "mentions" && (
                <div className="p-4 space-y-4">
                  {!selectedLore ? (
                    <div className="text-center text-sm text-zinc-500 mt-8">
                      Select a lore entry to see where it appears in your
                      manuscript.
                    </div>
                  ) : (
                    <>
                      <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-indigo-400" />
                        Mentions of {selectedLore.title}
                      </h3>
                      {mentions.length === 0 ? (
                        <p className="text-xs text-zinc-500">
                          No mentions found in chapters.
                        </p>
                      ) : (
                        <div className="space-y-2 mt-4">
                          {mentions.map((chapter) => (
                            <div
                              key={chapter.id}
                              className="p-3 bg-zinc-950 rounded-lg border border-zinc-800"
                            >
                              <h4 className="text-sm text-zinc-300 font-medium mb-1">
                                {chapter.title}
                              </h4>
                              <p className="text-xs text-zinc-500 line-clamp-3">
                                {/* Simple snippet extraction for visual flair */}
                                ...
                                {chapter.content
                                  ?.replace(/<[^>]*>?/gm, "")
                                  .substring(0, 100)}
                                ...
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {rightTab === "ai" && (
                <AIChatPanel
                  projectId={Number(projectId)}
                  currentContent={selectedLore?.content || ""}
                  loreEntries={loreEntries}
                  relationships={relationships}
                />
              )}
            </div>
          </Panel>
        </>
      )}
    </PanelGroup>
  );
}
