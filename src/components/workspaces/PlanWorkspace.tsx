import { useState } from "react";
import {
  LayoutGrid,
  List as ListIcon,
  Sparkles,
  Folder,
  FileText,
  CornerLeftUp,
} from "lucide-react";
import { Chapter } from "../../lib/db";
import { STORY_TEMPLATES } from "../../lib/templates";

interface PlanWorkspaceProps {
  chapters: Chapter[];
  onUpdateChapter: (chapter: Chapter) => void;
  onGenerateStructure?: (templateKey: string) => void;
}

export function PlanWorkspace({
  chapters,
  onUpdateChapter,
  onGenerateStructure,
}: PlanWorkspaceProps) {
  const [viewMode, setViewMode] = useState<"corkboard" | "timeline">(
    "corkboard",
  );
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);

  const currentParent = chapters.find((c) => c.id === currentParentId);

  // Filter to only show children of the current folder
  const documents = chapters
    .filter((c) => c.parent_id === currentParentId)
    .sort((a, b) => a.sort_order - b.sort_order);

  const handleDoubleClick = (chapter: Chapter) => {
    if (chapter.type === "folder") {
      setCurrentParentId(chapter.id!);
    }
  };

  const handleGoUp = () => {
    if (currentParent) {
      setCurrentParentId(currentParent.parent_id || null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-3">
          {currentParentId !== null && (
            <button
              onClick={handleGoUp}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              title="Go up one level"
            >
              <CornerLeftUp className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-xl font-semibold text-zinc-100">
            {currentParent ? currentParent.title : "Planning Board"}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          {documents.length > 0 && onGenerateStructure && (
            <div className="relative group">
              <button className="px-3 py-1.5 rounded-md text-sm font-medium text-indigo-400 hover:bg-indigo-500/10 transition-colors flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Templates
              </button>
              <div className="absolute top-full right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 shadow-xl rounded-lg overflow-hidden hidden group-hover:block z-50">
                {Object.keys(STORY_TEMPLATES).map((templateKey) => (
                  <button
                    key={templateKey}
                    onClick={() => {
                      onGenerateStructure(templateKey);
                      (document.activeElement as HTMLElement)?.blur();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    {templateKey}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("corkboard")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === "corkboard"
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Corkboard
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === "timeline"
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              <ListIcon className="w-4 h-4" /> Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {documents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500">
            <LayoutGrid className="w-16 h-16 opacity-30 mb-4" />
            <p className="mb-6">
              {currentParentId !== null
                ? "This folder is empty. Add a document or sub-folder."
                : "No documents found in the binder. Create a chapter first."}
            </p>
            {onGenerateStructure && currentParentId === null && (
              <div className="flex flex-col items-center gap-3">
                <div className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                  Or Generate a Structure
                </div>
                <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
                  {Object.keys(STORY_TEMPLATES).map((templateKey) => (
                    <button
                      key={templateKey}
                      onClick={() => onGenerateStructure(templateKey)}
                      className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 hover:bg-indigo-500/10 rounded-lg text-sm text-zinc-300 transition-colors flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      {templateKey}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : viewMode === "corkboard" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onDoubleClick={() => handleDoubleClick(doc)}
                className="bg-[#2a2a2a] bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 rounded-xl p-4 shadow-xl flex flex-col min-h-[240px] relative overflow-hidden group cursor-pointer hover:border-indigo-500/50 transition-colors"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/50 group-hover:bg-indigo-500 transition-colors" />

                <div className="flex items-center gap-2 mb-3">
                  {doc.type === "folder" ? (
                    <Folder className="w-5 h-5 text-indigo-400 shrink-0" />
                  ) : (
                    <FileText className="w-5 h-5 text-zinc-500 shrink-0" />
                  )}
                  <input
                    value={doc.title}
                    onChange={(e) =>
                      onUpdateChapter({ ...doc, title: e.target.value })
                    }
                    className="text-lg font-bold text-zinc-100 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 rounded px-1 placeholder-zinc-600 w-full"
                    placeholder={
                      doc.type === "folder" ? "Folder Title" : "Scene Title"
                    }
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  />
                </div>
                <textarea
                  value={doc.synopsis || ""}
                  onChange={(e) =>
                    onUpdateChapter({ ...doc, synopsis: e.target.value })
                  }
                  placeholder={
                    doc.type === "folder"
                      ? "Write a synopsis for this act/folder..."
                      : "Write a synopsis or goal for this scene..."
                  }
                  className="flex-1 bg-transparent text-sm text-zinc-400 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 rounded px-1 leading-relaxed"
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                />

                {doc.type === "folder" && (
                  <div className="absolute bottom-2 right-3 text-[10px] text-zinc-500 uppercase font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    Double-click to open
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto py-4">
            {documents.map((doc, index) => (
              <div key={doc.id} className="flex gap-6 relative">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/30 z-10 shrink-0">
                    {index + 1}
                  </div>
                  {index < documents.length - 1 && (
                    <div className="w-px h-full bg-zinc-800 -my-2" />
                  )}
                </div>
                {/* Timeline Card */}
                <div
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg mb-8 cursor-pointer hover:border-indigo-500/50 transition-colors relative group"
                  onDoubleClick={() => handleDoubleClick(doc)}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {doc.type === "folder" ? (
                      <Folder className="w-5 h-5 text-indigo-400 shrink-0" />
                    ) : (
                      <FileText className="w-5 h-5 text-zinc-500 shrink-0" />
                    )}
                    <input
                      value={doc.title}
                      onChange={(e) =>
                        onUpdateChapter({ ...doc, title: e.target.value })
                      }
                      className="text-lg font-semibold text-zinc-100 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 rounded px-1 w-full"
                      placeholder={
                        doc.type === "folder" ? "Folder Title" : "Scene Title"
                      }
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <textarea
                    value={doc.synopsis || ""}
                    onChange={(e) =>
                      onUpdateChapter({ ...doc, synopsis: e.target.value })
                    }
                    placeholder={
                      doc.type === "folder"
                        ? "Write a synopsis for this act/folder..."
                        : "Write a synopsis or goal for this scene..."
                    }
                    className="w-full h-24 bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-3 text-sm text-zinc-400 resize-none focus:outline-none focus:border-indigo-500/50 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  />

                  {doc.type === "folder" && (
                    <div className="absolute bottom-2 right-4 text-[10px] text-zinc-500 uppercase font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                      Double-click to open
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
